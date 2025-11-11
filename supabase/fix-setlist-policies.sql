-- Fix Setlist and Setlist Songs RLS Policies
-- This script ensures proper permissions for setlist deletion and song addition
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. VERIFY CURRENT POLICIES
-- ============================================
-- First, let's see what policies exist (uncomment to run):
-- SELECT tablename, policyname, permissive, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('setlists', 'setlist_songs')
-- ORDER BY tablename, cmd;

-- ============================================
-- 2. DROP EXISTING POLICIES (Clean Slate)
-- ============================================

-- Drop setlists policies
DROP POLICY IF EXISTS "Users can read setlists in their bands" ON public.setlists;
DROP POLICY IF EXISTS "Users can insert setlists in their bands" ON public.setlists;
DROP POLICY IF EXISTS "Users can update setlists in their bands" ON public.setlists;
DROP POLICY IF EXISTS "Users can delete setlists in their bands" ON public.setlists;

-- Drop setlist_songs policies
DROP POLICY IF EXISTS "Users can read setlist songs in their bands" ON public.setlist_songs;
DROP POLICY IF EXISTS "Users can insert setlist songs in their bands" ON public.setlist_songs;
DROP POLICY IF EXISTS "Users can update setlist songs in their bands" ON public.setlist_songs;
DROP POLICY IF EXISTS "Users can delete setlist songs in their bands" ON public.setlist_songs;

-- ============================================
-- 3. CREATE NEW POLICIES FOR SETLISTS
-- ============================================

-- SELECT policy
CREATE POLICY "Users can read setlists in their bands"
  ON public.setlists
  FOR SELECT
  USING (
    band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

-- INSERT policy
CREATE POLICY "Users can insert setlists in their bands"
  ON public.setlists
  FOR INSERT
  WITH CHECK (
    band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

-- UPDATE policy
CREATE POLICY "Users can update setlists in their bands"
  ON public.setlists
  FOR UPDATE
  USING (
    band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

-- DELETE policy - This is critical for deletion to work
CREATE POLICY "Users can delete setlists in their bands"
  ON public.setlists
  FOR DELETE
  USING (
    band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

-- ============================================
-- 4. CREATE NEW POLICIES FOR SETLIST_SONGS
-- ============================================

-- SELECT policy
CREATE POLICY "Users can read setlist songs in their bands"
  ON public.setlist_songs
  FOR SELECT
  USING (
    setlist_id IN (
      SELECT id FROM public.setlists
      WHERE band_id IN (
        SELECT id FROM public.bands WHERE created_by = auth.uid()
      )
    )
  );

-- INSERT policy - This is critical for adding songs to work
CREATE POLICY "Users can insert setlist songs in their bands"
  ON public.setlist_songs
  FOR INSERT
  WITH CHECK (
    setlist_id IN (
      SELECT id FROM public.setlists
      WHERE band_id IN (
        SELECT id FROM public.bands WHERE created_by = auth.uid()
      )
    )
  );

-- UPDATE policy
CREATE POLICY "Users can update setlist songs in their bands"
  ON public.setlist_songs
  FOR UPDATE
  USING (
    setlist_id IN (
      SELECT id FROM public.setlists
      WHERE band_id IN (
        SELECT id FROM public.bands WHERE created_by = auth.uid()
      )
    )
  )
  WITH CHECK (
    setlist_id IN (
      SELECT id FROM public.setlists
      WHERE band_id IN (
        SELECT id FROM public.bands WHERE created_by = auth.uid()
      )
    )
  );

-- DELETE policy
CREATE POLICY "Users can delete setlist songs in their bands"
  ON public.setlist_songs
  FOR DELETE
  USING (
    setlist_id IN (
      SELECT id FROM public.setlists
      WHERE band_id IN (
        SELECT id FROM public.bands WHERE created_by = auth.uid()
      )
    )
  );

-- ============================================
-- 5. VERIFY RLS IS ENABLED
-- ============================================

-- Ensure RLS is enabled on both tables
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlist_songs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. REFRESH SCHEMA CACHE
-- ============================================

-- Force PostgREST to reload the schema
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- Alternative notification method
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 7. VERIFICATION QUERIES
-- ============================================
-- Run these to verify policies were created correctly:

-- List all policies for setlists and setlist_songs
-- SELECT
--   tablename,
--   policyname,
--   permissive,
--   cmd as operation,
--   CASE
--     WHEN qual IS NOT NULL THEN 'Has USING clause'
--     ELSE 'No USING clause'
--   END as using_clause,
--   CASE
--     WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
--     ELSE 'No WITH CHECK clause'
--   END as check_clause
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('setlists', 'setlist_songs')
-- ORDER BY tablename, cmd;

-- Check RLS is enabled
-- SELECT
--   schemaname,
--   tablename,
--   rowsecurity as rls_enabled
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('setlists', 'setlist_songs');
