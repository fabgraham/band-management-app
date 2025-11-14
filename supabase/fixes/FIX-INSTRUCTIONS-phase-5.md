# 🔧 Phase 5 Fix Instructions

## The Problem
You're getting: `Failed to fetch bands: infinite recursion detected in policy for relation "band_members"`

This is because the RLS policies were never properly fixed - only the membership data was added.

## The Solution - Updated helpers + policies

This solution now includes security-definer helper functions so `band_members` policies can safely evaluate without recursively querying themselves.

### Helper functions (`is_band_member`, `has_band_role`, `get_user_band_role`)
- Run as table owner (SECURITY DEFINER) so the helpers bypass RLS while still using the authenticated uid
- Used across all `band_members` policies to avoid self-reference loops
- Included in `ULTIMATE-FIX-ALL-RECURSION.sql` and `phase5-member-management.sql`

## The Solution - ONE Script to Rule Them All

I've created **[COMPLETE-FIX-ALL-IN-ONE.sql](COMPLETE-FIX-ALL-IN-ONE.sql)** which does EVERYTHING:

✅ Removes all broken policies
✅ Creates correct non-recursive policies
✅ Adds trigger for auto-owner creation
✅ Fixes existing bands
✅ Updates shared access policies
✅ Verifies everything worked

---

## How to Apply (3 Steps)

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/kqpbwkfhpthmazitshxf/sql

### Step 2: Run the Complete Fix
1. Click **"New Query"**
2. Open **[COMPLETE-FIX-ALL-IN-ONE.sql](COMPLETE-FIX-ALL-IN-ONE.sql)** in your editor
3. Copy the **entire file** (all ~600 lines)
4. Paste into Supabase SQL Editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)

### Step 3: Check Results
You should see several result tables at the bottom showing:
- ✅ Verification: All bands have creators as members
- ✅ Policies Created: Count for each table
- ✅ Trigger Status: Active
- 🎉 Final message: "FIX COMPLETE! Try logging in now."

---

## Test It

1. **Restart your app** (if it's running)
2. **Log in**
3. **You should see your bands!** No recursion error!

---

## What This Script Does

### 1. Clean Slate (Lines 1-35)
Drops ALL existing policies to remove conflicts

### 2. Fix band_members Policies (Lines 37-120)
Creates policies with **NO RECURSION**:
- Uses direct `auth.uid()` check (not self-referential)
- Band owners can see all members
- Proper INSERT/UPDATE/DELETE permissions

### 3. Fix bands Policies (Lines 122-160)
Now safe to query band_members (no recursion loop)

### 4. Fix band_invitations Policies (Lines 162-280)
Proper invitation management

### 5. Update Shared Access (Lines 282-520)
Songs, setlists, setlist_songs - all support member collaboration

### 6. Add Trigger (Lines 522-545)
Auto-adds band creator as 'owner' for NEW bands

### 7. Fix Existing Bands (Lines 547-560)
Adds you as 'owner' to bands you already created

### 8. Verify (Lines 562-600)
Confirms everything worked

---

## Why Previous Attempts Didn't Work

❌ **fix-missing-creators.sql** - Only adds memberships, doesn't fix policies
❌ **phase5-fix-recursion.sql** - Fixes policies but you never ran it
✅ **COMPLETE-FIX-ALL-IN-ONE.sql** - Does BOTH in correct order

---

## Troubleshooting

### Still Getting Recursion Error?
1. Make sure you ran the **entire script** (all ~600 lines)
2. Check that you see the verification results at the bottom
3. Try refreshing your browser and running query again

### Verification Query
Run this to check policies are correct:
```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'band_members'
ORDER BY policyname;
```

You should see:
- `band_members_delete_policy`
- `band_members_insert_policy`
- `band_members_select_policy` ← Check this one
- `band_members_update_policy`

### Check the SELECT Policy
Run this to see the policy definition:
```sql
SELECT qual
FROM pg_policies
WHERE tablename = 'band_members'
AND policyname = 'band_members_select_policy';
```

Should start with: `((user_id = auth.uid()) OR ...` (direct check, no self-reference)

---

## Need Help?

If it still doesn't work after running the complete script:
1. Check the verification output
2. Run the troubleshooting queries above
3. Share the results so I can debug further

The script is designed to be **idempotent** (safe to run multiple times), so you can re-run it if needed.
