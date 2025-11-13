# Band Management App - Implementation Plan

## Current Status (November 10, 2025)

### Completed Phases:
- ✅ **Phase 1: Band Management** - Complete (100%)
  - Band CRUD operations
  - Band switching
  - Edit/Delete with confirmation
  - Freemium limit (1 band)

- ✅ **Phase 2: Song Library** - Complete (100%)
  - Song CRUD operations per band
  - Search with debounce
  - Song metadata (key, BPM, duration, lyrics, notes)
  - Freemium limit (10 songs per band)
  - **Dashboard navigation** with 4 cards (Setlists, Library, Calendar, Members)
  - **Icon-only bottom tabs** with active state highlighting
  - **Dynamic header** that changes per screen
  - Library FAB moved to header

### Currently Working On:
- 🎯 **Phase 3: Setlist Management** - Ready to Begin (0%)
  - Database schema already exists
  - Setlists tab placeholder in place
  - Dashboard card for navigation created

### Upcoming Phases:
- ⏳ **Phase 4: Offline Sync** - Not Started
- ⏳ **Phase 5: Advanced Features** - Not Started
- ⏳ **Phase 6: Subscriptions & Polish** - Not Started

### Future Features (Post-MVP):
- 📅 **Calendar** - Placeholder exists, coming in future phase
- 👥 **Members** - Placeholder exists, coming in future phase
- Other features listed in Phase 2+ section below

---

## Approach: Feature-by-Feature (Vertical Slices)

This implementation plan follows a **feature-by-feature approach**, where each phase delivers a complete, working feature that includes:
- Database schema + Row-Level Security (RLS) policies
- Service layer (API/data access functions)
- UI screens + forms
- State management integration
- Testing the complete user flow

### Why This Approach?
- ✅ Each phase delivers a **testable, working feature**
- ✅ Faster feedback loops - validate UX decisions immediately
- ✅ Easier to pivot if issues are discovered
- ✅ Motivating - see progress every week
- ✅ Reduces risk - backend and frontend built together
- ✅ Matches the PRD's phased development approach

### Estimated Timeline
- **With AI assistance**: 6-8 weeks total
- **Phase 1-3 (Core MVP)**: 3-4 weeks
- **Phase 4-6 (Advanced Features)**: 3-4 weeks

---

## Phase 1: Band Management 🎸
**Duration**: 5-7 days
**Priority**: P0 - Foundation for all other features
**Why First?**: Bands are the organizational unit - all songs and setlists belong to a band

### Backend Tasks
1. **Create `profiles` table** in Supabase
   - Columns: `id` (UUID, references auth.users), `subscription_tier` (text: 'free' or 'pro'), `created_at`, `updated_at`
   - Purpose: Track user subscription status for freemium limits

2. **Create `bands` table** in Supabase
   - Columns: `id` (UUID), `name` (text), `created_by` (UUID, references profiles), `created_at`, `updated_at`
   - Purpose: Store band information

3. **Implement RLS policies** for `bands` table
   - Users can only see bands they created or are members of
   - Users can only update/delete bands they created

4. **Create `band_members` join table** (optional for MVP, but recommended)
   - Columns: `band_id` (UUID), `profile_id` (UUID), `role` (text: 'admin', 'member'), `joined_at`
   - Purpose: Support multiple users per band (Phase 3 feature, but schema needed now)

### Frontend Tasks
5. **Create `bandService.ts`** in `src/services/data/`
   - Functions: `getBands()`, `createBand(name)`, `updateBand(id, name)`, `deleteBand(id)`
   - Use Supabase client for database operations

6. **Update BandContext** to use real Supabase data
   - Remove hardcoded demo data ("Midnight Echoes", "North Star Collective")
   - Add methods: `fetchBands()`, `createBand(name)`, `updateBand(id, name)`, `deleteBand(id)`, `selectBand(id)`
   - Add state: `bands` (array), `activeBand` (current selected band), `loading`, `error`

7. **Build "Create Band" form**
   - Create `CreateBandModal.tsx` or `CreateBandScreen.tsx`
   - Form fields: Band name (text input)
   - Validation: Name required, max 50 characters
   - On submit: Call `bandService.createBand()`, refresh band list

8. **Update BandsScreen** to show real bands
   - Replace hardcoded cards with dynamic list from BandContext
   - Add "Create Band" button (floating action button or header button)
   - Add empty state ("No bands yet - create your first band!")
   - Add pull-to-refresh functionality

9. **Build "Edit Band" functionality**
   - Add edit button to each band card
   - Reuse CreateBandModal with edit mode, or create EditBandModal
   - Pre-fill form with existing band name
   - On submit: Call `bandService.updateBand()`, refresh band list

10. **Build "Delete Band" functionality**
    - Add delete button/swipe action on band cards
    - Show confirmation modal: "Delete [band name]? This will delete all songs and setlists."
    - On confirm: Call `bandService.deleteBand()`, refresh band list

