# Story Weaver - Collaborative Farcaster Storytelling

## Overview
Story Weaver is a collaborative storytelling platform implemented as a Farcaster Mini App. It enables users to co-create stories, leveraging a like-based permission system where liking a story grants writing privileges. The platform integrates a React frontend with an Express backend, utilizing PostgreSQL for data persistence and deeply integrating with Farcaster's social features for a native social collaboration experience. The business vision is to foster creative expression and community engagement within the Farcaster ecosystem, offering a unique social storytelling experience.

## User Preferences
Preferred communication style: Simple, everyday language.
Farcaster FID: 977521 (authorized for story creation)

## System Architecture
The application uses a full-stack monorepo structure with `client/` (React, Vite), `server/` (Express.js), and `shared/` (common TypeScript types) directories, enabling type safety across the entire application.

**Tech Stack:**
- **Frontend**: React 18, TypeScript, shadcn/ui, TailwindCSS
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tools**: Vite (frontend), esbuild (backend)

**Key Components & Design Decisions:**

*   **Database Schema (Drizzle ORM):** A relational design with `users`, `stories`, `storySegments` (incorporated content), `storyComments` (pending content), `storyLikes` (permission tracking), and `storyLocks` (writing access management). This supports a moderated collaborative writing workflow where creators curate content from user submissions.
*   **Farcaster Integration:**
    *   Deep integration for native social collaboration, including a `cast_comments` table for tracking Farcaster cast comments and an approval workflow.
    *   Stories utilize `originalCastHash` and `latestWeaveCastHash` for viral sharing loops.
    *   Creator-managed cast comments: story creators can approve cast comments and automatically repost them as new weave casts.
    *   Farcaster Mini App SDK for user authentication and context.
    *   Full Farcaster Actions integration with a `weave-story` action handler for processing cast context, creating stories, and returning frame responses.
    *   Owner (FID 977521) restriction for new story creation, ensuring platform quality control.
    *   Stories automatically close after 10 comments or can be manually closed by the owner.
    *   A like-to-comment permission system requires users to like a story to unlock writing privileges, promoting engagement.
    *   Writing locks with a 1-minute maximum duration prevent simultaneous editing conflicts.
*   **Frontend Architecture:** Leverages shadcn/ui for consistent UI, TanStack Query for server state, React hooks for local state, Wouter for lightweight routing, and TailwindCSS for styling with custom Farcaster brand colors.
*   **Backend API Structure:** Provides a RESTful API for user management, story operations (get, create, list), story segment addition, and the like system.
*   **Data Flow:**
    *   **User Authentication:** Farcaster Mini App SDK provides user context, which is stored/updated in the local database. Enhanced user data is fetched from Neynar API.
    *   **Story Interaction:** Users like a story to gain commenting privileges. Submitted story parts are tracked as comments for creator review. Approved comments become `storySegments`.
*   **UI/UX:** Uses shadcn/ui for components and TailwindCSS for styling, with custom Farcaster brand color variables. Promotional assets (images, icons) are integrated for marketing and app discovery within Farcaster.

## External Dependencies

*   **Database Infrastructure:**
    *   Neon (PostgreSQL) as the primary database provider.
    *   Drizzle ORM for type-safe database operations and migrations.
*   **Farcaster Ecosystem:**
    *   Farcaster Mini App SDK for user authentication and social context.
    *   Neynar API for enhanced user data, cast interactions, and social graph access.
    *   Farcaster Protocol for FID-based user identification and cast hash tracking.
    *   Mini App Manifest located at `/.well-known/farcaster.json` for app registration.
    *   App Icon (`/icon.svg`) for Farcaster directory listing.
*   **UI and Styling:**
    *   Radix UI for accessible component primitives.
    *   TailwindCSS for utility-first styling.
    *   Lucide Icons for consistent iconography.