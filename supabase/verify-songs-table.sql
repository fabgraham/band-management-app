-- Verification: Check if songs table exists and has all columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'songs'
ORDER BY ordinal_position;
