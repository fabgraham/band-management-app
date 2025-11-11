# Delete Functionality Troubleshooting Guide

## Problem Summary

The delete buttons for setlists and songs are not working properly when running on web (localhost:8081). The buttons either don't respond or delete items without showing confirmation dialogs.

## What We're Trying to Do

1. **Delete Setlist**: User clicks trash icon in header → Show confirmation dialog → Delete only if user confirms → Navigate back
2. **Remove Song from Setlist**: User clicks trash icon on song card → Show confirmation dialog → Remove only if user confirms → Reload setlist

## Current Status

- ✅ **Adding songs to setlist** - Working correctly
- ✅ **Database operations** - All CRUD operations work (verified with direct calls)
- ✅ **RLS Policies** - Fixed and working correctly
- ✅ **Column naming** - Fixed `position` vs `order_index` mismatch
- ❌ **Delete confirmation dialogs** - Not working on web

## The Root Cause

React Native's `Alert.alert()` and browser's `window.confirm()` don't work properly in Expo's web environment:

### Issue with `Alert.alert()`
- Works on iOS/Android (native alerts)
- **Doesn't work on web** - No visible dialog appears

### Issue with `window.confirm()`
- Works in regular browsers
- **In Expo web**: Returns `{}` (empty object) instead of boolean
  - Log evidence: `type: object value: {}`
  - Empty object is truthy, so `if (!confirmed)` evaluates incorrectly
  - Items delete immediately without waiting for user input

## Code Location

**File**: `src/screens/Setlists/SetlistDetailScreen.tsx`

### Current Implementation (Lines 84-142)

```typescript
// Delete Setlist Handler
const handleDeleteSetlist = () => {
  if (!setlist) return;

  Alert.alert(
    'Delete Setlist',
    `Are you sure you want to delete "${setlist.name}"?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteSetlist(setlist.id)
            .then(() => {
              navigation.goBack();
            })
            .catch((error) => {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete setlist.'
              );
            });
        },
      },
    ],
  );
};

// Remove Song Handler
const handleRemoveSong = (entryId: string, songTitle: string) => {
  Alert.alert(
    'Remove Song',
    `Are you sure you want to remove "${songTitle}" from this setlist?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeSongFromSetlist(entryId)
            .then(() => {
              return loadSetlist();
            })
            .catch((error) => {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to remove song.'
              );
            });
        },
      },
    ],
  );
};
```

### Button Implementation

**Delete Setlist Button** (Line 270-273):
```typescript
<Pressable
  style={styles.headerButton}
  onPress={handleDeleteSetlist}
  hitSlop={8}
>
  <Ionicons name="trash-outline" size={22} color="#ffffff" />
</Pressable>
```

**Remove Song Button** (Lines 200-210):
```typescript
<Pressable
  onPress={(e) => {
    e?.stopPropagation?.();
    handleRemoveSong(item.id, item.song?.title ?? 'this song');
  }}
  onPressIn={(e) => e?.stopPropagation?.()}
  hitSlop={8}
  style={{ padding: 4 }}
>
  <Ionicons name="trash-outline" size={20} color="#ff3b30" />
</Pressable>
```

## Approaches Tried

### 1. Using `Alert.alert()` directly
- **Result**: No dialog appears on web
- **Why it failed**: React Native Alert not implemented for web

### 2. Using `window.confirm()`
- **Result**: Items deleted immediately without confirmation
- **Why it failed**: Expo polyfills `window.confirm()` to return Promise-like object `{}` instead of boolean

### 3. Using `Alert.alert()` with button callbacks
- **Result**: Buttons not responding
- **Why it's failing**: Unknown - possibly React Native Web polyfill issue

## Potential Solutions to Try

### Option 1: Install Cross-Platform Alert Library
```bash
npm install @blazejkustra/react-native-alert
```

Then replace all `Alert.alert` calls with this library's implementation. This library specifically handles web compatibility.

**Pros**: Drop-in replacement, works everywhere, maintained
**Cons**: Additional dependency

### Option 2: Create Custom Modal Component
Create a custom confirmation modal using React Native components that works across all platforms.

**Pros**: Full control, no external dependencies
**Cons**: More code to maintain

### Option 3: Platform-Specific Code
```typescript
import { Platform, Alert } from 'react-native';

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    // Use custom modal or different approach for web
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', onPress: onConfirm }
    ]);
  }
};
```

**Pros**: Handles each platform specifically
**Cons**: More complex, need custom web solution

### Option 4: Use react-native-web-compatible Modal
Create a simple modal using React Native's `Modal` component which works on web:

```typescript
import { Modal, View, Text, TouchableOpacity } from 'react-native';

// Custom confirmation modal component
// This would work across all platforms including web
```

**Pros**: Uses built-in components, no external dependencies
**Cons**: Need to build the modal UI

## Debug Information

### Console Logs When Clicking Delete

**With `window.confirm()`**:
```
[DELETE] Function called at: 2025-11-11T17:54:54.338Z
[DELETE] About to show confirm dialog
[DELETE] Confirm dialog returned: type: object value: {} at: 2025-11-11T17:54:54.338Z
[DELETE] User confirmed - proceeding with delete...
[setlistService] deleteSetlist start {setlistId: f17c8293-0dee-422d-a24b-ea7ff3910a94}
[setlistService] deleteSetlist result {deletedCount: 1}
[DELETE] Delete successful
get confirm result true  ← This appears AFTER delete completes
```

**With `Alert.alert()`**:
- No console logs
- No visible dialog
- Buttons don't respond

## Database Schema Reference

### Tables Involved
- `setlists` - Setlist metadata
- `setlist_songs` - Join table (setlist_id, song_id, position)

### Key Column Names
- Database uses: `position`
- TypeScript types use: `order_index`
- Mapping happens in `setlistService.ts` lines 47 and 239

## Files Modified During Troubleshooting

1. `src/screens/Setlists/SetlistDetailScreen.tsx` - Delete handlers
2. `src/services/data/setlistService.ts` - Fixed column names
3. `supabase/complete-fix-both-issues.sql` - RLS policies and constraints

## Next Steps to Try

1. **Install `@blazejkustra/react-native-alert`** and replace Alert.alert calls
2. **Or** Create a custom `ConfirmationModal` component using React Native Modal
3. **Or** Check if there are any conflicting polyfills or overrides in the Expo config
4. **Test on actual iOS/Android device** to confirm it's web-specific
5. **Check browser console** for any JavaScript errors being swallowed

## Recommended Solution

**Use `@blazejkustra/react-native-alert`** - This is the most straightforward solution:

```bash
npm install @blazejkustra/react-native-alert
```

```typescript
// Replace at top of SetlistDetailScreen.tsx
import Alert from '@blazejkustra/react-native-alert';

// Rest of the code stays the same - it's a drop-in replacement
```

This library was specifically created to solve the exact problem we're experiencing.

## Contact Points

- **Issue**: Delete buttons not working on web
- **Environment**: Expo web (localhost:8081)
- **Date**: December 11, 2025
- **Status**: Needs cross-platform alert solution
