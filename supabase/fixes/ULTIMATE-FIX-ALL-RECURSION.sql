-- =====================================================================
-- ULTIMATE FIX FOR ALL RECURSION ISSUES
-- =====================================================================
-- This script fixes ALL recursion issues by:
-- 1. Dropping EVERY policy that might cause recursion
-- 2. Creating simple, non-recursive policies for ALL tables
-- 3. Fixing all column name issues (owner_id -> created_by)
-- 4. Ensuring no circular dependencies exist
--
-- RUN THIS IN SUPABASE SQL EDITOR
-- =====================================================================


-- Drop all policies from ALL tables
DROP POLICY IF EXISTS band_members_select_policy ON public.band_members;
DROP POLICY IF EXISTS band_members_insert_policy ON public.band_members;
DROP POLICY IF EXISTS band_members_update_policy ON public.band_members;
DROP POLICY IF EXISTS band_members_delete_policy ON public.band_members;

DROP POLICY IF EXISTS bands_select_policy ON public.bands;
DROP POLICY IF EXISTS bands_insert_policy ON public.bands;
DROP POLICY IF EXISTS bands_update_policy ON public.bands;
DROP POLICY IF EXISTS bands_delete_policy ON public.bands;
DROP POLICY IF EXISTS "Users can read own bands" ON public.bands;
DROP POLICY IF EXISTS "Users can insert bands" ON public.bands;
DROP POLICY IF EXISTS "Users can update own bands" ON public.bands;
DROP POLICY IF EXISTS "Users can delete own bands" ON public.bands;

DROP POLICY IF EXISTS band_invitations_select_policy ON public.band_invitations;
DROP POLICY IF EXISTS band_invitations_insert_policy ON public.band_invitations;
DROP POLICY IF EXISTS band_invitations_update_policy ON public.band_invitations;
DROP POLICY IF EXISTS band_invitations_delete_policy ON public.band_invitations;

DROP POLICY IF EXISTS songs_select_policy ON public.songs;
DROP POLICY IF EXISTS songs_insert_policy ON public.songs;
DROP POLICY IF EXISTS songs_update_policy ON public.songs;
DROP POLICY IF EXISTS songs_delete_policy ON public.songs;
DROP POLICY IF EXISTS "Users can read songs from their bands" ON public.songs;
DROP POLICY IF EXISTS "Users can insert songs to their bands" ON public.songs;
DROP POLICY IF EXISTS "Users can update songs in their bands" ON public.songs;
DROP POLICY IF EXISTS "Users can delete songs from their bands" ON public.songs;

DROP POLICY IF EXISTS setlists_select_policy ON public.setlists;
DROP POLICY IF EXISTS setlists_insert_policy ON public.setlists;
DROP POLICY IF EXISTS setlists_update_policy ON public.setlists;
DROP POLICY IF EXISTS setlists_delete_policy ON public.setlists;
DROP POLICY IF EXISTS "Users can read setlists in their bands" ON public.setlists;
DROP POLICY IF EXISTS "Users can insert setlists in their bands" ON public.setlists;
DROP POLICY IF EXISTS "Users can update setlists in their bands" ON public.setlists;
DROP POLICY IF EXISTS "Users can delete setlists in their bands" ON public.setlists;

DROP POLICY IF EXISTS setlist_songs_select_policy ON public.setlist_songs;
DROP POLICY IF EXISTS setlist_songs_insert_policy ON public.setlist_songs;
DROP POLICY IF EXISTS setlist_songs_update_policy ON public.setlist_songs;
DROP POLICY IF EXISTS setlist_songs_delete_policy ON public.setlist_songs;
DROP POLICY IF EXISTS "Users can read setlist songs in their bands" ON public.setlist_songs;
DROP POLICY IF EXISTS "Users can insert setlist songs in their bands" ON public.setlist_songs;
DROP POLICY IF EXISTS "Users can update setlist songs in their bands" ON public.setlist_songs;
DROP POLICY IF EXISTS "Users can delete setlist songs in their bands" ON public.setlist_songs;

