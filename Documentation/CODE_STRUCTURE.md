# Story Weaver - Code Structure Guide

This document explains how the Story Weaver app is organized and which files do what, written for non-technical users.

## 🏗️ Overall Architecture

```
Story Weaver App
├── Frontend (What users see and interact with)
├── Backend (Server that processes requests)
├── Database (Stores all the stories and user data)
└── Farcaster Integration (Connects to social features)
```

## 📁 Main Folders

### `/client` - Frontend (User Interface)
**What it does**: Everything users see and click on
- Web pages (home, story pages, about)
- Buttons and forms 
- Visual design and styling

### `/server` - Backend (Behind-the-scenes processing)
**What it does**: Handles all the business logic
- Processes user requests
- Manages story creation and editing
- Connects to the database
- Handles Farcaster cast actions

### `/shared` - Common Code
**What it does**: Code used by both frontend and backend
- Database structure definitions
- Data validation rules

## 🎯 Key Features & Which Files Handle Them

### 1. **Story Creation** (When someone uses "Weave My Part" action)

**Flow**: User clicks action → Farcaster → Our server → Database → Response

**Files involved**:
- `server/routes.ts` (lines 786-902) - Receives the action request
- `server/storage.ts` - Saves the new story to database
- `shared/schema.ts` - Defines what a story looks like

### 2. **User Authentication** (Who is logged in)

**Flow**: User opens app → Farcaster SDK → Enhanced by Neynar → Saved locally

**Files involved**:
- `client/src/hooks/use-farcaster.tsx` - Main user login logic
- `client/src/lib/farcaster.ts` - Connects to Farcaster
- `client/src/lib/neynar.ts` - Gets extra user info
- `server/storage.ts` - Saves user to database

### 3. **Story Collaboration** (Adding parts to stories)

**Flow**: User writes comment → Permission check → Creator approval → Added to story

**Files involved**:
- `client/src/components/CommentSubmissionModal.tsx` - Comment form
- `client/src/components/CreatorDashboard.tsx` - Approval interface
- `server/routes.ts` (lines 665-775) - Comment processing
- `server/storage.ts` - Database operations

### 4. **Story Display** (Showing stories to users)

**Flow**: User visits page → Fetch from database → Display with styling

**Files involved**:
- `client/src/pages/story.tsx` - Individual story page
- `client/src/pages/home.tsx` - Story list page
- `client/src/components/StoryCard.tsx` - Story preview cards
- `server/routes.ts` (lines 175-220) - Story data API

### 5. **Action Installation** (Installing the "Weave My Part" button)

**Flow**: User visits install page → Clicks install → Redirected to Warpcast

**Files involved**:
- `client/src/pages/install-action.tsx` - Installation page
- `server/routes.ts` (lines 803-820) - Action metadata

## 🔧 Technical Components

### Database Operations
**File**: `server/storage.ts`
**Purpose**: All database interactions (create, read, update, delete)
**Key functions**:
- `createStory()` - Makes new stories
- `getStories()` - Gets list of stories
- `addStoryComment()` - Adds comments to stories
- `updateStoryLike()` - Handles story likes

### API Endpoints
**File**: `server/routes.ts`
**Purpose**: Handles all incoming requests
**Key sections**:
- Lines 175-300: Story management APIs
- Lines 786-902: Farcaster cast action handler
- Lines 400-500: User and comment APIs

### User Interface Components
**Folder**: `client/src/components/`
**Purpose**: Reusable UI pieces
**Key files**:
- `StoryCard.tsx` - Shows story previews
- `CommentSubmissionModal.tsx` - Comment form popup
- `CreatorDashboard.tsx` - Story management for creators

### Pages
**Folder**: `client/src/pages/`
**Purpose**: Main app screens
**Key files**:
- `home.tsx` - Main story list
- `story.tsx` - Individual story view
- `install-action.tsx` - Action installation
- `about.tsx` - App information

## 🔄 Data Flow Examples

### Example 1: User Creates Story via Cast Action

```
1. User clicks "Weave My Part" on any Farcaster cast
   ↓
2. Farcaster sends request to: server/routes.ts (POST /api/cast-actions/weave-story)
   ↓
3. Server validates user permissions (only FID 977521 can create)
   ↓
4. Server calls: server/storage.ts → createStory()
   ↓
5. Database saves story with cast content as seed
   ↓
6. Server responds with link to new story
   ↓
7. User sees success message and story link
```

### Example 2: User Views Story

```
1. User visits story page: /story/123
   ↓
2. Frontend (client/src/pages/story.tsx) loads
   ↓
3. React Query fetches data from: server/routes.ts (GET /api/stories/123)
   ↓
4. Server calls: server/storage.ts → getStoryById()
   ↓
5. Database returns story data
   ↓
6. Frontend displays story with comments and like button
```

### Example 3: User Adds Comment

```
1. User fills out comment form (CommentSubmissionModal.tsx)
   ↓
2. Form submits to: server/routes.ts (POST /api/stories/123/comments)
   ↓
3. Server checks if user has liked the story (permission system)
   ↓
4. Server calls: server/storage.ts → addStoryComment()
   ↓
5. Comment saved as "pending" status
   ↓
6. Story creator sees comment in CreatorDashboard.tsx
   ↓
7. Creator can approve/decline via server/routes.ts APIs
```

## 🎨 Styling & Design

### Theme System
**File**: `client/src/index.css`
**Purpose**: App-wide colors and styling
**Key features**:
- Farcaster purple brand colors
- Dark/light mode support
- Responsive design for mobile/desktop

### Component Styling
**Folder**: `client/src/components/ui/`
**Purpose**: Reusable styled components
**Examples**: buttons, cards, forms, modals

## 🔐 Security & Permissions

### User Permissions
- **Story Creation**: Only FID 977521 (owner)
- **Comments**: Users who have liked the story
- **Approval**: Story creators only

### Data Validation
**File**: `shared/schema.ts`
**Purpose**: Ensures data is correct format before saving
**Validates**: User info, story content, comment text

## 🌐 External Integrations

### Farcaster SDK
**File**: `client/src/lib/farcaster.ts`
**Purpose**: Official Farcaster integration
**Features**: User authentication, cast actions

### Neynar API
**File**: `client/src/lib/neynar.ts`
**Purpose**: Enhanced Farcaster data
**Features**: User profiles, follower counts, profile pictures

### Database
**Technology**: PostgreSQL via Drizzle ORM
**Configuration**: `drizzle.config.ts`, `shared/schema.ts`
**Purpose**: Permanent data storage

## 📱 User Journey Map

```
New User:
Install Action → Use on Cast → Create Story → Share → Get Comments

Existing User:
Browse Stories → Like Story → Add Comment → Wait for Approval

Story Creator:
Receive Comments → Review in Dashboard → Approve/Decline → Story Updates
```

This structure allows the app to handle collaborative storytelling while maintaining quality through the approval system and integrating seamlessly with Farcaster's social features.