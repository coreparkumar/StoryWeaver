# Story Weaver - Collaborative Farcaster Storytelling

## Overview

Story Weaver is a collaborative storytelling platform built as a Farcaster Mini App. It allows users to create and contribute to shared stories, with a like-based permission system where users must like a story to unlock writing privileges. The application combines React frontend with Express backend, using PostgreSQL for data persistence and integrating with Farcaster's social features.

## User Preferences

Preferred communication style: Simple, everyday language.

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
The application uses a relational database design with four main tables:
- `users` - Farcaster user profiles with FID (Farcaster ID) as unique identifier
- `stories` - Main story entries with metadata and creator information
- `storySegments` - Individual contributions to stories, ordered sequentially
- `storyLikes` - Tracks which users have liked which stories (enables writing privileges)

This design allows for collaborative writing while maintaining proper attribution and permissions.

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
1. User views story and sees current content + contributor list
2. To contribute, user must first "like" the story (via Farcaster)
3. Like action grants writing privileges and opens contribution form
4. New contributions are appended as story segments with proper ordering
5. Real-time updates show new contributions and updated contributor counts

### Permission System
The like-based permission system ensures:
- Only engaged users can contribute (must like to write)
- Social proof through visible like counts
- Natural content quality filter through community engagement

## External Dependencies

### Database Infrastructure
- Uses Neon (PostgreSQL) as the primary database provider
- Drizzle ORM for type-safe database operations and migrations
- Connection pooling and serverless-optimized database access

### Farcaster Ecosystem
- **Farcaster Mini App SDK**: User authentication and social context
- **Neynar API**: Enhanced user data, cast interactions, social graph access
- **Farcaster Protocol**: FID-based user identification, cast hash tracking

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