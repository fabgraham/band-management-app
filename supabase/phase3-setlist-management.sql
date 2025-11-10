-- Phase 3: Setlist Management - Database Schema
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- 1. SETLISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.setlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  show_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_setlists_band_id ON public.setlists(band_id);

ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read setlists in their bands" ON public.setlists;
DROP POLICY IF EXISTS "Users can insert setlists in their bands" ON public.setlists;
DROP POLICY IF EXISTS "Users can update setlists in their bands" ON public.setlists;
DROP POLICY IF EXISTS "Users can delete setlists in their bands" ON public.setlists;

CREATE POLICY "Users can read setlists in their bands"
  ON public.setlists
  FOR SELECT
  USING (
    band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert setlists in their bands"
  ON public.setlists
  FOR INSERT
  WITH CHECK (
    band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

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

CREATE POLICY "Users can delete setlists in their bands"
  ON public.setlists
  FOR DELETE
  USING (
    band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

-- ============================================
-- 2. SETLIST SONGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.setlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  order_index INTEGER CHECK (order_index > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_setlist_songs_setlist_id ON public.setlist_songs(setlist_id);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_song_id ON public.setlist_songs(song_id);

-- Ensure order_index column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'setlist_songs'
      AND column_name = 'order_index'
  ) THEN
    ALTER TABLE public.setlist_songs
      ADD COLUMN order_index INTEGER CHECK (order_index > 0);
  END IF;
END $$;

-- Ensure existing rows have default order_index
UPDATE public.setlist_songs
SET order_index = COALESCE(order_index, 1)
WHERE order_index IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'setlist_songs'
      AND column_name = 'order_index'
  ) THEN
    ALTER TABLE public.setlist_songs
      ALTER COLUMN order_index SET DEFAULT 1;
ALTER TABLE public.setlist_songs
  ALTER COLUMN order_index SET NOT NULL;
END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.setlist_songs'::regclass
      AND conname = 'setlist_songs_order_check'
  ) THEN
    ALTER TABLE public.setlist_songs
      ADD CONSTRAINT setlist_songs_order_check CHECK (order_index > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.setlist_songs'::regclass
      AND conname = 'setlist_songs_unique_order'
  ) THEN
    ALTER TABLE public.setlist_songs
      ADD CONSTRAINT setlist_songs_unique_order UNIQUE (setlist_id, order_index);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.setlist_songs'::regclass
      AND conname = 'setlist_songs_unique_song'
  ) THEN
    ALTER TABLE public.setlist_songs
      ADD CONSTRAINT setlist_songs_unique_song UNIQUE (setlist_id, song_id);
  END IF;
END $$;

ALTER TABLE public.setlist_songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read setlist songs in their bands" ON public.setlist_songs;
DROP POLICY IF EXISTS "Users can insert setlist songs in their bands" ON public.setlist_songs;
DROP POLICY IF EXISTS "Users can update setlist songs in their bands" ON public.setlist_songs;
DROP POLICY IF EXISTS "Users can delete setlist songs in their bands" ON public.setlist_songs;

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
-- 3. UPDATED_AT TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS set_updated_at_setlists ON public.setlists;
CREATE TRIGGER set_updated_at_setlists
  BEFORE UPDATE ON public.setlists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 4. VERIFICATION QUERIES (OPTIONAL)
-- ============================================
-- SELECT * FROM public.setlists LIMIT 5;
-- SELECT * FROM public.setlist_songs LIMIT 5;
-- SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('setlists', 'setlist_songs');

-- ============================================
-- 5. REFRESH SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';
