-- Phase 5: RLS Policies for Member Management - Simplified Version
-- Enable RLS and create basic policies for band_members and band_invitations

-- ====================
-- ENABLE RLS ON NEW TABLES
-- ====================
ALTER TABLE public.band_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.band_invitations ENABLE ROW LEVEL SECURITY;

-- ====================
-- BAND_MEMBERS POLICIES
-- ====================

-- Select: Users can view members of bands they belong to
DROP POLICY IF EXISTS band_members_select_policy ON public.band_members;
CREATE POLICY "band_members_select_policy"
  ON public.band_members
  FOR SELECT
  USING (is_band_member(auth.uid(), band_members.band_id));

-- Insert: Only band owners and admins can add members
DROP POLICY IF EXISTS band_members_insert_policy ON public.band_members;
CREATE POLICY "band_members_insert_policy"
  ON public.band_members
  FOR INSERT
  WITH CHECK (has_band_role(auth.uid(), band_members.band_id, ARRAY['owner', 'admin']));

-- Update: Only band owners can change roles
DROP POLICY IF EXISTS band_members_update_policy ON public.band_members;
CREATE POLICY "band_members_update_policy"
  ON public.band_members
  FOR UPDATE
  USING (has_band_role(auth.uid(), band_members.band_id, ARRAY['owner']))
  WITH CHECK (has_band_role(auth.uid(), band_members.band_id, ARRAY['owner']));

-- Delete: Only band owners can remove members (cannot remove self if only owner)
DROP POLICY IF EXISTS band_members_delete_policy ON public.band_members;
CREATE POLICY "band_members_delete_policy"
  ON public.band_members
  FOR DELETE
  USING (
    has_band_role(auth.uid(), band_members.band_id, ARRAY['owner'])
    AND band_members.user_id != auth.uid()
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

-- Update: Inviters can cancel their own invitations, invited users can accept/decline
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
  );

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
