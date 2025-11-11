-- Diagnostic Script for Setlist Issues
-- Run this in Supabase SQL Editor while logged in as the user experiencing issues
-- This will help identify permission and data issues

-- ============================================
-- 1. CHECK CURRENT USER
-- ============================================
SELECT
  'Current User ID' as check_name,
  auth.uid() as user_id;

-- ============================================
-- 2. CHECK BANDS OWNERSHIP
-- ============================================
SELECT
  'User Bands' as check_name,
  id as band_id,
  name as band_name,
  created_by,
  CASE
    WHEN created_by = auth.uid() THEN 'OWNED BY YOU'
    ELSE 'NOT OWNED BY YOU'
  END as ownership
FROM public.bands
WHERE created_by = auth.uid();

-- ============================================
-- 3. CHECK SETLISTS
-- ============================================
SELECT
  'User Setlists' as check_name,
  s.id as setlist_id,
  s.name as setlist_name,
  s.band_id,
  b.name as band_name,
  b.created_by,
  CASE
    WHEN b.created_by = auth.uid() THEN 'CAN DELETE (should work)'
    ELSE 'CANNOT DELETE (no permission)'
  END as delete_permission
FROM public.setlists s
LEFT JOIN public.bands b ON s.band_id = b.id;

-- ============================================
-- 4. CHECK SETLIST_SONGS
-- ============================================
SELECT
  'Setlist Songs' as check_name,
  ss.id as entry_id,
  ss.setlist_id,
  sl.name as setlist_name,
  ss.song_id,
  so.title as song_title,
  ss.order_index,
  b.created_by,
  CASE
    WHEN b.created_by = auth.uid() THEN 'CAN INSERT (should work)'
    ELSE 'CANNOT INSERT (no permission)'
  END as insert_permission
FROM public.setlist_songs ss
LEFT JOIN public.setlists sl ON ss.setlist_id = sl.id
LEFT JOIN public.songs so ON ss.song_id = so.id
LEFT JOIN public.bands b ON sl.band_id = b.id;

-- ============================================
-- 5. CHECK RLS POLICIES FOR SETLISTS
-- ============================================
SELECT
  'Setlists RLS Policies' as check_name,
  policyname,
  cmd as operation,
  CASE
    WHEN qual IS NOT NULL THEN 'Has USING'
    ELSE 'No USING'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
    ELSE 'No WITH CHECK'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'setlists'
ORDER BY cmd;

-- ============================================
-- 6. CHECK RLS POLICIES FOR SETLIST_SONGS
-- ============================================
SELECT
  'Setlist Songs RLS Policies' as check_name,
  policyname,
  cmd as operation,
  CASE
    WHEN qual IS NOT NULL THEN 'Has USING'
    ELSE 'No USING'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
    ELSE 'No WITH CHECK'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'setlist_songs'
ORDER BY cmd;

-- ============================================
-- 7. CHECK RLS IS ENABLED
-- ============================================
SELECT
  'RLS Status' as check_name,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('bands', 'setlists', 'setlist_songs', 'songs')
ORDER BY tablename;

-- ============================================
-- 8. TEST DELETION PERMISSIONS (DRY RUN)
-- ============================================
-- This shows which setlists WOULD be deleted if you ran a DELETE command
SELECT
  'Deletable Setlists' as check_name,
  s.id,
  s.name,
  s.band_id,
  b.name as band_name,
  b.created_by,
  auth.uid() as current_user
FROM public.setlists s
JOIN public.bands b ON s.band_id = b.id
WHERE b.created_by = auth.uid();

-- ============================================
-- 9. TEST INSERT PERMISSIONS FOR SONGS
-- ============================================
-- This shows which songs can be added to which setlists
SELECT
  'Available Songs for Setlists' as check_name,
  so.id as song_id,
  so.title,
  so.band_id,
  b.name as band_name,
  sl.id as setlist_id,
  sl.name as setlist_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.setlist_songs ss
      WHERE ss.setlist_id = sl.id AND ss.song_id = so.id
    ) THEN 'ALREADY IN SETLIST'
    ELSE 'CAN BE ADDED'
  END as status
FROM public.songs so
JOIN public.bands b ON so.band_id = b.id
JOIN public.setlists sl ON sl.band_id = b.id
WHERE b.created_by = auth.uid()
ORDER BY sl.name, so.title;

-- ============================================
-- 10. CHECK FOR ORPHANED DATA
-- ============================================
-- Check for setlist_songs entries that reference deleted songs or setlists
SELECT
  'Orphaned Setlist Songs' as check_name,
  ss.id,
  ss.setlist_id,
  ss.song_id,
  CASE WHEN s.id IS NULL THEN 'SONG DELETED' ELSE 'Song exists' END as song_status,
  CASE WHEN sl.id IS NULL THEN 'SETLIST DELETED' ELSE 'Setlist exists' END as setlist_status
FROM public.setlist_songs ss
LEFT JOIN public.songs s ON ss.song_id = s.id
LEFT JOIN public.setlists sl ON ss.setlist_id = sl.id
WHERE s.id IS NULL OR sl.id IS NULL;
