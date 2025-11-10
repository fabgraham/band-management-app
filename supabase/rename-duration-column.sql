-- Rename duration column to duration_seconds for consistency
ALTER TABLE public.songs
RENAME COLUMN duration TO duration_seconds;

-- Refresh the schema cache so Supabase picks up the change
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- Verify the change
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'songs'
  AND column_name LIKE '%duration%';
