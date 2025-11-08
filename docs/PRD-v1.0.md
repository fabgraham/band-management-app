# Product Requirements Document: Band Setlist Manager

## 1. Project Overview

### Purpose
A mobile-first application for singers and band members to manage song lyrics, create setlists, and organize their musical repertoire. Users can store songs with detailed metadata, upload backing tracks, and build setlists for rehearsals and performances.

### Target Users
- Singers who need quick access to lyrics
- Band members managing multiple groups
- Musicians organizing gigs and rehearsals

### Core Value Proposition
Centralized song library with lyrics, backing tracks, and setlist management across multiple bands.

---

## 2. Tech Stack

### Frontend
- **Framework**: React Native with Expo
- **Language**: JavaScript/TypeScript
- **UI Library**: React Native Paper or Native Base (optional - can use pure React Native components)
- **Navigation**: React Navigation
- **State Management**: React Context API or Zustand (lightweight)

### Backend
- **Platform**: Supabase
- **Authentication**: Supabase Auth (email/password)
- **Database**: PostgreSQL (via Supabase)
- **File Storage**: Supabase Storage (for MP3 backing tracks)
- **API**: Supabase JavaScript client

### Development Tools
- **Package Manager**: npm or yarn
- **Testing**: Expo Go app for iOS/Android testing
- **iOS Simulator**: Xcode Simulator (Mac)
- **Version Control**: Git

---

## 3. Phase 1 Features

### 3.1 User Authentication
**Requirements:**
- Sign up with email and password
- Sign in with email and password
- Sign out functionality
- Password reset via email
- Persistent session (stay logged in)

**User Flow:**
1. App opens to login screen
2. User signs up or signs in
3. On successful auth, navigate to band selection screen

---

### 3.2 Band Space Management

**Requirements:**
- Create new band
- View list of user's bands
- Select active band
- Each band has:
  - Name (required)
  - Genre (optional)
  - Created date (auto)

**User Flow:**
1. After login, user sees "My Bands" screen
2. If no bands exist, prompt to create first band
3. User taps "Create Band" button
4. Enters band name and optional genre
5. Band is created and becomes active
6. User can switch between bands via band selector

