-- =====================================================================
-- FINAL FIX FOR INFINITE RECURSION
-- =====================================================================
-- This script completely replaces the problematic policies with non-recursive versions
-- Run this in Supabase SQL Editor
-- =====================================================================

-- =====================================================================
-- STEP 1: DROP ALL EXISTING POLICIES (Clean slate)
-- =====================================================================

-- Drop all band_members policies
DROP POLICY IF EXISTS band_members_select_policy ON public.band_members;
DROP POLICY IF EXISTS band_members_insert_policy ON public.band_members;
DROP POLICY IF EXISTS band_members_update_policy ON public.band_members;
DROP POLICY IF EXISTS band_members_delete_policy ON public.band_members;

-- Drop all bands policies
DROP POLICY IF EXISTS bands_select_policy ON public.bands;
DROP POLICY IF EXISTS bands_insert_policy ON public.bands;
DROP POLICY IF EXISTS bands_update_policy ON public.bands;
DROP POLICY IF EXISTS bands_delete_policy ON public.bands;
DROP POLICY IF EXISTS "Users can read own bands" ON public.bands;
DROP POLICY IF EXISTS "Users can insert bands" ON public.bands;
DROP POLICY IF EXISTS "Users can update own bands" ON public.bands;
DROP POLICY IF EXISTS "Users can delete own bands" ON public.bands;

-- =====================================================================
-- STEP 2: CREATE NON-RECURSIVE BAND_MEMBERS POLICIES
-- =====================================================================

-- SELECT: Direct check - NO self-reference!
CREATE POLICY "band_members_select_policy"
  ON public.band_members
  FOR SELECT
  USING (
    -- Direct check - no recursion possible
    user_id = auth.uid()
    OR
    -- Band creators can see all members (safe - checks bands table)
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = band_members.band_id
      AND bands.created_by = auth.uid()
    )
  );

-- INSERT: Only owners and admins can add members
CREATE POLICY "band_members_insert_policy"
  ON public.band_members
  FOR INSERT
  WITH CHECK (
    -- Band owner can add members
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = band_members.band_id
      AND bands.created_by = auth.uid()
    )
    OR
    -- Admins can add members (direct check - no recursion)
    EXISTS (
      SELECT 1 FROM public.band_members existing_member
      WHERE existing_member.user_id = auth.uid()
      AND existing_member.band_id = band_members.band_id
      AND existing_member.role = 'admin'
    )
  );

-- UPDATE: Owners can update any member, members can update themselves
CREATE POLICY "band_members_update_policy"
  ON public.band_members
  FOR UPDATE
  USING (
    -- Band owner can update
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = band_members.band_id
      AND bands.created_by = auth.uid()
    )
    OR
    -- User can update their own record
    user_id = auth.uid()
  )
  WITH CHECK (
    -- Same conditions for updated row
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = band_members.band_id
      AND bands.created_by = auth.uid()
    )
    OR
    user_id = auth.uid()
  );

-- DELETE: Only owners can remove members (but not themselves)
CREATE POLICY "band_members_delete_policy"
  ON public.band_members
  FOR DELETE
  USING (
    -- Only band owner can delete
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE bands.id = band_members.band_id
      AND bands.created_by = auth.uid()
    )
    -- Prevent removing yourself
    AND band_members.user_id != auth.uid()
  );

-- =====================================================================
-- STEP 3: CREATE NON-RECURSIVE BANDS POLICIES
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
-- STEP 4: ENSURE TRIGGER EXISTS FOR AUTO-CREATING OWNERS
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
-- STEP 5: FIX EXISTING BANDS (Add creators as owners retroactively)
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
-- STEP 6: REFRESH POSTGREST CACHE
-- =====================================================================

SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- =====================================================================
-- STEP 7: VERIFICATION
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
WHERE tablename IN ('bands', 'band_members')
GROUP BY tablename
ORDER BY tablename;

-- Final message
SELECT '🎉 RECURSION FIX COMPLETE! Try logging in now.' as message;