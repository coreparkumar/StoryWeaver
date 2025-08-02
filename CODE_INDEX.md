# Story Weaver - Code Index

## Quick Reference Guide

### 🎯 Core Features Location Map

| Feature | Primary File | Supporting Files | Description |
|---------|-------------|------------------|-------------|
| **Cast Actions** | `server/routes.ts:712` | `client/public/.well-known/farcaster.json` | Farcaster action handler for "Weave My Part" |
| **Story Creation** | `server/routes.ts:162` | `shared/schema.ts:26` | Create collaborative stories from casts |
| **Like System** | `server/routes.ts:350` | `client/src/hooks/use-story.tsx` | Permission system - like to unlock commenting |
| **Collaborative Writing** | `server/routes.ts:419` | `client/src/pages/story.tsx` | Comment submission and approval workflow |
| **Farcaster SDK** | `client/src/hooks/use-farcaster.tsx` | `client/index.html:53` | User authentication and cast interactions |
| **Database Schema** | `shared/schema.ts` | `server/db.ts`, `server/storage.ts` | PostgreSQL tables and relationships |
| **Story Segments** | `server/routes.ts:295` | `client/src/pages/story.tsx:120` | Individual story contributions |
| **Writing Locks** | `server/routes.ts:236` | `client/src/hooks/use-story-lock.tsx` | Prevent simultaneous editing |

### 📁 File Structure Overview

```
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and API clients
│   │   ├── pages/            # Route components
│   │   └── App.tsx           # Main app with routing
│   ├── public/               # Static assets
│   └── index.html            # HTML template with Farcaster meta tags
├── server/                   # Express.js backend
│   ├── routes.ts            # All API endpoints
│   ├── storage.ts           # Database operations
│   ├── db.ts               # Database connection
│   └── index.ts            # Server entry point
├── shared/                  # Common types and schema
│   └── schema.ts           # Database schema and types
└── Configuration Files
```

### 🔧 API Endpoints Reference

#### Story Management
- `GET /api/stories` - List all stories
- `GET /api/stories/:id` - Get story with contributors
- `POST /api/stories` - Create new story (owner only)
- `POST /api/stories/:id/segments` - Add story segment

#### User Interactions
- `POST /api/stories/:id/like` - Toggle story like
- `GET /api/stories/:id/like/:userFid` - Check like status
- `POST /api/stories/:id/comments` - Add comment (requires like)
- `POST /api/stories/:id/comments/:commentId/incorporate` - Approve comment

#### Farcaster Integration
- `GET /api/cast-actions` - Cast action installation endpoint
- `POST /api/cast-actions/weave-story` - Cast action handler
- `GET /.well-known/farcaster.json` - Mini app manifest

#### Writing System
- `POST /api/stories/:id/lock` - Acquire writing lock
- `DELETE /api/stories/:id/lock` - Release writing lock
- `GET /api/stories/:id/lock` - Check lock status

### 🎨 UI Components Locations

| Component | File | Purpose |
|-----------|------|---------|
| Story List | `client/src/pages/home.tsx` | Homepage with all stories |
| Story Detail | `client/src/pages/story.tsx` | Individual story view |
| Story Card | `client/src/components/` | Story preview cards |
| Like Button | `client/src/pages/story.tsx:200` | Like/unlike functionality |
| Comment Form | `client/src/pages/story.tsx:250` | Story contribution form |
| Install Action | `client/src/pages/install-action.tsx` | Cast action installation |

### 🔍 Key Functions & Hooks

#### Custom Hooks
- `use-farcaster.tsx` - Farcaster SDK integration and user auth
- `use-story.tsx` - Story data fetching and mutations
- `use-story-lock.tsx` - Writing lock management
- `use-toast.ts` - Toast notifications
- `use-mobile.tsx` - Responsive design detection

#### Database Operations (`server/storage.ts`)
- `createStory()` - Create collaborative story
- `getStoryWithContributors()` - Get story with user data
- `createStoryComment()` - Add pending contribution
- `incorporateComment()` - Approve and add to story
- `acquireLock()` - Manage writing permissions

### 🎯 Business Logic Flow

#### Cast Action Workflow
1. User clicks "Weave My Part" on any Farcaster cast
2. `POST /api/cast-actions/weave-story` receives cast context
3. System creates collaborative story from cast content
4. Returns frame response to post weaved cast back to Farcaster

#### Collaborative Writing Flow
1. User views story on homepage or direct link
2. Must like story to unlock commenting privileges
3. Submits story continuation as comment
4. Story creator approves comments to incorporate into main story
5. Approved content becomes permanent story segment

#### Permission System
- **Story Creation**: Restricted to FID 977521 (owner)
- **Commenting**: Requires liking the story first
- **Incorporation**: Only story creator can approve comments
- **Writing Locks**: Prevent simultaneous editing (1 minute max)

### 🔐 Security & Permissions

#### Authentication
- Farcaster SDK provides user context (FID, username, display name)
- No passwords - leverages Farcaster's social identity
- User data cached in local database for performance

#### Authorization Levels
1. **Platform Owner** (FID 977521): Can create stories
2. **Story Creator**: Can approve comments and incorporate content
3. **Engaged Users** (liked story): Can submit comments
4. **All Users**: Can view stories and like them

### 🚀 Deployment & Configuration

#### Environment Variables
- `DATABASE_URL` - PostgreSQL connection
- `FARCASTER_PRIVATE_KEY` - For cast action signatures
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - DB config

#### Build Process
- Frontend: Vite builds React app to `dist/public`
- Backend: esbuild bundles Express server to `dist/index.js`
- Single deployment serves both frontend and API

#### Farcaster Integration
- Manifest at `/.well-known/farcaster.json` for app registration
- Account association signature for domain verification
- Meta tags in `index.html` for proper cast sharing

### 📊 Database Schema Summary

#### Core Tables
- `users` - Farcaster user profiles (FID as primary key)
- `stories` - Main story entries with creator info
- `storySegments` - Incorporated story content (ordered sequence)
- `storyComments` - Pending contributions awaiting approval
- `storyLikes` - User likes (enables commenting)
- `storyLocks` - Writing permissions (1-minute duration)

#### Relationships
- Stories → Creator (users.fid)
- Segments → Story + Author
- Comments → Story + Author  
- Likes → Story + User
- Locks → Story + User

### 🐛 Common Issues & Solutions

#### Development
- Cast actions only work on HTTPS production domains
- Use `npm run db:push` for schema changes
- SDK ready() call prevents splash screen persistence

#### Production
- Ensure manifest URLs use HTTPS
- Account association must match domain
- POST endpoints work, GET shows React 404 (expected)