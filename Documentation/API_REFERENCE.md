# Story Weaver - API Reference

This document explains all the API endpoints and what they do, written in simple terms.

## 📡 API Endpoints Overview

All API endpoints start with `/api/` and are handled in `server/routes.ts`

## 🏠 Story Management APIs

### Get All Stories
- **URL**: `GET /api/stories`
- **Purpose**: Get list of all stories for the home page
- **Who can use**: Anyone
- **Returns**: Array of story summaries
- **Code location**: `server/routes.ts` lines 175-185

### Get Single Story
- **URL**: `GET /api/stories/:id`
- **Purpose**: Get full details of one specific story
- **Who can use**: Anyone
- **Returns**: Complete story with all segments
- **Code location**: `server/routes.ts` lines 187-200

### Create New Story
- **URL**: `POST /api/stories`
- **Purpose**: Create a new story (used internally by cast action)
- **Who can use**: System only (not directly by users)
- **Code location**: `server/routes.ts` lines 202-220

## 👥 User Management APIs

### Create/Update User
- **URL**: `POST /api/users`
- **Purpose**: Save user info when they log in
- **Who can use**: Authenticated users
- **Returns**: User profile data
- **Code location**: `server/routes.ts` lines 150-173

## 💬 Comment System APIs

### Get Story Comments
- **URL**: `GET /api/stories/:id/comments`
- **Purpose**: Get approved comments (story parts) for a story
- **Who can use**: Anyone
- **Returns**: Array of story segments
- **Code location**: `server/routes.ts` lines 590-600

### Add Comment to Story
- **URL**: `POST /api/stories/:id/comments`
- **Purpose**: Submit a new comment/story part
- **Who can use**: Users who have liked the story
- **Returns**: Saved comment
- **Code location**: `server/routes.ts` lines 602-620

### Get Pending Comments (Creator Dashboard)
- **URL**: `GET /api/stories/:id/cast-comments/pending`
- **Purpose**: Get comments waiting for approval
- **Who can use**: Story creators
- **Returns**: Array of pending comments
- **Code location**: `server/routes.ts` lines 738-744

### Approve Comment
- **URL**: `POST /api/cast-comments/:id/approve`
- **Purpose**: Approve a comment and add it to the story
- **Who can use**: Story creators
- **Returns**: Updated comment
- **Code location**: `server/routes.ts` lines 746-759

### Decline Comment
- **URL**: `POST /api/cast-comments/:id/decline`
- **Purpose**: Reject a comment
- **Who can use**: Story creators
- **Returns**: Success message
- **Code location**: `server/routes.ts` lines 761-774

## ❤️ Like System APIs

### Add Like to Story
- **URL**: `POST /api/stories/:id/like`
- **Purpose**: Like a story (unlocks commenting)
- **Who can use**: Authenticated users
- **Returns**: Like confirmation
- **Code location**: `server/routes.ts` lines 622-640

### Remove Like from Story
- **URL**: `DELETE /api/stories/:id/like`
- **Purpose**: Unlike a story
- **Who can use**: Users who have liked the story
- **Returns**: Success message
- **Code location**: `server/routes.ts` lines 642-660

### Check User's Like Status
- **URL**: `GET /api/stories/:id/user-like`
- **Purpose**: Check if current user has liked this story
- **Who can use**: Authenticated users
- **Returns**: Like status (true/false)
- **Code location**: `server/routes.ts` lines 662-675

## 🎭 Farcaster Cast Action APIs

### Get Action Metadata
- **URL**: `GET /api/cast-actions/weave-story`
- **Purpose**: Tell Farcaster clients about our action
- **Who can use**: Farcaster clients (Warpcast, etc.)
- **Returns**: Action button info
- **Code location**: `server/routes.ts` lines 803-820

### Handle Cast Action
- **URL**: `POST /api/cast-actions/weave-story`
- **Purpose**: Process when user clicks "Weave My Part" button
- **Who can use**: Farcaster clients with signed messages
- **Returns**: Frame response with story link
- **Code location**: `server/routes.ts` lines 828-902

