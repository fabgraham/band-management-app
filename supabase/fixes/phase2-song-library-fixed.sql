-- Phase 2: Song Library - Database Schema (FIXED)
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- 1. DROP EXISTING TABLE IF YOU NEED TO START FRESH
-- ============================================
-- Uncomment the line below ONLY if you want to completely recreate the table
-- DROP TABLE IF EXISTS public.songs CASCADE;

-- ============================================
-- 2. SONGS TABLE
-- ============================================
-- Create songs table with all required columns
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 100),
  artist TEXT NOT NULL CHECK (char_length(artist) > 0 AND char_length(artist) <= 100),
  key TEXT CHECK (key IN ('C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
                          'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm')),
  bpm INTEGER CHECK (bpm > 0 AND bpm <= 300),
  duration_seconds INTEGER CHECK (duration_seconds > 0),
  lyrics TEXT,
  notes TEXT,
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_songs_band_id ON public.songs(band_id);
CREATE INDEX IF NOT EXISTS idx_songs_title ON public.songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON public.songs(artist);

-- Enable Row Level Security
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read songs from their bands" ON public.songs;
DROP POLICY IF EXISTS "Users can insert songs to their bands" ON public.songs;
DROP POLICY IF EXISTS "Users can update songs in their bands" ON public.songs;
DROP POLICY IF EXISTS "Users can delete songs from their bands" ON public.songs;

-- ============================================
-- 3. RLS POLICIES FOR SONGS (FIXED)
-- ============================================
-- Users can read songs from bands they created
CREATE POLICY "Users can read songs from their bands"
  ON public.songs
  FOR SELECT
  USING (
    band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

-- Users can insert songs to their bands
CREATE POLICY "Users can insert songs to their bands"
  ON public.songs
  FOR INSERT
  WITH CHECK (
    band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

-- Users can update songs in their bands
CREATE POLICY "Users can update songs in their bands"
  ON public.songs
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

-- Users can delete songs from their bands
CREATE POLICY "Users can delete songs from their bands"
  ON public.songs
  FOR DELETE
  USING (
    band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

-- ============================================
-- 4. UPDATED_AT TRIGGER FOR SONGS
-- ============================================
-- Apply trigger to songs table (uses existing handle_updated_at function)
DROP TRIGGER IF EXISTS set_updated_at_songs ON public.songs;
CREATE TRIGGER set_updated_at_songs
  BEFORE UPDATE ON public.songs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 5. REFRESH SCHEMA CACHE (IMPORTANT!)
-- ============================================
-- This tells Supabase to reload the schema cache
NOTIFY pgrst, 'reload schema';
