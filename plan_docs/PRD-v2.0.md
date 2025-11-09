# Product Requirements Document v2.0
## Band Setlist Manager

---

## Document Control

| Field | Value |
|-------|-------|
| **Version** | 2.0 |
| **Date** | November 8, 2025 |
| **Author** | Product Owner |
| **Status** | Ready for Development |
| **Previous Version** | 1.0 (Band App Setlist Manager.md) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Market Analysis](#2-market-analysis)
3. [Product Vision](#3-product-vision)
4. [User Personas](#4-user-personas)
5. [Feature Requirements](#5-feature-requirements)
6. [Business Model](#6-business-model)
7. [Success Metrics](#7-success-metrics)
8. [Roadmap](#8-roadmap)
9. [Dependencies & Risks](#9-dependencies--risks)

---

## 1. Executive Summary

### 1.1 Product Overview

Band Setlist Manager is a mobile-first application that enables musicians to manage song lyrics, backing tracks, and performance setlists across multiple bands. The app emphasizes **offline-first architecture** and provides an intuitive, drag-and-drop interface for setlist creation.

### 1.2 Problem Statement

Musicians performing live face several challenges:
- **Fragmented tools**: Lyrics in notes apps, backing tracks in cloud storage, setlists on paper
- **Poor offline support**: Many apps require internet connectivity during performances
- **Complex UX**: Existing solutions (BandHelper, OnSong) are either overwhelming or platform-limited
- **Expensive**: Premium apps charge $30-60/year with limited free tiers

### 1.3 Solution

A cross-platform mobile app with:
- **Offline-first architecture** using PowerSync + Supabase
- **Simple, modern UX** with drag-and-drop setlist building
- **Auto-scrolling lyrics** synchronized with song duration or backing tracks
- **Generous free tier** (1 band, 2 setlists, 10 songs)
- **Affordable Pro pricing** ($19.99/year)

### 1.4 Target Market

- **Primary**: Solo performers and small bands (2-5 members) performing regularly
- **Secondary**: Wedding/cover bands, worship teams, music teachers
- **Initial focus**: iOS and Android (React Native + Expo)

---

## 2. Market Analysis

### 2.1 Competitive Landscape

| App | Platform | Pricing | Key Strength | Key Weakness |
|-----|----------|---------|--------------|--------------|
| **BandHelper** | iOS, Android, Web | $30-60/year | Comprehensive features | Overwhelming UI, dated design |
| **OnSong** | iOS only | $30-60/year | Polished experience | iOS-only, expensive |
| **Band Companion** | iOS, Android | Unknown | Good concept | Crashes, clunky setlist creation |
| **SetlistMaker** | iOS, Android | N/A | Legacy | No longer developed |

### 2.2 Competitive Advantages

1. **Modern tech stack** → Faster performance, smoother UX
2. **True offline-first** → Works without internet (competitors struggle)
3. **Cross-platform from day 1** → Reach both iOS and Android users
4. **Lower pricing** → $19.99/year vs. $30-60/year competitors
5. **Better UX** → Address Band Companion complaints (crashes, poor reordering)

### 2.3 User Pain Points (From Competitor Reviews)

**Band Companion Issues to Fix:**
- "Occasionally crashing while editing songs"
- "Cumbersome to make new setlists" (users want drag-and-drop)
- "Impossible to put in order" with 34+ song setlists
- Limited key options (missing flats)
- No master song library

**OnSong Limitations:**
- iOS-only (no Android)
- High pricing ($60/year for Premium)
- Limited collaboration features

**BandHelper Feedback:**
- Desktop UI feels dated
- Can be overwhelming for solo musicians
- Steep learning curve

---

## 3. Product Vision

### 3.1 Core Value Proposition

> "The simplest way to manage your band's songs and setlists - works perfectly offline, affordable, and beautiful to use."

### 3.2 Product Principles

1. **Offline-First**: Every feature must work without internet
2. **Simplicity over Features**: Prioritize ease-of-use over feature bloat
3. **Performance Matters**: Sub-2-second app load time, smooth 60fps animations
4. **Generous Free Tier**: Provide real value before asking for payment
5. **Cross-Platform Parity**: iOS and Android get equal treatment

### 3.3 Long-Term Vision (3-5 years)

- **Year 1**: Establish as the best solo/small band setlist app
- **Year 2**: Add collaboration features (shared setlists, band member invites)
- **Year 3**: Calendar integration, event management, rehearsal tracking
- **Year 4**: Social features (public song library, community setlists)
- **Year 5**: AI-powered features (setlist suggestions, chord recognition)

---

## 4. User Personas

### 4.1 Primary Persona: "Sarah the Solo Performer"

**Demographics:**
- Age: 28-45
- Occupation: Full-time musician or side gig
- Performs: 2-4 times per month (bars, restaurants, weddings)

**Goals:**
- Quick access to lyrics during performances
- Organize 50-100 songs into themed setlists
- Play backing tracks when performing solo
- Work offline (venues often have poor WiFi)

**Pain Points:**
- Current solution: Mix of Google Docs, Spotify, and paper notes
- Wastes time searching for lyrics between songs
- Backing tracks scattered across cloud services
- Needs something simpler than BandHelper

**How Our App Helps:**
- Master song library with searchable lyrics
- Offline access to everything
- Backing track playback built-in
- Auto-scrolling lyrics (hands-free performance)

### 4.2 Secondary Persona: "Mike the Multi-Band Member"

**Demographics:**
- Age: 25-40
- Occupation: Part-time musician
- Plays in: 2-3 bands simultaneously

**Goals:**
- Separate song libraries per band
- Switch between band contexts easily
- Share setlists with bandmates
- Remember which songs belong to which band

**Pain Points:**
- Confusion mixing songs from different bands
- Different setlist requirements per band
- Needs quick context switching
- OnSong doesn't handle multiple bands well

**How Our App Helps:**
- Band-based organization (isolated libraries)
- Quick band switcher
- Future: Collaboration features (Phase 3)

### 4.3 Tertiary Persona: "Emily the Worship Leader"

**Demographics:**
- Age: 22-35
- Role: Church worship team leader
- Frequency: Weekly services + rehearsals

**Goals:**
- Plan worship setlists in advance
- Share lyrics with team members
- Track song keys and tempos
- Have backup if projection system fails

**Pain Points:**
- Planning Center is overkill for her small church
- Needs something her volunteers can use easily
- Budget-conscious (church-funded)

**How Our App Helps:**
- Simple setlist planning
- Key and tempo tracking
- Offline backup for emergency
- Affordable pricing ($20/year)

---

## 5. Feature Requirements

### 5.1 Phase 1 (MVP) - Weeks 1-12

#### 5.1.1 Authentication & User Management

| Feature | Priority | Description |
|---------|----------|-------------|
| Email/Password Sign Up | P0 | Supabase Auth with email verification |
| Email/Password Sign In | P0 | Persistent sessions via AsyncStorage |
| Password Reset | P1 | Email-based password recovery |
| Sign Out | P0 | Clear session and redirect to login |

**Acceptance Criteria:**
- User can create account with valid email
- Session persists across app restarts
- Password reset email received within 5 minutes
- Sign out clears all local session data

---

#### 5.1.2 Band Management

| Feature | Priority | Description |
|---------|----------|-------------|
| Create Band | P0 | Name (required), Genre (optional) |
| View Bands | P0 | List of user's bands |
| Switch Band | P0 | Change active band context |
| Edit Band | P1 | Update name/genre |
| Delete Band | P1 | Cascade delete songs/setlists (with warning) |

**Business Rules:**
- **Free tier**: Max 1 band
- **Pro tier**: Unlimited bands
- User must have at least 1 band to access features
- All songs and setlists belong to specific band
- Switching bands maintains current screen (Library/Setlists/etc.)

**Acceptance Criteria:**
- Free users blocked at 1 band with upgrade prompt
- Deleting band shows warning: "This will delete X songs and Y setlists"
- Band switcher accessible from all main screens
- Last active band persists across app restarts

---

#### 5.1.3 Song Library

| Feature | Priority | Description |
|---------|----------|-------------|
| Add Song | P0 | Title, Artist, Lyrics, Key, BPM, Duration |
| Edit Song | P0 | Update any song field |
| Delete Song | P0 | Remove song with setlist warning |
| View Song Details | P0 | Full song information screen |
| Search Songs | P0 | Search by title or artist |
| List Songs | P0 | Scrollable card-based list |

**Song Properties:**

| Field | Type | Required | Validation | Free Tier Limit |
|-------|------|----------|------------|-----------------|
| Title | Text | Yes | Max 200 chars | - |
| Artist | Text | Yes | Max 200 chars | - |
| Lyrics | Multiline | No | Max 10,000 chars | - |
| Duration | Text | No | Format: MM:SS | - |
| BPM | Number | No | 40-240 | - |
| Key | Dropdown | No | See key options below | - |
| Backing Track | File | No | MP3, max 15MB | Pro only |

**Key Options (Complete with Sharps and Flats):**
```
C, Cm, Db, Dbm, C#, C#m, D, Dm, Eb, Ebm, D#, D#m, E, Em, F, Fm,
Gb, Gbm, F#, F#m, G, Gm, Ab, Abm, G#, G#m, A, Am, Bb, Bbm,
A#, A#m, B, Bm
```

**Business Rules:**
- **Free tier**: Max 10 songs per band
- **Pro tier**: Unlimited songs
- Deleting song checks setlist membership: "This song is in 3 setlists. Continue?"
- Songs can belong to multiple setlists
- Backing tracks require Pro subscription

**Acceptance Criteria:**
- Free users blocked at 10 songs with upgrade prompt
- Search filters in real-time (debounced 300ms)
- Duration auto-formats as user types (330 → 3:30)
- Lyrics support multiline text with scroll
- Song cards show: title, artist, key, BPM, backing track indicator

---

#### 5.1.4 Setlist Management

| Feature | Priority | Description |
|---------|----------|-------------|
| Create Setlist | P0 | Name, Date (optional), Notes |
| Edit Setlist | P0 | Update name/date/notes |
| Delete Setlist | P0 | Remove setlist (songs remain in library) |
| View Setlist | P0 | Ordered list of songs |
| Add Songs (Method 1) | P0 | From song detail → Add to Setlist |
| Add Songs (Method 2) | P0 | From setlist → Browse & add songs |
| Remove Song | P0 | Remove song from setlist (keep in library) |
| Reorder Songs | P0 | Drag-and-drop reordering |
| Duplicate Setlist | P1 | Copy setlist with all songs |

**Business Rules:**
- **Free tier**: Max 2 setlists per band
- **Pro tier**: Unlimited setlists
- Deleting setlist does NOT delete songs from library
- Songs maintain position (1, 2, 3...) in setlist
- Same song can appear multiple times in one setlist

**Drag-and-Drop Requirements:**
- Library: react-native-draggable-flatlist
- Long-press to initiate drag
- Haptic feedback on drag start/drop
- Visual elevation during drag
- Alternative: Up/down arrow buttons for accessibility

**Acceptance Criteria:**
- Free users blocked at 2 setlists with upgrade prompt
- Setlist cards show: name, date, song count, total duration
- Adding song from library shows checkbox modal of setlists
- Reordering saves position immediately
- Empty setlist shows helpful prompt: "Add your first song"

---

#### 5.1.5 Lyrics Display & Auto-Scroll

| Feature | Priority | Description |
|---------|----------|-------------|
| Lyrics Viewer | P0 | Full-screen lyrics display |
| Text Size Adjustment | P0 | User-controlled font size |
| Manual Scroll | P0 | User can scroll freely |
| Auto-Scroll (Duration-Based) | P0 | Scroll based on MM:SS duration |
| Play/Pause Controls | P0 | Start/stop auto-scroll |
| Scroll Speed Indicator | P1 | Show time remaining |

**Auto-Scroll Implementation:**
- If song has duration (MM:SS), enable auto-scroll
- Play button at bottom menu starts scroll
- Scroll speed calculated: `lyricHeight / durationSeconds`
- User can manually scroll (auto-resume after 5 seconds)
- Pause button stops scroll at current position

**Technical Approach:**
- Use `react-native-lrc` for LRC format support
- Or custom ScrollView with Animated API (60fps)
- Store scroll position in case of interruption

**Acceptance Criteria:**
- Lyrics readable on all screen sizes (responsive font sizing)
- Auto-scroll smooth (no jank, 60fps)
- Manual scroll doesn't break auto-scroll
- Play button disabled if no duration set
- Dark mode optimized for stage lighting

---

#### 5.1.6 Backing Track Management

| Feature | Priority | Description |
|---------|----------|-------------|
| Upload Backing Track | P0 | MP3 upload to Supabase Storage (Pro only) |
| Download for Offline | P0 | Toggle to cache locally |
| Play/Pause | P0 | Audio playback controls |
| Progress Bar | P0 | Show playback position |
| Delete Backing Track | P0 | Remove from storage |

**Business Rules:**
- **Free tier**: Cannot upload backing tracks
- **Pro tier**: 15MB limit per file, unlimited files
- Offline toggle downloads MP3 to device storage
- Playback syncs with lyrics auto-scroll (if enabled)

**Technical Implementation:**
- Upload: Supabase Storage with path `{userId}/{bandId}/{songId}.mp3`
- Download: expo-file-system to `FileSystem.documentDirectory`
- Playback: expo-av with Audio.Sound API
- Permissions: iOS (NSMediaLibrary), Android (READ_EXTERNAL_STORAGE)

**Acceptance Criteria:**
- Upload shows progress bar (0-100%)
- Free users see "Upgrade to Pro" on upload attempt
- Downloaded tracks play without internet
- Audio stops when user navigates away
- File size shown before/after upload

---

#### 5.1.7 Offline Functionality

| Feature | Priority | Description |
|---------|----------|-------------|
| Offline Data Sync | P0 | PowerSync or WatermelonDB |
| Download Setlist | P0 | Cache all songs + backing tracks |
| Offline Indicator | P0 | Show connection status |
| Auto-Sync on Reconnect | P0 | Upload changes when online |

**Technical Architecture:**
- **Primary recommendation**: PowerSync + Supabase
  - Managed sync service
  - Automatic conflict resolution
  - No custom backend code
- **Alternative**: WatermelonDB + custom RPC functions

**Offline Storage:**
- Songs, setlists, band data → Local SQLite (via PowerSync/WatermelonDB)
- Backing track MP3s → expo-file-system
- User preferences → AsyncStorage

**Permissions Required:**
- iOS: None (scoped storage)
- Android: WRITE_EXTERNAL_STORAGE (Android <10)

**Acceptance Criteria:**
- App fully functional in airplane mode
- Changes sync within 10 seconds of reconnection
- No data loss during offline period
- Clear UI indicator of sync status
- Downloaded setlist includes all songs + tracks

---

#### 5.1.8 Navigation & UX

| Feature | Priority | Description |
|---------|----------|-------------|
| Bottom Tab Navigation | P0 | Library, Setlists, Members, Calendar |
| Band Switcher | P0 | Dropdown in header |
| Empty States | P0 | Helpful prompts when no data |
| Loading States | P0 | Skeleton screens during fetch |
| Error States | P0 | User-friendly error messages |
| Pull to Refresh | P1 | Manual sync trigger |

**Bottom Tabs:**
1. **Library** (P0) - Song list and search
2. **Setlists** (P0) - Setlist list and creation
3. **Members** (P1, Phase 3) - Placeholder for now
4. **Calendar** (P1, Phase 4) - Placeholder for now

**Band Switcher Behavior:**
- Accessible from all main screens
- Switching bands maintains current tab
- Shows band name + song/setlist count
- Animation: Smooth fade transition

**Acceptance Criteria:**
- Tab navigation animates smoothly
- Empty states include CTA buttons
- Loading states use skeleton UI (no spinners)
- Band switcher updates data without full reload

---

### 5.2 Phase 2 Features (Post-Launch)

**Not included in initial scope:**

- Export/Backup (CSV, PDF)
- Collaboration (invite band members)
- Real-time sync between band members
- Calendar integration
- Event management
- Practice mode with loop sections
- Chord transposition
- Voice memos per song
- AI setlist suggestions

---

## 6. Business Model

### 6.1 Monetization Strategy

**Freemium Model with Subscriptions**

#### Free Tier Limitations:
- 1 band maximum
- 2 setlists per band
- 10 songs per band
- No backing track uploads
- Basic lyrics (no backing track sync)

#### Pro Tier Features:
- Unlimited bands
- Unlimited setlists
- Unlimited songs
- Backing track uploads (15MB per file)
- Auto-scroll sync with backing tracks
- Priority support
- Future: Early access to new features

### 6.2 Pricing

| Tier | Price | Target Market |
|------|-------|---------------|
| **Free** | $0 | Casual musicians, trial users |
| **Pro Monthly** | $2.99/month | Flexibility, try before commit |
| **Pro Annual** | $19.99/year | Best value, serious musicians |
| **Lifetime** | TBD (Phase 2) | Super fans, one-time payment |

**Competitive Comparison:**
- OnSong: $30-60/year
- BandHelper: $30-60/year
- **Our App**: $19.99/year (33-50% cheaper)

### 6.3 Payment Processing

**Recommended: RevenueCat**

**Why RevenueCat:**
- Unified API across iOS, Android, Web
- Built-in receipt validation
- Subscription lifecycle management
- Analytics and cohort tracking
- Free up to $10k/month revenue
- 1% fee after $10k

**Alternative: Stripe (for Web only)**

### 6.4 Revenue Projections (Conservative)

**Year 1 Assumptions:**
- 1,000 total users
- 10% conversion to Pro
- $19.99/year per Pro user

**Year 1 Revenue:** 100 Pro users × $19.99 = **$1,999**

**Year 2 Assumptions:**
- 5,000 total users
- 15% conversion rate (improved onboarding)

**Year 2 Revenue:** 750 Pro users × $19.99 = **$14,992**

**Costs to Consider:**
- Supabase: ~$25-100/month (scales with users)
- PowerSync: Potentially free (depending on service)
- RevenueCat: 1% fee after $10k = ~$50 (Year 2)
- App Store fees: 30% first year, 15% after (subscription)

---

## 7. Success Metrics

### 7.1 North Star Metric

**Weekly Active Setlist Views**

Rationale: Users who view setlists weekly are actively performing, indicating product-market fit.

### 7.2 Key Performance Indicators (KPIs)

#### Acquisition Metrics
- App Store downloads (target: 500 in first 3 months)
- Beta tester sign-ups (target: 100+)
- Organic vs. paid acquisition split

#### Engagement Metrics
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- DAU/WAU ratio (target: >20%)
- Average songs per user (target: 20+)
- Average setlists per user (target: 3+)
- Session duration (target: 5+ minutes)

#### Retention Metrics
- Day 1 retention (target: >40%)
- Day 7 retention (target: >30%)
- Day 30 retention (target: >20%)
- Churn rate (target: <10% monthly)

#### Monetization Metrics
- Free-to-Pro conversion rate (target: >10%)
- Monthly Recurring Revenue (MRR)
- Average Revenue Per User (ARPU)
- Lifetime Value (LTV) : Customer Acquisition Cost (CAC) ratio (target: >3:1)

#### Technical Performance Metrics
- App load time (target: <2 seconds)
- Crash-free rate (target: >99%)
- API response time (target: <200ms p95)
- Offline sync success rate (target: >95%)

#### User Satisfaction Metrics
- App Store rating (target: >4.5 stars)
- Net Promoter Score (NPS) (target: >50)
- Beta tester feedback sentiment

---

## 8. Roadmap

### 8.1 Phase 1: MVP (Weeks 1-12)

**Milestone 1: Foundation (Weeks 1-2)**
- [ ] Expo + TypeScript project setup
- [ ] Supabase configuration (auth, database, storage)
- [ ] Database schema + RLS policies
- [ ] PowerSync/WatermelonDB integration
- [ ] Basic authentication screens

**Milestone 2: Core Features (Weeks 3-6)**
- [ ] Band CRUD operations
- [ ] Song library (add, edit, delete, search)
- [ ] Setlist management (create, edit, delete)
- [ ] Drag-and-drop song reordering
- [ ] Offline sync working end-to-end

**Milestone 3: Advanced Features (Weeks 7-9)**
- [ ] Lyrics auto-scroll (duration-based)
- [ ] Backing track upload + playback
- [ ] Offline download toggle
- [ ] RevenueCat subscription integration
- [ ] Freemium tier enforcement

**Milestone 4: Polish & Beta (Weeks 10-12)**
- [ ] UI/UX refinements
- [ ] Empty/loading/error states
- [ ] Sentry crash reporting
- [ ] TestFlight deployment
- [ ] Beta tester recruitment

### 8.2 Phase 2: Post-Launch Improvements (Weeks 13-24)

- Export/backup functionality
- Share setlist (read-only link)
- Improved search (full-text)
- Dark mode enhancements
- Performance optimizations
- User-requested features

### 8.3 Phase 3: Collaboration (Months 7-12)

- Invite band members by email
- Real-time setlist updates
- Member roles (admin, editor, viewer)
- Comment threads on songs
- Activity feed

### 8.4 Phase 4: Calendar & Events (Year 2)

- Gig calendar view
- Assign setlists to events
- Rehearsal tracking
- Reminders and notifications

### 8.5 Phase 5: Advanced Features (Year 2+)

- Chord transposition
- Built-in metronome
- Practice mode with loops
- Voice memos per song
- AI-powered setlist suggestions

---

## 9. Dependencies & Risks

### 9.1 Technical Dependencies

| Dependency | Risk Level | Mitigation |
|------------|------------|------------|
| **Supabase** | Medium | Managed service, good uptime (99.9%) |
| **PowerSync** | Medium | Alternative: WatermelonDB (open-source) |
| **RevenueCat** | Low | Alternative: Stripe direct integration |
| **Expo** | Low | Mature platform, large community |
| **React Native** | Low | Industry standard |

### 9.2 Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Low conversion rate (<5%) | High | Medium | Improve onboarding, clear value prop |
| Competitive response | Medium | Low | Move fast, build community |
| App Store rejection | High | Low | Follow guidelines, thorough testing |
| High churn rate | High | Medium | Focus on retention, engagement loops |
| PowerSync/backend costs | Medium | Medium | Monitor usage, optimize queries |

### 9.3 Development Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Offline sync complexity | High | High | Use PowerSync (managed service) |
| Audio playback bugs | Medium | Medium | Extensive device testing |
| Storage permission issues | Low | Low | Clear user communication |
| Performance on older devices | Medium | Low | Set minimum OS versions (iOS 13+, Android 8+) |

### 9.4 Market Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Niche market too small | High | Low | Expand to adjacent markets (teachers, worship) |
| Price sensitivity | Medium | Medium | Offer generous free tier |
| Competitor releases similar app | Medium | Low | Speed to market, community building |

---

## 10. Appendices

### 10.1 Glossary

- **RLS**: Row-Level Security (Supabase database security)
- **PowerSync**: Offline-first sync service for Supabase
- **WatermelonDB**: Open-source reactive database for React Native
- **RevenueCat**: Subscription management platform
- **LRC**: Lyric file format with timestamps
- **DAU/WAU**: Daily/Weekly Active Users
- **NPS**: Net Promoter Score

### 10.2 References

- Original PRD: `Band App Setlist Manager.md`
- Competitive Research: (Completed Nov 8, 2025)
- Technical Research: (Completed Nov 8, 2025)

### 10.3 Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Nov 8, 2025 | Initial draft | Product Owner |
| 2.0 | Nov 8, 2025 | Added offline strategy, freemium model, competitive analysis, complete key options | Product Owner |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Technical Lead | | | |
| Design Lead | | | |

---

**End of Document**
