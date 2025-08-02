# Story Weaver - Function Mapping Guide

This guide shows exactly which files contain which functions, making it easy for non-coders to understand where specific features are implemented.

## 🔍 Quick Function Finder

### User Authentication Functions
| Function | File | Purpose |
|----------|------|---------|
| `initializeSDK()` | `client/src/hooks/use-farcaster.tsx` | Connects to Farcaster |
| `getUserByFid()` | `client/src/lib/neynar.ts` | Gets user details from Neynar |
| `createUser()` | `server/storage.ts` | Saves user to database |
| `POST /api/users` | `server/routes.ts` | API endpoint for user creation |

### Story Creation Functions
| Function | File | Purpose |
|----------|------|---------|
| `createStory()` | `server/storage.ts` | Creates new story in database |
| `POST /api/cast-actions/weave-story` | `server/routes.ts` | Handles "Weave My Part" action |
| `StoryCreationModal` | `client/src/components/StoryCreationModal.tsx` | Manual story creation form |
| `validateCastAction()` | `server/routes.ts` | Validates Farcaster action requests |

### Story Display Functions
| Function | File | Purpose |
|----------|------|---------|
| `getStories()` | `server/storage.ts` | Gets all stories from database |
| `getStoryWithContributors()` | `server/storage.ts` | Gets single story with details |
| `GET /api/stories` | `server/routes.ts` | API endpoint for story list |
| `GET /api/stories/:id` | `server/routes.ts` | API endpoint for single story |
| `StoryCard` | `client/src/components/StoryCard.tsx` | Story preview component |
| `Story Page` | `client/src/pages/story.tsx` | Full story display page |

### Comment System Functions
| Function | File | Purpose |
|----------|------|---------|
| `addStoryComment()` | `server/storage.ts` | Saves comment to database |
| `POST /api/stories/:id/comments` | `server/routes.ts` | API endpoint for adding comments |
| `CommentSubmissionModal` | `client/src/components/CommentSubmissionModal.tsx` | Comment writing form |
| `approveCastComment()` | `server/storage.ts` | Approves pending comment |
| `declineCastComment()` | `server/storage.ts` | Rejects pending comment |
| `CreatorDashboard` | `client/src/components/CreatorDashboard.tsx` | Comment approval interface |

### Like System Functions
| Function | File | Purpose |
|----------|------|---------|
| `createStoryLike()` | `server/storage.ts` | Saves like to database |
| `deleteStoryLike()` | `server/storage.ts` | Removes like from database |
| `hasUserLikedStory()` | `server/storage.ts` | Checks if user liked story |
| `POST /api/stories/:id/like` | `server/routes.ts` | API endpoint for liking |
| `DELETE /api/stories/:id/like` | `server/routes.ts` | API endpoint for unliking |
| `GET /api/stories/:id/user-like` | `server/routes.ts` | API endpoint to check like status |

### Permission System Functions
| Function | File | Purpose |
|----------|------|---------|
| `checkPermissions()` | `server/routes.ts` | Validates user permissions |
| `canCreateStory()` | `server/storage.ts` | Checks if user can create stories |
| `canComment()` | `server/storage.ts` | Checks if user can add comments |
| `useStoryLock()` | `client/src/hooks/use-story-lock.tsx` | Manages writing locks |

## 📂 File-by-File Function List

### `server/routes.ts` - Main API Handler
**Lines 1-50**: Setup and configuration
- `registerRoutes()` - Main function that sets up all endpoints

**Lines 51-150**: Static file serving
- `/story-weaver-promo.jpg` - Serves promotional image
- `/story-weaver-icon.png` - Serves app icon
- `/.well-known/farcaster.json` - Serves Farcaster manifest
- `/api/cast-actions` - Lists available cast actions

**Lines 151-200**: User management
- `POST /api/users` - Create/update user account
- User validation and authentication

**Lines 201-350**: Story management
- `GET /api/stories` - Get all stories
- `GET /api/stories/:id` - Get single story
- `POST /api/stories` - Create new story
- Story validation and processing

**Lines 351-550**: Comment system
- `GET /api/stories/:id/comments` - Get story comments
- `POST /api/stories/:id/comments` - Add new comment
- Comment validation and permission checks

**Lines 551-700**: Like system
- `POST /api/stories/:id/like` - Like a story
- `DELETE /api/stories/:id/like` - Unlike a story
- `GET /api/stories/:id/user-like` - Check like status

**Lines 701-850**: Creator dashboard
- `GET /api/stories/:id/cast-comments/pending` - Get pending comments
- `POST /api/cast-comments/:id/approve` - Approve comment
- `POST /api/cast-comments/:id/decline` - Decline comment

