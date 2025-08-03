# Story Weaver - Collaborative Farcaster Storytelling

## Overview
Story Weaver is a collaborative storytelling platform implemented as a Farcaster Mini App. It enables users to co-create stories, leveraging a like-based permission system where liking a story grants writing privileges. The platform integrates a React frontend with an Express backend, utilizing PostgreSQL for data persistence and deeply integrating with Farcaster's social features for a native social collaboration experience. The business vision is to foster creative expression and community engagement within the Farcaster ecosystem, offering a unique social storytelling experience.

## AI Development Prompts Collection
### Core Architecture Prompts
1. **Full-Stack Setup**: "Build a Farcaster Mini App with TypeScript React frontend, Express.js backend, PostgreSQL with Drizzle ORM, and shadcn/ui components. Include proper routing with Wouter and TanStack Query for state management."

2. **Farcaster Integration**: "Integrate Farcaster Mini App SDK for user authentication, implement cast actions with proper metadata endpoints, and add Neynar API integration for enhanced user data."

3. **Database Schema**: "Design a collaborative content system with users, stories, story segments, comments, likes (for permissions), locks (for editing), and cast comments tables with proper relations."

## User Preferences
Preferred communication style: Simple, everyday language.
Farcaster FID: 977521 (authorized for story creation)
Repository access: Private (GitHub repository should be private for code protection)

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
    *   Duplicate prevention system: prevents creating multiple stories from the same cast hash, redirects to existing story with appropriate messaging.
    *   Stories automatically close after 10 comments or can be manually closed by the owner.
    *   A like-to-comment permission system requires users to like a story to unlock writing privileges, promoting engagement.
    *   Writing locks with a 1-minute maximum duration prevent simultaneous editing conflicts.
*   **Frontend Architecture:** Leverages shadcn/ui for consistent UI, TanStack Query for server state, React hooks for local state, Wouter for lightweight routing, and TailwindCSS for styling with custom Farcaster brand colors.
*   **Backend API Structure:** Provides a RESTful API for user management, story operations (get, create, list), story segment addition, and the like system.
*   **Data Flow:**
    *   **User Authentication:** Farcaster Mini App SDK provides user context, which is stored/updated in the local database. Enhanced user data is fetched from Neynar API.
    *   **Story Interaction:** Users like a story to gain commenting privileges. Submitted story parts are tracked as comments for creator review. Approved comments become `storySegments`.
*   **UI/UX:** Uses shadcn/ui for components and TailwindCSS for styling, with custom Farcaster brand color variables. Promotional assets (images, icons) are integrated for marketing and app discovery within Farcaster.

### Feature Implementation Prompts
4. **Cast Actions**: "Create a Farcaster cast action that transforms any cast into collaborative content. Include GET metadata endpoint returning proper JSON with name, icon (valid octicon), description, aboutUrl, and action type. Add POST handler for action execution with frame responses."

5. **Permission System**: "Implement a like-based permission system where users must like content to unlock contribution privileges. Track permissions in database and enforce in UI/API."

6. **Collaborative Editing**: "Build a writing lock system to prevent simultaneous editing conflicts. Include 1-minute timeouts, lock acquisition/release, and UI indicators."

7. **Content Moderation**: "Create admin dashboard for content creators to approve/decline user submissions. Include pending state management and automatic story closure after defined limits."

### Technical Infrastructure Prompts
8. **CORS & Security**: "Configure proper CORS headers for Farcaster iframe environment, handle CSP violations gracefully, and suppress expected browser console errors from restricted APIs."

9. **Real-time Updates**: "Implement WebSocket connections for live collaboration features, ensuring proper connection management and error handling."

10. **Error Handling**: "Add comprehensive error boundaries, API error handling, and user-friendly error messages throughout the application."

### Deployment & Production Prompts
11. **Farcaster Manifest**: "Create proper Farcaster mini app manifest with correct metadata, splash screens, and action configurations for app directory listing."

12. **Production Optimization**: "Optimize for Replit deployment with proper environment variables, database connections, and caching strategies."

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

## Code Documentation

The codebase includes comprehensive documentation for non-technical users:

