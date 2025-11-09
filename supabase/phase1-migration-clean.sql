-- Phase 1: Band Management - Clean Migration
-- This script handles existing tables and policies

-- ============================================
-- 1. DROP EXISTING POLICIES ON BANDS TABLE
-- ============================================
DROP POLICY IF EXISTS "bands_is_owner_delete" ON public.bands;
DROP POLICY IF EXISTS "bands_is_owner_insert" ON public.bands;
DROP POLICY IF EXISTS "bands_is_owner_select" ON public.bands;
DROP POLICY IF EXISTS "bands_is_owner_update" ON public.bands;
DROP POLICY IF EXISTS "Users can read own bands" ON public.bands;
DROP POLICY IF EXISTS "Users can insert bands" ON public.bands;
DROP POLICY IF EXISTS "Users can update own bands" ON public.bands;
DROP POLICY IF EXISTS "Users can delete own bands" ON public.bands;

-- ============================================
-- 2. DROP AND RECREATE BANDS TABLE
-- ============================================
-- Drop the existing bands table (careful - this deletes data!)
DROP TABLE IF EXISTS public.bands CASCADE;

-- Create bands table with correct schema
CREATE TABLE public.bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 50),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_bands_created_by ON public.bands(created_by);

-- Enable Row Level Security
ALTER TABLE public.bands ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE NEW RLS POLICIES FOR BANDS
-- ============================================
-- Users can read bands they created
CREATE POLICY "Users can read own bands"
  ON public.bands
  FOR SELECT
  USING (auth.uid() = created_by);

-- Users can insert bands (freemium limit checked in application)
CREATE POLICY "Users can insert bands"
  ON public.bands
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own bands
CREATE POLICY "Users can update own bands"
  ON public.bands
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own bands
CREATE POLICY "Users can delete own bands"
  ON public.bands
  FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================
-- 4. CREATE PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 5. UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles table
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Apply trigger to bands table
DROP TRIGGER IF EXISTS set_updated_at_bands ON public.bands;
CREATE TRIGGER set_updated_at_bands
  BEFORE UPDATE ON public.bands
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 6. AUTOMATIC PROFILE CREATION
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, subscription_tier)
  VALUES (NEW.id, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 7. CREATE PROFILES FOR EXISTING USERS
-- ============================================
-- Create profiles for any existing auth users who don't have one yet
INSERT INTO public.profiles (id, subscription_tier)
SELECT id, 'free'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. UPDATE SONGS TABLE (if exists)
-- ============================================
-- Add band_id column to songs table if it doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'songs') THEN
    -- Add band_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'songs' AND column_name = 'band_id') THEN
      ALTER TABLE public.songs ADD COLUMN band_id UUID REFERENCES public.bands(id) ON DELETE CASCADE;
      CREATE INDEX idx_songs_band_id ON public.songs(band_id);
    END IF;
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Verify tables exist
SELECT 'profiles table' AS table_name, COUNT(*) AS row_count FROM public.profiles
UNION ALL
SELECT 'bands table', COUNT(*) FROM public.bands;

-- Verify RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('profiles', 'bands')
ORDER BY tablename, policyname;