-- Add missing columns to songs table and rename duration

-- 1. Rename duration to duration_seconds
ALTER TABLE public.songs
RENAME COLUMN duration TO duration_seconds;

-- 2. Add notes column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'songs'
        AND column_name = 'notes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.songs ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 3. Add lyrics column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'songs'
        AND column_name = 'lyrics'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.songs ADD COLUMN lyrics TEXT;
    END IF;
END $$;

-- 4. Refresh the schema cache
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- 5. Verify all columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'songs'
ORDER BY ordinal_position;
