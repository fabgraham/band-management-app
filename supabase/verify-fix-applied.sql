-- Verification Script: Check if the Fix Was Applied Successfully
-- Run this AFTER running fix-setlist-policies.sql
-- All checks should show "PASS" status

-- ============================================
-- CHECK 1: RLS is enabled
-- ============================================
SELECT
  '1. RLS Enabled Check' as test_name,
  tablename,
  CASE
    WHEN rowsecurity = true THEN '✓ PASS'
    ELSE '✗ FAIL - RLS not enabled'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('setlists', 'setlist_songs')
ORDER BY tablename;

-- ============================================
-- CHECK 2: DELETE policy exists for setlists
-- ============================================
SELECT
  '2. Setlists DELETE Policy' as test_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ PASS - DELETE policy exists'
    ELSE '✗ FAIL - No DELETE policy found'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'setlists'
AND cmd = 'DELETE';

-- ============================================
-- CHECK 3: INSERT policy exists for setlist_songs
-- ============================================
SELECT
  '3. Setlist Songs INSERT Policy' as test_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ PASS - INSERT policy exists'
    ELSE '✗ FAIL - No INSERT policy found'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'setlist_songs'
AND cmd = 'INSERT';

-- ============================================
-- CHECK 4: All required policies exist
-- ============================================
SELECT
  '4. Complete Policy Coverage' as test_name,
  tablename,
  CASE
    WHEN COUNT(DISTINCT cmd) = 4 THEN '✓ PASS - All 4 operations covered'
    ELSE '✗ FAIL - Only ' || COUNT(DISTINCT cmd) || ' of 4 operations'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('setlists', 'setlist_songs')
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- CHECK 5: Policy details
-- ============================================
SELECT
  '5. Policy Details' as test_name,
  tablename,
  policyname,
  cmd as operation,
  CASE
    WHEN qual IS NOT NULL THEN 'Has USING ✓'
    ELSE 'No USING ✗'
  END as using_clause,
  CASE
    WHEN cmd IN ('INSERT', 'UPDATE') AND with_check IS NOT NULL THEN 'Has WITH CHECK ✓'
    WHEN cmd IN ('SELECT', 'DELETE') THEN 'N/A'
    ELSE 'Missing WITH CHECK ✗'
  END as check_clause
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('setlists', 'setlist_songs')
ORDER BY tablename, cmd;

-- ============================================
-- CHECK 6: User can delete their setlists
-- ============================================
SELECT
  '6. User Deletion Permission' as test_name,
  COUNT(*) as deletable_setlists,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ PASS - You can delete ' || COUNT(*) || ' setlist(s)'
    ELSE '⚠ INFO - No setlists found (create one to test)'
  END as status
FROM public.setlists s
JOIN public.bands b ON s.band_id = b.id
WHERE b.created_by = auth.uid();

-- ============================================
-- CHECK 7: User can insert setlist songs
-- ============================================
SELECT
  '7. User Insert Permission' as test_name,
  COUNT(DISTINCT sl.id) as available_setlists,
  COUNT(*) as available_songs,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ PASS - You can add ' || COUNT(*) || ' song(s) to ' || COUNT(DISTINCT sl.id) || ' setlist(s)'
    ELSE '⚠ INFO - No songs or setlists found'
  END as status
FROM public.songs so
JOIN public.bands b ON so.band_id = b.id
JOIN public.setlists sl ON sl.band_id = b.id
WHERE b.created_by = auth.uid();

-- ============================================
-- SUMMARY
-- ============================================
SELECT
  'SUMMARY' as test_name,
  'If all checks show PASS or INFO, the fix was applied successfully!' as message,
  'You can now test deletion and adding songs in your app.' as next_step;

-- ============================================
-- TROUBLESHOOTING QUERIES
-- ============================================
-- If any checks failed, uncomment and run these:

-- See all policies:
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public' AND tablename IN ('setlists', 'setlist_songs')
-- ORDER BY tablename, cmd;

-- Check your user ID:
-- SELECT auth.uid() as your_user_id;

-- Check your bands:
-- SELECT id, name, created_by FROM public.bands WHERE created_by = auth.uid();
