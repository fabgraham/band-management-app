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
- ✅ **Delete confirmation flow (setlists + songs)**
  - A shared `showConfirm` helper is used.
  - On native (iOS/Android), it uses `Alert.alert` with promise-based resolution.
  - On web, it uses a compatible confirmation implementation so that clicking "Cancel" stops the delete and clicking "OK" proceeds.
  - `handleDeleteSetlist` and `handleRemoveSong` both `await showConfirm(...)` and only run delete logic when the result is `true`.
- ✅ **Delete buttons correctly wired**
  - Header trash icon calls `handleDeleteSetlist`.
  - Song row trash icon calls `handleRemoveSong` with the correct `entryId` and title.
- ✅ **No immediate deletes without confirmation**
  - Items are no longer deleted on icon press alone; confirmation result is respected.
- 🚧 **Styling alignment for empty states** (in progress; see below)
- ❌ (Original) **Delete confirmation dialogs** - Not working on web → now addressed via custom confirm logic.

## Root Cause (Historical)

React Native's `Alert.alert()` and browser's `window.confirm()` behave inconsistently in the Expo web environment:

- `Alert.alert()`
  - Works on iOS/Android
  - On web: effectively a no-op / not reliably rendered in this setup
- `window.confirm()`
  - In Expo web, returns an object-like value instead of a simple boolean
  - Truthy return caused "immediate delete" behavior without real user confirmation

## Implemented Solution (Current)

### 1. Shared `showConfirm` helper

A cross-platform helper was introduced (in `src/utils/helpers/confirm.ts`) to normalize confirmation behavior:

- Returns a `Promise<boolean>`.
- Native:
  - Uses `Alert.alert` with two buttons (Cancel/OK or Cancel/Delete), resolving to `true` only when confirm is pressed.
- Web:
  - Uses a compatible confirmation approach that returns a real boolean and does not auto-delete on its own.

All delete flows now:

1. Await `showConfirm`.
2. If `false` → exit early (no delete).
3. If `true` → perform delete and update UI.

### 2. `SetlistDetailScreen` handlers wired to `showConfirm`

`src/screens/Setlists/SetlistDetailScreen.tsx`:

- `handleDeleteSetlist`
  - Awaits `showConfirm("Delete Setlist", ...)`.
  - On confirm: calls `deleteSetlist(setlist.id)` then navigates back.
  - On cancel: does nothing.

- `handleRemoveSong`
  - Awaits `showConfirm("Remove Song", ...)`.
  - On confirm: calls `removeSongFromSetlist(entryId)` then reloads the setlist.
  - On cancel: does nothing.

- Header trash icon and song row trash icons now call only these handlers (no direct delete calls), preventing accidental deletes.

## UI/Styling Work (In Progress)

We started aligning the visual styling between:

- The main **Setlists screen** empty state (when there are no setlists), and
- The **Setlist detail screen** empty state (when a specific setlist has no songs yet).

### Goal

- When viewing a specific setlist with no songs:
  - Show only:
    - The blue header with the setlist title and actions (back, + to add songs, edit, delete).
    - A clean, centered empty state message in the content area.
  - Do NOT re-render the setlist "card" at the top of the detail page.
  - Use a style that visually matches the tone of the main Setlists screen empty state:
    - Background: `theme.colors.background`.
    - Content padding: consistent (e.g. 20px) left/right.
    - Typography: same hierarchy as other screens (title-like primary line, softer secondary text).
    - Colors: primary text readable but not harsh; secondary text in subtle gray (`#6e6e73`-like), similar to `InfoCard`/empty-state patterns.

### Current Implementation State

In `SetlistDetailScreen.tsx`:

- The header:
  - Uses the blue bar with back button, setlist title, +, edit, and delete icons.
- Song list:
  - Songs (when present) are rendered as white, card-like rows with:
    - Rounded corners
    - Subtle border
    - Clear song title + meta info
    - Red trash icon button for remove
- Empty state (when `songs.length === 0`):
  - Renders a centered message, e.g.:
    - Title: "No songs yet in this setlist"
    - Body: "Tap the + icon above to add songs."
  - We are iterating on font size and color to:
    - Match the visual weight and softness of the main Setlists screen empty state
    - Avoid overly dark or heavy text

### Next Steps for Tomorrow

When you pick this up:

1. Fine-tune the empty-state text styles in `SetlistDetailScreen.tsx`:
   - Adjust `emptyStateTitle.fontSize` and `fontWeight` to align with your primary/secondary typography.
   - Adjust `emptyStateBody.color` (e.g. `#6e6e73`) and size to match supporting/secondary text.
2. Confirm that:
   - The detail screen does NOT show a duplicate setlist card at the top.
   - Only header + empty-state content appear when there are no songs.
   - Song rows, when present, visually match the app’s existing card style.
3. Re-test delete flows on:
   - Web: ensure confirm dialog appears, Cancel cancels, OK deletes.
   - iOS/Android: confirm the same behavior.

This document now reflects the fixed delete behavior and the styling alignment work you can continue tomorrow.