11. **Build band switcher dropdown** in app header
    - Show current band name in header
    - Dropdown menu shows all user's bands
    - On select: Update `activeBand` in BandContext
    - Show on all app screens (not auth screens)

12. **Implement freemium limit** (1 band for free users)
    - Check `profiles.subscription_tier` before creating band
    - If tier is 'free' and user has 1 band, show paywall modal
    - Create `PaywallModal.tsx` (simple placeholder for now)
    - Message: "Upgrade to Pro to create unlimited bands"

### Expected Outcome
- Users can create, view, edit, and delete bands
- Band switcher dropdown allows switching between bands
- Free users limited to 1 band (paywall shown on 2nd band creation)
- All data stored in Supabase and persisted
- Complete user flow: Tap Bands → See bands → Create band → Switch bands

---

## Phase 2: Song Library 🎵
**Duration**: 7-10 days
**Priority**: P0 - Core feature
**Why Second?**: Songs are needed before setlists can be built

### Backend Tasks
1. **Verify/update `songs` table schema** in Supabase
   - Ensure columns: `id`, `title`, `artist`, `key`, `bpm`, `duration_seconds`, `lyrics`, `notes`, `band_id` (FK), `created_at`, `updated_at`
   - Add `band_id` foreign key if missing (references bands.id)
   - Add index on `band_id` for performance

2. **Implement RLS policies** for `songs` table
   - Users can only see songs from their bands
   - Users can only create/update/delete songs in their bands
   - Policy: `band_id IN (SELECT id FROM bands WHERE created_by = auth.uid())`

### Frontend Tasks
3. **Update `songService.ts`** to filter by band
   - Update `getSongs()` to accept optional `bandId` parameter
   - Update `createSong()` to require `bandId` parameter
   - Ensure all operations filter by active band

4. **Move LibraryScreen to functional implementation**
   - Currently a placeholder - make it display songs
   - Fetch songs from `songService.getSongs(activeBand.id)`
   - Display as list/grid with song cards
   - Show: title, artist, key (color-coded), BPM

5. **Build "Add Song" form**
   - Create `AddSongScreen.tsx` or `AddSongModal.tsx`
   - Form fields:
     - Title (text input, required)
     - Artist (text input, required)
     - Key (picker: C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B, with major/minor)
     - BPM (number input, optional)
     - Duration (time picker: MM:SS, optional)
     - Lyrics (multiline text input, optional)
     - Notes (multiline text input, optional)
   - Validation: Title and artist required
   - On submit: Call `songService.createSong()` with `activeBand.id`

6. **Build "Song Detail" screen**
   - Create `SongDetailScreen.tsx`
   - Display all song metadata at top
   - Show lyrics in scrollable view with user's font preferences (from ProfileScreen)
   - Edit button opens edit form
   - Delete button with confirmation

7. **Build "Edit Song" form**
   - Reuse AddSongScreen/AddSongModal in edit mode
   - Pre-fill all fields with existing song data
   - On submit: Call `songService.updateSong()`

8. **Implement song search** with debounce
   - Add search bar at top of LibraryScreen
   - Use `searchSongs()` from songService
   - Debounce search input by 300ms (use lodash.debounce or custom hook)
   - Search by title, artist, key

9. **Add delete confirmation modal**
   - Show when delete button tapped on song
   - Message: "Delete '[song title]'? This cannot be undone."
   - On confirm: Call `songService.deleteSong()`, refresh song list

10. **Implement freemium limit** (10 songs for free users)
    - Check `profiles.subscription_tier` before creating song
    - If tier is 'free' and band has 10 songs, show paywall modal
    - Message: "Upgrade to Pro for unlimited songs (free tier: 10 songs per band)"

11. **Add empty/loading/error states**
    - Empty: "No songs yet - add your first song!"
    - Loading: Show loading spinner while fetching
    - Error: Show error message with retry button

### Expected Outcome
- Library tab is fully functional
- Users can add, view, edit, delete, and search songs
- Songs filtered by active band (band switcher affects Library view)
- Free users limited to 10 songs per band
- Song detail screen shows lyrics with user's font preferences
- Complete user flow: Tap Library → See songs → Add song → View details → Edit/Delete

---

## Phase 3: Setlist Management 📋
**Duration**: 7-10 days
**Priority**: P0 - Core feature
**Why Third?**: Combines bands and songs into organized setlists

### Backend Tasks
1. **Create `setlists` table** in Supabase
   - Columns: `id` (UUID), `name` (text), `band_id` (UUID, FK), `show_date` (timestamp, optional), `created_at`, `updated_at`
   - Foreign key: `band_id` references `bands.id`

