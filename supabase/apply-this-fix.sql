-- Run this in Supabase SQL Editor to fix deletion
-- This adds the missing DELETE policy

DROP POLICY IF EXISTS "Users can delete setlists in their bands" ON public.setlists;

CREATE POLICY "Users can delete setlists in their bands"
  ON public.setlists
  FOR DELETE
  USING (
    band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );

ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;

SELECT pg_notify('pgrst', 'reload schema');
