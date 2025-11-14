-- Phase 5: RLS Policies for Member Management
-- Row Level Security policies for band_members and band_invitations tables
-- Updated policies for existing tables to support shared band access

-- ====================
-- BAND_MEMBERS POLICIES
-- ====================

-- Select: Users can view members of bands they belong to
DROP POLICY IF EXISTS band_members_select_policy ON public.band_members;
CREATE POLICY "band_members_select_policy"
  ON public.band_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members viewer_member
      WHERE viewer_member.user_id = auth.uid()
      AND viewer_member.band_id = band_members.band_id
    )
  );

-- Insert: Only band owners and admins can add members
DROP POLICY IF EXISTS band_members_insert_policy ON public.band_members;
CREATE POLICY "band_members_insert_policy"
  ON public.band_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.band_members inviter_member
      WHERE inviter_member.user_id = auth.uid()
      AND inviter_member.band_id = band_members.band_id
      AND inviter_member.role IN ('owner', 'admin')
    )
  );

-- Update: Only band owners can change roles, members can update their own joined_at (no-op)
DROP POLICY IF EXISTS band_members_update_policy ON public.band_members;
CREATE POLICY "band_members_update_policy"
  ON public.band_members
  FOR UPDATE
  USING (
    -- Owners can update any member's role
    EXISTS (
      SELECT 1 FROM public.band_members updater_member
      WHERE updater_member.user_id = auth.uid()
      AND updater_member.band_id = band_members.band_id
      AND updater_member.role = 'owner'
    )
    OR 
    -- Members can update their own record (but role changes are restricted by column policy)
    user_id = auth.uid()
  )
  WITH CHECK (
    -- Prevent role escalation by non-owners
    CASE 
      WHEN role IS DISTINCT FROM OLD.role THEN
        EXISTS (
          SELECT 1 FROM public.band_members updater_member
          WHERE updater_member.user_id = auth.uid()
          AND updater_member.band_id = band_members.band_id
          AND updater_member.role = 'owner'
        )
      ELSE true
    END
  );

-- Delete: Only band owners can remove members (cannot remove self if only owner)
DROP POLICY IF EXISTS band_members_delete_policy ON public.band_members;
CREATE POLICY "band_members_delete_policy"
  ON public.band_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members deleter_member
      WHERE deleter_member.user_id = auth.uid()
      AND deleter_member.band_id = band_members.band_id
      AND deleter_member.role = 'owner'
      AND band_members.role != 'owner' -- Prevent owner from deleting themselves
    )
  );

-- ====================
-- BAND_INVITATIONS POLICIES
-- ====================

-- Select: Users can view invitations for bands they own or admin
DROP POLICY IF EXISTS band_invitations_select_policy ON public.band_invitations;
CREATE POLICY "band_invitations_select_policy"
  ON public.band_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members viewer_member
      WHERE viewer_member.user_id = auth.uid()
      AND viewer_member.band_id = band_invitations.band_id
      AND viewer_member.role IN ('owner', 'admin')
    )
    OR
    -- Users can see their own pending invitations
    (invited_email = auth.email() AND status = 'pending')
  );

-- Insert: Only band owners and admins can create invitations
DROP POLICY IF EXISTS band_invitations_insert_policy ON public.band_invitations;
CREATE POLICY "band_invitations_insert_policy"
  ON public.band_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.band_members inviter_member
      WHERE inviter_member.user_id = auth.uid()
      AND inviter_member.band_id = band_invitations.band_id
      AND inviter_member.role IN ('owner', 'admin')
    )
  );

