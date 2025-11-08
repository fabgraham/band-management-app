# UI/UX Design Specification
## Band Setlist Manager

---

## Document Control

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Date** | November 8, 2025 |
| **Author** | Design Lead |
| **Status** | Ready for Implementation |
| **Related Docs** | PRD v2.0, Technical Design Document |

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Visual Design System](#2-visual-design-system)
3. [Navigation Architecture](#3-navigation-architecture)
4. [Screen Designs](#4-screen-designs)
5. [Component Library](#5-component-library)
6. [Interaction Patterns](#6-interaction-patterns)
7. [Accessibility](#7-accessibility)
8. [Dark Mode](#8-dark-mode)
9. [Responsive Design](#9-responsive-design)
10. [Animation Guidelines](#10-animation-guidelines)

---

## 1. Design Philosophy

### 1.1 Core Principles

**1. Performance is Everything**
- Every interaction must feel instant (<100ms response)
- 60fps animations, no jank
- List scrolling must be buttery smooth
- Offline-first means no loading spinners

**2. Simplicity Over Complexity**
- One primary action per screen
- Clear visual hierarchy
- Minimal cognitive load
- Progressive disclosure of advanced features

**3. Stage-Ready**
- Lyrics readable in dim/bright lighting
- Large tap targets (musicians have calloused fingers!)
- Works one-handed
- No critical actions require two hands

**4. Familiar Yet Fresh**
- iOS-native patterns (muscle memory)
- Modern aesthetic (not corporate)
- Consistent with musician tools (tuners, metronomes)

### 1.2 Design Inspiration

**Reference Apps:**
- Apple Music - Clean, content-first design
- Things 3 - Beautiful task management, great animations
- Bear Notes - Simple, elegant text editing
- Fantastical - Calendar with personality

**Avoid:**
- BandHelper - Dated, cluttered interface
- Microsoft Teams - Too many options, overwhelming
- Old-school music apps - Skeuomorphic designs

---

## 2. Visual Design System

### 2.1 Color Palette

#### Primary Colors

```css
/* Light Mode */
--primary: #007AFF;           /* iOS Blue - primary actions */
--primary-dark: #0051D5;      /* Pressed state */
--primary-light: #3395FF;     /* Hover state */

--secondary: #5856D6;         /* Purple - secondary actions */
--accent: #FF9500;            /* Orange - highlights */

--success: #34C759;           /* Green - success states */
--warning: #FF9500;           /* Orange - warnings */
--error: #FF3B30;             /* Red - errors, delete */
```

#### Neutral Colors

```css
/* Light Mode */
--background: #FFFFFF;
--background-secondary: #F2F2F7;
--background-tertiary: #E5E5EA;

--text-primary: #000000;
--text-secondary: #8E8E93;
--text-tertiary: #C7C7CC;

--border: #C6C6C8;
--separator: #E5E5EA;
```

#### Dark Mode Colors

```css
/* Dark Mode */
--primary: #0A84FF;           /* Lighter blue for dark backgrounds */
--primary-dark: #0066CC;
--primary-light: #409CFF;

--background: #000000;
--background-secondary: #1C1C1E;
--background-tertiary: #2C2C2E;

--text-primary: #FFFFFF;
--text-secondary: #EBEBF5;    /* 60% opacity white */
--text-tertiary: #EBEBF5;     /* 30% opacity white */

--border: #38383A;
--separator: #38383A;
```

### 2.2 Typography

**Font Family:** System Font (San Francisco on iOS, Roboto on Android)

#### Type Scale

| Style | Size | Weight | Line Height | Use Case |
|-------|------|--------|-------------|----------|
| **Large Title** | 34pt | Bold | 41pt | Screen titles |
| **Title 1** | 28pt | Bold | 34pt | Section headers |
| **Title 2** | 22pt | Bold | 28pt | Card titles |
| **Title 3** | 20pt | Semibold | 25pt | Subsection headers |
| **Headline** | 17pt | Semibold | 22pt | Emphasis, buttons |
| **Body** | 17pt | Regular | 22pt | Main content, lyrics |
| **Callout** | 16pt | Regular | 21pt | Secondary content |
| **Subhead** | 15pt | Regular | 20pt | Card metadata |
| **Footnote** | 13pt | Regular | 18pt | Timestamps, counts |
| **Caption 1** | 12pt | Regular | 16pt | Labels |
| **Caption 2** | 11pt | Regular | 13pt | Fine print |

#### Typography Examples

```typescript
// src/theme/typography.ts
export const typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34
  },
  title2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18
  }
};
```

### 2.3 Spacing System

**8-Point Grid System**

```typescript
export const spacing = {
  xs: 4,    // Tight spacing, icon padding
  sm: 8,    // Element padding
  md: 16,   // Card padding, screen margins
  lg: 24,   // Section spacing
  xl: 32,   // Large gaps
  xxl: 48   // Screen-level spacing
};
```

**Common Patterns:**
- Screen padding: `16px` (md)
- Card padding: `16px` (md)
- Card margin: `12px` between cards
- Button padding: `12px vertical, 24px horizontal`
- Icon size: `24px` (standard), `20px` (small), `32px` (large)

### 2.4 Shadows & Elevation

```typescript
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3 // Android
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12
  }
};
```

### 2.5 Border Radius

```typescript
export const borderRadius = {
  sm: 8,    // Buttons, inputs
  md: 12,   // Cards
  lg: 16,   // Modals
  xl: 24,   // Large containers
  full: 999 // Pill buttons, badges
};
```

---

## 3. Navigation Architecture

### 3.1 App Navigation Structure

```
┌────────────────────────────────────────────────┐
│              Header (Band Switcher)            │
└────────────────────────────────────────────────┘
│                                                │
│                                                │
│            Main Content Area                   │
│         (Stack Navigation)                     │
│                                                │
│                                                │
┌────────────────────────────────────────────────┐
│          Bottom Tab Navigation                 │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │Library│  │Setlists│ │Members│ │Calendar│    │
│  └──────┘  └──────┘  └──────┘  └──────┘      │
└────────────────────────────────────────────────┘
```

### 3.2 Bottom Tab Bar

**Design Specs:**
- Height: `49px` (iOS), `56px` (Android)
- Background: `--background` with border-top
- Active tab: `--primary` color
- Inactive tab: `--text-secondary` color
- Badge support for notifications (future)

**Tab Icons:**

| Tab | Icon (Inactive) | Icon (Active) | Label |
|-----|----------------|---------------|-------|
| Library | 📚 music.note.list | 📚 music.note.list.fill | Library |
| Setlists | 📋 list.bullet | 📋 list.bullet.fill | Setlists |
| Members | 👥 person.2 | 👥 person.2.fill | Members |
| Calendar | 📅 calendar | 📅 calendar.fill | Calendar |

### 3.3 Header/Navigation Bar

**Design Specs:**
- Height: `44px` + safe area inset
- Background: `--background` with border-bottom
- Back button: iOS-style chevron + label
- Right actions: Icon buttons (add, edit, etc.)

**Band Switcher (Dropdown):**
- Centered in header
- Shows current band name
- Tap to show band list modal
- Down chevron indicator

---

## 4. Screen Designs

### 4.1 Authentication Screens

#### 4.1.1 Login Screen

**Layout:**
```
┌─────────────────────────────────┐
│                                 │
│         [App Logo/Icon]         │  ← 80x80px, centered
│                                 │
│      Band Setlist Manager       │  ← Title 1
│   Your music, always with you   │  ← Subhead, secondary color
│                                 │
│  ┌───────────────────────────┐ │
│  │ Email                     │ │  ← Text input
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Password                  │ │  ← Secure text input
│  └───────────────────────────┘ │
│                                 │
│        Forgot Password?         │  ← Link, right-aligned
│                                 │
│  ┌───────────────────────────┐ │
│  │       Sign In             │ │  ← Primary button
│  └───────────────────────────┘ │
│                                 │
│  Don't have an account?         │  ← Center-aligned
│         Sign Up                 │  ← Link
│                                 │
└─────────────────────────────────┘
```

**Interactions:**
- Email field has keyboard type: `email-address`
- Password field has secure entry + show/hide toggle
- "Sign In" button disabled until both fields filled
- Loading state shows spinner in button
- Errors display below relevant field

#### 4.1.2 Sign Up Screen

Similar to Login Screen with additions:
- "Confirm Password" field
- Password strength indicator
- Terms of Service checkbox (required)
- Privacy Policy link

### 4.2 Library Screen

#### 4.2.1 Library List View

**Layout:**
```
┌─────────────────────────────────┐
│  [Band Switcher ▼]              │  ← Header
│  ─────────────────────────────  │
│  🔍 [Search songs...]           │  ← Search bar, sticky
│  ─────────────────────────────  │
│                                 │
│  ┌──────────────────────────┐  │
│  │ 🎵 Song Title            │  │  ← Song card
│  │    Artist Name           │  │
│  │    C  •  120 BPM  •  🎼 │  │  ← Metadata row
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │ 🎵 Another Song          │  │
│  │    Another Artist        │  │
│  │    G  •  140 BPM        │  │
│  └──────────────────────────┘  │
│                                 │
│  [... more songs ...]           │
│                                 │
│          [+ Add Song] ●         │  ← FAB, bottom-right
└─────────────────────────────────┘
```

**Song Card Design:**
- Height: `80px`
- Background: `--background`
- Border radius: `12px`
- Shadow: `card`
- Padding: `16px`
- Tap target: Full card

**Song Card Contents:**
- **Title**: Title 2, bold, `--text-primary`
- **Artist**: Subhead, `--text-secondary`
- **Metadata Row**: Footnote, `--text-tertiary`
  - Key (if set)
  - BPM (if set)
  - Backing track icon (if exists)
  - Separator: ` • `

**Empty State:**
```
┌─────────────────────────────────┐
│                                 │
│                                 │
│         📚 [Large Icon]         │  ← 80x80px, gray
│                                 │
│       No songs yet              │  ← Title 2
│                                 │
│   Add your first song to get    │  ← Body, secondary
│        started                  │
│                                 │
│  ┌───────────────────────────┐ │
│  │       Add Song            │ │  ← Primary button
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

#### 4.2.2 Song Detail Screen

**Layout:**
```
┌─────────────────────────────────┐
│ ← Song Title         [Edit] ... │  ← Header with actions
│  ─────────────────────────────  │
│  Artist Name                    │  ← Headline, secondary
│                                 │
│  ┌───────────────────────────┐ │
│  │ INFO                       │ │  ← Section header
│  │ Key: C major               │ │
│  │ BPM: 120                   │ │
│  │ Duration: 03:30            │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ BACKING TRACK              │ │
│  │ ▶ my-track.mp3             │ │  ← Playback control
│  │ [────────────●─]  2:15     │ │  ← Progress bar
│  │                             │ │
│  │ [Download for Offline]     │ │  ← Toggle (if Pro)
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ LYRICS                     │ │
│  │                             │ │
│  │ [A] [Lyrics text size]     │ │  ← Font size control
│  │                             │ │
│  │ Verse 1                     │ │  ← Lyrics content
│  │ These are the lyrics...     │ │  ← Scrollable
│  │                             │ │
│  │ Chorus                      │ │
│  │ More lyrics here...         │ │
│  │                             │ │
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
   ┌──────────────────────────┐
   │ [▶ Play] [Add to Setlist]│     ← Bottom action bar
   └──────────────────────────┘
```

**Bottom Action Bar:**
- Height: `60px` + safe area inset
- Background: `--background-secondary` with blur effect
- Two primary actions:
  1. **Play**: Starts auto-scroll (if duration set) or plays backing track
  2. **Add to Setlist**: Shows setlist picker modal

#### 4.2.3 Add/Edit Song Screen

**Layout:**
```
┌─────────────────────────────────┐
│ [Cancel]  Add Song     [Save]   │  ← Header
│  ─────────────────────────────  │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Song Title *               │ │  ← Required field
│  │ [                        ] │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Artist *                   │ │
│  │ [                        ] │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌──────┐  ┌────────┐  ┌─────┐│
│  │ Key  │  │  BPM   │  │Durat││  ← Inline fields
│  │ [C ▼]│  │ [120 ] │  │[3:30││
│  └──────┘  └────────┘  └─────┘│
│                                 │
│  ┌───────────────────────────┐ │
│  │ Lyrics (optional)          │ │
│  │ [                        ] │ │  ← Multiline textarea
│  │ [                        ] │ │
│  │ [                        ] │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ [📎 Upload Backing Track] │ │  ← Pro only
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Validation:**
- Save button disabled until required fields filled
- Real-time validation for duration format (MM:SS)
- BPM range validation (40-240)
- Freemium limit check on save attempt

### 4.3 Setlist Screens

#### 4.3.1 Setlists List View

**Layout:**
```
┌─────────────────────────────────┐
│  [Band Switcher ▼]              │  ← Header
│  ─────────────────────────────  │
│                                 │
│  ┌──────────────────────────┐  │
│  │ 📋 Summer Festival        │  │  ← Setlist card
│  │    June 15, 2025          │  │
│  │    12 songs  •  42 mins   │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │ 📋 Saturday Night         │  │
│  │    No date set            │  │
│  │    8 songs  •  28 mins    │  │
│  └──────────────────────────┘  │
│                                 │
│  [... more setlists ...]        │
│                                 │
│       [+ Create Setlist] ●      │  ← FAB
└─────────────────────────────────┘
```

**Setlist Card Design:**
- Similar to Song Card (height, padding, etc.)
- Icon: 📋 or custom setlist icon
- Metadata shows: song count, total duration

#### 4.3.2 Setlist Detail Screen

**Layout:**
```
┌─────────────────────────────────┐
│ ← Setlist Name       [Edit] ... │  ← Header
│  ─────────────────────────────  │
│  June 15, 2025                  │  ← Date (if set)
│  12 songs  •  42 mins           │  ← Summary
│                                 │
│  ┌───────────────────────────┐ │
│  │ [Download for Offline]  ☐ │ │  ← Toggle
│  └───────────────────────────┘ │
│                                 │
│  SONGS                          │  ← Section header
│                                 │
│  ┌───────────────────────────┐ │
│  │ ≡  1. Song Title           │ │  ← Drag handle + number
│  │       Artist  •  C  •  3:30│ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ ≡  2. Another Song         │ │
│  │       Artist  •  G  •  4:00│ │
│  └───────────────────────────┘ │
│                                 │
│  [... more songs ...]           │
│                                 │
│  ┌───────────────────────────┐ │
│  │ [+ Add Songs]              │ │  ← Add button
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Song Row in Setlist:**
- Drag handle (≡) on left
- Position number
- Song title + artist
- Metadata (key, duration)
- Swipe left to remove

**Drag-and-Drop Interaction:**
1. Long press on song row (haptic feedback)
2. Row lifts with shadow elevation
3. Other rows shift to make space
4. Drop to reorder
5. Auto-save new positions

#### 4.3.3 Performance View (Full-Screen Lyrics)

**Layout:**
```
┌─────────────────────────────────┐
│                                 │  ← Minimal header
│  ← [1/12]    Song Title         │
│  ─────────────────────────────  │
│                                 │
│                                 │
│         Verse 1                 │  ← Large, readable text
│                                 │
│     These are the lyrics        │  ← Auto-scroll content
│     of the first verse          │
│     with multiple lines         │
│                                 │
│         Chorus                  │  ← Highlighted (current)
│                                 │
│     This is the chorus          │
│     that we're singing now      │
│                                 │
│         Verse 2                 │  ← Dimmed (upcoming)
│                                 │
│                                 │
│                                 │
│  [Prev]   [⏸ Pause]   [Next]   │  ← Bottom controls
└─────────────────────────────────┘
```

**Performance View Features:**
- Maximum font size (user-adjustable)
- Current section highlighted
- Auto-scroll based on duration
- Manual scroll overrides auto-scroll (resumes after 5s)
- Swipe left/right for prev/next song
- Tap to show/hide controls

### 4.4 Band Management Screens

#### 4.4.1 Band Switcher Modal

**Layout:**
```
┌─────────────────────────────────┐
│  Select Band        [Close]     │  ← Modal header
│  ─────────────────────────────  │
│                                 │
│  ┌───────────────────────────┐ │
│  │ ✓ Rock Cover Band         │ │  ← Current (checkmark)
│  │   12 songs  •  3 setlists │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │   Jazz Ensemble            │ │
│  │   8 songs  •  2 setlists   │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ + Create New Band          │ │  ← Create action
│  └───────────────────────────┘ │
│                                 │
│  ──────────────────────────────│  ← Separator (free tier)
│                                 │
│  🔒 Free Tier: 1 band          │  ← Freemium indicator
│  Upgrade to Pro for unlimited  │
│                                 │
│  ┌───────────────────────────┐ │
│  │   Upgrade to Pro          │ │  ← Upgrade CTA
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

### 4.5 Subscription/Upgrade Screens

#### 4.5.1 Paywall Modal

**Layout:**
```
┌─────────────────────────────────┐
│                [Close X]         │
│                                 │
│         🎸 [Icon]               │  ← Large, colorful icon
│                                 │
│       Upgrade to Pro            │  ← Title 1
│                                 │
│  Get the most out of your music │  ← Subhead
│                                 │
│  ✓ Unlimited bands              │  ← Feature list
│  ✓ Unlimited setlists           │
│  ✓ Unlimited songs              │
│  ✓ Backing track uploads        │
│  ✓ Offline downloads            │
│  ✓ Priority support             │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 💎 Annual  $19.99/year    │ │  ← Plan option (popular)
│  │    Save 44%!               │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │   Monthly  $2.99/month     │ │  ← Plan option
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │    Start Free Trial       │ │  ← Primary CTA
│  └───────────────────────────┘ │
│                                 │
│  Terms • Privacy • Restore      │  ← Footer links
│                                 │
└─────────────────────────────────┘
```

---

## 5. Component Library

### 5.1 Buttons

#### 5.1.1 Primary Button

```typescript
<Button
  title="Save"
  variant="primary"
  onPress={handleSave}
  loading={isSaving}
  disabled={!isValid}
/>
```

**Design Specs:**
- Height: `48px`
- Border radius: `8px`
- Background: `--primary`
- Text: `Headline`, white
- Padding: `12px 24px`
- Disabled state: 40% opacity
- Loading state: Spinner replaces text

#### 5.1.2 Secondary Button

- Same as Primary but:
- Background: transparent
- Border: `1px solid --primary`
- Text color: `--primary`

#### 5.1.3 Destructive Button

- Same as Primary but:
- Background: `--error`
- Used for delete actions

### 5.2 Cards

#### 5.2.1 Song Card Component

```typescript
interface SongCardProps {
  song: Song;
  onPress: () => void;
  onLongPress?: () => void;
}

<SongCard
  song={song}
  onPress={() => navigateToDetail(song.id)}
/>
```

**States:**
- Default
- Pressed (slight scale down + opacity)
- Dragging (elevated, translucent)

### 5.3 Form Inputs

#### 5.3.1 Text Input

```typescript
<TextInput
  label="Song Title"
  placeholder="Enter song title"
  value={title}
  onChangeText={setTitle}
  required
  error={errors.title}
/>
```

**Design Specs:**
- Height: `48px`
- Border: `1px solid --border`
- Border radius: `8px`
- Padding: `12px 16px`
- Focus state: Border color `--primary`, 2px width
- Error state: Border color `--error`

#### 5.3.2 Dropdown/Picker

```typescript
<Picker
  label="Key"
  value={selectedKey}
  onChange={setSelectedKey}
  options={KEY_OPTIONS}
/>
```

### 5.4 Modals

#### 5.4.1 Bottom Sheet Modal

- Slides up from bottom
- Dimmed backdrop (40% black)
- Rounded top corners (16px)
- Drag handle at top
- Swipe down to dismiss

#### 5.4.2 Center Modal

- Centered on screen
- Rounded corners (16px)
- Max width: `90%` of screen or `400px`
- Drop shadow

### 5.5 Empty States

**Pattern:**
- Large icon (80x80px, gray)
- Title (Title 2)
- Description (Body, secondary color)
- Primary action button

### 5.6 Loading States

**Skeleton Screens:**
- Use animated placeholders instead of spinners
- Match layout of actual content
- Shimmer animation

```typescript
<SkeletonCard /> // Mimics SongCard shape
```

---

## 6. Interaction Patterns

### 6.1 Gestures

| Gesture | Context | Action |
|---------|---------|--------|
| **Tap** | Card, button | Select/activate |
| **Long press** | Song in setlist | Enter drag mode |
| **Swipe left** | Song in setlist | Reveal delete button |
| **Swipe right** | (Future) | Mark as favorite |
| **Pull down** | List | Refresh/sync |
| **Pinch** | Lyrics | Adjust font size |

### 6.2 Haptic Feedback

| Event | Haptic Type |
|-------|-------------|
| Button press | Light impact |
| Drag start | Medium impact |
| Drag drop | Heavy impact |
| Delete confirmation | Notification error |
| Success action | Notification success |

```typescript
import * as Haptics from 'expo-haptics';

// On button press
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// On drag start
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
```

### 6.3 Feedback & Confirmation

**Delete Confirmation:**
- Use iOS ActionSheet for destructive actions
- Options: "Delete", "Cancel"
- "Delete" in red
- Warning message if song is in setlists

**Toast Notifications:**
- Success: Green background, checkmark icon
- Error: Red background, X icon
- Info: Blue background, i icon
- Duration: 3 seconds
- Position: Top of screen (below notch)

---

## 7. Accessibility

### 7.1 WCAG 2.1 Compliance

**Target Level:** AA

**Key Requirements:**
- Color contrast ratio ≥ 4.5:1 for text
- Color contrast ratio ≥ 3:1 for UI components
- Touch targets ≥ 44x44pt
- Text resizable up to 200%
- No content only conveyed by color

### 7.2 VoiceOver/TalkBack Support

```typescript
<View
  accessible={true}
  accessibilityLabel="Song: Yesterday by The Beatles"
  accessibilityRole="button"
  accessibilityHint="Double tap to view song details"
>
  <SongCard song={song} />
</View>
```

**Required Labels:**
- All interactive elements
- All images (decorative images: `accessible={false}`)
- Form inputs with clear labels
- Dynamic content announcements

### 7.3 Dynamic Type Support

- All text must scale with user's font size preference
- Test at 100%, 150%, 200% sizes
- UI must not break at larger sizes
- Consider fixed layouts for extreme sizes

### 7.4 Accessibility Features

- High contrast mode support (future)
- Reduce motion preference (disable animations)
- VoiceOver optimized drag-and-drop
- Keyboard navigation (future, iPad)

---

## 8. Dark Mode

### 8.1 Implementation Strategy

**Automatic Switching:**
- Follows system preference by default
- User can override in settings (future)

**Color Adjustments:**
- Increase brightness of blues/purples for dark backgrounds
- Reduce shadow opacity
- Adjust borders to be visible on dark backgrounds

### 8.2 Testing Dark Mode

- Test all screens in both modes
- Check color contrast (use automated tools)
- Verify readability of lyrics in dim lighting
- Test on OLED screens (true black)

---

## 9. Responsive Design

### 9.1 Breakpoints

| Device | Width | Layout Adjustments |
|--------|-------|-------------------|
| iPhone SE | 375pt | Default layout |
| iPhone Pro | 390pt | Default layout |
| iPhone Pro Max | 428pt | Slightly wider cards |
| iPad | 768pt+ | Two-column layout (future) |

### 9.2 Landscape Mode

**Strategy:** Support portrait primarily, gracefully handle landscape

**Landscape Adjustments:**
- Navigation bar horizontal (iOS style)
- Lyrics use full width
- Form inputs in two columns (if space)

---

## 10. Animation Guidelines

### 10.1 Animation Principles

1. **Purposeful**: Animations guide attention, don't distract
2. **Responsive**: Animations respond to user input immediately
3. **Natural**: Follow physics (easing, bounce)
4. **Fast**: Animations complete in 200-400ms
5. **Skippable**: Respect "Reduce Motion" preference

### 10.2 Common Animations

#### Screen Transitions
- Duration: `300ms`
- Easing: `ease-in-out`
- Type: Slide (iOS), Fade + Scale (Android)

#### Modal Appearance
- Duration: `250ms`
- Easing: `ease-out`
- Type: Slide up + fade in

#### Button Press
- Duration: `100ms`
- Easing: `ease-in`
- Type: Scale down (0.95x) + opacity (0.8)

#### Drag and Drop
- Duration: Follows finger (no fixed duration)
- Easing: Spring physics
- Type: Elevation + position

### 10.3 Animation Code Examples

```typescript
import { Animated } from 'react-native';

// Button press animation
const scale = new Animated.Value(1);

const animatePress = () => {
  Animated.sequence([
    Animated.timing(scale, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true
    }),
    Animated.timing(scale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true
    })
  ]).start();
};

<Animated.View style={{ transform: [{ scale }] }}>
  <Button onPress={animatePress} />
</Animated.View>
```

---

## 11. Appendices

### 11.1 Icon Library

**Recommended:** SF Symbols (iOS) / Material Icons (Android)

**Common Icons:**
- Music note: `music.note`
- Setlist: `list.bullet`
- Add: `plus`
- Edit: `pencil`
- Delete: `trash`
- Download: `arrow.down.circle`
- Play: `play.fill`
- Pause: `pause.fill`
- Search: `magnifyingglass`
- Band: `person.2`
- Calendar: `calendar`

### 11.2 Design Tokens (JSON)

```json
{
  "colors": {
    "primary": "#007AFF",
    "background": "#FFFFFF",
    "text": {
      "primary": "#000000",
      "secondary": "#8E8E93"
    }
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 16,
    "lg": 24,
    "xl": 32
  },
  "typography": {
    "title1": {
      "fontSize": 28,
      "fontWeight": "700",
      "lineHeight": 34
    }
  }
}
```

### 11.3 Figma Design File Structure (Future)

```
Band Setlist Manager Design
├── 🎨 Design System
│   ├── Colors
│   ├── Typography
│   ├── Components
│   └── Icons
├── 📱 Screens
│   ├── Authentication
│   ├── Library
│   ├── Setlists
│   ├── Performance
│   └── Settings
└── 🔄 Flows
    ├── Onboarding
    ├── Create Song
    └── Build Setlist
```

---

**End of Document**
