-- Quick diagnostic - run this and share the results

-- 1. Check if DELETE policy exists
SELECT 'DELETE Policy Check' as test,
  COUNT(*) as policy_count,
  CASE
    WHEN COUNT(*) > 0 THEN 'POLICY EXISTS'
    ELSE 'NO DELETE POLICY'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'setlists'
  AND cmd = 'DELETE';

-- 2. Check RLS is enabled
SELECT 'RLS Enabled Check' as test,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'setlists';

-- 3. Check your bands
SELECT 'Your Bands' as test,
  id,
  name,
  created_by,
  auth.uid() as your_user_id,
  CASE
    WHEN created_by = auth.uid() THEN 'YOU OWN THIS'
    ELSE 'NOT YOURS'
  END as ownership
FROM public.bands;

-- 4. Check setlist_songs table structure
SELECT 'Setlist Songs Columns' as test,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'setlist_songs'
ORDER BY ordinal_position;

-- 5. Check for existing positions in a setlist
SELECT 'Existing Positions' as test,
  setlist_id,
  song_id,
  position
FROM public.setlist_songs
ORDER BY setlist_id, position
LIMIT 10;