*   **Documentation/CODE_STRUCTURE.md**: Explains the overall architecture and which files handle which features
*   **Documentation/API_REFERENCE.md**: Documents all API endpoints and data flows in simple terms
*   **Documentation/FUNCTION_MAPPING.md**: Shows exactly which functions are in which files for easy code navigation
*   **Documentation/test-action.md**: Contains testing information for the Farcaster cast action
*   **Documentation/GITHUB_PRIVACY_GUIDE.md**: Instructions for making the GitHub repository private
*   **Documentation/TROUBLESHOOTING.md**: Common issues and solutions, including expected browser errors

These documents help stakeholders understand the technical implementation without requiring coding knowledge.

### Recent Implementation Updates

**August 3, 2025 - Cast Action Handler & Frontend Display Fixes Complete**
- **Cast Action Handler Fixed**: Resolved 500 Internal Server Error with proper error handling for Neynar API failures
  - Added graceful fallback when Neynar API returns 403 Forbidden during development
  - Cast actions now return proper 200 responses with correct JSON format
  - Action manifest URLs dynamically use current Replit domain for development
  - All story links in responses use encrypted IDs for security
- **Frontend User Display Enhancement**: Replaced FID displays with "@worthify" branding
  - Updated all username fallbacks to show "@worthify" instead of numeric FID values
  - Applied to story cards, cast dashboard, comments sections, and contributor lists
  - Maintains consistent branding when user data is unavailable
- **Reply Detection System**: Enhanced cast action to automatically detect replies to story seed casts
  - System identifies parent cast hash and links replies to correct stories for approval
  - Automatic user creation with Neynar API integration and fallback handling
  - Contributions appear in dashboard's "Cast Stories" section for owner review

**August 3, 2025 - Reply Detection & URL Encryption System Complete**
- **Cast Reply Detection**: Enhanced cast action handler to automatically detect replies to story seed casts
  - When users reply to a story seed cast and select "Weave My Part", their contribution is saved to cast_comments table
  - System identifies parent cast hash and links reply to the correct story for owner approval
  - Automatic user creation for new contributors with Neynar API integration
  - Proper approval workflow where replies appear in dashboard for owner review
- **URL Encryption System**: Implemented comprehensive URL encryption for security
  - Added URLEncryption utility class with encrypt/decrypt methods for story IDs
  - All story links now use encrypted IDs for enhanced security and obfuscation
  - Backend routes support both plain and encrypted IDs for backward compatibility
  - Base64URL encoding provides URL-safe encrypted story links
- **Farcaster Integration Enhancements**: 
  - Fixed Farcaster posting for dashboard-created stories with character limit handling
  - Story snippets automatically generated when content exceeds 320 character limit
  - Smart truncation preserves story title and adds continuation link
  - Encrypted story URLs in all Farcaster posts for security

**August 3, 2025 - Public Story Creation & Cast Validation System Complete**
- **Public Story Creation Interface**: Added full-featured story creation component for all authenticated Farcaster users
  - Character limits: 100 for titles, 500 for content with real-time counters
  - Form validation, submission handling, and user-friendly error messages
  - Share and notification buttons for user engagement
  - Comprehensive help text explaining collaborative workflow
- **Cast Validation System**: Implemented comprehensive validation for deleted Farcaster seed casts
  - Server-side Neynar API integration for cast verification
  - Real-time cast status checking (active/deleted/error states)
  - CastValidationAlert component with contextual warnings and explanations
  - Cast status display in both story pages and admin dashboard
  - API endpoint `/api/validate-cast/:hash` for cast verification
- **Authorization Improvements**: Enhanced owner/co-owner system with scalable permission management
  - Prepared miniapp_owners table structure for future co-owner functionality
  - Centralized authorization checks throughout the application
- **User Experience Enhancements**: 
  - Clear messaging about cast deletion impacts on story accessibility
  - Proper error handling for API limitations and network issues
  - Professional UI components for validation alerts and status indicators

**August 2, 2025 - Cast Stories Dashboard & Database Documentation Complete**
- Created comprehensive "Stories from Cast Actions" tabular dashboard with professional table layout
- Added action buttons to close, approve, and remove each story with confirmation dialogs  
- Implemented cast stories API endpoints with proper owner authentication (FID 977521)
- Dashboard displays cast hash, comment count, status, creation time, and management actions
- Fixed database cleanup script to properly clear all data while preserving user profiles
- Added comprehensive database documentation including schema, dictionary, and technical reports
- Enhanced cast action workflow: non-owner users can now contribute to existing stories via "Weave My Part" action
- System now captures cast details from user actions and stores them in database for dashboard review
- Both story_comments and cast_comments tables populate with pending contributions awaiting approval