2. **Create `setlist_songs` join table** in Supabase
   - Columns: `id` (UUID), `setlist_id` (UUID, FK), `song_id` (UUID, FK), `order_index` (integer), `created_at`
   - Foreign keys: `setlist_id` references `setlists.id`, `song_id` references `songs.id`
   - Index on `setlist_id` for performance
   - Unique constraint on (`setlist_id`, `order_index`)

3. **Implement RLS policies** for both tables
   - Users can only see setlists from their bands
   - Users can only create/update/delete setlists in their bands
   - Policy: `band_id IN (SELECT id FROM bands WHERE created_by = auth.uid())`

### Frontend Tasks
4. **Create `setlistService.ts`** in `src/services/data/`
   - Functions:
     - `getSetlists(bandId)` - Get all setlists for a band
     - `getSetlistWithSongs(setlistId)` - Get setlist with joined songs
     - `createSetlist(bandId, name, showDate?)` - Create new setlist
     - `updateSetlist(id, name, showDate?)` - Update setlist
     - `deleteSetlist(id)` - Delete setlist
     - `addSongToSetlist(setlistId, songId, orderIndex)` - Add song
     - `removeSongFromSetlist(setlistId, songId)` - Remove song
     - `reorderSetlistSongs(setlistId, newOrder)` - Update order_index values

5. **Update SetlistsScreen** to show real setlists
   - Currently shows songs directly - change to show setlists
   - Display setlist cards with: name, show date, song count
   - Add "Create Setlist" button
   - Add empty state
   - On tap: Navigate to SetlistDetailScreen

6. **Build "Create Setlist" form**
   - Create `CreateSetlistModal.tsx`
   - Form fields:
     - Name (text input, required)
     - Show date (date picker, optional)
   - On submit: Call `setlistService.createSetlist()` with `activeBand.id`

7. **Build "Setlist Detail" screen**
   - Create `SetlistDetailScreen.tsx`
   - Show setlist name and show date at top
   - Display list of songs in order
   - Each song card shows: order number, title, artist, key, duration
   - Show total setlist duration
   - Add "Add Songs" button
   - Edit/Delete buttons in header

8. **Build "Add Songs to Setlist" picker modal**
   - Create `AddSongsModal.tsx`
   - Show all songs from current band (not already in setlist)
   - Multi-select with checkboxes
   - Search/filter functionality
   - On confirm: Call `setlistService.addSongToSetlist()` for each selected song

9. **Implement drag-and-drop reordering**
   - Install `react-native-draggable-flatlist`
   - Replace FlatList in SetlistDetailScreen with DraggableFlatList
   - On drag end: Call `setlistService.reorderSetlistSongs()` with new order
   - Add haptic feedback on drag start/end (Haptics.impactAsync)

10. **Build "Edit Setlist" form**
    - Reuse CreateSetlistModal in edit mode
    - Pre-fill name and show date
    - On submit: Call `setlistService.updateSetlist()`

11. **Add delete setlist functionality**
    - Delete button in SetlistDetailScreen header
    - Show confirmation: "Delete '[setlist name]'? This will remove all songs from this setlist."
    - On confirm: Call `setlistService.deleteSetlist()`, navigate back

12. **Implement freemium limit** (2 setlists for free users)
    - Check `profiles.subscription_tier` before creating setlist
    - If tier is 'free' and band has 2 setlists, show paywall modal
    - Message: "Upgrade to Pro for unlimited setlists (free tier: 2 setlists per band)"

### Expected Outcome
- Setlists tab is fully functional
- Users can create, view, edit, delete setlists
- Users can add songs to setlists from Library
- Drag-and-drop reordering with haptic feedback works smoothly
- Free users limited to 2 setlists per band
- Complete user flow: Tap Setlists → Create setlist → Add songs → Reorder songs → View/Edit/Delete

---

## ✅ Phase 3: Setlist Management - COMPLETE (November 13, 2025)

### Current Status
**Phase 3 is COMPLETE** - All core functionality working, UX polished.

### ✅ Completed November 12-13, 2025
1. **Setlist Detail Screen UI Redesign**
   - Removed card-based song layout
   - Added clean list design with 1px dividers
   - Added hamburger icons (≡) for visual drag affordance
   - Added subtle song numbering (gray, 12px)
   - Implemented Edit Mode toggle (pencil/checkmark icons)
   - Delete buttons now only appear in edit mode
   - Files modified: `src/screens/Setlists/SetlistDetailScreen.tsx`

2. **Fixed Setlist Card Actions (BandDetailScreen)**
   - Added `e.stopPropagation()` to edit/delete buttons on setlist cards
   - Fixed modal flash issue when editing setlist
   - Files modified: `src/screens/Bands/BandDetailScreen.tsx`

3. **UX Decision: Edit/Delete Separation**
   - **Setlist metadata editing** (name/date) → Handled in modal from setlist cards
   - **Song management** (remove songs) → Handled in SetlistDetailScreen with edit mode
   - No confusion between editing setlist vs editing songs

