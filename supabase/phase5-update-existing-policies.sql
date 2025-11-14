-- Phase 5: Update Existing Table Policies for Shared Band Access
-- Update RLS policies for bands, songs, setlists, and setlist_songs to support member collaboration

-- ====================
-- UPDATE BANDS TABLE POLICIES
-- ====================

-- Update bands select policy to support shared access
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

-- ====================
-- UPDATE SONGS TABLE POLICIES
-- ====================

-- Update songs select policy to support shared access
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

-- Update songs insert policy to support shared access
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

-- Update songs update policy to support shared access
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

-- Update songs delete policy to support shared access
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

-- ====================
-- UPDATE SETLISTS TABLE POLICIES
-- ====================

-- Update setlists select policy to support shared access
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

-- Update setlists insert policy to support shared access
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

-- Update setlists update policy to support shared access
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

-- Update setlists delete policy to support shared access
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

-- ====================
-- UPDATE SETLIST_SONGS TABLE POLICIES
-- ====================

-- Update setlist_songs select policy to support shared access
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

-- Update setlist_songs insert policy to support shared access
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

-- Update setlist_songs update policy to support shared access
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

-- Update setlist_songs delete policy to support shared access
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

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');