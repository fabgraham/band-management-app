-- =====================================================================
-- Fix Missing Band Creators
-- =====================================================================
-- This script adds band creators as 'owner' members if they're missing
-- Run this AFTER phase5-fix-recursion.sql if bands still don't show
-- =====================================================================

-- Add all band creators as owners in band_members if not already there
INSERT INTO public.band_members (band_id, user_id, role)
SELECT
  b.id as band_id,
  b.created_by as user_id,
  'owner' as role
FROM public.bands b
WHERE NOT EXISTS (
  SELECT 1 FROM public.band_members bm
  WHERE bm.band_id = b.id
  AND bm.user_id = b.created_by
)
ON CONFLICT (band_id, user_id) DO NOTHING;

-- Verify the fix
SELECT
  b.name as band_name,
  b.created_by as creator_id,
  bm.role as member_role,
  CASE
    WHEN bm.role IS NOT NULL THEN '✅ Fixed'
    ELSE '❌ Still missing'
  END as status
FROM public.bands b
LEFT JOIN public.band_members bm ON bm.band_id = b.id AND bm.user_id = b.created_by
ORDER BY b.created_at DESC;