**Lines 851-950**: Farcaster cast actions
- `GET /api/cast-actions/weave-story` - Action metadata
- `POST /api/cast-actions/weave-story` - Action handler
- `OPTIONS /api/cast-actions/weave-story` - CORS preflight

### `server/storage.ts` - Database Operations
**Lines 1-100**: Interface definitions
- `IStorage` - Main storage interface
- Type definitions and contracts

**Lines 101-200**: User operations
- `getUser()` - Find user by ID
- `getUserByFid()` - Find user by Farcaster ID
- `createUser()` - Save new user
- `updateUser()` - Update user details

**Lines 201-350**: Story operations
- `getStory()` - Get single story
- `getStoryWithContributors()` - Get story with full details
- `createStory()` - Create new story
- `updateStory()` - Update story details
- `getAllStories()` - Get all stories
- `getStoryByCastHash()` - Find story by cast hash

**Lines 351-450**: Story segment operations
- `getStorySegments()` - Get story parts
- `createStorySegment()` - Add new story part

**Lines 451-550**: Like operations
- `getStoryLikes()` - Get all story likes
- `createStoryLike()` - Add new like
- `deleteStoryLike()` - Remove like
- `hasUserLikedStory()` - Check like status

**Lines 551-650**: Lock operations
- `acquireLock()` - Get writing permission
- `releaseLock()` - Release writing permission
- `cleanupExpiredLocks()` - Remove old locks

**Lines 651-750**: Comment operations
- `addStoryComment()` - Add pending comment
- `getCastComments()` - Get pending comments
- `approveCastComment()` - Approve comment
- `declineCastComment()` - Reject comment

### `client/src/hooks/use-farcaster.tsx` - User Authentication
**Lines 1-50**: Setup and context
- `FarcasterContext` - Shared user state
- `FarcasterProvider` - Authentication wrapper

**Lines 51-150**: SDK initialization
- `initializeSDK()` - Connect to Farcaster
- `getUserData()` - Fetch user details
- Error handling and fallbacks

**Lines 151-200**: User management
- `ready()` - Mark app as ready
- User state management
- Authentication validation

### `client/src/pages/story.tsx` - Story Display
**Lines 1-50**: Setup and imports
- React hooks and components
- API client setup

**Lines 51-150**: Story loading
- `useQuery` for fetching story data
- Loading and error states
- Permission checking

**Lines 151-250**: Story rendering
- Story content display
- Comment list rendering
- Interactive elements (like button, comment form)

**Lines 251-300**: User interactions
- Comment submission handling
- Like/unlike functionality
- Permission-based UI updates

### `client/src/components/CreatorDashboard.tsx` - Comment Management
**Lines 1-50**: Setup and state management
- React hooks for pending comments
- UI state management

**Lines 51-150**: Comment fetching
- API calls for pending comments
- Real-time updates
- Error handling

**Lines 151-250**: Comment approval interface
- Comment display with approve/decline buttons
- Batch operations
- Status updates

**Lines 251-300**: UI rendering
- Responsive layout
- Action buttons
- Status indicators

## 🔄 Common Workflows and Their Functions

### Workflow 1: User Creates Story via Cast Action
```
1. User clicks "Weave My Part" in Warpcast
   → Farcaster calls: server/routes.ts → POST /api/cast-actions/weave-story
2. Server validates permissions
   → server/routes.ts → checkPermissions()
3. Server creates story
   → server/storage.ts → createStory()
4. Server responds with story link
   → server/routes.ts → response handling
```

### Workflow 2: User Views and Likes Story
```
1. User visits story page
   → client/src/pages/story.tsx → component loads
2. Frontend fetches story data
   → API call to server/routes.ts → GET /api/stories/:id
3. Server retrieves story
   → server/storage.ts → getStoryWithContributors()
4. User clicks like button
   → API call to server/routes.ts → POST /api/stories/:id/like
5. Server saves like
   → server/storage.ts → createStoryLike()
```

### Workflow 3: User Submits Comment
```
1. User opens comment form
   → client/src/components/CommentSubmissionModal.tsx → modal opens
2. User submits comment
   → API call to server/routes.ts → POST /api/stories/:id/comments
3. Server checks permissions
   → server/storage.ts → hasUserLikedStory()
4. Server saves comment as pending
   → server/storage.ts → addStoryComment()
5. Creator sees comment in dashboard
   → client/src/components/CreatorDashboard.tsx → displays pending
```

### Workflow 4: Creator Approves Comment
```
1. Creator views pending comments
   → client/src/components/CreatorDashboard.tsx → loads pending
2. Creator clicks approve
   → API call to server/routes.ts → POST /api/cast-comments/:id/approve
3. Server approves comment
   → server/storage.ts → approveCastComment()
4. Comment becomes part of story
   → server/storage.ts → createStorySegment()
```

This mapping makes it easy to find exactly where any feature is implemented and understand how different parts of the code work together.