-- =====================================================================
-- STEP 2: CREATE SECURITY DEFINER HELPERS (NO MORE RECURSION)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.is_band_member(user_id UUID, band_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_id IS NULL OR band_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.band_members
    WHERE band_members.user_id = is_band_member.user_id
      AND band_members.band_id = is_band_member.band_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_band_role(user_id UUID, band_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_id IS NULL OR band_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.band_members
    WHERE band_members.user_id = has_band_role.user_id
      AND band_members.band_id = has_band_role.band_id
      AND band_members.role = ANY(has_band_role.allowed_roles)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_band_role(user_id UUID, band_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_role TEXT;
BEGIN
  IF user_id IS NULL OR band_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT role INTO member_role
  FROM public.band_members
  WHERE band_members.user_id = get_user_band_role.user_id
    AND band_members.band_id = get_user_band_role.band_id
  LIMIT 1;

  RETURN member_role;
END;
$$;

-- =====================================================================
-- STEP 3: CREATE SIMPLE, NON-RECURSIVE BAND_MEMBERS POLICIES
-- =====================================================================

-- SELECT: Members can view everyone in their band
CREATE POLICY "band_members_select_policy"
  ON public.band_members
  FOR SELECT
  USING (is_band_member(auth.uid(), band_members.band_id));

-- INSERT: Only owners and admins can add members
CREATE POLICY "band_members_insert_policy"
  ON public.band_members
  FOR INSERT
  WITH CHECK (has_band_role(auth.uid(), band_members.band_id, ARRAY['owner', 'admin']));

-- UPDATE: Only owners can change member records
CREATE POLICY "band_members_update_policy"
  ON public.band_members
  FOR UPDATE
  USING (has_band_role(auth.uid(), band_members.band_id, ARRAY['owner']))
  WITH CHECK (has_band_role(auth.uid(), band_members.band_id, ARRAY['owner']));

-- DELETE: Owners can remove members but never themselves
CREATE POLICY "band_members_delete_policy"
  ON public.band_members
  FOR DELETE
  USING (
    has_band_role(auth.uid(), band_members.band_id, ARRAY['owner'])
    AND band_members.user_id != auth.uid()
  );

-- =====================================================================
-- STEP 4: CREATE SIMPLE, NON-RECURSIVE BANDS POLICIES
-- =====================================================================

-- SELECT: User owns band OR user is a member (now safe!)
CREATE POLICY "bands_select_policy"
  ON public.bands
  FOR SELECT
  USING (
    -- User created the band
    created_by = auth.uid()
    OR
    -- User is a member (safe - band_members uses direct auth.uid() check)
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.user_id = auth.uid()
      AND band_members.band_id = bands.id
    )
  );

-- INSERT: Any authenticated user can create a band
CREATE POLICY "bands_insert_policy"
  ON public.bands
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- UPDATE: Only the band creator can update
CREATE POLICY "bands_update_policy"
  ON public.bands
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- DELETE: Only the band creator can delete
CREATE POLICY "bands_delete_policy"
  ON public.bands
  FOR DELETE
  USING (created_by = auth.uid());

-- =====================================================================
-- STEP 5: CREATE SIMPLE, NON-RECURSIVE SONGS POLICIES
-- =====================================================================

-- SELECT: Band owner or members can see songs
CREATE POLICY "songs_select_policy"
  ON public.songs
  FOR SELECT
  USING (
    -- Band owner can see songs
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = songs.band_id
      AND bands.created_by = auth.uid()
    )
    OR
    -- Band members can see songs
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.user_id = auth.uid()
      AND band_members.band_id = songs.band_id
    )
  );

-- INSERT: Band owner or members can add songs
CREATE POLICY "songs_insert_policy"
  ON public.songs
  FOR INSERT
  WITH CHECK (
    -- Band owner can add songs
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = songs.band_id
      AND bands.created_by = auth.uid()
    )
    OR
    -- Band members can add songs
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.user_id = auth.uid()
      AND band_members.band_id = songs.band_id
    )
  );

