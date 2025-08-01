# Story Weaver - Collaborative Farcaster Storytelling

## Overview

Story Weaver is a collaborative storytelling platform built as a Farcaster Mini App. It allows users to create and contribute to shared stories, with a like-based permission system where users must like a story to unlock writing privileges. The application combines React frontend with Express backend, using PostgreSQL for data persistence and integrating with Farcaster's social features.

## Recent Changes

**January 31, 2025**
- **Cast Action Installation System**: Added proper Cast Action installation endpoint at `/api/cast-actions` for users to install "Weave My Part" action
- **Installation Page**: Created dedicated `/install-action` page with user-friendly installation flow and clear instructions
- **About Page**: Added comprehensive `/about` page explaining Story Weaver workflow and cast action functionality
- **Action Discovery Fix**: Resolved missing cast action buttons by implementing proper Farcaster Action installation format alongside V2 Mini App triggers
- **Farcaster V2 Manifest Compliance**: Fixed manifest to comply with official Farcaster Frames V2/Mini Apps specification
- **Version Format Fix**: Changed from semantic versioning "1.0.1" to spec-compliant version "1"
- **Structure Correction**: Updated manifest from "miniapp" to "frame" with proper "triggers" array format
- **Cast-Based Collaborative Workflow**: Implemented full Farcaster cast integration for native social collaboration
- **Cast Comment System**: Added `cast_comments` table for tracking Farcaster cast comments and approval workflow
- **Native Farcaster Integration**: Stories now use original and weave cast hashes for viral sharing loops
- **Creator Cast Management**: Story creators can approve cast comments and automatically repost as new weave casts
- **Enhanced Database Schema**: Added `originalCastHash`, `latestWeaveCastHash`, and `weaveCastCount` to stories table
- **Cast-Based API Endpoints**: New endpoints for cast comment creation, approval, and weave cast management
- **Farcaster SDK Enhancement**: Integrated cast sharing, cast creation, and user authentication via Mini App SDK
- **Viral Collaboration Loop**: Approved comments become incorporated content and trigger new cast shares
- **Social Permission System**: Maintained like-to-comment requirement with native Farcaster cast interaction
- **Complete Farcaster Actions Integration**: Implemented verified action handler pattern with cast context parsing and weaved cast responses
- **Seed-to-Weave Workflow**: Users trigger Story Weaver action from original "seed" casts, system creates collaborative stories with automatic weaved cast posting
- **Action Handler Route**: Proper /api/cast-actions/weave-story endpoint that processes cast context, creates stories, and returns frame responses for cast posting
- **Owner Approval Architecture**: Built pending weaves system (currently auto-approving for demonstration) with future manual approval workflow support
- **Individual Story Pages**: Added dedicated story pages with routing for better story viewing and sharing experience
- **Cast Action About Page**: Added informational about page explaining Story Weaver workflow for cast action users
- **Story Creation Owner Restriction**: Restored FID restriction with clear ownership message for Story Weaver platform control
- **Rate Limit Fix**: Removed restrictive rate limiting middleware preventing story creation
- **Critical 400 Error Fix**: Previously resolved 400 errors when users click "add to story" button by fixing schema validation
- **Database Migration Complete**: Successfully migrated from in-memory storage (MemStorage) to PostgreSQL database (DatabaseStorage)
- **Full Data Persistence**: All user data, stories, story segments, likes, and comments are now stored persistently in PostgreSQL
- **Sample Data Initialization**: Automated sample data creation with collaborative story "Digital Magic Adventures"
- **Story Creation Restrictions**: Added warp-sharing requirement for new story creation to control content quality
- **Farcaster Deployment Setup**: Added manifest file and app icon for Mini App registration
- **Authentic Farcaster Manifest**: Generated proper accountAssociation signature using FID 977521 private key for domain verification
- **Character Limits**: Set 280-character limit per story contribution (roughly 40-60 words)
- **Production Ready**: Application now supports persistent data storage and authentic Farcaster integration for deployment
- **Promotional Assets**: Added atmospheric promotional image featuring magical storytelling theme for app marketing
- **Manifest Enhancement**: Updated manifest with promotional imagery for splash screens and social sharing
- **Cast Share URL**: Added missing castShareUrl property to Farcaster manifest for proper cast sharing functionality
- **Domain Migration**: Updated all manifest URLs to use worthifyme.in domain with HTTPS for proper Farcaster integration
- **Discovery Optimization**: Explicitly set noindex: false in manifest to ensure Story Weaver is discoverable in Warpcast directory
- **Brand Icon Update**: Replaced generic SVG icon with custom Story Weaver PNG icon featuring collaborative storytelling design elements
- **Account Association Update**: Updated accountAssociation with new authentication credentials for worthifyme.in domain
- **SDK Ready Fix**: Fixed Farcaster SDK initialization to automatically call ready() after setup, preventing splash screen persistence
- **SDK Authentication Update**: Enhanced Farcaster SDK implementation to match official documentation patterns with proper context handling and QuickAuth support
- **Username Validation Fix**: Added fallback username generation to prevent 400 errors when user data is incomplete
- **Manifest Actions Update**: Moved cast actions to proper actions array under miniapp with context: ["cast"] for universal cast action availability