-- Update: 
-- - Inviters can cancel their own invitations
-- - Invited users can accept/decline their own invitations
-- - System can mark expired invitations
DROP POLICY IF EXISTS band_invitations_update_policy ON public.band_invitations;
CREATE POLICY "band_invitations_update_policy"
  ON public.band_invitations
  FOR UPDATE
  USING (
    -- Inviter can cancel their own invitations
    (invited_by = auth.uid() AND status IN ('pending'))
    OR
    -- Invited user can accept/decline their own invitations
    (invited_email = auth.email() AND status = 'pending')
    OR
    -- System can update expired invitations (for cleanup)
    (status = 'pending' AND expires_at <= NOW())
  )
  WITH CHECK (
    -- Validate status transitions
    CASE
      WHEN OLD.status = 'pending' AND NEW.status IN ('accepted', 'declined', 'expired') THEN true
      WHEN OLD.status = 'accepted' THEN false -- Cannot change accepted invitations
      WHEN OLD.status = 'declined' THEN false -- Cannot change declined invitations
      WHEN OLD.status = 'expired' THEN false -- Cannot change expired invitations
      ELSE false
    END
  );

-- ====================
-- UPDATE EXISTING POLICIES FOR SHARED ACCESS
-- ====================

-- Update bands table policies to support shared access
DROP POLICY IF EXISTS bands_select_policy ON public.bands;
CREATE POLICY "bands_select_policy"
  ON public.bands
  FOR SELECT
  USING (
    -- User can select bands they own OR bands they are members of
    owner_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.user_id = auth.uid()
      AND band_members.band_id = bands.id
    )
  );

-- Keep existing insert/update/delete policies for bands (owner-only)
-- These remain unchanged as only owners can modify band details

-- Update songs table policies to support shared access
DROP POLICY IF EXISTS songs_select_policy ON public.songs;
CREATE POLICY "songs_select_policy"
  ON public.songs
  FOR SELECT
  USING (
    -- User can select songs from bands they own OR are members of
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = songs.band_id
      AND (
        bands.owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.band_members
          WHERE band_members.user_id = auth.uid()
          AND band_members.band_id = songs.band_id
        )
      )
    )
  );

DROP POLICY IF EXISTS songs_insert_policy ON public.songs;
CREATE POLICY "songs_insert_policy"
  ON public.songs
  FOR INSERT
  WITH CHECK (
    -- User can insert songs to bands they own OR are members of (any role)
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = songs.band_id
      AND (
        bands.owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.band_members
          WHERE band_members.user_id = auth.uid()
          AND band_members.band_id = songs.band_id
        )
      )
    )
  );

DROP POLICY IF EXISTS songs_update_policy ON public.songs;
CREATE POLICY "songs_update_policy"
  ON public.songs
  FOR UPDATE
  USING (
    -- User can update songs in bands they own OR are members of
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = songs.band_id
      AND (
        bands.owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.band_members
          WHERE band_members.user_id = auth.uid()
          AND band_members.band_id = songs.band_id
        )
      )
    )
  );

DROP POLICY IF EXISTS songs_delete_policy ON public.songs;
CREATE POLICY "songs_delete_policy"
  ON public.songs
  FOR DELETE
  USING (
    -- User can delete songs from bands they own OR are members of
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = songs.band_id
      AND (
        bands.owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.band_members
          WHERE band_members.user_id = auth.uid()
          AND band_members.band_id = songs.band_id
        )
      )
    )
  );

-- Update setlists table policies to support shared access
DROP POLICY IF EXISTS setlists_select_policy ON public.setlists;
CREATE POLICY "setlists_select_policy"
  ON public.setlists
  FOR SELECT
  USING (
    -- User can select setlists from bands they own OR are members of
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = setlists.band_id
      AND (
        bands.owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.band_members
          WHERE band_members.user_id = auth.uid()
          AND band_members.band_id = setlists.band_id
        )
      )
    )
  );

DROP POLICY IF EXISTS setlists_insert_policy ON public.setlists;
CREATE POLICY "setlists_insert_policy"
  ON public.setlists
  FOR INSERT
  WITH CHECK (
    -- User can insert setlists to bands they own OR are members of
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = setlists.band_id
      AND (
        bands.owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.band_members
          WHERE band_members.user_id = auth.uid()
          AND band_members.band_id = setlists.band_id
        )
      )
    )
  );