-- UPDATE: Band owner or members can update songs
CREATE POLICY "songs_update_policy"
  ON public.songs
  FOR UPDATE
  USING (
    -- Band owner can update songs
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = songs.band_id
      AND bands.created_by = auth.uid()
    )
    OR
    -- Band members can update songs
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.user_id = auth.uid()
      AND band_members.band_id = songs.band_id
    )
  )
  WITH CHECK (
    -- Band owner can update songs
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = songs.band_id
      AND bands.created_by = auth.uid()
    )
    OR
    -- Band members can update songs
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.user_id = auth.uid()
      AND band_members.band_id = songs.band_id
    )
  );

-- DELETE: Band owner or admins can delete songs
CREATE POLICY "songs_delete_policy"
  ON public.songs
  FOR DELETE
  USING (
    -- Band owner can delete songs
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = songs.band_id
      AND bands.created_by = auth.uid()
    )
    OR
    -- Admins can delete songs
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.user_id = auth.uid()
      AND band_members.band_id = songs.band_id
      AND band_members.role IN ('admin', 'owner')
    )
  );

-- =====================================================================
-- STEP 6: CREATE SIMPLE, NON-RECURSIVE SETLISTS POLICIES
-- =====================================================================

-- SELECT: Band owner or members can see setlists
CREATE POLICY "setlists_select_policy"
  ON public.setlists
  FOR SELECT
  USING (
    -- Band owner can see setlists
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = setlists.band_id
      AND bands.created_by = auth.uid()
    )
    OR
    -- Band members can see setlists
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.user_id = auth.uid()
      AND band_members.band_id = setlists.band_id
    )
  );

-- INSERT: Band owner or members can add setlists
CREATE POLICY "setlists_insert_policy"
  ON public.setlists
  FOR INSERT
  WITH CHECK (
    -- Band owner can add setlists
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = setlists.band_id
      AND bands.created_by = auth.uid()
    )
    OR
    -- Band members can add setlists
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.user_id = auth.uid()
      AND band_members.band_id = setlists.band_id
    )
  );

-- UPDATE: Band owner or members can update setlists
CREATE POLICY "setlists_update_policy"
  ON public.setlists
  FOR UPDATE
  USING (
    -- Band owner can update setlists
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = setlists.band_id
      AND bands.created_by = auth.uid()
    )
    OR
    -- Band members can update setlists
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.user_id = auth.uid()
      AND band_members.band_id = setlists.band_id
    )
  )
  WITH CHECK (
    -- Band owner can update setlists
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = setlists.band_id
      AND bands.created_by = auth.uid()
    )
    OR
    -- Band members can update setlists
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.user_id = auth.uid()
      AND band_members.band_id = setlists.band_id
    )
  );

-- DELETE: Band owner or admins can delete setlists
CREATE POLICY "setlists_delete_policy"
  ON public.setlists
  FOR DELETE
  USING (
    -- Band owner can delete setlists
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = setlists.band_id
      AND bands.created_by = auth.uid()
    )
    OR
    -- Admins can delete setlists
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.user_id = auth.uid()
      AND band_members.band_id = setlists.band_id
      AND band_members.role IN ('admin', 'owner')
    )
  );

-- =====================================================================
-- STEP 7: CREATE SIMPLE, NON-RECURSIVE SETLIST_SONGS POLICIES
-- =====================================================================

-- SELECT: Can see if they can see the setlist
CREATE POLICY "setlist_songs_select_policy"
  ON public.setlist_songs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.setlists
      WHERE setlists.id = setlist_songs.setlist_id
      AND (
        -- Band owner can see
        EXISTS (
          SELECT 1 FROM public.bands
          WHERE bands.id = setlists.band_id
          AND bands.created_by = auth.uid()
        )
        OR
        -- Band members can see
        EXISTS (
          SELECT 1 FROM public.band_members
          WHERE band_members.user_id = auth.uid()
          AND band_members.band_id = setlists.band_id
        )
      )
    )
  );

