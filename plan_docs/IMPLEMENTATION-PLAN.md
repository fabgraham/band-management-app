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

## Phase 4: Offline Sync 📡
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

## Phase 5: Advanced Features ⭐
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

## Phase 6: Subscriptions & Polish 💎
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