DROP POLICY IF EXISTS setlists_update_policy ON public.setlists;
CREATE POLICY "setlists_update_policy"
  ON public.setlists
  FOR UPDATE
  USING (
    -- User can update setlists in bands they own OR are members of
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = setlists.band_id
      AND (
        bands.owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.band_members
          WHERE band_members.user_id = auth.uid()
          AND band_members.band_id = setlists.band_id
        )
      )
    )
  );

DROP POLICY IF EXISTS setlists_delete_policy ON public.setlists;
CREATE POLICY "setlists_delete_policy"
  ON public.setlists
  FOR DELETE
  USING (
    -- User can delete setlists from bands they own OR are members of
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = setlists.band_id
      AND (
        bands.owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.band_members
          WHERE band_members.user_id = auth.uid()
          AND band_members.band_id = setlists.band_id
        )
      )
    )
  );

-- Update setlist_songs table policies to support shared access
DROP POLICY IF EXISTS setlist_songs_select_policy ON public.setlist_songs;
CREATE POLICY "setlist_songs_select_policy"
  ON public.setlist_songs
  FOR SELECT
  USING (
    -- User can select setlist_songs from bands they own OR are members of
    EXISTS (
      SELECT 1 FROM public.setlists
      JOIN public.bands ON bands.id = setlists.band_id
      WHERE setlists.id = setlist_songs.setlist_id
      AND (
        bands.owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.band_members
          WHERE band_members.user_id = auth.uid()
          AND band_members.band_id = bands.id
        )
      )
    )
  );

DROP POLICY IF EXISTS setlist_songs_insert_policy ON public.setlist_songs;
CREATE POLICY "setlist_songs_insert_policy"
  ON public.setlist_songs
  FOR INSERT
  WITH CHECK (
    -- User can insert setlist_songs to bands they own OR are members of
    EXISTS (
      SELECT 1 FROM public.setlists
      JOIN public.bands ON bands.id = setlists.band_id
      WHERE setlists.id = setlist_songs.setlist_id
      AND (
        bands.owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.band_members
          WHERE band_members.user_id = auth.uid()
          AND band_members.band_id = bands.id
        )
      )
    )
  );

DROP POLICY IF EXISTS setlist_songs_update_policy ON public.setlist_songs;
CREATE POLICY "setlist_songs_update_policy"
  ON public.setlist_songs
  FOR UPDATE
  USING (
    -- User can update setlist_songs in bands they own OR are members of
    EXISTS (
      SELECT 1 FROM public.setlists
      JOIN public.bands ON bands.id = setlists.band_id
      WHERE setlists.id = setlist_songs.setlist_id
      AND (
        bands.owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.band_members
          WHERE band_members.user_id = auth.uid()
          AND band_members.band_id = bands.id
        )
      )
    )
  );

DROP POLICY IF EXISTS setlist_songs_delete_policy ON public.setlist_songs;
CREATE POLICY "setlist_songs_delete_policy"
  ON public.setlist_songs
  FOR DELETE
  USING (
    -- User can delete setlist_songs from bands they own OR are members of
    EXISTS (
      SELECT 1 FROM public.setlists
      JOIN public.bands ON bands.id = setlists.band_id
      WHERE setlists.id = setlist_songs.setlist_id
      AND (
        bands.owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.band_members
          WHERE band_members.user_id = auth.uid()
          AND band_members.band_id = bands.id
        )
      )
    )
  );

-- Enable RLS on new tables
ALTER TABLE public.band_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.band_invitations ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.band_members TO anon, authenticated;
GRANT INSERT ON public.band_members TO authenticated;
GRANT UPDATE ON public.band_members TO authenticated;
GRANT DELETE ON public.band_members TO authenticated;

GRANT SELECT ON public.band_invitations TO anon, authenticated;
GRANT INSERT ON public.band_invitations TO authenticated;
GRANT UPDATE ON public.band_invitations TO authenticated;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');