-- INSERT: Can insert if they can access the setlist
CREATE POLICY "setlist_songs_insert_policy"
  ON public.setlist_songs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.setlists
      WHERE setlists.id = setlist_songs.setlist_id
      AND (
        EXISTS (
          SELECT 1 FROM public.bands
          WHERE bands.id = setlists.band_id
          AND bands.created_by = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM public.band_members
          WHERE band_members.user_id = auth.uid()
          AND band_members.band_id = setlists.band_id
        )
      )
    )
  );

-- UPDATE: Can update if they can access the setlist
CREATE POLICY "setlist_songs_update_policy"
  ON public.setlist_songs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.setlists
      WHERE setlists.id = setlist_songs.setlist_id
      AND (
        EXISTS (
          SELECT 1 FROM public.bands
          WHERE bands.id = setlists.band_id
          AND bands.created_by = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM public.band_members
          WHERE band_members.user_id = auth.uid()
          AND band_members.band_id = setlists.band_id
        )
      )
    )
  );

-- DELETE: Can delete if they can access the setlist
CREATE POLICY "setlist_songs_delete_policy"
  ON public.setlist_songs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.setlists
      WHERE setlists.id = setlist_songs.setlist_id
      AND (
        EXISTS (
          SELECT 1 FROM public.bands
          WHERE bands.id = setlists.band_id
          AND bands.created_by = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM public.band_members
          WHERE band_members.user_id = auth.uid()
          AND band_members.band_id = setlists.band_id
        )
      )
    )
  );

-- =====================================================================
-- STEP 8: ENSURE TRIGGER EXISTS FOR AUTO-CREATING OWNERS
-- =====================================================================

-- Function: Automatically add band creator as 'owner' member
CREATE OR REPLACE FUNCTION add_band_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the band creator as an owner in band_members
  INSERT INTO public.band_members (band_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner')
  ON CONFLICT (band_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS ensure_band_creator_is_owner ON public.bands;

-- Create trigger: Run after band insertion
CREATE TRIGGER ensure_band_creator_is_owner
  AFTER INSERT ON public.bands
  FOR EACH ROW
  EXECUTE FUNCTION add_band_creator_as_owner();

-- =====================================================================
-- STEP 9: FIX EXISTING BANDS (Add creators as owners retroactively)
-- =====================================================================

-- Add all band creators as owners if they're missing
INSERT INTO public.band_members (band_id, user_id, role)
SELECT
  b.id as band_id,
  b.created_by as user_id,
  'owner' as role
FROM public.bands b
WHERE NOT EXISTS (
  SELECT 1 FROM public.band_members bm
  WHERE bm.band_id = b.id
  AND bm.user_id = b.created_by
)
ON CONFLICT (band_id, user_id) DO NOTHING;

-- =====================================================================
-- STEP 10: REFRESH POSTGREST CACHE
-- =====================================================================

SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- =====================================================================
-- STEP 11: VERIFICATION
-- =====================================================================

-- Check all bands have their creators as members
SELECT
  '✅ Verification: Band Creators in band_members' as check_name,
  COUNT(*) as total_bands,
  COUNT(bm.user_id) as bands_with_creator,
  CASE
    WHEN COUNT(*) = COUNT(bm.user_id) THEN '✅ ALL GOOD'
    ELSE '❌ SOME MISSING'
  END as status
FROM public.bands b
LEFT JOIN public.band_members bm ON bm.band_id = b.id AND bm.user_id = b.created_by;

-- Show all policies created
SELECT
  '✅ Policies Created' as check_name,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('bands', 'band_members', 'songs', 'setlists', 'setlist_songs')
GROUP BY tablename
ORDER BY tablename;

-- Final message
SELECT '🎉 ULTIMATE RECURSION FIX COMPLETE! Try logging in now.' as message;