### CORS Preflight for Cast Actions
- **URL**: `OPTIONS /api/cast-actions/weave-story`
- **Purpose**: Handle browser CORS checks
- **Who can use**: Browsers automatically
- **Returns**: CORS headers
- **Code location**: `server/routes.ts` lines 792-800

## 🖼️ Media & Asset APIs

### Image Proxy
- **URL**: `GET /api/proxy/image?url=<image_url>`
- **Purpose**: Load external images without CORS issues
- **Who can use**: Frontend components
- **Returns**: Proxied image
- **Code location**: `server/routes.ts` lines 78-123

### Story Weaver Promotional Image
- **URL**: `GET /story-weaver-promo.jpg`
- **Purpose**: Serve app promotional image
- **Who can use**: Anyone (public asset)
- **Code location**: `server/routes.ts` lines 14-24

### Story Weaver Icon
- **URL**: `GET /story-weaver-icon.png`
- **Purpose**: Serve app icon
- **Who can use**: Anyone (public asset)
- **Code location**: `server/routes.ts` lines 26-36

## 📋 Configuration APIs

### Farcaster Manifest
- **URL**: `GET /.well-known/farcaster.json`
- **Purpose**: Tell Farcaster about our mini app
- **Who can use**: Farcaster system
- **Returns**: App configuration
- **Code location**: `server/routes.ts` lines 38-73

### Cast Action Installation Info
- **URL**: `GET /api/cast-actions`
- **Purpose**: Provide action installation details
- **Who can use**: Anyone
- **Returns**: Action list
- **Code location**: `server/routes.ts` lines 125-147

## 🔄 Data Flow Examples

### Story Creation Flow
```
1. User clicks "Weave My Part" in Warpcast
2. Farcaster → POST /api/cast-actions/weave-story
3. Server validates user (must be FID 977521)
4. Server calls storage.createStory()
5. Database saves new story
6. Server returns frame response with story URL
7. Farcaster shows success message to user
```

### Comment Submission Flow
```
1. User writes comment in app
2. Frontend → POST /api/stories/123/comments
3. Server checks if user liked story
4. Server saves comment as "pending"
5. Server returns success
6. Creator sees comment in dashboard
7. Creator → POST /api/cast-comments/456/approve
8. Comment becomes part of story
```

### Permission System Flow
```
1. User tries to comment
2. Frontend → GET /api/stories/123/user-like
3. Server checks database for user's like
4. If no like: Show "like first" message
5. If has like: Allow comment submission
6. Server validates permission on every comment API call
```

## 🛡️ Security & Validation

### Authentication
- Users authenticated via Farcaster SDK
- User data stored in database on first login
- FID (Farcaster ID) used as primary identifier

### Permissions
- **Story Creation**: Only FID 977521
- **Comments**: Users who liked the story
- **Approvals**: Story creators only

### Data Validation
- All inputs validated using Zod schemas
- SQL injection prevented by Drizzle ORM
- CORS configured for Farcaster iframe environment

### Rate Limiting
- General rate limit: Applied to all routes
- Contribution rate limit: Applied to comment APIs
- Code location: `server/middleware/rate-limiter.ts`

## 🔧 Error Handling

### Standard Error Responses
```json
{
  "error": "Human readable error message",
  "details": "Technical details (development only)"
}
```

### Common HTTP Status Codes
- **200**: Success
- **400**: Bad request (invalid data)
- **401**: Unauthorized (not logged in)
- **403**: Forbidden (no permission)
- **404**: Not found (story/comment doesn't exist)
- **429**: Too many requests (rate limited)
- **500**: Server error

### Debug Information
- Development mode includes detailed error info
- Production mode shows minimal error details
- All errors logged on server for debugging

This API structure supports the collaborative storytelling workflow while maintaining security and providing a smooth user experience.