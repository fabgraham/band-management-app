-- Force Schema Cache Refresh for Supabase
-- This will reload the PostgREST schema cache

-- Step 1: First, verify the column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'songs'
    AND column_name = 'duration_seconds'
  ) THEN
    RAISE EXCEPTION 'Column duration_seconds does not exist in songs table!';
  END IF;
END $$;

-- Step 2: Force reload the schema cache
-- This is the most reliable way to refresh PostgREST's schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- Alternative: You can also reload config
SELECT pg_notify('pgrst', 'reload config');

-- Step 3: Verify the songs table structure
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'songs'
ORDER BY ordinal_position;