## User Preferences

Preferred communication style: Simple, everyday language.
Farcaster FID: 977521 (authorized for story creation)

## System Architecture

### Full-Stack Monorepo Structure
The application uses a monorepo architecture with three main directories:
- `client/` - React frontend with Vite build system
- `server/` - Express.js backend API
- `shared/` - Common TypeScript types & database schema

This setup allows for shared type definitions between frontend and backend, ensuring type safety across the entire application.

### Tech Stack Selection
- **Frontend**: React 18 with TypeScript, shadcn/ui components, TailwindCSS
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tools**: Vite for frontend, esbuild for backend bundling
- **Deployment**: Single build process that creates both client and server bundles

## Key Components

### Database Schema (Drizzle ORM)
The application uses a relational database design with six main tables:
- `users` - Farcaster user profiles with FID (Farcaster ID) as unique identifier
- `stories` - Main story entries with metadata and creator information
- `storySegments` - Individual contributions to stories, ordered sequentially (incorporated content)
- `storyComments` - User-submitted story parts awaiting creator review and incorporation
- `storyLikes` - Tracks which users have liked which stories (enables commenting privileges)
- `storyLocks` - Manages exclusive writing access with 1-minute maximum duration for creators

This design enables moderated collaborative writing where users submit ideas via comments and creators curate the final story content.

### Frontend Architecture
- **Component Library**: shadcn/ui provides consistent, accessible UI components
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: TailwindCSS with custom Farcaster brand color variables

### Backend API Structure
RESTful API with endpoints for:
- User management (create/update Farcaster users)
- Story operations (get, create, list stories)
- Story segments (add contributions)
- Like system (like/unlike stories for permissions)

### Farcaster Integration
- Mini App SDK integration for user authentication and context
- Neynar API client for enhanced Farcaster data (user profiles, follower counts)
- Meta tags optimized for Farcaster sharing and Mini App discovery

## Data Flow

### User Authentication Flow
1. Farcaster Mini App SDK provides user context (FID, username, display name)
2. Application creates/updates user record in local database
3. Enhanced user data fetched from Neynar API when available
4. User context maintained throughout session for permissions

### Story Interaction Flow
1. User views story and sees current content + contributor list + pending comments
2. To contribute, user must first "like" the story (via Farcaster)
3. Like action grants commenting privileges and opens comment form
4. User submits story part as a comment for creator review
5. Story creator can review comments and incorporate selected ones into the main story
6. Incorporated comments become story segments and are removed from pending comments
7. Real-time updates show new comments and incorporated content

### Permission System
The tiered permission system ensures:
- Only engaged users can comment (must like to contribute ideas)
- Story creators have full editorial control over final content
- Social proof through visible like counts and comment engagement
- Natural content quality filter through creator curation
- Writing locks prevent simultaneous editing conflicts when incorporating comments (1-minute maximum)
- Story creation requires warp sharing to authorized FID for platform quality control

## External Dependencies

### Database Infrastructure
- Uses Neon (PostgreSQL) as the primary database provider
- Drizzle ORM for type-safe database operations and migrations
- Connection pooling and serverless-optimized database access

### Farcaster Ecosystem
- **Farcaster Mini App SDK**: User authentication and social context
- **Neynar API**: Enhanced user data, cast interactions, social graph access
- **Farcaster Protocol**: FID-based user identification, cast hash tracking
- **Mini App Manifest**: Located at `/.well-known/farcaster.json` for app registration
- **App Icon**: SVG icon at `/icon.svg` for Farcaster directory listing

### UI and Styling
- **Radix UI**: Accessible component primitives for complex interactions
- **TailwindCSS**: Utility-first styling with custom design system
- **Lucide Icons**: Consistent iconography throughout the application

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite compiles React app to static assets in `dist/public`
2. **Backend Build**: esbuild bundles Express server to `dist/index.js`
3. **Single Deployment**: Combined build creates deployable Node.js application

### Production Configuration
- Environment variables for database connection and API keys
- Static file serving for frontend through Express in production
- Development mode uses Vite dev server with HMR for rapid iteration

### Database Management
- Drizzle migrations stored in `migrations/` directory
- Schema changes pushed via `npm run db:push` command
- PostgreSQL dialect with UUID primary keys for scalability

The architecture supports both development flexibility and production scalability, with clear separation of concerns while maintaining type safety across the full stack.