### ✅ All Issues Resolved (November 13, 2025)

**FIXES COMPLETED**:

1. **✅ Song Reordering - FIXED**
   - **Solution**: Removed outer Pressable wrapper, moved `onLongPress={drag}` directly to hamburger icon
   - **Result**: Long-press drag now works smoothly with proper haptic feedback
   - **Files**: `src/screens/Setlists/SetlistDetailScreen.tsx`

2. **✅ Delete Buttons - FIXED**
   - **Solution**: Switched from Alert.alert to ConfirmModal for web compatibility
   - **Enhancement**: Added `showCancelButton={false}` prop for streamlined UX
   - **Result**: All delete confirmations work correctly on both web and native
   - **Files**: `src/components/Modals/ConfirmModal.tsx`, `src/screens/Setlists/SetlistDetailScreen.tsx`

3. **✅ Three-Dot Menu - NEW FEATURE**
   - **Added**: ActionMenuModal component for consistent menu pattern
   - **Location**: SetlistDetailScreen header (replaces inline delete button)
   - **Options**: "Edit Setlist" and "Delete Setlist" with destructive styling
   - **Files**: `src/components/Modals/ActionMenuModal.tsx` (NEW)

4. **✅ Edit Setlist Integration - COMPLETE**
   - **Added**: CreateSetlistModal integration in SetlistDetailScreen
   - **Access**: Opens from three-dot menu "Edit Setlist" option
   - **Result**: In-place editing with automatic reload after save
   - **Files**: `src/screens/Setlists/SetlistDetailScreen.tsx`

5. **✅ Setlist Card UX Improvements - COMPLETE**
   - **Removed**: "No date set" text (field cannot be set)
   - **Added**: 16px top padding to setlist scroll area
   - **Improved**: Stats layout (flex:0, minWidth:30%) for tighter visual grouping
   - **Reduced**: Gap between "Songs" and "Duration" from 24px to 16px
   - **Files**: `src/screens/Bands/BandDetailScreen.tsx`

### 📁 Files Modified/Created November 13
1. `src/screens/Setlists/SetlistDetailScreen.tsx` - Fixed drag, added three-dot menu, integrated edit modal
2. `src/screens/Bands/BandDetailScreen.tsx` - Improved setlist card styling
3. `src/components/Modals/ActionMenuModal.tsx` - **NEW** reusable menu component
4. `src/components/Modals/ConfirmModal.tsx` - Added optional cancel button
5. `src/components/Modals/CreateSetlistModal.tsx` - Removed delete button (now in menu)
6. `plan_docs/Implementation_Summary.md` - Documented all changes

### 🎨 UI/UX Improvements Summary
- Cleaner setlist cards without button clutter
- Consistent three-dot menu pattern for actions
- Better spacing and visual hierarchy
- Streamlined delete confirmation flow (no cancel button)
- Web-compatible modals throughout
- Tighter stats layout on setlist cards

---

## 🎯 Phase 4: Lyrics Display & Performance Mode (NEXT - December 2025)

### Overview
**Duration**: 3-5 days
**Priority**: P0 - Core value proposition
**Why Next?**: This is the main feature that makes the app useful for live performances

### User Story
> "As a performer, when I tap on a song in a setlist, I want to see the lyrics in a large, readable format with auto-scroll, so I can perform without looking away from the stage."

### Current State
- ✅ Songs have `lyrics` field (text, stored in database)
- ✅ Lyrics are viewable in SongDetailScreen (small text, edit mode)
- ❌ No performance/live view mode
- ❌ No auto-scroll functionality
- ❌ No large text display optimized for stage use

### Requirements (from PRD 5.1.5)

#### Must-Have (P0):
1. **Full-Screen Lyrics Viewer**
   - Access from: SetlistDetailScreen → Tap song row
   - Hide: Header, navigation, all UI chrome
   - Show: Only lyrics text and minimal controls
   - Dark mode optimized for stage lighting

2. **Text Size Adjustment**
   - User-controlled font size slider (14px - 36px range)
   - Preference saved per user (not per song)
   - Large default size (24px) for stage visibility

3. **Manual Scroll**
   - User can scroll freely through lyrics
   - Smooth scrolling with momentum
   - Current position indicator (optional)

4. **Auto-Scroll (Duration-Based)**
   - Only enabled if song has `duration_seconds`
   - Calculate scroll speed: `lyricHeight / durationSeconds`
   - Play/Pause button at bottom (floating action button)
   - Pause on manual scroll (auto-resume after 5 seconds of no touch)
   - Smooth 60fps animation

5. **Play/Pause Controls**
   - Play: Start auto-scroll from current position
   - Pause: Stop at current position
   - Bottom navigation bar with three buttons:
     - Previous song (left arrow icon)
     - Play/Pause (center, primary button)
     - Next song (right arrow icon)
   - Navigation buttons allow moving through setlist without exiting performance mode

