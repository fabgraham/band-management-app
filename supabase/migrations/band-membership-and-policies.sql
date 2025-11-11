-- Band membership model and permissive policies for collaborative bands
-- Run this in Supabase SQL editor or via migration tooling

-- 1) Band membership table
CREATE TABLE IF NOT EXISTS public.band_members (
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (band_id, user_id)
);

ALTER TABLE public.band_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own memberships" ON public.band_members;
CREATE POLICY "Users can read own memberships"
  ON public.band_members
  FOR SELECT
  USING (user_id = auth.uid());

-- 2) Relax policies to allow any band member (not just creator)

-- Songs
DROP POLICY IF EXISTS "Users can read songs from their bands" ON public.songs;
DROP POLICY IF EXISTS "Users can insert songs to their bands" ON public.songs;
DROP POLICY IF EXISTS "Users can update songs in their bands" ON public.songs;
DROP POLICY IF EXISTS "Users can delete songs from their bands" ON public.songs;

CREATE POLICY "Users can read songs from their bands"
  ON public.songs
  FOR SELECT
  USING (
    band_id IN (
      SELECT band_id FROM public.band_members WHERE user_id = auth.uid()
    )
    OR band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert songs to their bands"
  ON public.songs
  FOR INSERT
  WITH CHECK (
    band_id IN (
      SELECT band_id FROM public.band_members WHERE user_id = auth.uid()
    )
    OR band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update songs in their bands"
  ON public.songs
  FOR UPDATE
  USING (
    band_id IN (
      SELECT band_id FROM public.band_members WHERE user_id = auth.uid()
    )
    OR band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    band_id IN (
      SELECT band_id FROM public.band_members WHERE user_id = auth.uid()
    )
    OR band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete songs from their bands"
  ON public.songs
  FOR DELETE
  USING (
    band_id IN (
      SELECT band_id FROM public.band_members WHERE user_id = auth.uid()
    )
    OR band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

-- Setlists
DROP POLICY IF EXISTS "Users can read setlists in their bands" ON public.setlists;
DROP POLICY IF EXISTS "Users can insert setlists in their bands" ON public.setlists;
DROP POLICY IF EXISTS "Users can update setlists in their bands" ON public.setlists;
DROP POLICY IF EXISTS "Users can delete setlists in their bands" ON public.setlists;

CREATE POLICY "Users can read setlists in their bands"
  ON public.setlists
  FOR SELECT
  USING (
    band_id IN (
      SELECT band_id FROM public.band_members WHERE user_id = auth.uid()
    )
    OR band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert setlists in their bands"
  ON public.setlists
  FOR INSERT
  WITH CHECK (
    band_id IN (
      SELECT band_id FROM public.band_members WHERE user_id = auth.uid()
    )
    OR band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update setlists in their bands"
  ON public.setlists
  FOR UPDATE
  USING (
    band_id IN (
      SELECT band_id FROM public.band_members WHERE user_id = auth.uid()
    )
    OR band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    band_id IN (
      SELECT band_id FROM public.band_members WHERE user_id = auth.uid()
    )
    OR band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete setlists in their bands"
  ON public.setlists
  FOR DELETE
  USING (
    band_id IN (
      SELECT band_id FROM public.band_members WHERE user_id = auth.uid()
    )
    OR band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

-- Setlist songs
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
        SELECT band_id FROM public.band_members WHERE user_id = auth.uid()
      )
      OR band_id IN (
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
        SELECT band_id FROM public.band_members WHERE user_id = auth.uid()
      )
      OR band_id IN (
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
        SELECT band_id FROM public.band_members WHERE user_id = auth.uid()
      )
      OR band_id IN (
        SELECT id FROM public.bands WHERE created_by = auth.uid()
      )
    )
  )
  WITH CHECK (
    setlist_id IN (
      SELECT id FROM public.setlists
      WHERE band_id IN (
        SELECT band_id FROM public.band_members WHERE user_id = auth.uid()
      )
      OR band_id IN (
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
        SELECT band_id FROM public.band_members WHERE user_id = auth.uid()
      )
      OR band_id IN (
        SELECT id FROM public.bands WHERE created_by = auth.uid()
      )
    )
  );