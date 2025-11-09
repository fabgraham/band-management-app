-- Phase 1: Band Management - Database Schema
-- Run this SQL in your Supabase SQL Editor: https://supabase.com/dashboard/project/kqpbwkfhpthmazitshxf/editor

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
-- Stores user subscription information for freemium limits
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
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. BANDS TABLE
-- ============================================
-- Stores band information
CREATE TABLE IF NOT EXISTS public.bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 50),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_bands_created_by ON public.bands(created_by);

-- Enable Row Level Security
ALTER TABLE public.bands ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own bands" ON public.bands;
DROP POLICY IF EXISTS "Users can insert bands" ON public.bands;
DROP POLICY IF EXISTS "Users can update own bands" ON public.bands;
DROP POLICY IF EXISTS "Users can delete own bands" ON public.bands;

-- RLS Policies for bands
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
-- 3. UPDATED_AT TRIGGER FUNCTION
-- ============================================
-- Automatically update updated_at timestamp
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
-- 4. AUTOMATIC PROFILE CREATION
-- ============================================
-- Automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, subscription_tier)
  VALUES (NEW.id, 'free');
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
-- 5. UPDATE EXISTING SONGS TABLE (if exists)
-- ============================================
-- Add band_id column to songs table if it doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'songs') THEN
    -- Add band_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'songs' AND column_name = 'band_id') THEN
      ALTER TABLE public.songs ADD COLUMN band_id UUID REFERENCES public.bands(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_songs_band_id ON public.songs(band_id);
    END IF;
  END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the tables were created successfully:

-- Check if profiles table exists
-- SELECT * FROM public.profiles LIMIT 5;

-- Check if bands table exists
-- SELECT * FROM public.bands LIMIT 5;

-- Check RLS policies
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename IN ('profiles', 'bands');