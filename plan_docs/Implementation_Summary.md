# Implementation Summary - Band Management App

**Knowledge Base for Implemented Features**

This document serves as a comprehensive reference for all features implemented in the Band Management App, covering Phase 1 (Band Management) and Phase 2 (Song Library).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Phase 1: Band Management](#phase-1-band-management)
3. [Phase 2: Song Library](#phase-2-song-library)
4. [Database Schema Fixes and Troubleshooting](#database-schema-fixes-and-troubleshooting-november-2025) **(NEW - Nov 2025)**
5. [Database Schema Summary](#database-schema-summary)
6. [File Structure](#file-structure)
7. [Next Steps](#next-steps)
8. [Recent Changes](#recent-changes-november-2025) **(NEW - Nov 2025)**

---

## Architecture Overview

### Tech Stack
- **Frontend:** React Native + Expo
- **Navigation:** React Navigation (Native Stack Navigator) - **Updated November 2025: Removed Bottom Tabs**
- **Backend:** Supabase (PostgreSQL + Authentication + Row Level Security)
- **State Management:** React Context + Zustand (BandContext with `selectBand` function)
- **Language:** TypeScript
- **UI:** Custom themed components with light/dark mode support

### Data Flow
```
User Authentication (Supabase Auth)
        �
Band Management (Phase 1)
        �
Song Library (Phase 2) - Per-band repository for songs (Updated Nov 2025)
        �
Setlists (Phase 3) - Curated collections from Library
        �
Live Performance Mode (Phase 4)
```

**Navigation Update (November 2025):** The data flow has been restructured. Bottom tab navigation was removed, and the Library is now accessed through each Band's detail screen. This means:
- Login → Bands Screen (no bottom tabs)
- Select Band → BandDetailScreen with tabs (Overview, Library, Setlists, Members)
- Each band has its own isolated song library
- Songs are managed within the band context, not globally

### Key Architectural Decisions

1. **Row Level Security (RLS):** All database tables use RLS policies to ensure users only access their own data
2. **Cascade Deletes:** Foreign keys use `ON DELETE CASCADE` to maintain referential integrity
3. **Idempotent Migrations:** SQL files use `IF NOT EXISTS` and `DROP IF EXISTS` patterns for safe re-runs
4. **Freemium Limits:** Free tier allows 1 band and 10 songs per band
5. **Master-Detail Pattern:** Library acts as master repository, setlists reference songs

---

## Phase 1: Band Management

### Overview
Phase 1 implements the core band management functionality, allowing users to create, view, update, and delete bands. This is the foundation for organizing all other features (songs, setlists, members).

### Database Schema

**File:** `supabase/phase1-bands.sql`

**Table: `bands`**
```sql
CREATE TABLE IF NOT EXISTS public.bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Features:**
- UUID primary key for unique identification
- Name validation (1-100 characters, required)
- Optional description field
- owner_id links to Supabase auth.users
- Automatic timestamps (created_at, updated_at)
- Trigger to auto-update updated_at timestamp

**Indexes:**
- `idx_bands_owner_id` on owner_id for fast lookups

**RLS Policies:**
1. `bands_select_policy` - Users can select their own bands
2. `bands_insert_policy` - Users can insert bands they own
3. `bands_update_policy` - Users can update their own bands
4. `bands_delete_policy` - Users can delete their own bands

### Service Layer

**File:** `src/services/data/bandService.ts`

**Functions:**
- `createBand(payload: CreateBandPayload): Promise<Band>` - Creates a new band
- `getBands(userId: string): Promise<Band[]>` - Gets all bands for a user
- `getBandById(bandId: string): Promise<Band>` - Gets a single band by ID
- `updateBand(bandId: string, updates: UpdateBandPayload): Promise<Band>` - Updates a band
- `deleteBand(bandId: string): Promise<void>` - Deletes a band
- `getBandCount(userId: string): Promise<number>` - Gets band count for freemium limit checking

**Error Handling:**
```typescript
const handleError = (error: PostgrestError | null, context: string) => {
  if (error) {
    console.error(context, error);
    throw new Error(`${context}: ${error.message}`);
  }
};
```

### Context Management

**File:** `src/context/BandContext.tsx`

**State:**
- `bands: Band[]` - List of all user's bands
- `activeBand: Band | null` - Currently selected band
- `loading: boolean` - Loading state

**Functions:**
- `loadBands()` - Fetches all bands for logged-in user
- `setActiveBand(band: Band | null)` - Sets the active band
- `addBand(band: Band)` - Adds a new band to state
- `updateBandInState(bandId: string, updates: Partial<Band>)` - Updates a band in state
- `removeBand(bandId: string)` - Removes a band from state

### UI Components

#### BandsScreen
**File:** `src/screens/Bands/BandsScreen.tsx`

**Features:**
- Displays list of user's bands
- Search functionality with debouncing
- Pull-to-refresh support
- Delete band with confirmation dialog
- Freemium limit check (1 band for free tier)
- Empty state when no bands exist
- FAB (Floating Action Button) to add new bands
- Navigation to BandDetailScreen

**Key UI Elements:**
- Custom header with gradient background (#123053)
- Search bar with 300ms debounce
- Band cards showing name, description, member count
- Delete button (trash icon) on each card
- Profile button in header

#### BandDetailScreen
**File:** `src/screens/Bands/BandDetailScreen.tsx`

**Features:**
- Display band details (name, description, created date)
- Edit band information
- Delete band with confirmation
- Member management placeholder
- **NEW: Full library integration with tabs** (November 2025)
- Navigation back to bands list

**Key Sections:**
- Header with back button, edit, and delete actions
- Band info section (name, description, creation date)
- **NEW: Tabbed interface** - Overview, Library, Setlists, Members
- **NEW: Complete song management within Library tab**

---

### Library Integration in BandDetailScreen (November 2025)

**Major Feature Update:** All Library functionality has been moved into BandDetailScreen's "Library" tab.

**New State Management:**
```typescript
// Song management state
const [showAddSongModal, setShowAddSongModal] = useState(false);
const [songs, setSongs] = useState<Song[]>([]);
const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [loadingSongs, setLoadingSongs] = useState(false);

// Set active band when entering screen
useEffect(() => {
  selectBand(bandId);  // Fixed: was setActiveBand(band)
}, [bandId, selectBand]);
```

**Key Functions Added:**

1. **loadSongs()** - Fetches all songs for current band
```typescript
const loadSongs = useCallback(async () => {
  try {
    setLoadingSongs(true);
    const data = await getSongs(bandId);
    setSongs(data);
    setFilteredSongs(data);
  } catch (error) {
    Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load songs');
  } finally {
    setLoadingSongs(false);
  }
}, [bandId]);
```

2. **handleSearch()** - Debounced search with 300ms delay
```typescript
const handleSearch = useCallback(
  async (query: string) => {
    if (!query.trim()) {
      setFilteredSongs(songs);
      return;
    }
    try {
      const results = await searchSongs(query, bandId);
      setFilteredSongs(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  },
  [songs, bandId]
);
```

3. **handleDeleteSong()** - Delete with confirmation
```typescript
const handleDeleteSong = async (songId: string, songTitle: string) => {
  Alert.alert(
    'Delete Song',
    `Are you sure you want to delete "${songTitle}"?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSong(songId);
          Alert.alert('Success', 'Song deleted successfully');
          loadSongs();
        },
      },
    ]
  );
};
```

**Library Tab UI:**

The Library tab now includes:
- Search bar with debounced input (300ms delay)
- Song cards displaying:
  - Title and artist
  - Key badge (blue pill with musical note icon)
  - BPM display (with speedometer icon)
  - Duration display (MM:SS format, with time icon)
  - Delete button (trash icon)
- FAB (Floating Action Button) to add new songs
- Pull-to-refresh support
- Empty states:
  - No songs in library
  - No search results found
- Navigation to SongDetailScreen on song tap

**Song Card Rendering:**
```typescript
{filteredSongs.map((song) => (
  <Pressable
    key={song.id}
    style={styles.songCard}
    onPress={() => navigation.navigate('SongDetail', { songId: song.id })}
  >
    <View style={styles.songHeader}>
      <Text style={styles.songTitle}>{song.title}</Text>
      <Pressable onPress={() => handleDeleteSong(song.id, song.title)}>
        <Ionicons name="trash-outline" size={20} color="#ff3b30" />
      </Pressable>
    </View>
    <Text style={styles.songArtist}>{song.artist}</Text>

    <View style={styles.songMetadata}>
      {song.key && (
        <View style={styles.keyBadge}>
          <Ionicons name="musical-note" size={12} color="#ffffff" />
          <Text style={styles.keyText}>{song.key}</Text>
        </View>
      )}
      {song.bpm && (
        <View style={styles.metadataItem}>
          <Ionicons name="speedometer-outline" size={14} color="#666" />
          <Text style={styles.metadataText}>{song.bpm} BPM</Text>
        </View>
      )}
      {song.duration_seconds && (
        <View style={styles.metadataItem}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.metadataText}>
            {formatDuration(song.duration_seconds)}
          </Text>
        </View>
      )}
    </View>
  </Pressable>
))}
```

**AddSongModal Integration:**
```typescript
<AddSongModal
  visible={showAddSongModal}
  onClose={() => setShowAddSongModal(false)}
  onSuccess={async () => {
    setShowAddSongModal(false);
    // Small delay to ensure modal closes before fetching
    // This prevents ERR_ABORTED network errors
    setTimeout(() => {
      loadSongs();
    }, 300);
  }}
/>
```

**Default Tab:** Set to 'overview' to show dashboard first (updated November 10, 2025)

**Important Fix:** The modal close timing issue was resolved by adding a 300ms setTimeout delay between closing the modal and calling `loadSongs()`. This prevents the `net::ERR_ABORTED` error that occurred when the fetch request was cancelled due to the modal closing too quickly.

---

### Dashboard/Overview Screen (November 10, 2025)

**Major UX Update:** Implemented a dashboard approach when opening a band, providing a clear navigation entry point.

**Overview Tab Features:**

When users open a band, they now see a dashboard with 4 navigation cards in a 2x2 grid:

1. **Setlists Card** - Navigate to setlists management (Phase 3)
2. **Library Card** - Navigate to song library
3. **Calendar Card** - Navigate to calendar (coming soon)
4. **Members Card** - Navigate to member management (Phase 5)

**Tab Structure (5 tabs total):**
```typescript
type TabType = 'overview' | 'library' | 'setlists' | 'calendar' | 'members';
```

**Dashboard Card Styling:**
```typescript
dashboardCard: {
  width: '47%',
  aspectRatio: 1,
  backgroundColor: '#ffffff',
  borderRadius: 16,
  padding: 20,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
  borderWidth: 1,
  borderColor: '#e5e5ea',
}
```

**Bottom Tab Navigation Updates:**

- **Icon-only design** - Removed text labels for cleaner UI
- **Larger icons** - Increased from 24px to 28px
- **Active state highlighting** - Light blue background (`rgba(0, 122, 255, 0.1)`) on active tab
- **4 tabs visible** - Setlists, Library, Calendar, Members
- **Compact layout** - Added horizontal padding to tab bar

**Dynamic Header Implementation:**

The header now changes based on the active tab:

```typescript
const getHeaderTitle = () => {
  switch (activeTab) {
    case 'overview':
      return band.name;           // Show band name on dashboard
    case 'library':
      return 'Library';            // Show screen name
    case 'setlists':
      return 'Setlists';
    case 'calendar':
      return 'Calendar';
    case 'members':
      return 'Members';
    default:
      return band.name;
  }
};
```

**Dynamic Header Actions:**

Header buttons change based on active screen:

- **Library tab**: Shows plus (+) button for adding songs (moved from FAB)
- **Other tabs**: Show edit and delete buttons for band management

```typescript
const renderHeaderActions = () => {
  if (activeTab === 'library') {
    return (
      <Pressable onPress={() => setShowAddSongModal(true)} style={styles.headerButton}>
        <Ionicons name="add" size={24} color="#ffffff" />
      </Pressable>
    );
  }

  // For overview and other tabs
  return (
    <>
      <Pressable onPress={() => setShowEditModal(true)} style={styles.headerButton}>
        <Ionicons name="create-outline" size={24} color="#ffffff" />
      </Pressable>
      <Pressable onPress={handleDeleteBand} style={styles.headerButton}>
        <Ionicons name="trash-outline" size={24} color="#ffffff" />
      </Pressable>
    </>
  );
};
```

**Removed FAB:** The floating action button was removed from Library tab, with its functionality moved to the header for consistency across the app.

**Calendar Screen:** Separated from overview - now has its own dedicated "Coming Soon" placeholder screen.

#### AddBandModal
**File:** `src/components/Modals/AddBandModal.tsx`

**Features:**
- Dual-mode modal (create/edit)
- Form validation (name required, max 100 chars)
- Description field (optional, max 500 chars)
- Loading states during submission
- Freemium limit check for creation
- Success/error alerts

**Form Fields:**
- Name (required, max 100 characters)
- Description (optional, max 500 characters)

### Freemium Implementation

**Limit:** 1 band for free tier users

**Check Location:** `AddBandModal.tsx` (lines 42-51)
```typescript
// Check freemium limit (1 band for free users)
const bandCount = await getBandCount(user.id);

if (bandCount >= 1) {
  Alert.alert(
    'Upgrade Required',
    'Free users can create 1 band. Upgrade to Pro for unlimited bands.',
  );
  setIsSubmitting(false);
  return;
}
```

### Navigation

**Stack:** `BandsStack` (Native Stack Navigator)

**Routes:**
- `BandsHome` - Main bands list
- `BandDetail` - Individual band details
- `Profile` - User profile settings

**Tab:** Bands tab with people icon in bottom tab navigator

---

## Phase 2: Song Library

### Overview
Phase 2 implements the Song Library, which serves as the master repository for all songs. Users create songs here first before adding them to setlists (Phase 3). Each song belongs to a specific band.

### User Flow
```
1. User creates/selects a band
2. User adds songs to Library (this phase)
3. User creates setlists (Phase 3)
4. User adds songs from Library to setlists (Phase 3)
```

### Database Schema

**File:** `supabase/phase2-song-library.sql`

**Table: `songs`**
```sql
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 100),
  artist TEXT NOT NULL CHECK (char_length(artist) > 0 AND char_length(artist) <= 100),
  key TEXT CHECK (key IN ('C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
                          'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm')),
  bpm INTEGER CHECK (bpm > 0 AND bpm <= 300),
  duration_seconds INTEGER CHECK (duration_seconds > 0),
  lyrics TEXT,
  notes TEXT,
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Features:**
- UUID primary key
- Title and artist (required, 1-100 characters each)
- Musical key from 33 options (17 major + 16 minor keys)
- BPM validation (1-300 beats per minute)
- Duration in seconds (positive integer)
- Lyrics and notes (optional, unlimited text)
- band_id foreign key with CASCADE DELETE
- Automatic timestamps with trigger

**Musical Keys Supported:**
- **Major:** C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B
- **Minor:** Cm, C#m, Dbm, Dm, D#m, Ebm, Em, Fm, F#m, Gbm, Gm, G#m, Abm, Am, A#m, Bbm, Bm

**Indexes:**
- `idx_songs_band_id` on band_id for fast filtering
- `idx_songs_title` on title for search optimization
- `idx_songs_artist` on artist for search optimization

**RLS Policies:**
1. `songs_select_policy` - Users can select songs from their bands
2. `songs_insert_policy` - Users can insert songs to their bands
3. `songs_update_policy` - Users can update songs in their bands
4. `songs_delete_policy` - Users can delete songs from their bands

All policies enforce band ownership through the bands table:
```sql
EXISTS (
  SELECT 1 FROM public.bands
  WHERE bands.id = songs.band_id
  AND bands.owner_id = auth.uid()
)
```

### Type Definitions

**File:** `src/types/song.ts`

**Interfaces:**
```typescript
export interface Song {
  id: string;
  title: string;
  artist: string;
  key?: string | null;
  bpm?: number | null;
  duration_seconds?: number | null;
  lyrics?: string | null;
  notes?: string | null;
  band_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSongPayload {
  title: string;
  artist: string;
  key?: string | null;
  bpm?: number | null;
  duration_seconds?: number | null;
  lyrics?: string | null;
  notes?: string | null;
  band_id: string;
}

export interface UpdateSongPayload {
  title?: string;
  artist?: string;
  key?: string | null;
  bpm?: number | null;
  duration_seconds?: number | null;
  lyrics?: string | null;
  notes?: string | null;
}
```

**Key Design Decision:** Using `duration_seconds` instead of `durationSeconds` for consistency with database column naming.

### Service Layer

**File:** `src/services/data/songService.ts`

**Functions:**

1. **createSong(payload: CreateSongPayload): Promise<Song>**
   - Creates a new song in the database
   - Returns the created song with generated ID

2. **getSongById(songId: string): Promise<Song>**
   - Fetches a single song by ID
   - Throws error if song not found
   - Used by SongDetailScreen

3. **getSongs(bandId?: string): Promise<Song[]>**
   - Gets all songs, optionally filtered by band
   - Returns empty array if no songs found
   - Ordered by title (ascending)

4. **getSongCount(bandId: string): Promise<number>**
   - Gets count of songs for a specific band
   - Used for freemium limit checking
   - Returns 0 if no songs exist

5. **updateSong(songId: string, updates: UpdateSongPayload): Promise<Song>**
   - Updates an existing song
   - Returns the updated song
   - Only updates provided fields (partial update)

6. **deleteSong(songId: string): Promise<void>**
   - Deletes a song by ID
   - No return value on success

7. **searchSongs(term: string, bandId?: string): Promise<Song[]>**
   - Searches songs by title or artist (case-insensitive)
   - Optionally filtered by band
   - Uses PostgreSQL ILIKE for pattern matching
   - Returns up to 50 results
   - Ordered by title (ascending)

**Search Implementation:**
```typescript
const likePattern = `%${trimmedTerm}%`;
let query = supabase
  .from(SONG_TABLE)
  .select('*')
  .or(`title.ilike.${likePattern},artist.ilike.${likePattern}`);
```

### Navigation

**File:** `src/navigation/libraryStack.types.ts`

**Stack:** `LibraryStack` (Native Stack Navigator) - **DEPRECATED: See Navigation Restructure below**

**Routes:**
```typescript
export type LibraryStackParamList = {
  LibraryHome: undefined;
  SongDetail: { songId: string };
};
```

**Original App.tsx Configuration (Before Restructure):**
- Added LibraryStack navigator
- Added Library as first tab with musical-notes icon
- Updated shouldHideTabBar to hide on SongDetail screen
- Tab order: Library, Setlists, Bands, Settings

---

### Navigation Restructure (November 2025)

**Major Architecture Change:** Removed bottom tab navigation completely and moved all Library functionality into each band's detail screen.

**New User Flow:**
1. User logs in → sees Bands screen directly (no bottom tabs)
2. User creates/selects a band → navigates to BandDetailScreen
3. BandDetailScreen has tabs: Overview, Library, Setlists, Members
4. All song management happens within each band's Library tab

**File:** `App.tsx`

**Changes Made:**
- Removed bottom tab navigator entirely (`createBottomTabNavigator`)
- Removed `AppTabs` component
- Changed authenticated navigation to use `BandsStackNavigator` directly
- Removed unused imports: `SetlistsScreen`, `SettingsScreen`, `LibraryScreen`
- Added `SongDetailScreen` to `BandsStack` navigator

**Updated BandsStack Routes:**
```typescript
export type BandsStackParamList = {
  BandsHome: undefined;
  BandDetail: { bandId: string };
  SongDetail: { songId: string };  // ADDED for band-specific songs
  Profile: undefined;
};
```

**New Code Structure:**
```typescript
const AppContent = () => {
  // ...
  return (
    <NavigationContainer theme={navigationTheme}>
      {user ? (
        <BandsStackNavigator />  // Changed from <AppTabs />
      ) : (
        <AuthStack.Navigator>
          {/* Auth screens */}
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
};

const BandsStackNavigator = () => (
  <BandsStack.Navigator>
    <BandsStack.Screen
      name="BandsHome"
      component={BandsScreen}
      options={{ headerShown: false }}
    />
    <BandsStack.Screen
      name="BandDetail"
      component={BandDetailScreen}
      options={{ headerShown: false }}
    />
    <BandsStack.Screen
      name="SongDetail"
      component={SongDetailScreen}
      options={{ headerShown: false }}
    />
    <BandsStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ headerShown: false }}
    />
  </BandsStack.Navigator>
);
```

**Rationale:**
- Simplifies navigation structure
- Each band has its own isolated library
- Eliminates confusion about which band songs belong to
- Makes the app flow more intuitive: Band → Library → Setlists

### UI Components

#### LibraryScreen
**File:** `src/screens/Library/LibraryScreen.tsx`

**Features:**
- Displays all songs for active band
- Search functionality with 300ms debounce
- Pull-to-refresh support
- Song cards with metadata
- Delete song with confirmation
- Empty states (no band, no songs, no search results)
- FAB to add new songs
- Navigation to SongDetailScreen

**Key UI Elements:**

1. **Header**
   - Title: "Library"
   - Search bar with debounced input
   - Custom gradient background (#123053)

2. **Song Cards**
   - Title and artist
   - Key badge (if set) - blue pill with musical note icon
   - BPM display (if set) - with speedometer icon
   - Duration display (MM:SS format) - with time icon
   - Delete button (trash icon)
   - Tap to navigate to detail view

3. **Empty States**
   - No active band selected
   - No songs in library
   - No search results found

4. **FAB (Floating Action Button)**
   - Blue circular button with plus icon
   - Opens AddSongModal
   - Positioned bottom-right

**Search Implementation:**
```typescript
// Debounced search
useEffect(() => {
  const timer = setTimeout(() => {
    handleSearch(searchQuery);
  }, 300);
  return () => clearTimeout(timer);
}, [searchQuery, handleSearch]);
```

**Duration Formatting:**
```typescript
const formatDuration = (seconds?: number | null) => {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

#### SongDetailScreen
**File:** `src/screens/Library/SongDetailScreen.tsx`

**Features:**
- Full song information display
- Edit song functionality
- Delete song with confirmation
- Back navigation
- Sections for lyrics and notes
- Empty state when no lyrics/notes

**Key UI Sections:**

1. **Header**
   - Back button (left)
   - Edit button (right)
   - Delete button (right)
   - Custom gradient background (#123053)

2. **Title Section**
   - Large title (song name)
   - Subtitle (artist name)

3. **Metadata Section**
   - Key (with musical note icon)
   - BPM (with speedometer icon)
   - Duration (with time icon)
   - Displayed in a row with icons

4. **Lyrics Section** (if exists)
   - Section header with document icon
   - White content box with text
   - Multiline display

5. **Notes Section** (if exists)
   - Section header with clipboard icon
   - White content box with text
   - Multiline display

6. **Empty State** (if no lyrics/notes)
   - Document icon
   - Message prompting user to add content

**Edit Integration:**
- Opens AddSongModal with song prop
- Pre-fills all form fields
- Reloads song data on success

**Delete Flow:**
```typescript
Alert.alert(
  'Delete Song',
  `Are you sure you want to delete "${song.title}"? This action cannot be undone.`,
  [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        await deleteSong(song.id);
        Alert.alert('Success', 'Song deleted successfully');
        navigation.goBack();
      },
    },
  ],
);
```

#### AddSongModal
**File:** `src/components/Modals/AddSongModal.tsx`

**Features:**
- Dual-mode modal (create/edit)
- Pre-fills form when editing
- Comprehensive form validation
- Musical key picker (33 options)
- Duration input (MM:SS format)
- Lyrics and notes text areas
- Freemium limit check (10 songs per band)
- Loading states during submission

**Props:**
```typescript
interface AddSongModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  song?: Song; // Optional: if provided, modal is in edit mode
}
```

**Form Fields (Reordered November 2025):**

The form field order was updated to improve user experience:

1. **Artist** (required)
   - Max 100 characters
   - Text input with placeholder
   - **Moved to top position**

2. **Title** (required)
   - Max 100 characters
   - Text input with placeholder

3. **Lyrics** (optional)
   - Multiline text area
   - Unlimited length
   - Placeholder: "Enter lyrics here..."
   - **Moved up in priority**

4. **Duration** (optional)
   - Two inputs: Minutes (MM) and Seconds (SS)
   - Converted to total seconds for storage
   - Validation: seconds must be 0-59
   - Keyboard: number-pad

5. **Key** (optional)
   - Picker with 33 musical keys
   - Includes major and minor keys
   - Default: "Select key (optional)"

6. **BPM** (optional)
   - Number input (1-300)
   - Validation: must be positive integer
   - Keyboard: number-pad

7. **Notes** (optional)
   - Multiline text area
   - Unlimited length
   - Placeholder: "Add any notes (chords, tempo changes, etc.)"
   - Used for chord progressions, tempo changes, performance notes

**Validation Rules:**
```typescript
// Title required
if (!title.trim()) {
  Alert.alert('Error', 'Please enter a song title');
  return;
}

// Artist required
if (!artist.trim()) {
  Alert.alert('Error', 'Please enter an artist name');
  return;
}

// Title length
if (title.trim().length > 100) {
  Alert.alert('Error', 'Song title must be 100 characters or less');
  return;
}

// Artist length
if (artist.trim().length > 100) {
  Alert.alert('Error', 'Artist name must be 100 characters or less');
  return;
}

// BPM range
if (bpm && (isNaN(bpmNum) || bpmNum <= 0 || bpmNum > 300)) {
  Alert.alert('Error', 'BPM must be between 1 and 300');
  return;
}

// Duration format
if (isNaN(mins) || isNaN(secs) || mins < 0 || secs < 0 || secs >= 60) {
  Alert.alert('Error', 'Invalid duration format');
  return;
}
```

**Pre-fill Logic (Edit Mode):**
```typescript
useEffect(() => {
  if (song) {
    setTitle(song.title);
    setArtist(song.artist);
    setSelectedKey(song.key || '');
    setBpm(song.bpm ? song.bpm.toString() : '');

    // Convert duration_seconds to MM:SS
    if (song.duration_seconds) {
      const mins = Math.floor(song.duration_seconds / 60);
      const secs = song.duration_seconds % 60;
      setDurationMinutes(mins.toString());
      setDurationSeconds(secs.toString());
    }

    setLyrics(song.lyrics || '');
    setNotes(song.notes || '');
  }
}, [song]);
```

**Freemium Check:**
```typescript
// Check freemium limit (10 songs for free users) only when creating
const songCount = await getSongCount(activeBand.id);

if (songCount >= 10) {
  Alert.alert(
    'Upgrade Required',
    'Free users can create up to 10 songs per band. Upgrade to Pro for unlimited songs.',
  );
  setIsSubmitting(false);
  return;
}
```

**Dynamic UI Labels:**
- Modal title: "Add Song" / "Edit Song"
- Subtitle: "Add a new song to {bandName}" / "Update \"{songTitle}\""
- Button label: "Add Song" / "Save Changes"
- Loading label: "Adding..." / "Saving..."

### Freemium Implementation

**Limit:** 10 songs per band for free tier users

**Check Location:** `AddSongModal.tsx` (lines 142-154)

**Important:** Limit check only applies to song creation, not updates

---

## Database Schema Fixes and Troubleshooting (November 2025)

During implementation of the navigation restructure and library integration, several database schema issues were discovered and resolved:

### Issue 1: Incorrect Column Reference in RLS Policies

**Problem:** RLS policies referenced `owner_id` column which doesn't exist in the bands table
**Error:** `ERROR: 42703: column "owner_id" does not exist`

**File Created:** `supabase/phase2-song-library-fixed.sql`

**Solution:** Updated all RLS policies to use `created_by` instead of `owner_id`:

```sql
-- BEFORE (Incorrect)
CREATE POLICY "Users can read songs from their bands"
  ON public.songs
  FOR SELECT
  USING (
    band_id IN (
      SELECT id FROM public.bands WHERE owner_id = auth.uid()
    )
  );

-- AFTER (Correct)
CREATE POLICY "Users can read songs from their bands"
  ON public.songs
  FOR SELECT
  USING (
    band_id IN (
      SELECT id FROM public.bands WHERE created_by = auth.uid()
    )
  );
```

All four policies (SELECT, INSERT, UPDATE, DELETE) were updated with this fix.

### Issue 2: Column Name Mismatch - duration vs duration_seconds

**Problem:** Code expected `duration_seconds` column but database had `duration` column
**Error:** `Could not find the 'duration_seconds' column of 'songs' in the schema cache`

**Files Created:**
- `supabase/rename-duration-column.sql`
- `supabase/add-missing-columns.sql`

**Solution:** Renamed the column in database to match code expectations:

```sql
-- Rename duration column to duration_seconds for consistency
ALTER TABLE public.songs
RENAME COLUMN duration TO duration_seconds;

-- Refresh the schema cache so Supabase picks up the change
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');
```

**Important:** Schema cache refresh is critical after column changes. Without it, PostgREST continues to use the old schema definition.

### Issue 3: Missing notes and lyrics Columns

**Problem:** Code referenced `notes` and `lyrics` columns that didn't exist in database
**Error:** `Could not find the 'notes' column of 'songs' in the schema cache`

**File:** `supabase/add-missing-columns.sql`

**Solution:** Added both missing columns with proper error handling:

```sql
-- Add notes column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'songs'
        AND column_name = 'notes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.songs ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Add lyrics column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'songs'
        AND column_name = 'lyrics'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.songs ADD COLUMN lyrics TEXT;
    END IF;
END $$;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');
```

**Why notes field?** Per PRD requirements, notes field is used for storing:
- Chord progressions
- Tempo changes
- Performance notes
- Special instructions
- Any other song-specific information

### Issue 4: Network Request Abortion After Song Creation

**Problem:** Song created successfully but got `net::ERR_ABORTED` when fetching updated list
**Error:** `net::ERR_ABORTED https://[...].supabase.co/rest/v1/songs?select=*&band_id=eq.[...]`

**Root Cause:** Modal was closing too quickly, causing the subsequent fetch request to be cancelled

**Solution:** Added 300ms setTimeout delay in BandDetailScreen:

```typescript
<AddSongModal
  visible={showAddSongModal}
  onClose={() => setShowAddSongModal(false)}
  onSuccess={async () => {
    setShowAddSongModal(false);
    // Small delay to ensure modal closes before fetching
    // This prevents ERR_ABORTED network errors
    setTimeout(() => {
      loadSongs();
    }, 300);
  }}
/>
```

**Location:** `src/screens/Bands/BandDetailScreen.tsx` (lines 424-434)

### Schema Verification Files

Additional SQL files created for verification:

1. **verify-songs-table.sql** - Checks all columns exist with correct data types
2. **force-schema-refresh.sql** - Forces PostgREST schema cache reload

**Verification Query:**
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'songs'
ORDER BY ordinal_position;
```

### Best Practices Learned

1. **Always refresh schema cache after DDL changes:**
   ```sql
   SELECT pg_notify('pgrst', 'reload schema');
   SELECT pg_notify('pgrst', 'reload config');
   ```

2. **Use idempotent column additions:**
   - Use `DO $$ ... END $$` blocks with `IF NOT EXISTS` checks
   - Prevents errors when running migrations multiple times

3. **Verify column names match between code and database:**
   - Use consistent naming conventions
   - Document any naming transformations (snake_case vs camelCase)

4. **Add delays for sequential async operations:**
   - Prevent race conditions
   - Allow UI state changes to complete before triggering data fetches

5. **Test RLS policies with correct column references:**
   - Double-check foreign key relationships
   - Verify column names in JOIN conditions

---

## Database Schema Summary

### Table Relationships

```
auth.users (Supabase Auth)
    � (owner_id)
bands
    � (band_id)
songs
    � (song_id) [Phase 3]
setlist_songs
    � (setlist_id) [Phase 3]
setlists
```

### Cascade Rules

1. **User deleted** � All bands deleted (CASCADE)
2. **Band deleted** � All songs deleted (CASCADE)
3. **Song deleted** � All setlist_songs entries deleted (CASCADE) [Phase 3]
4. **Setlist deleted** � All setlist_songs entries deleted (CASCADE) [Phase 3]

### RLS Policy Pattern

All tables follow the same RLS pattern:
```sql
-- Select: User can access records they own (through band ownership chain)
-- Insert: User can create records for bands they own
-- Update: User can update records they own
-- Delete: User can delete records they own
```

### Index Strategy

- Foreign key columns (owner_id, band_id, song_id)
- Search columns (title, artist, name)
- All indexes use `IF NOT EXISTS` for idempotent migrations

---

## File Structure

### Project Layout

```
band-management-app/
   supabase/
      phase1-bands.sql              # Band management schema
      phase2-song-library.sql       # Song library schema
   src/
      components/
         Buttons/
            ThemedButton.tsx
         Modals/
             AddBandModal.tsx      # Create/edit band modal
             AddSongModal.tsx      # Create/edit song modal (Phase 2)
      context/
         AuthContext.tsx           # Authentication state
         BandContext.tsx           # Band state management
      navigation/
         authStack.types.ts
         bandsStack.types.ts
         libraryStack.types.ts     # Phase 2
      screens/
         Auth/
            LoginScreen.tsx
            SignUpScreen.tsx
            ForgotPasswordScreen.tsx
         Bands/
            BandsScreen.tsx       # Band list
            BandDetailScreen.tsx  # Band details
         Library/
            LibraryScreen.tsx     # Song list (Phase 2)
            SongDetailScreen.tsx  # Song details (Phase 2)
         Profile/
            ProfileScreen.tsx
         Settings/
            SettingsScreen.tsx
         Setlists/
             SetlistsScreen.tsx    # Placeholder for Phase 3
      services/
         data/
            bandService.ts        # Band CRUD operations
            songService.ts        # Song CRUD operations (Phase 2)
         supabase/
             client.ts             # Supabase client setup
      types/
         band.ts                   # Band type definitions
         song.ts                   # Song type definitions (Phase 2)
         index.ts                  # Type exports
      theme/
          index.tsx                 # Theme provider & styles
   plan_docs/
      IMPLEMENTATION-PLAN.md        # Original implementation plan
      PRD-v2.0.md                   # Product requirements
      Implementation_Summary.md     # This file
   App.tsx                            # Root component
   package.json
   tsconfig.json
```

### Key Files by Feature

**Authentication:**
- `src/context/AuthContext.tsx`
- `src/screens/Auth/*.tsx`

**Band Management (Phase 1):**
- `supabase/phase1-bands.sql`
- `src/types/band.ts`
- `src/services/data/bandService.ts`
- `src/context/BandContext.tsx`
- `src/screens/Bands/*.tsx`
- `src/components/Modals/AddBandModal.tsx`

**Song Library (Phase 2):**
- `supabase/phase2-song-library.sql`
- `src/types/song.ts`
- `src/services/data/songService.ts`
- `src/navigation/libraryStack.types.ts`
- `src/screens/Library/*.tsx`
- `src/components/Modals/AddSongModal.tsx`

---

## Next Steps

### Phase 3: Setlist Management
1. Create setlists table with band_id foreign key
2. Create setlist_songs junction table (many-to-many)
3. Implement SetlistsScreen with list view
4. Create SetlistDetailScreen showing songs in setlist
5. Implement AddSetlistModal for creation/editing
6. Add song picker to add songs from Library to setlist
7. Implement drag-and-drop reordering of songs
8. Add setlist sharing functionality

### Phase 3 Update (November 2025)
- **Schema + Services:** Added `setlists`/`setlist_songs` tables with idempotent migrations, RLS policies, ordering constraints, and PostgreSQL helpers plus the TypeScript `setlistService` that exposes list/detail queries, CRUD, song linking, and reordering.
- **UI Flow:** Replaced the placeholder setlists tab with real cards that paginate `SetlistDetailScreen`, enforce the free-tier limit (2 setlists), and expose header “+” actions; the detail screen displays stats, drag-and-drop ordering (with Haptics), song removal, and linked modals.
- **Modals & Pickers:** Built the floating `CreateSetlistModal` (name-only with backdrop close) and the `AddSetlistSongsModal` picker to add library songs, with reloading hooks to keep list/detail synchronized.
- **Navigation:** Integrated `SetlistDetailScreen` into `BandsStack`, wired band context/profile data to gate the freemium limit, and routed card taps → detail screen so each band now has a finished Phase 3 flow.

### Phase 4: Live Performance Mode
1. Create performance view with large text
2. Implement auto-scroll functionality
3. Add tempo/metronome integration
4. Create section navigation (verse, chorus, bridge)
5. Add performance history tracking

### Phase 5: Member Management
1. Create band_members table
2. Implement invitation system
3. Add role-based permissions (owner, admin, member)
4. Update RLS policies for shared access
5. Create member management UI

### Phase 6: Advanced Features
1. Chord diagram library
2. Audio/video attachments
3. Practice mode with loop markers
4. Transposition tools
5. Export functionality (PDF, plain text)

### Pending Bug Fixes
- Band deletion issue (deferred from Phase 1)
  - Issue may be related to RLS policies or cascade rules
  - Needs investigation when time permits

---

## Development Guidelines

### SQL Migration Best Practices
1. Always use `IF NOT EXISTS` for tables and indexes
2. Use `DROP POLICY IF EXISTS` before creating policies
3. Use `CREATE OR REPLACE FUNCTION` for functions
4. Test migrations on local Supabase instance first
5. Keep migrations idempotent for safe re-runs

### Component Design Patterns
1. Use dual-mode modals (create/edit) for form components
2. Implement loading states for all async operations
3. Show empty states with actionable messages
4. Use debouncing (300ms) for search inputs
5. Implement pull-to-refresh on list screens
6. Always show confirmation dialogs for destructive actions

### State Management
1. Use Context for global state (auth, active band)
2. Use local state for UI-specific state
3. Implement optimistic updates where appropriate
4. Handle errors gracefully with user-friendly messages

### Type Safety
1. Define TypeScript interfaces for all data models
2. Use type guards for runtime validation
3. Avoid `any` types
4. Use type assertions only when necessary (e.g., `data as Song`)

### Error Handling
1. Always catch and display errors to users
2. Log errors to console for debugging
3. Provide context in error messages
4. Don't silently fail - inform the user

---

## Conclusion

This document captures all features implemented in Phase 1 (Band Management) and Phase 2 (Song Library). It serves as a knowledge base for understanding the architecture, database schema, service layer, UI components, and implementation decisions.

**Key Achievements:**
- Complete band management system with CRUD operations
- Comprehensive song library with search and filtering
- Robust RLS policies ensuring data security
- Freemium limits (1 band, 10 songs per band)
- Dual-mode modals for efficient UX
- Idempotent SQL migrations for safe deployments
- Type-safe TypeScript implementation throughout

**Next Phase:** Setlist Management - connecting the Library to curated performance collections.

---

**Last Updated:** 2025-11-10
**Version:** 1.1 (Navigation Restructure Update)
**Maintained By:** Implementation Team

---

## Recent Changes (November 2025)

### Summary of Navigation Restructure

This update documents a major architectural change made on November 10, 2025:

**What Changed:**
1. ✅ Removed bottom tab navigation completely
2. ✅ Bands screen is now the first screen after login (no tabs)
3. ✅ Moved all Library functionality into BandDetailScreen's "Library" tab
4. ✅ Each band now has its own isolated song library
5. ✅ Fixed database schema issues (column names, RLS policies)
6. ✅ Reordered AddSongModal form fields
7. ✅ Fixed ERR_ABORTED error with setTimeout delay
8. ✅ Implemented dashboard/overview screen with 4 navigation cards (November 10, 2025)
9. ✅ Made bottom tabs icon-only with active state highlighting
10. ✅ Added dynamic header that changes based on active screen
11. ✅ Moved Library FAB to header as plus button
12. ✅ Separated Calendar from Overview into its own tab

**Files Modified:**
- [App.tsx](App.tsx) - Removed tab navigator, BandsStack now main authenticated nav
- [src/navigation/bandsStack.types.ts](src/navigation/bandsStack.types.ts) - Added SongDetail route
- [src/screens/Bands/BandDetailScreen.tsx](src/screens/Bands/BandDetailScreen.tsx) - Full library integration
- [src/components/Modals/AddSongModal.tsx](src/components/Modals/AddSongModal.tsx) - Reordered form fields

**SQL Files Created:**
- [supabase/phase2-song-library-fixed.sql](supabase/phase2-song-library-fixed.sql) - Fixed RLS policies
- [supabase/rename-duration-column.sql](supabase/rename-duration-column.sql) - Renamed duration column
- [supabase/add-missing-columns.sql](supabase/add-missing-columns.sql) - Added notes and lyrics columns
- [supabase/verify-songs-table.sql](supabase/verify-songs-table.sql) - Verification query
- [supabase/force-schema-refresh.sql](supabase/force-schema-refresh.sql) - Force schema cache refresh

**Key Fixes:**
- Fixed `setActiveBand is not a function` → Changed to `selectBand(bandId)`
- Fixed `owner_id` column reference → Changed to `created_by`
- Fixed `duration` → `duration_seconds` column name
- Added missing `notes` and `lyrics` columns
- Fixed `ERR_ABORTED` error → Added 300ms setTimeout delay

**New User Flow:**
```
Login → Bands Screen (no bottom tabs)
  → Click Band → BandDetailScreen (Overview Dashboard)
    → Dashboard Cards (Setlists, Library, Calendar, Members)
    → Library Tab → Manage songs
      → Click Song → SongDetailScreen
    → Setlists Tab → Coming soon (Phase 3)
    → Calendar Tab → Coming soon
    → Members Tab → Coming soon (Phase 5)
```

**UI/UX Improvements (November 10, 2025):**
- Dashboard provides clear navigation entry point
- Icon-only bottom tabs for cleaner interface
- Active tab highlighting for better user feedback
- Dynamic header with context-aware actions
- Consistent action placement (header instead of FAB)

This restructure simplifies the app architecture and makes song management more intuitive by scoping it to individual bands.

---

## Phase 3: Setlist Management (Ready to Begin)

**Status:** Ready for implementation

**Overview:** Create, manage, and organize setlists from the song library. Setlists are curated collections of songs for performances.

**Key Features to Implement:**
1. Setlist CRUD operations (Create, Read, Update, Delete)
2. Add songs from library to setlists
3. Reorder songs in setlists
4. Setlist metadata (name, description, date, venue)
5. Duplicate setlists
6. Share setlists (future enhancement)

**Database Schema (Already Exists):**
```sql
-- setlists table
CREATE TABLE IF NOT EXISTS public.setlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- setlist_songs junction table
CREATE TABLE IF NOT EXISTS public.setlist_songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setlist_id UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Navigation:** Setlists tab already exists in BandDetailScreen, ready to be implemented.

**Next Steps:**
1. Create setlist service functions (CRUD operations)
2. Build SetlistsScreen UI in BandDetailScreen
3. Create CreateSetlistModal component
4. Implement add songs to setlist functionality
5. Add drag-and-drop reordering
6. Implement setlist detail view
7. Add freemium limit (e.g., 5 setlists per band for free users)
