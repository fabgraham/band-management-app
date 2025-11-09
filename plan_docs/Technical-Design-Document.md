# Technical Design Document
## Band Setlist Manager

---

## Document Control

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Date** | November 8, 2025 |
| **Author** | Technical Lead |
| **Status** | Ready for Implementation |
| **Related Docs** | PRD v2.0 |

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Data Architecture](#3-data-architecture)
4. [Offline-First Strategy](#4-offline-first-strategy)
5. [Security Architecture](#5-security-architecture)
6. [API Design](#6-api-design)
7. [File Storage Strategy](#7-file-storage-strategy)
8. [Performance Optimization](#8-performance-optimization)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment Strategy](#10-deployment-strategy)
11. [Monitoring & Analytics](#11-monitoring--analytics)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile Clients                        │
│              (iOS, Android - React Native)               │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   UI Layer   │  │  Navigation  │  │   Context    │ │
│  │  (Screens)   │  │    (Tabs)    │  │  (State)     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Business Logic Layer                     │  │
│  │    (Services, Hooks, Utilities)                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Data Access Layer                        │  │
│  │                                                    │  │
│  │  ┌───────────────┐      ┌───────────────┐       │  │
│  │  │   PowerSync   │      │  Supabase JS  │       │  │
│  │  │   (Offline)   │◄────►│    Client     │       │  │
│  │  └───────────────┘      └───────────────┘       │  │
│  │         ▲                       ▲                 │  │
│  │         │                       │                 │  │
│  │  ┌──────▼────────┐      ┌──────▼────────┐       │  │
│  │  │   SQLite DB   │      │ AsyncStorage  │       │  │
│  │  │   (Offline)   │      │ (Preferences) │       │  │
│  │  └───────────────┘      └───────────────┘       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS / WebSocket
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend Services                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              PowerSync Service                    │  │
│  │       (Reads Postgres WAL, Manages Sync)          │  │
│  └──────────────────────────────────────────────────┘  │
│                           ▲                              │
│                           │                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │                  Supabase                         │  │
│  │                                                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │PostgreSQL│  │   Auth   │  │ Storage  │       │  │
│  │  │    DB    │  │(Supabase)│  │(MP3 Files)│      │  │
│  │  └──────────┘  └──────────┘  └──────────┘       │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────┐        │  │
│  │  │     Row-Level Security (RLS)         │        │  │
│  │  │  - User isolation                     │        │  │
│  │  │  - Band-based access control          │        │  │
│  │  │  - Freemium tier enforcement          │        │  │
│  │  └──────────────────────────────────────┘        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Third-Party Services                        │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │RevenueCat│  │  Sentry  │  │ Analytics│             │
│  │ (Subs)   │  │ (Errors) │  │  (Mixpanel)             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Principles

1. **Offline-First**: App must function without network connectivity
2. **Progressive Enhancement**: Start with core features, enhance later
3. **Separation of Concerns**: Clear boundaries between layers
4. **Testability**: Each layer independently testable
5. **Performance**: Target 60fps animations, <2s load time

### 1.3 Data Flow

**Normal Flow (Online):**
1. User action → UI Layer
2. UI calls Service Layer
3. Service writes to PowerSync (local SQLite)
4. PowerSync syncs to Supabase (background)
5. RLS policies enforce access control
6. Changes propagate to other devices (if multi-device in future)

**Offline Flow:**
1. User action → UI Layer
2. UI calls Service Layer
3. Service writes to PowerSync (local SQLite)
4. Changes queued for sync
5. UI updates immediately (optimistic)
6. When online, PowerSync syncs queued changes

---

## 2. Technology Stack

### 2.1 Frontend Stack

| Category | Technology | Version | Rationale |
|----------|------------|---------|-----------|
| **Framework** | React Native | 0.74+ | Cross-platform mobile development |
| **Build Tool** | Expo | SDK 51+ | Simplified build/deployment, managed workflow |
| **Language** | TypeScript | 5.0+ | Type safety, better DX |
| **Navigation** | React Navigation | 6.0+ | Industry standard, flexible |
| **State Management** | React Context + Zustand | Latest | Simple for Phase 1, scalable |
| **Styling** | StyleSheet + Theme | Native | Performance, no runtime overhead |
| **Forms** | React Hook Form | 7.0+ | Performance, validation |
| **Offline DB** | PowerSync SDK | Latest | Managed sync, automatic conflict resolution |
| **Local Storage** | AsyncStorage | Latest | Session/preferences |
| **File System** | expo-file-system | Latest | MP3 storage |
| **Audio** | expo-av | Latest | Audio playback |
| **Drag-Drop** | react-native-draggable-flatlist | 4.0+ | Setlist reordering |

### 2.2 Backend Stack

| Category | Technology | Rationale |
|----------|------------|-----------|
| **Database** | Supabase (PostgreSQL) | Managed Postgres, RLS, realtime |
| **Authentication** | Supabase Auth | Email/password, session management |
| **File Storage** | Supabase Storage | Managed S3-compatible storage |
| **Sync Service** | PowerSync | Offline-first sync for Supabase |
| **API** | Supabase JS Client | Type-safe API calls |

### 2.3 Third-Party Services

| Service | Purpose | Free Tier | Paid After |
|---------|---------|-----------|------------|
| **RevenueCat** | Subscription management | Up to $10k MRR | 1% fee |
| **Sentry** | Error tracking | 5k events/month | $26/month |
| **Mixpanel** | Analytics (optional) | 100k events/month | $24/month |
| **Expo EAS** | Build/deployment | Free tier available | $29/month for teams |

### 2.4 Development Tools

| Tool | Purpose |
|------|---------|
| **Git** | Version control |
| **GitHub** | Code hosting, CI/CD |
| **ESLint** | Linting |
| **Prettier** | Code formatting |
| **Jest** | Unit testing |
| **React Native Testing Library** | Component testing |
| **Detox** (optional) | E2E testing |
| **Xcode** | iOS development |
| **Android Studio** | Android development |

---

## 3. Data Architecture

### 3.1 Database Schema

#### 3.1.1 Entity Relationship Diagram

```
┌─────────────────┐
│   auth.users    │ (Managed by Supabase Auth)
│─────────────────│
│ id (uuid) PK    │
│ email           │
│ created_at      │
└────────┬────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐
│    profiles     │
│─────────────────│
│ id (uuid) PK    │◄─────FK
│ email           │
│ subscription_   │
│   tier          │ ('free' | 'pro')
│ subscription_   │
│   status        │
│ stripe_         │
│   customer_id   │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│      bands      │
│─────────────────│
│ id (uuid) PK    │
│ user_id FK      │
│ name            │
│ genre           │
│ created_at      │
└────────┬────────┘
         │
         │ 1:N
         ├──────────────────┐
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│      songs      │  │    setlists     │
│─────────────────│  │─────────────────│
│ id (uuid) PK    │  │ id (uuid) PK    │
│ band_id FK      │  │ band_id FK      │
│ title           │  │ name            │
│ artist          │  │ date            │
│ lyrics          │  │ notes           │
│ duration        │  │ created_at      │
│ bpm             │  │ updated_at      │
│ key             │  └────────┬────────┘
│ backing_track_  │           │
│   url           │           │ 1:N
│ backing_track_  │           │
│   filename      │           ▼
│ created_at      │  ┌─────────────────┐
│ updated_at      │  │ setlist_songs   │
└────────┬────────┘  │─────────────────│
         │           │ id (uuid) PK    │
         │           │ setlist_id FK   │
         │ N:M       │ song_id FK      │◄───FK
         └──────────►│ position (int)  │
                     │ created_at      │
                     └─────────────────┘
```

#### 3.1.2 Table Definitions

**profiles**
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due')),
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_profiles_subscription_tier ON profiles(subscription_tier);
```

**bands**
```sql
CREATE TABLE bands (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  genre text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_bands_user_id ON bands(user_id);
```

**songs**
```sql
CREATE TABLE songs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  band_id uuid NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  title text NOT NULL,
  artist text NOT NULL,
  lyrics text,
  duration text, -- Format: "MM:SS"
  bpm integer CHECK (bpm >= 40 AND bpm <= 240),
  key text,
  backing_track_url text,
  backing_track_filename text,
  backing_track_local_uri text, -- For offline storage
  is_downloaded boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_songs_band_id ON songs(band_id);
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_artist ON songs(artist);
```

**setlists**
```sql
CREATE TABLE setlists (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  band_id uuid NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  name text NOT NULL,
  date date,
  notes text,
  is_downloaded_for_offline boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_setlists_band_id ON setlists(band_id);
CREATE INDEX idx_setlists_date ON setlists(date);
```

**setlist_songs**
```sql
CREATE TABLE setlist_songs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  setlist_id uuid NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(setlist_id, song_id, position)
);

CREATE INDEX idx_setlist_songs_setlist_id ON setlist_songs(setlist_id);
CREATE INDEX idx_setlist_songs_song_id ON setlist_songs(song_id);
CREATE INDEX idx_setlist_songs_position ON setlist_songs(setlist_id, position);
```

### 3.2 PowerSync Schema

PowerSync schema mirrors Supabase schema:

```typescript
// lib/powersync/schema.ts
import { Column, Schema, Table } from '@powersync/react-native';

export const AppSchema = new Schema([
  new Table({
    name: 'profiles',
    columns: [
      new Column({ name: 'email', type: 'TEXT' }),
      new Column({ name: 'subscription_tier', type: 'TEXT' }),
      new Column({ name: 'subscription_status', type: 'TEXT' }),
      new Column({ name: 'created_at', type: 'TEXT' }),
      new Column({ name: 'updated_at', type: 'TEXT' })
    ]
  }),
  new Table({
    name: 'bands',
    columns: [
      new Column({ name: 'user_id', type: 'TEXT' }),
      new Column({ name: 'name', type: 'TEXT' }),
      new Column({ name: 'genre', type: 'TEXT' }),
      new Column({ name: 'created_at', type: 'TEXT' }),
      new Column({ name: 'updated_at', type: 'TEXT' })
    ],
    indexes: [
      { name: 'user_id', columns: [new Column({ name: 'user_id' })] }
    ]
  }),
  new Table({
    name: 'songs',
    columns: [
      new Column({ name: 'band_id', type: 'TEXT' }),
      new Column({ name: 'title', type: 'TEXT' }),
      new Column({ name: 'artist', type: 'TEXT' }),
      new Column({ name: 'lyrics', type: 'TEXT' }),
      new Column({ name: 'duration', type: 'TEXT' }),
      new Column({ name: 'bpm', type: 'INTEGER' }),
      new Column({ name: 'key', type: 'TEXT' }),
      new Column({ name: 'backing_track_url', type: 'TEXT' }),
      new Column({ name: 'backing_track_filename', type: 'TEXT' }),
      new Column({ name: 'backing_track_local_uri', type: 'TEXT' }),
      new Column({ name: 'is_downloaded', type: 'INTEGER' }), // Boolean as 0/1
      new Column({ name: 'created_at', type: 'TEXT' }),
      new Column({ name: 'updated_at', type: 'TEXT' })
    ],
    indexes: [
      { name: 'band_id', columns: [new Column({ name: 'band_id' })] }
    ]
  }),
  new Table({
    name: 'setlists',
    columns: [
      new Column({ name: 'band_id', type: 'TEXT' }),
      new Column({ name: 'name', type: 'TEXT' }),
      new Column({ name: 'date', type: 'TEXT' }),
      new Column({ name: 'notes', type: 'TEXT' }),
      new Column({ name: 'is_downloaded_for_offline', type: 'INTEGER' }),
      new Column({ name: 'created_at', type: 'TEXT' }),
      new Column({ name: 'updated_at', type: 'TEXT' })
    ],
    indexes: [
      { name: 'band_id', columns: [new Column({ name: 'band_id' })] }
    ]
  }),
  new Table({
    name: 'setlist_songs',
    columns: [
      new Column({ name: 'setlist_id', type: 'TEXT' }),
      new Column({ name: 'song_id', type: 'TEXT' }),
      new Column({ name: 'position', type: 'INTEGER' }),
      new Column({ name: 'created_at', type: 'TEXT' })
    ],
    indexes: [
      { name: 'setlist_id', columns: [new Column({ name: 'setlist_id' })] },
      { name: 'song_id', columns: [new Column({ name: 'song_id' })] }
    ]
  })
]);
```

---

## 4. Offline-First Strategy

### 4.1 Architecture Decision: PowerSync

**Why PowerSync over WatermelonDB:**

| Factor | PowerSync | WatermelonDB |
|--------|-----------|--------------|
| Setup Complexity | Low (plug-and-play) | High (custom RPC functions) |
| Sync Management | Automatic | Manual implementation |
| Conflict Resolution | Handled automatically | Must implement |
| Backend Changes | None required | Custom RPC endpoints |
| Cost | Managed service (potential fee) | Free (open-source) |
| Maintenance | Low | High |

**Decision:** Use PowerSync for Phase 1 MVP due to:
- Faster time-to-market
- Reduced complexity
- Proven sync reliability
- Can migrate to WatermelonDB later if costs become prohibitive

### 4.2 Sync Strategy

**Sync Modes:**

1. **Automatic Background Sync** (Default)
   - Syncs every 30 seconds when app is active
   - Pauses when app is backgrounded
   - Resumes on app foreground

2. **Manual Sync** (Pull-to-Refresh)
   - User triggers sync explicitly
   - Shows progress indicator
   - Useful for ensuring latest data

3. **Optimistic Updates**
   - UI updates immediately on user action
   - Changes queued for sync
   - Rollback on server rejection (rare)

**Conflict Resolution:**

PowerSync handles conflicts automatically using last-write-wins (LWW) strategy:
- Conflict detected when same record updated on multiple devices
- Most recent update (by server timestamp) wins
- Suitable for single-user scenario (Phase 1)
- Future: Custom conflict resolution for collaboration (Phase 3)

### 4.3 Offline Data Storage

**Storage Breakdown:**

| Data Type | Storage Method | Size Estimate |
|-----------|----------------|---------------|
| Songs/Setlists/Bands | SQLite (PowerSync) | ~500KB per 100 songs |
| Backing Track MP3s | File System | ~3-5MB per file |
| User Preferences | AsyncStorage | <10KB |
| Auth Session | AsyncStorage (encrypted) | <5KB |

**File System Structure:**
```
FileSystem.documentDirectory/
├── backing-tracks/
│   ├── {songId1}.mp3
│   ├── {songId2}.mp3
│   └── ...
└── cache/
    ├── thumbnails/
    └── temp/
```

### 4.4 Offline UX Patterns

**Indicators:**
- Header badge: "Offline" (red) / "Syncing..." (yellow) / "Synced" (green)
- Last sync timestamp: "Last synced 2 mins ago"
- Queue count: "3 changes pending sync"

**Error Handling:**
- Sync failures retry with exponential backoff
- User notified after 3 failed retry attempts
- Option to manually retry or view error details

---

## 5. Security Architecture

### 5.1 Authentication Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Email + Password
     ▼
┌─────────────────────┐
│   Login Screen      │
└─────────┬───────────┘
          │
          │ 2. supabase.auth.signInWithPassword()
          ▼
┌─────────────────────┐
│  Supabase Auth      │
│  - Validates creds  │
│  - Generates JWT    │
└─────────┬───────────┘
          │
          │ 3. Returns session (JWT + refresh token)
          ▼
┌─────────────────────┐
│  AsyncStorage       │
│  - Store session    │
└─────────┬───────────┘
          │
          │ 4. Navigate to app
          ▼
┌─────────────────────┐
│  AuthContext        │
│  - user: {...}      │
│  - session: {...}   │
└─────────────────────┘
```

**Session Management:**
- JWT access token valid for 1 hour
- Refresh token valid for 7 days
- Automatic refresh before expiry
- Persist session in AsyncStorage (encrypted)

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase, 1 lowercase, 1 number
- No common passwords (Supabase default validation)

### 5.2 Row-Level Security (RLS) Policies

**Bands Table:**
```sql
-- Users can only access their own bands
CREATE POLICY "Users can CRUD own bands"
ON bands
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

**Songs Table:**
```sql
-- Users can access songs from their bands
CREATE POLICY "Users can view songs from own bands"
ON songs
FOR SELECT
TO authenticated
USING (
  band_id IN (
    SELECT id FROM bands WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert songs to own bands"
ON songs
FOR INSERT
TO authenticated
WITH CHECK (
  band_id IN (
    SELECT id FROM bands WHERE user_id = auth.uid()
  )
);

-- Similar policies for UPDATE and DELETE
```

**Freemium Tier Enforcement:**
```sql
-- Free users can only create 1 band
CREATE POLICY "Free users limited to 1 band"
ON bands
FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN (SELECT subscription_tier FROM profiles WHERE id = auth.uid()) = 'free'
    THEN (SELECT COUNT(*) FROM bands WHERE user_id = auth.uid()) < 1
    ELSE true
  END
);

-- Free users can only create 10 songs per band
CREATE POLICY "Free users limited to 10 songs"
ON songs
FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN (SELECT subscription_tier FROM profiles WHERE id = auth.uid()) = 'free'
    THEN (
      SELECT COUNT(*)
      FROM songs
      WHERE band_id IN (SELECT id FROM bands WHERE user_id = auth.uid())
    ) < 10
    ELSE true
  END
);

-- Free users can only create 2 setlists per band
CREATE POLICY "Free users limited to 2 setlists"
ON setlists
FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN (SELECT subscription_tier FROM profiles WHERE id = auth.uid()) = 'free'
    THEN (
      SELECT COUNT(*)
      FROM setlists
      WHERE band_id IN (SELECT id FROM bands WHERE user_id = auth.uid())
    ) < 2
    ELSE true
  END
);
```

### 5.3 File Storage Security

**Supabase Storage Policies:**
```sql
-- Allow authenticated users to upload backing tracks
CREATE POLICY "Users can upload backing tracks"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'backing-tracks' AND
  auth.role() = 'authenticated' AND
  -- Only Pro users can upload
  (SELECT subscription_tier FROM profiles WHERE id = auth.uid()) = 'pro'
);

-- Allow users to read their own files
CREATE POLICY "Users can read own backing tracks"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'backing-tracks' AND
  -- Path format: {userId}/{bandId}/{songId}.mp3
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own backing tracks"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'backing-tracks' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 5.4 Data Privacy

**Personal Data Collected:**
- Email address (required for auth)
- Song lyrics (user-generated content)
- Setlist names/notes (user-generated content)

**Data Retention:**
- Active accounts: Indefinite
- Deleted accounts: 30-day grace period, then permanent deletion
- Deleted songs/setlists: Immediate deletion (CASCADE)

**GDPR Compliance:**
- Right to access: User can export data (Phase 2)
- Right to deletion: Account deletion removes all user data
- Right to portability: Export feature (Phase 2)

---

## 6. API Design

### 6.1 Supabase Client Initialization

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
```

### 6.2 Service Layer Pattern

**Example: Song Service**

```typescript
// services/songService.ts
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/powersync'; // PowerSync instance
import type { Song, CreateSongInput, UpdateSongInput } from '@/types';

export const songService = {
  /**
   * Get all songs for a band (from local DB)
   */
  async getSongs(bandId: string): Promise<Song[]> {
    const results = await db.execute(
      'SELECT * FROM songs WHERE band_id = ? ORDER BY title ASC',
      [bandId]
    );
    return results.rows._array;
  },

  /**
   * Create a new song (writes to local DB, syncs to Supabase)
   */
  async createSong(bandId: string, input: CreateSongInput): Promise<Song> {
    const songId = uuid.v4();

    await db.execute(
      `INSERT INTO songs (id, band_id, title, artist, lyrics, duration, bpm, key, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        songId,
        bandId,
        input.title,
        input.artist,
        input.lyrics || null,
        input.duration || null,
        input.bpm || null,
        input.key || null,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    // PowerSync automatically syncs to Supabase
    const song = await this.getSongById(songId);
    return song!;
  },

  /**
   * Update song
   */
  async updateSong(songId: string, updates: UpdateSongInput): Promise<Song> {
    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');

    const values = [...Object.values(updates), new Date().toISOString(), songId];

    await db.execute(
      `UPDATE songs SET ${setClause}, updated_at = ? WHERE id = ?`,
      values
    );

    const song = await this.getSongById(songId);
    return song!;
  },

  /**
   * Delete song (with setlist check)
   */
  async deleteSong(songId: string): Promise<{ setlistCount: number }> {
    // Check setlist membership
    const setlistResult = await db.execute(
      'SELECT COUNT(*) as count FROM setlist_songs WHERE song_id = ?',
      [songId]
    );

    const setlistCount = setlistResult.rows._array[0].count;

    // Delete song (CASCADE will remove from setlists)
    await db.execute('DELETE FROM songs WHERE id = ?', [songId]);

    return { setlistCount };
  },

  /**
   * Search songs
   */
  async searchSongs(bandId: string, query: string): Promise<Song[]> {
    const results = await db.execute(
      `SELECT * FROM songs
       WHERE band_id = ? AND (title LIKE ? OR artist LIKE ?)
       ORDER BY title ASC`,
      [bandId, `%${query}%`, `%${query}%`]
    );
    return results.rows._array;
  }
};
```

### 6.3 Error Handling

**Error Types:**

```typescript
// types/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error') {
    super(message, 'NETWORK_ERROR', 503);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class FreemiumLimitError extends AppError {
  constructor(resource: string, limit: number) {
    super(
      `Free tier limit reached: ${resource} (max ${limit})`,
      'FREEMIUM_LIMIT',
      402
    );
  }
}
```

**Error Handling Pattern:**

```typescript
// hooks/useSongs.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { songService } from '@/services/songService';
import { handleError } from '@/utils/errorHandler';

export function useCreateSong(bandId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSongInput) => songService.createSong(bandId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs', bandId] });
      showToast('Song created successfully', 'success');
    },
    onError: (error) => {
      const { message, shouldRetry } = handleError(error);
      showToast(message, 'error');

      if (shouldRetry) {
        // Optionally retry
      }
    }
  });
}
```

---

## 7. File Storage Strategy

### 7.1 Backing Track Upload Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Select MP3 file
     ▼
┌─────────────────────┐
│ DocumentPicker      │
│ - Validate file type│
│ - Check size (<15MB)│
└─────────┬───────────┘
          │
          │ 2. If Pro user, proceed
          ▼
┌─────────────────────┐
│ Upload to Supabase  │
│ Path: {userId}/     │
│       {bandId}/     │
│       {songId}.mp3  │
└─────────┬───────────┘
          │
          │ 3. Get public URL
          ▼
┌─────────────────────┐
│ Update Song Record  │
│ - backing_track_url │
│ - backing_track_    │
│   filename          │
└─────────────────────┘
```

**Implementation:**

```typescript
// services/backingTrackService.ts
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/powersync';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export const backingTrackService = {
  /**
   * Pick and upload backing track
   */
  async uploadBackingTrack(
    userId: string,
    bandId: string,
    songId: string,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; filename: string }> {
    // Step 1: Pick file
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/mpeg',
      copyToCacheDirectory: true
    });

    if (result.type === 'cancel') {
      throw new Error('Upload cancelled');
    }

    const { uri, name, size } = result;

    // Step 2: Validate
    if (!size || size > MAX_FILE_SIZE) {
      throw new ValidationError('File size must be under 15MB');
    }

    // Step 3: Upload to Supabase Storage
    const filePath = `${userId}/${bandId}/${songId}.mp3`;
    const fileBody = await fetch(uri).then(r => r.blob());

    const { data, error } = await supabase.storage
      .from('backing-tracks')
      .upload(filePath, fileBody, {
        cacheControl: '3600',
        upsert: true,
        onUploadProgress: (progress) => {
          const percent = (progress.loaded / progress.total) * 100;
          onProgress?.(percent);
        }
      });

    if (error) throw error;

    // Step 4: Get public URL
    const { data: urlData } = supabase.storage
      .from('backing-tracks')
      .getPublicUrl(filePath);

    // Step 5: Update song record
    await db.execute(
      `UPDATE songs
       SET backing_track_url = ?,
           backing_track_filename = ?,
           updated_at = ?
       WHERE id = ?`,
      [urlData.publicUrl, name, new Date().toISOString(), songId]
    );

    return {
      url: urlData.publicUrl,
      filename: name
    };
  },

  /**
   * Download backing track for offline use
   */
  async downloadForOffline(song: Song): Promise<string> {
    if (!song.backing_track_url) {
      throw new Error('No backing track to download');
    }

    const localUri = `${FileSystem.documentDirectory}backing-tracks/${song.id}.mp3`;

    // Check if already downloaded
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      return localUri;
    }

    // Create directory if needed
    await FileSystem.makeDirectoryAsync(
      `${FileSystem.documentDirectory}backing-tracks/`,
      { intermediates: true }
    );

    // Download file
    const downloadResumable = FileSystem.createDownloadResumable(
      song.backing_track_url,
      localUri,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten /
                        downloadProgress.totalBytesExpectedToWrite;
        // Update UI with progress
      }
    );

    const { uri } = await downloadResumable.downloadAsync();

    // Update song record
    await db.execute(
      `UPDATE songs
       SET backing_track_local_uri = ?,
           is_downloaded = 1,
           updated_at = ?
       WHERE id = ?`,
      [uri, new Date().toISOString(), song.id]
    );

    return uri!;
  },

  /**
   * Delete local backing track
   */
  async deleteLocalTrack(songId: string): Promise<void> {
    const localUri = `${FileSystem.documentDirectory}backing-tracks/${songId}.mp3`;

    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(localUri);
    }

    await db.execute(
      `UPDATE songs
       SET backing_track_local_uri = NULL,
           is_downloaded = 0,
           updated_at = ?
       WHERE id = ?`,
      [new Date().toISOString(), songId]
    );
  }
};
```

---

## 8. Performance Optimization

### 8.1 Key Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| App Load Time | <2 seconds | Time from splash to first interactive screen |
| List Scroll FPS | 60 FPS | React DevTools Profiler |
| Search Response | <200ms | Time from keystroke to results |
| Offline Sync | <10 seconds | Time to sync queued changes |
| Memory Usage | <150MB | Xcode Instruments / Android Profiler |

### 8.2 Optimization Strategies

**1. List Rendering**

Use `FlashList` instead of `FlatList` for better performance:

```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={songs}
  renderItem={({ item }) => <SongCard song={item} />}
  estimatedItemSize={80}
  keyExtractor={(item) => item.id}
/>
```

**2. Image Optimization**

- No images in Phase 1 (text-based UI)
- Future: Use `expo-image` for optimized caching

**3. Lazy Loading**

```typescript
// Lazy load lyrics on detail screen
const SongDetailScreen = ({ route }: Props) => {
  const { songId } = route.params;
  const [song, setSong] = useState<Song | null>(null);
  const [lyrics, setLyrics] = useState<string | null>(null);

  useEffect(() => {
    // Load song metadata immediately
    songService.getSongById(songId).then(setSong);

    // Load lyrics separately (can be large)
    songService.getLyrics(songId).then(setLyrics);
  }, [songId]);

  // ...
};
```

**4. Memoization**

```typescript
import { memo, useMemo } from 'react';

const SongCard = memo(({ song }: { song: Song }) => {
  const formattedDuration = useMemo(() => {
    return formatDuration(song.duration);
  }, [song.duration]);

  return (
    <View>
      <Text>{song.title}</Text>
      <Text>{formattedDuration}</Text>
    </View>
  );
}, (prevProps, nextProps) => {
  return prevProps.song.id === nextProps.song.id &&
         prevProps.song.updated_at === nextProps.song.updated_at;
});
```

**5. Debouncing Search**

```typescript
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const LibraryScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const { data: songs } = useQuery({
    queryKey: ['songs', bandId, debouncedQuery],
    queryFn: () => songService.searchSongs(bandId, debouncedQuery)
  });

  // ...
};
```

---

## 9. Testing Strategy

### 9.1 Testing Pyramid

```
         ┌─────────────┐
         │     E2E     │  10% (Critical flows)
         └─────────────┘
       ┌───────────────────┐
       │   Integration     │  30% (Feature-level)
       └───────────────────┘
   ┌─────────────────────────────┐
   │       Unit Tests            │  60% (Functions, utils)
   └─────────────────────────────┘
```

### 9.2 Unit Tests (Jest)

```typescript
// services/__tests__/songService.test.ts
import { songService } from '../songService';
import { db } from '@/lib/powersync';

jest.mock('@/lib/powersync');

describe('songService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSong', () => {
    it('should create a song with all fields', async () => {
      const mockSong = {
        title: 'Test Song',
        artist: 'Test Artist',
        lyrics: 'La la la',
        duration: '03:30',
        bpm: 120,
        key: 'C'
      };

      (db.execute as jest.Mock).mockResolvedValueOnce({ rows: { _array: [] } });

      const result = await songService.createSong('band-123', mockSong);

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO songs'),
        expect.arrayContaining(['band-123', mockSong.title, mockSong.artist])
      );
    });

    it('should throw ValidationError if title is missing', async () => {
      await expect(
        songService.createSong('band-123', { artist: 'Test' } as any)
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

### 9.3 Component Tests (React Native Testing Library)

```typescript
// components/__tests__/SongCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { SongCard } from '../SongCard';

describe('SongCard', () => {
  const mockSong = {
    id: '1',
    title: 'Test Song',
    artist: 'Test Artist',
    key: 'C',
    bpm: 120,
    backing_track_url: null
  };

  it('should render song details', () => {
    const { getByText } = render(<SongCard song={mockSong} />);

    expect(getByText('Test Song')).toBeTruthy();
    expect(getByText('Test Artist')).toBeTruthy();
    expect(getByText('C')).toBeTruthy();
    expect(getByText('120 BPM')).toBeTruthy();
  });

  it('should call onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <SongCard song={mockSong} onPress={onPress} />
    );

    fireEvent.press(getByTestId('song-card'));
    expect(onPress).toHaveBeenCalledWith(mockSong);
  });
});
```

### 9.4 Integration Tests

```typescript
// __tests__/integration/songFlow.test.ts
describe('Song Management Flow', () => {
  it('should create, update, and delete a song', async () => {
    // Create
    const song = await songService.createSong('band-123', {
      title: 'Test Song',
      artist: 'Test Artist'
    });
    expect(song.id).toBeDefined();

    // Update
    const updated = await songService.updateSong(song.id, {
      title: 'Updated Song'
    });
    expect(updated.title).toBe('Updated Song');

    // Delete
    await songService.deleteSong(song.id);
    const deleted = await songService.getSongById(song.id);
    expect(deleted).toBeNull();
  });
});
```

### 9.5 E2E Tests (Optional - Detox)

```typescript
// e2e/songCreation.e2e.ts
describe('Song Creation', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should create a new song', async () => {
    await element(by.id('library-tab')).tap();
    await element(by.id('add-song-button')).tap();

    await element(by.id('song-title-input')).typeText('Test Song');
    await element(by.id('song-artist-input')).typeText('Test Artist');
    await element(by.id('save-song-button')).tap();

    await expect(element(by.text('Test Song'))).toBeVisible();
  });
});
```

### 9.6 Testing Coverage Goals

| Category | Coverage Target |
|----------|----------------|
| Unit Tests | >80% |
| Component Tests | >70% |
| Integration Tests | >50% |
| E2E Tests | >30% (critical flows only) |

---

## 10. Deployment Strategy

### 10.1 Build Configuration (EAS)

**eas.json**
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### 10.2 CI/CD Pipeline (GitHub Actions)

**.github/workflows/build.yml**
```yaml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --coverage

  build-ios:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform ios --profile production --non-interactive

  build-android:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform android --profile production --non-interactive
```

### 10.3 Environment Variables

**.env.development**
```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
EXPO_PUBLIC_POWERSYNC_URL=https://xxx.powersync.com
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=xxx
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=xxx
EXPO_PUBLIC_SENTRY_DSN=xxx
EXPO_PUBLIC_ENV=development
```

**.env.production**
```
# Production environment variables (managed via EAS Secrets)
```

### 10.4 Release Process

**1. Development → Staging**
- Merge feature branch to `develop`
- Automated tests run
- Build `preview` profile
- Deploy to internal TestFlight

**2. Staging → Production**
- Merge `develop` to `main`
- Manual QA approval required
- Build `production` profile
- Submit to App Store / Play Store

**3. Versioning**
- Semantic versioning: `MAJOR.MINOR.PATCH`
- Example: `1.0.0` → `1.0.1` (bug fix) → `1.1.0` (new feature)

---

## 11. Monitoring & Analytics

### 11.1 Error Tracking (Sentry)

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_ENV,
  tracesSampleRate: 0.2, // 20% of transactions
  enableInExpoDevelopment: false,
  debug: __DEV__
});

// Usage
try {
  await songService.createSong(bandId, input);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: 'song-creation',
      bandId
    },
    extra: {
      input
    }
  });
  throw error;
}
```

### 11.2 Analytics (Mixpanel - Optional)

```typescript
// lib/analytics.ts
import { Mixpanel } from 'mixpanel-react-native';

const mixpanel = new Mixpanel(process.env.EXPO_PUBLIC_MIXPANEL_TOKEN!);
await mixpanel.init();

export const analytics = {
  track(event: string, properties?: Record<string, any>) {
    mixpanel.track(event, properties);
  },

  identify(userId: string) {
    mixpanel.identify(userId);
  },

  setUserProperties(properties: Record<string, any>) {
    mixpanel.getPeople().set(properties);
  }
};

// Usage
analytics.track('Song Created', {
  bandId,
  hasBacking Track: !!song.backing_track_url,
  duration: song.duration
});
```

### 11.3 Key Events to Track

| Event | Properties |
|-------|-----------|
| User Signed Up | source, timestamp |
| User Logged In | timestamp |
| Band Created | genre, timestamp |
| Song Created | hasBackingTrack, hasLyrics, key, bpm |
| Setlist Created | songCount, timestamp |
| Song Added to Setlist | setlistId, songId |
| Backing Track Uploaded | fileSize, duration |
| Backing Track Downloaded | songId |
| Lyrics Auto-Scroll Started | songId, duration |
| Subscription Upgraded | tier, price |

### 11.4 Performance Monitoring

```typescript
// lib/performance.ts
import { Performance } from 'react-native-performance';

Performance.mark('app-load-start');

// ... app loads ...

Performance.mark('app-load-end');
Performance.measure('app-load', 'app-load-start', 'app-load-end');

const measure = Performance.getEntriesByName('app-load')[0];
console.log(`App loaded in ${measure.duration}ms`);

// Send to analytics
analytics.track('App Load Time', {
  duration: measure.duration,
  platform: Platform.OS
});
```

---

## 12. Appendices

### 12.1 Glossary

| Term | Definition |
|------|------------|
| **RLS** | Row-Level Security - Postgres security feature |
| **PowerSync** | Offline-first sync service for Supabase |
| **WAL** | Write-Ahead Log - Postgres replication mechanism |
| **JWT** | JSON Web Token - Auth token format |
| **LWW** | Last-Write-Wins - Conflict resolution strategy |
| **EAS** | Expo Application Services - Build/deploy platform |

### 12.2 Key Dependencies

```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "react": "18.2.0",
    "react-native": "0.74.0",
    "@supabase/supabase-js": "^2.38.0",
    "@powersync/react-native": "^1.0.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/native-stack": "^6.9.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@tanstack/react-query": "^5.0.0",
    "react-native-draggable-flatlist": "^4.0.0",
    "expo-av": "~14.0.0",
    "expo-file-system": "~17.0.0",
    "expo-document-picker": "~12.0.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-hook-form": "^7.49.0",
    "zustand": "^4.4.0",
    "@sentry/react-native": "^5.15.0"
  },
  "devDependencies": {
    "@types/react": "~18.2.45",
    "@types/react-native": "~0.73.0",
    "typescript": "^5.3.0",
    "jest": "^29.7.0",
    "@testing-library/react-native": "^12.4.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1"
  }
}
```

### 12.3 Useful Resources

- Supabase Docs: https://supabase.com/docs
- PowerSync Docs: https://docs.powersync.com
- React Native Docs: https://reactnative.dev
- Expo Docs: https://docs.expo.dev
- RevenueCat Docs: https://www.revenuecat.com/docs

---

**End of Document**