**Business Rules:**
- User must have at least one band to access other features
- All songs and setlists belong to a specific band
- Band data is isolated (Band A cannot see Band B's content)

---

### 3.3 Song Library

**Requirements:**

**Song Properties:**
- Title (required, text)
- Artist (required, text)
- Lyrics (optional, multi-line text)
- Duration (optional, format: MM:SS)
- BPM (optional, number, range: 40-240)
- Key (optional, dropdown selection)
- Backing Track (optional, MP3 file upload)

**Key Options:**
C, Cm, C#, C#m, D, Dm, D#, D#m, E, Em, F, Fm, F#, F#m, G, Gm, G#, G#m, A, Am, A#, A#m, B, Bm

**Features:**
- Add new song
- Edit existing song
- Delete song (with confirmation)
- View song list (scrollable)
- Search songs by title or artist
- Tap song to view full details
- Add song to setlist(s) from song detail view

**User Flow - Add Song:**
1. User taps "Add Song" button in Library
2. Form appears with fields for all song properties
3. User fills required fields (title, artist)
4. User optionally adds lyrics, duration, BPM, key
5. User optionally uploads MP3 backing track
6. User saves song
7. Song appears in library list

**User Flow - Add to Setlist:**
1. User views song details
2. User taps "Add to Setlist" button
3. Modal/sheet opens showing all existing setlists with checkboxes
4. User checks one or more setlists
5. User confirms
6. Song is added to selected setlists
7. Success message appears

**Backing Track Upload:**
- Accept MP3 files only
- File size limit: 10MB per track
- Upload to Supabase Storage
- Store file URL in song record
- Display upload progress indicator
- Show file name and size after upload

**Library View:**
- Card-based layout
- Each song card shows:
  - Title (bold)
  - Artist (secondary text)
  - Key and BPM (if available)
  - Small icon if backing track exists
- Search bar at top
- Floating "Add Song" button

---

### 3.4 Setlists

**Requirements:**

**Setlist Properties:**
- Name (required, text)
- Date (optional, date picker)
- Notes (optional, text)
- Song list (ordered)
- Created date (auto)

**Features:**
- Create new setlist
- Edit setlist details
- Delete setlist (with confirmation)
- View all setlists
- Add songs to setlist
- Remove songs from setlist
- Reorder songs in setlist (drag and drop)
- View setlist with all song details

**User Flow - Create Setlist:**
1. User taps "Create Setlist" button
2. Form appears with name, date, notes fields
3. User enters setlist name (required)
4. User optionally sets date and notes
5. User saves setlist
6. Empty setlist is created
7. User can now add songs

**User Flow - Add Songs to Setlist:**
Method 1 (from song library):
- See 3.3 "Add to Setlist" flow

Method 2 (from setlist view):
1. User opens setlist
2. User taps "Add Songs" button
3. Song library appears with checkboxes
4. User selects multiple songs
5. User confirms
6. Songs are added to end of setlist

**User Flow - Reorder Songs:**
1. User opens setlist
2. User taps "Edit Order" button
3. Drag handles appear next to each song
4. User drags songs to reorder
5. User taps "Done"
6. New order is saved

**Setlist View:**
- Card-based layout for setlist list
- Each setlist card shows:
  - Name (bold)
  - Date (if set)
  - Song count
- Tap card to view setlist details
- Detail view shows:
  - Setlist name and date at top
  - Numbered list of songs
  - Each song shows: title, artist, key, duration
  - Tap song in setlist to view full song details

---

## 4. Data Models

### User
```
id: uuid (primary key)
email: string
created_at: timestamp
```

### Band
```
id: uuid (primary key)
user_id: uuid (foreign key to User)
name: string
genre: string (nullable)
created_at: timestamp
```

### Song
```
id: uuid (primary key)
band_id: uuid (foreign key to Band)
title: string
artist: string
lyrics: text (nullable)
duration: string (nullable, format: "MM:SS")
bpm: integer (nullable)
key: string (nullable)
backing_track_url: string (nullable)
backing_track_filename: string (nullable)
created_at: timestamp
updated_at: timestamp
```

### Setlist
```
id: uuid (primary key)
band_id: uuid (foreign key to Band)
name: string
date: date (nullable)
notes: text (nullable)
created_at: timestamp
updated_at: timestamp
```

### SetlistSong (Join Table)
```
id: uuid (primary key)
setlist_id: uuid (foreign key to Setlist)
song_id: uuid (foreign key to Song)
position: integer (for ordering)
created_at: timestamp
```

---

## 5. User Flows

### First-Time User Flow
1. Open app → Login screen
2. Tap "Sign Up"
3. Enter email and password
4. Account created, logged in
5. Navigate to "My Bands" (empty state)
6. Prompt: "Create your first band"
7. Enter band name
8. Band created
9. Navigate to Library (empty state)
10. Prompt: "Add your first song"

### Returning User Flow
1. Open app → Auto login (if session valid)
2. Navigate to last active band
3. View Library or Setlists
4. Access songs and setlists immediately

### Core Task Flow: Prepare for Gig
1. User selects band
2. User creates new setlist with gig date
3. User adds songs from library to setlist
4. User reorders songs for optimal flow
5. User reviews setlist with all song details
6. User can tap any song to review lyrics or play backing track

---

## 6. UI/UX Guidelines

### Design Principles
- **Simplicity**: Clean, uncluttered interface
- **Speed**: Quick access to songs and lyrics
- **Apple-like**: iOS native patterns and aesthetics
- **Card-based**: Primary content in cards
- **Touch-friendly**: Large tap targets, swipe gestures

### Visual Design

**Color Palette:**
- Primary: iOS blue (#007AFF) or custom brand color
- Background: White (#FFFFFF)
- Secondary background: Light gray (#F2F2F7)
- Text primary: Black (#000000)
- Text secondary: Gray (#8E8E93)
- Accent: Green for success, Red for delete

**Typography:**
- iOS System font (San Francisco)
- Title: 28pt, Bold
- Headline: 17pt, Semibold
- Body: 17pt, Regular
- Caption: 13pt, Regular

**Spacing:**
- Screen padding: 16px
- Card margin: 12px
- Element spacing: 8-16px
- Section spacing: 24px

**Components:**

**Navigation:**
- Tab bar at bottom with icons:
  - Library
  - Setlists
  - Band (settings)
- Navigation bar at top with title and action buttons
- Back button follows iOS conventions

**Cards:**
- White background
- Subtle shadow (elevation: 2)
- Rounded corners (12px)
- Padding: 16px
- Tap for more details

**Buttons:**
- Primary: Filled, blue background
- Secondary: Outlined, blue border
- Destructive: Red text
- Floating Action Button (FAB) for main actions (Add Song, Add Setlist)

**Forms:**
- iOS-style inputs
- Labels above fields
- Clear placeholder text
- Keyboard type matches input (numeric for BPM)
- Validation messages below fields

**Lists:**
- Simple list items with chevron for navigation
- Swipe actions for delete
- Pull to refresh
- Empty states with helpful messages

**Modals/Sheets:**
- Bottom sheets for selections
- Full modals for forms
- Clear dismiss actions
- Backdrop dimming

---

## 7. Development Setup

### Environment Setup

**Prerequisites:**
- Node.js (v18+)
- npm or yarn
- Git
- Xcode (for iOS Simulator)
- Expo CLI
- Supabase account

**Initial Setup:**

```bash
# Install Expo CLI globally
npm install -g expo-cli

# Create new Expo project
npx create-expo-app band-setlist-manager
cd band-setlist-manager

# Install dependencies
npm install @supabase/supabase-js
npm install @react-navigation/native
npm install @react-navigation/native-stack
npm install @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install expo-document-picker  # For file uploads
npm install expo-av  # For audio playback

# Install development dependencies
npm install --save-dev @types/react @types/react-native
```

**Supabase Setup:**

1. Create Supabase project at https://supabase.com
2. Copy project URL and anon key
3. Create `.env` file:
```
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

4. Run database migrations (SQL scripts):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create bands table
CREATE TABLE bands (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  genre TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create songs table
CREATE TABLE songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  band_id UUID REFERENCES bands ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  lyrics TEXT,
  duration TEXT,
  bpm INTEGER CHECK (bpm >= 40 AND bpm <= 240),
  key TEXT,
  backing_track_url TEXT,
  backing_track_filename TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create setlists table
CREATE TABLE setlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  band_id UUID REFERENCES bands ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create setlist_songs join table
CREATE TABLE setlist_songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setlist_id UUID REFERENCES setlists ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES songs ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(setlist_id, song_id)
);

-- Row Level Security (RLS) Policies

-- Bands: Users can only access their own bands
ALTER TABLE bands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bands"
  ON bands FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bands"
  ON bands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bands"
  ON bands FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bands"
  ON bands FOR DELETE
  USING (auth.uid() = user_id);

-- Songs: Users can access songs from their bands
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view songs from own bands"
  ON songs FOR SELECT
  USING (band_id IN (
    SELECT id FROM bands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert songs to own bands"
  ON songs FOR INSERT
  WITH CHECK (band_id IN (
    SELECT id FROM bands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update songs from own bands"
  ON songs FOR UPDATE
  USING (band_id IN (
    SELECT id FROM bands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete songs from own bands"
  ON songs FOR DELETE
  USING (band_id IN (
    SELECT id FROM bands WHERE user_id = auth.uid()
  ));

-- Setlists: Users can access setlists from their bands
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view setlists from own bands"
  ON setlists FOR SELECT
  USING (band_id IN (
    SELECT id FROM bands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert setlists to own bands"
  ON setlists FOR INSERT
  WITH CHECK (band_id IN (
    SELECT id FROM bands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update setlists from own bands"
  ON setlists FOR UPDATE
  USING (band_id IN (
    SELECT id FROM bands WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete setlists from own bands"
  ON setlists FOR DELETE
  USING (band_id IN (
    SELECT id FROM bands WHERE user_id = auth.uid()
  ));

-- Setlist Songs: Users can access through their bands
ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view setlist_songs from own bands"
  ON setlist_songs FOR SELECT
  USING (setlist_id IN (
    SELECT id FROM setlists WHERE band_id IN (
      SELECT id FROM bands WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert setlist_songs to own bands"
  ON setlist_songs FOR INSERT
  WITH CHECK (setlist_id IN (
    SELECT id FROM setlists WHERE band_id IN (
      SELECT id FROM bands WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can update setlist_songs from own bands"
  ON setlist_songs FOR UPDATE
  USING (setlist_id IN (
    SELECT id FROM setlists WHERE band_id IN (
      SELECT id FROM bands WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete setlist_songs from own bands"
  ON setlist_songs FOR DELETE
  USING (setlist_id IN (
    SELECT id FROM setlists WHERE band_id IN (
      SELECT id FROM bands WHERE user_id = auth.uid()
    )
  ));

-- Indexes for performance
CREATE INDEX idx_bands_user_id ON bands(user_id);
CREATE INDEX idx_songs_band_id ON songs(band_id);
CREATE INDEX idx_setlists_band_id ON setlists(band_id);
CREATE INDEX idx_setlist_songs_setlist_id ON setlist_songs(setlist_id);
CREATE INDEX idx_setlist_songs_song_id ON setlist_songs(song_id);
CREATE INDEX idx_setlist_songs_position ON setlist_songs(setlist_id, position);
```

5. Set up Storage bucket for backing tracks:
   - Go to Supabase Storage
   - Create bucket named `backing-tracks`
   - Set as public bucket
   - Configure policies:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload backing tracks"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'backing-tracks' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to read
CREATE POLICY "Users can view backing tracks"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'backing-tracks');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own backing tracks"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'backing-tracks' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

**Project Structure:**

```
band-setlist-manager/
├── App.js (or App.tsx)
├── app.json
├── package.json
├── .env
├── src/
│   ├── components/
│   │   ├── SongCard.js
│   │   ├── SetlistCard.js
│   │   ├── BandSelector.js
│   │   └── EmptyState.js
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   └── SignUpScreen.js
│   │   ├── bands/
│   │   │   ├── BandListScreen.js
│   │   │   └── CreateBandScreen.js
│   │   ├── library/
│   │   │   ├── LibraryScreen.js
│   │   │   ├── SongDetailScreen.js
│   │   │   ├── AddSongScreen.js
│   │   │   └── EditSongScreen.js
│   │   └── setlists/
│   │       ├── SetlistsScreen.js
│   │       ├── SetlistDetailScreen.js
│   │       ├── CreateSetlistScreen.js
│   │       └── EditSetlistScreen.js
│   ├── services/
│   │   ├── supabase.js
│   │   ├── auth.js
│   │   ├── bands.js
│   │   ├── songs.js
│   │   └── setlists.js
│   ├── context/
│   │   ├── AuthContext.js
│   │   └── BandContext.js
│   ├── navigation/
│   │   ├── AppNavigator.js
│   │   └── AuthNavigator.js
│   └── utils/
│       ├── constants.js
│       └── helpers.js
└── assets/
```

**Running the App:**

```bash
# Start development server
npm start

# Run on iOS Simulator
npm run ios

# Run on physical device with Expo Go
# Scan QR code from terminal with Camera app (iOS) or Expo Go app (Android)

# Run on Android emulator
npm run android
```

**Testing on Device:**
1. Install Expo Go from App Store (iOS) or Play Store (Android)
2. Start dev server: `npm start`
3. Scan QR code with Camera app (iOS) or Expo Go (Android)
4. App loads on device with hot reloading

---

## 8. Key Implementation Notes

### Authentication Flow
- Use Supabase `auth.signUp()` and `auth.signInWithPassword()`
- Store session in AsyncStorage for persistence
- Use AuthContext to manage auth state globally
- Protect screens with auth check in navigator

### Band Context
- Use React Context to store active band ID
- Pass band ID to all database queries
- Switch bands by updating context
- Persist last active band in AsyncStorage

### File Upload (Backing Tracks)
- Use Expo DocumentPicker to select MP3 files
- Validate file type and size before upload
- Upload to Supabase Storage with unique path: `{userId}/{bandId}/{filename}`
- Store public URL in song record
- Show upload progress with ActivityIndicator

### Audio Playback
- Use Expo AV for playing backing tracks
- Implement play/pause/stop controls
- Show playback progress bar
- Handle background audio (optional for Phase 1)

### Search Implementation
- Filter songs in memory (client-side) for Phase 1
- Use `.filter()` on title and artist fields
- Add debouncing for search input (300ms)
- Consider full-text search in later phases

### Setlist Song Ordering
- Use `position` integer field in setlist_songs table
- Reorder by updating position values
- Use react-native-draggable-flatlist for drag-and-drop UI
- Recalculate positions after reorder: 1, 2, 3, 4...

### Error Handling
- Wrap all Supabase calls in try-catch
- Show user-friendly error messages with Alert or Toast
- Log errors to console for debugging
- Handle network failures gracefully

### Performance Considerations
- Lazy load song lyrics (fetch on detail view, not in list)
- Paginate song library if > 100 songs (future)
- Cache backing track URLs
- Optimize images and assets

---

## 9. Future Phases (Post-MVP)

### Phase 2: Enhanced Setlist Management
- Duplicate setlists
- Setlist templates
- Print/export setlists (PDF)
- Setlist statistics (total duration, key distribution)

### Phase 3: Collaboration
- Invite band members by email
- Share setlists (view-only)
- Real-time updates when setlists change
- Member roles (admin, editor, viewer)

### Phase 4: Calendar & Events
- Add events (gig, rehearsal)
- Assign setlist to event
- Month/week calendar view
- Reminders and notifications

### Phase 5: Advanced Features
- Transpose songs to different keys
- Metronome with BPM from song
- Lyrics annotation (personal notes)
- Voice memos per song
- Tags and categories
- Favorites/recently played
- Practice mode (loop sections)

### Phase 6: Social & Discovery
- Public song library (opt-in)
- Share setlists publicly
- Discover songs other bands play
- Import songs from other users

---

## 10. Success Metrics (Phase 1)

### User Engagement
- Daily active users
- Songs added per user
- Setlists created per user
- Average session duration

### Technical Performance
- App load time < 2 seconds
- Search response < 200ms
- File upload success rate > 95%
- Crash-free rate > 99%

### User Satisfaction
- App Store rating target: 4.5+
- User retention (7-day): > 40%
- User retention (30-day): > 20%

---

## 11. Potential Challenges & Solutions

### Challenge: Large MP3 file uploads on mobile networks
**Solution:** 
- Compress files before upload
- Show clear upload progress
- Allow cancellation and retry
- Recommend WiFi for uploads
- Consider streaming instead of download for playback

### Challenge: Offline access to lyrics
**Solution:**
- Cache viewed songs locally with AsyncStorage
- Implement offline mode indicator
- Sync changes when back online (Phase 2+)

### Challenge: iOS App Store approval
**Solution:**
- Follow Apple guidelines for metadata and content
- Ensure proper permissions for file access and audio
- Provide clear privacy policy
- Test thoroughly on TestFlight before submission

### Challenge: Complex song reordering UX
**Solution:**
- Use proven library (react-native-draggable-flatlist)
- Add visual feedback (haptics, animation)
- Include alternative method (up/down arrows)
- Test with real users

---

## 12. Development Timeline Estimate

### Week 1: Foundation
- Project setup with Expo
- Supabase configuration
- Database schema and migrations
- Authentication screens and logic

### Week 2: Band & Library Core
- Band creation and selection
- Song CRUD operations
- Library list view
- Song detail view
- Search functionality

### Week 3: Setlists & File Upload
- Setlist CRUD operations
- Add/remove songs to setlists
- Song reordering
- Backing track upload
- Audio playback

### Week 4: Polish & Testing
- UI refinements
- Error handling
- Empty states
- Loading states
- iOS Simulator testing
- TestFlight deployment

**Total: 4 weeks for Phase 1 MVP**

---

## 13. Appendix

### Key Dropdown Values
```javascript
const KEYS = [
  'C', 'Cm',
  'C#', 'C#m', 
  'D', 'Dm',
  'D#', 'D#m',
  'E', 'Em',
  'F', 'Fm',
  'F#', 'F#m',
  'G', 'Gm',
  'G#', 'G#m',
  'A', 'Am',
  'A#', 'A#m',
  'B', 'Bm'
];
```

### Duration Format Validation
```javascript
// Regex for MM:SS format
const durationRegex = /^([0-5]?[0-9]):([0-5][0-9])$/;

// Validation function
const isValidDuration = (duration) => {
  return durationRegex.test(duration);
};
```

### File Size Helper
```javascript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
```

### Example Supabase Service Functions

```javascript
// services/songs.js
import { supabase } from './supabase';

export const getSongs = async (bandId) => {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('band_id', bandId)
    .order('title', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const createSong = async (bandId, songData) => {
  const { data, error } = await supabase
    .from('songs')
    .insert([{ 
      band_id: bandId,
      ...songData 
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateSong = async (songId, updates) => {
  const { data, error } = await supabase
    .from('songs')
    .update({ 
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', songId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteSong = async (songId) => {
  const { error } = await supabase
    .from('songs')
    .delete()
    .eq('id', songId);
  
  if (error) throw error;
};

export const uploadBackingTrack = async (userId, bandId, file) => {
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `${userId}/${bandId}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('backing-tracks')
    .upload(filePath, file);
  
  if (error) throw error;
  
  const { data: urlData } = supabase.storage
    .from('backing-tracks')
    .getPublicUrl(filePath);
  
  return {
    url: urlData.publicUrl,
    filename: file.name
  };
};
```

---

## Document Version
- **Version**: 1.0
- **Date**: November 8, 2025
- **Author**: Product Owner
- **Status**: Ready for Development

---

## Questions or Clarifications

For questions during implementation, refer to:
1. Supabase documentation: https://supabase.com/docs
2. React Native documentation: https://reactnative.dev
3. Expo documentation: https://docs.expo.dev

This PRD should be treated as the source of truth for Phase 1 development. Any deviations or additions should be documented and approved before implementation.
