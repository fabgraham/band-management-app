-- Complete fix for both deletion and adding songs
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- PART 1: Fix ALL RLS Policies
-- ============================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can read setlists in their bands" ON public.setlists;
DROP POLICY IF EXISTS "Users can insert setlists in their bands" ON public.setlists;
DROP POLICY IF EXISTS "Users can update setlists in their bands" ON public.setlists;
DROP POLICY IF EXISTS "Users can delete setlists in their bands" ON public.setlists;

DROP POLICY IF EXISTS "Users can read setlist songs in their bands" ON public.setlist_songs;
DROP POLICY IF EXISTS "Users can insert setlist songs in their bands" ON public.setlist_songs;
DROP POLICY IF EXISTS "Users can update setlist songs in their bands" ON public.setlist_songs;
DROP POLICY IF EXISTS "Users can delete setlist songs in their bands" ON public.setlist_songs;

-- Create fresh policies for SETLISTS
CREATE POLICY "Users can read setlists in their bands"
  ON public.setlists FOR SELECT
  USING (band_id IN (SELECT id FROM public.bands WHERE created_by = auth.uid()));

CREATE POLICY "Users can insert setlists in their bands"
  ON public.setlists FOR INSERT
  WITH CHECK (band_id IN (SELECT id FROM public.bands WHERE created_by = auth.uid()));

CREATE POLICY "Users can update setlists in their bands"
  ON public.setlists FOR UPDATE
  USING (band_id IN (SELECT id FROM public.bands WHERE created_by = auth.uid()))
  WITH CHECK (band_id IN (SELECT id FROM public.bands WHERE created_by = auth.uid()));

CREATE POLICY "Users can delete setlists in their bands"
  ON public.setlists FOR DELETE
  USING (band_id IN (SELECT id FROM public.bands WHERE created_by = auth.uid()));

-- Create fresh policies for SETLIST_SONGS
CREATE POLICY "Users can read setlist songs in their bands"
  ON public.setlist_songs FOR SELECT
  USING (
    setlist_id IN (
      SELECT id FROM public.setlists
      WHERE band_id IN (SELECT id FROM public.bands WHERE created_by = auth.uid())
    )
  );

CREATE POLICY "Users can insert setlist songs in their bands"
  ON public.setlist_songs FOR INSERT
  WITH CHECK (
    setlist_id IN (
      SELECT id FROM public.setlists
      WHERE band_id IN (SELECT id FROM public.bands WHERE created_by = auth.uid())
    )
  );

CREATE POLICY "Users can update setlist songs in their bands"
  ON public.setlist_songs FOR UPDATE
  USING (
    setlist_id IN (
      SELECT id FROM public.setlists
      WHERE band_id IN (SELECT id FROM public.bands WHERE created_by = auth.uid())
    )
  )
  WITH CHECK (
    setlist_id IN (
      SELECT id FROM public.setlists
      WHERE band_id IN (SELECT id FROM public.bands WHERE created_by = auth.uid())
    )
  );

CREATE POLICY "Users can delete setlist songs in their bands"
  ON public.setlist_songs FOR DELETE
  USING (
    setlist_id IN (
      SELECT id FROM public.setlists
      WHERE band_id IN (SELECT id FROM public.bands WHERE created_by = auth.uid())
    )
  );

-- Enable RLS
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlist_songs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 2: Fix Unique Constraint Issue
-- ============================================

-- Drop the problematic unique constraint if it exists
ALTER TABLE public.setlist_songs
  DROP CONSTRAINT IF EXISTS setlist_songs_unique_order;

-- Keep only the unique song constraint (prevent duplicate songs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'setlist_songs_unique_song'
      AND conrelid = 'public.setlist_songs'::regclass
  ) THEN
    ALTER TABLE public.setlist_songs
      ADD CONSTRAINT setlist_songs_unique_song UNIQUE (setlist_id, song_id);
  END IF;
END $$;

-- ============================================
-- PART 3: Refresh Schema
-- ============================================

SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');
NOTIFY pgrst, 'reload schema';
