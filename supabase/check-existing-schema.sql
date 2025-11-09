-- Check what tables and columns already exist

-- 1. Check if profiles table exists and its columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Check if bands table exists and its columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bands'
ORDER BY ordinal_position;

-- 3. Check existing RLS policies
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('profiles', 'bands')
ORDER BY tablename, policyname;