6. **Song Settings Menu**
   - Three-dot menu icon in header (right side, next to song name)
   - Opens settings modal with all song details (same as AddSongModal)
   - User can edit: title, artist, key, BPM, duration, lyrics, notes
   - Changes save immediately and update performance view
   - Uses existing AddSongModal component in edit mode

#### Nice-to-Have (P1):
7. **Scroll Speed Indicator**
   - Show time remaining (e.g., "2:45 remaining")
   - Show progress bar (0-100%)

8. **Scroll Speed Adjustment**
   - Slider to adjust speed (0.5x - 2x)
   - Useful if song duration estimate is off

### Implementation Tasks

#### Backend (None - uses existing schema)
- ✅ `songs.lyrics` column already exists
- ✅ `songs.duration_seconds` column already exists
- No database changes needed

#### Frontend Tasks

**1. Create PerformanceModeScreen**
- File: `src/screens/Performance/PerformanceModeScreen.tsx`
- Route: Add to BandsStack navigator
- Navigation: From SetlistDetailScreen song tap
- Props: `{ songId: string, setlistId?: string }`

**2. Build Full-Screen Lyrics View**
- Hide React Navigation header (`headerShown: false`)
- Dark background (#000000 or #1a1a1a)
- White text (#ffffff) with high contrast
- Full-screen ScrollView with lyrics
- Exit button (top-left corner, minimal)

**3. Implement Font Size Control**
- Add slider component (bottom sheet or overlay)
- Range: 14px - 36px, default 24px
- Save to AsyncStorage: `@lyrics_font_size`
- Load on mount and apply to lyrics text

**4. Add Manual Scroll**
- Use `ScrollView` with `ref` for programmatic control
- Track scroll position with `onScroll` event
- Store current position in state
- Disable auto-scroll on user touch

**5. Implement Auto-Scroll**
- Calculate scroll speed on mount:
  ```typescript
  const scrollSpeed = lyricHeight / song.duration_seconds;
  ```
- Use `Animated.timing()` for smooth scroll:
  ```typescript
  Animated.timing(scrollY, {
    toValue: lyricHeight,
    duration: song.duration_seconds * 1000,
    easing: Easing.linear,
    useNativeDriver: true,
  }).start();
  ```
- Add pause/resume functionality
- Pause on manual scroll, resume after 5s timeout

**6. Build Bottom Navigation Bar**
- Fixed bottom bar (always visible, doesn't auto-hide)
- Three main buttons in horizontal layout:
  - **Previous Song** (left): Arrow-left icon, navigates to previous song in setlist
  - **Play/Pause** (center): Large primary button, toggles auto-scroll
  - **Next Song** (right): Arrow-right icon, navigates to next song in setlist
- Styling: Dark background to match performance mode
- Button states:
  - Disable Previous if first song in setlist
  - Disable Next if last song in setlist
  - Play/Pause always enabled if song has duration

**7. Build Song Settings Menu**
- Three-dot menu icon in header (top-right, next to song name)
- Opens ActionMenuModal with options:
  - "Edit Song Details" → Opens AddSongModal in edit mode
  - Shows all song fields (title, artist, lyrics, key, BPM, duration, notes)
  - On save: Update song, reload performance view
  - Allow editing lyrics during performance (useful for corrections)

**8. Implement Setlist Navigation**
- Pass `setlistId` and `songIndex` as route params
- Load full setlist data to enable prev/next navigation
- Track current song index in state
- On Previous/Next: Update index, load new song, reset scroll position
- Maintain auto-scroll state across song changes (if playing, start next song automatically)

**9. Add Scroll Progress Indicator (P1)**
- Progress bar at top (2px height, subtle)
- Time remaining label (top-right corner)
- Format: MM:SS or "2:45 remaining"

**10. Navigation Flow**
- SetlistDetailScreen: Tap song row → Navigate to PerformanceModeScreen
- Pass songId via route params
- Load song data (title, artist, lyrics, duration)
- Show loading state while fetching

**11. Edge Cases & Error Handling**
- No lyrics: Show message "No lyrics available for this song"
- No duration: Disable auto-scroll, show manual scroll only
- Very short songs (<30s): Warn that auto-scroll may be too fast
- Very long songs (>10min): Consider chunked scrolling

**12. Testing Checklist**
- [ ] Lyrics display correctly with various text lengths
- [ ] Font size adjustment persists across app restarts
- [ ] Auto-scroll speed is accurate (test with known song)
- [ ] Manual scroll doesn't break auto-scroll
- [ ] Controls auto-hide and show on tap
- [ ] Exit button returns to setlist
- [ ] Works on small screens (iPhone SE) and large (iPad)
- [ ] Dark mode is comfortable for stage lighting
- [ ] 60fps scrolling (no jank or stuttering)

### Expected Outcome
- ✅ Users can view lyrics in full-screen performance mode
- ✅ Auto-scroll works smoothly based on song duration
- ✅ Font size is adjustable and readable from distance
- ✅ Manual scroll and auto-scroll coexist without conflicts
- ✅ Previous/Next buttons allow seamless navigation through setlist
- ✅ Song settings accessible without exiting performance mode
- ✅ Lyrics can be edited during performance for quick corrections
- ✅ Bottom navigation always visible and easy to reach
- ✅ Complete user flow: Tap song → See lyrics → Auto-scroll → Navigate setlist → Edit if needed → Perform

### Files to Create/Modify
**New Files:**
- `src/screens/Performance/PerformanceModeScreen.tsx`
- `src/components/Performance/LyricsViewer.tsx` (optional, for reusability)
- `src/components/Performance/AutoScrollControls.tsx` (optional)

**Modified Files:**
- `src/navigation/bandsStack.types.ts` - Add PerformanceModeScreen route with params `{ setlistId: string, songIndex: number }`
- `App.tsx` - Add PerformanceModeScreen to BandsStack
- `src/screens/Setlists/SetlistDetailScreen.tsx` - Add navigation to performance mode (pass setlistId and songIndex)
- `src/components/Modals/AddSongModal.tsx` - Reused for editing song details from performance mode

### Success Metrics
- **Primary**: Can perform entire setlist without exiting performance mode
- **Secondary**: Auto-scroll speed accurate (no manual adjustment needed)
- **Tertiary**: Font size readable from 2-3 meters away
- **Quaternary**: Previous/Next navigation feels natural and responsive
- **User feedback**: "This feature makes the app worth using"

### UX Design Details

**Bottom Navigation Bar Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│         [Performance View]              │
│                                         │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  ◄    │      ▶ Play      │      ►      │
│ Prev  │     (large)       │     Next    │
└─────────────────────────────────────────┘
```

**Header Layout:**
```
┌─────────────────────────────────────────┐
│  ✕      Song Title         ⋮           │
│ Exit                      Menu          │
└─────────────────────────────────────────┘
```

**Route Params:**
```typescript
type PerformanceModeParams = {
  setlistId: string;
  songIndex: number; // Current position in setlist (0-based)
};
```

**State Management:**
```typescript
const [currentSongIndex, setCurrentSongIndex] = useState(songIndex);
const [setlistSongs, setSetlistSongs] = useState<SetlistSongEntry[]>([]);
const [isPlaying, setIsPlaying] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);

// Navigation handlers
const handlePrevious = () => {
  if (currentSongIndex > 0) {
    setCurrentSongIndex(currentSongIndex - 1);
    // Reset scroll, load new song
  }
};

const handleNext = () => {
  if (currentSongIndex < setlistSongs.length - 1) {
    setCurrentSongIndex(currentSongIndex + 1);
    // Reset scroll, load new song
  }
};
```

---

## Phase 5: Offline Sync 📡
**Duration**: 7-10 days
**Priority**: P0 - Critical infrastructure
**Why Fourth?**: Makes app reliable for live performances (no internet dependency)

### Research & Decision
1. **PowerSync vs WatermelonDB decision**
   - **PowerSync**: Managed service, easier setup, $10/month per 10 users
   - **WatermelonDB**: Free, open-source, more complex setup
   - **Recommendation**: PowerSync for faster development (can migrate to WatermelonDB later if cost becomes issue)

### Backend Tasks (PowerSync)
2. **Set up PowerSync instance**
   - Sign up for PowerSync account
   - Create PowerSync instance connected to Supabase project
   - Configure sync rules for `bands`, `songs`, `setlists`, `setlist_songs` tables

3. **Configure PowerSync Sync Rules**
   - Define what data each user can sync
   - Rule: Sync all data from user's bands
   - Ensure RLS policies align with sync rules

### Frontend Tasks
4. **Install PowerSync packages**
   - `npm install @powersync/react-native @powersync/common`
   - `npm install react-native-quick-sqlite` (PowerSync dependency)
   - `npx pod-install` (iOS)

5. **Create PowerSync database setup**
   - Create `src/services/powersync/powersyncDb.ts`
   - Define schema for local SQLite database
   - Initialize PowerSync with Supabase connector
   - Configure sync credentials (JWT from Supabase auth)

6. **Create PowerSync context/provider**
   - Create `src/context/PowerSyncContext.tsx`
   - Wrap app with PowerSyncProvider (above AuthProvider)
   - Expose `db` instance and sync status

7. **Migrate all services to use PowerSync**
   - Update `bandService.ts` to use PowerSync queries instead of direct Supabase
   - Update `songService.ts` to use PowerSync
   - Update `setlistService.ts` to use PowerSync
   - Keep Supabase client for auth only

8. **Add sync status indicators in UI**
   - Show sync icon in header (synced, syncing, offline)
   - Add pull-to-refresh to trigger manual sync
   - Show last sync time in Settings

9. **Test offline mode extensively**
   - Turn off wifi/cellular data
   - Create/edit/delete bands, songs, setlists
   - Turn on connectivity
   - Verify data syncs correctly
   - Test conflict resolution (edit same song on two devices)

10. **Add offline warning banners**
    - Show banner when device goes offline
    - Show when data queued for sync
    - Hide when back online and synced

### Expected Outcome
- App works fully offline (view and edit data)
- Data syncs automatically when connection restored
- Users see sync status in UI
- No data loss during offline periods
- Complete offline-first experience for live performances

---

## Phase 6: Advanced Features ⭐
**Duration**: 7-10 days
**Priority**: P1 - Differentiating features
**Why Fifth?**: Core CRUD done, now add value-add features

### Feature 5A: Lyrics Viewer with Auto-Scroll
1. **Build Performance Mode screen**
   - Create `PerformanceModeScreen.tsx`
   - Full-screen lyrics display (hide header, tabs)
   - Large, readable font (use ProfileScreen preferences)
   - Dark background for stage lighting
   - Access from SongDetailScreen or SetlistDetailScreen

2. **Implement auto-scroll**
   - Calculate scroll speed based on `song.duration_seconds`
   - Add play/pause button (floating action button)
   - Add scroll speed adjustment (slider: 0.5x to 2x)
   - Use ScrollView with `scrollTo()` animation

3. **Add auto-scroll controls**
   - Play/Pause button
   - Reset button (scroll to top)
   - Speed adjustment slider
   - Tap anywhere to show/hide controls (auto-hide after 3 seconds)

### Feature 5B: Backing Track Management (Pro Only)
4. **Set up Supabase Storage bucket**
   - Create `backing-tracks` bucket in Supabase Storage
   - Configure RLS policies: users can only access their own tracks
   - Set max file size: 50MB

5. **Add `backing_track_url` column to `songs` table**
   - Column: `backing_track_url` (text, nullable)
   - Stores Supabase Storage URL

6. **Build backing track upload UI**
   - Add "Upload Backing Track" button in AddSong/EditSong forms
   - Use `expo-document-picker` to select MP3 file
   - Show upload progress bar
   - On success: Save URL to song.backing_track_url

7. **Install audio playback package**
   - `npm install expo-av`
   - Configure audio session for background playback (iOS)

8. **Build audio player controls**
   - Create `AudioPlayer.tsx` component
   - Show in SongDetailScreen and PerformanceModeScreen if backing track exists
   - Controls: Play/Pause, Seek bar, Current time/Total time, Volume
   - Auto-sync lyrics scroll with audio playback (if in Performance Mode)

9. **Implement offline download**
   - Add "Download for Offline" button on songs with backing tracks
   - Use `expo-file-system` to download MP3 to local storage
   - Show download progress
   - Play from local file when offline

10. **Add Pro-only feature gating**
    - Check `profiles.subscription_tier` before showing upload button
    - If tier is 'free', show paywall: "Backing tracks are a Pro feature"
    - Allow Pro users to upload unlimited tracks

### Feature 5C: Polish & UX Improvements
11. **Add haptic feedback** throughout app
    - Install `expo-haptics`
    - Add feedback on: button presses, drag-and-drop, swipe actions, confirmations
    - Use appropriate impact styles (light, medium, heavy)

12. **Add loading skeletons** (replace spinners)
    - Install `react-native-shimmer-placeholder`
    - Create skeleton versions of: BandCard, SongCard, SetlistCard
    - Show while data loading

13. **Add empty state illustrations**
    - Use simple SVG illustrations for empty states
    - Create `EmptyState.tsx` component with icon, title, subtitle, CTA button
    - Use in BandsScreen, LibraryScreen, SetlistsScreen when empty

### Expected Outcome
- Full-screen lyrics viewer with auto-scroll for live performances
- Audio playback with backing tracks (Pro feature)
- Offline download of backing tracks
- Haptic feedback throughout app
- Beautiful loading and empty states
- Professional, polished UX

---

## Phase 7: Subscriptions & Polish 💎
**Duration**: 5-7 days
**Priority**: P0 - Monetization
**Why Last?**: Core features done, now enable revenue

### Subscription System
1. **Set up RevenueCat account**
   - Create RevenueCat project
   - Configure App Store Connect integration (iOS)
   - Configure Google Play Console integration (Android)
   - Create entitlement: "pro" for Pro subscription

2. **Create subscription product in App Store Connect & Google Play**
   - Product ID: `band_manager_pro_annual`
   - Price: $19.99/year
   - Name: "Band Manager Pro"
   - Description: "Unlimited bands, songs, setlists, and backing tracks"

3. **Install RevenueCat SDK**
   - `npm install react-native-purchases`
   - `npx pod-install` (iOS)
   - Configure RevenueCat API keys in app.json

4. **Create subscription context**
   - Create `src/context/SubscriptionContext.tsx`
   - Methods: `getSubscriptionStatus()`, `purchaseSubscription()`, `restorePurchases()`
   - State: `subscriptionTier` ('free' or 'pro'), `isProUser` (boolean)

5. **Build Paywall Modal**
   - Create `PaywallModal.tsx`
   - Show Pro features list:
     - Unlimited bands
     - Unlimited songs per band
     - Unlimited setlists per band
     - Backing track upload & playback
     - Offline setlist downloads
     - Priority support
   - Show price: "$19.99/year"
   - Purchase button: "Start Pro Trial" (if trial enabled) or "Subscribe Now"
   - Restore purchases button

6. **Sync subscription status to Supabase**
   - On subscription purchase: Update `profiles.subscription_tier = 'pro'`
   - On subscription expiration: Update `profiles.subscription_tier = 'free'`
   - Use RevenueCat webhooks to keep Supabase in sync

7. **Implement all freemium limits**
   - Band limit: 1 (free) vs unlimited (pro)
   - Song limit per band: 10 (free) vs unlimited (pro)
   - Setlist limit per band: 2 (free) vs unlimited (pro)
   - Backing tracks: blocked (free) vs enabled (pro)
   - Show paywall modal when limits reached

8. **Add Pro badge in UI**
   - Show "Pro" badge next to user name in Settings
   - Show "Free" users how many bands/songs/setlists they've used (e.g., "Songs: 7/10")

### Analytics & Monitoring
9. **Set up crash reporting**
   - Install Sentry: `npm install @sentry/react-native`
   - Configure Sentry DSN in app.json
   - Wrap app with Sentry error boundary
   - Test crash reporting works

10. **Set up analytics** (optional but recommended)
    - Choose: Mixpanel, Amplitude, or Firebase Analytics
    - Track key events:
      - Sign up, sign in, sign out
      - Create band, song, setlist
      - Play backing track
      - Enter performance mode
      - Subscribe to Pro
    - Track user properties: subscription_tier, band_count, song_count

### Final Polish
11. **Add toast notifications**
    - Install `react-native-toast-message`
    - Show toasts for: success (saved), error (failed), info (syncing)
    - Replace alert() calls with toast notifications

12. **Add swipe gestures** for navigation
    - iOS: Back swipe gesture (built-in to React Navigation)
    - Add swipe-to-delete on song/setlist lists

13. **Test on real devices**
    - Test on iPhone (various sizes)
    - Test on Android (various sizes)
    - Test offline mode extensively
    - Test subscription purchase flow (sandbox mode)

14. **Prepare for launch**
    - Set up EAS Build: `npm install -g eas-cli && eas build:configure`
    - Build iOS app: `eas build --platform ios`
    - Build Android app: `eas build --platform android`
    - Submit to TestFlight: `eas submit --platform ios`
    - Recruit beta testers

### Expected Outcome
- Subscription system fully functional
- Users can subscribe to Pro via in-app purchase
- All freemium limits enforced
- Crash reporting and analytics in place
- Toast notifications throughout app
- App ready for TestFlight/Play Store beta
- Beta testing can begin

---

## Success Criteria for MVP Launch

### Must-Have Features (P0):
- ✅ User authentication (sign up, login, logout)
- ✅ Band management (create, edit, delete, switch)
- ✅ Song library (CRUD, search)
- ✅ Setlist management (CRUD, add songs, reorder)
- ✅ Offline sync (PowerSync or WatermelonDB)
- ✅ Lyrics viewer with auto-scroll
- ✅ Freemium subscription (RevenueCat)
- ✅ Pro features (backing tracks, unlimited limits)

### Nice-to-Have Features (P1):
- ✅ Haptic feedback
- ✅ Loading skeletons
- ✅ Empty state illustrations
- ✅ Toast notifications
- ✅ Crash reporting (Sentry)
- ✅ Analytics

### Future Features (Phase 2+):
- 📅 Calendar with show scheduling
- 👥 Band member management (invite, roles)
- 💬 In-app chat for band members
- 📊 Setlist analytics (most played songs, etc.)
- 🎤 Song notes per band member
- 🔗 Integration with Spotify/Apple Music
- 📤 Export setlists to PDF

---

## Next Steps

Now that the implementation plan is documented, we'll start with:

**Phase 1: Band Management - Backend Setup**
1. Create `profiles` table in Supabase
2. Create `bands` table in Supabase
3. Implement RLS policies
4. Test tables in Supabase SQL Editor

Then move to frontend implementation.

Ready to begin! 🚀
