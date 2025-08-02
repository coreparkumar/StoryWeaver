# Story Weaver Database Schema Documentation

## Overview

The Story Weaver database is built on PostgreSQL using Drizzle ORM for type-safe database operations. The schema supports collaborative storytelling with Farcaster integration, featuring user management, story creation, comment approval workflows, and social interactions.

## Database Architecture

### Core Principles
- **Collaborative Workflow**: Stories are created by owners and enhanced through community contributions
- **Permission System**: Like-based access control for commenting privileges  
- **Moderation**: Creator approval required for all story contributions
- **Farcaster Integration**: Native support for cast actions and social features
- **Data Integrity**: Foreign key relationships ensure referential integrity

## Table Relationships

```
users (FID-based authentication)
  ↓ (one-to-many)
stories (collaborative story entries)
  ↓ (one-to-many)
  ├── story_segments (approved content pieces)
  ├── story_comments (pending contributions)
  ├── story_likes (permission tracking)
  ├── story_locks (editing conflict prevention)
  └── cast_comments (Farcaster cast-based workflow)
```

## Table Definitions

### users
**Purpose**: Stores Farcaster user profiles and authentication data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR | PRIMARY KEY, DEFAULT uuid | Unique user identifier |
| fid | INTEGER | NOT NULL, UNIQUE | Farcaster ID (primary authentication) |
| username | TEXT | NOT NULL | Farcaster username |
| display_name | TEXT | NOT NULL | User's display name |
| pfp_url | TEXT | NULLABLE | Profile picture URL |
| follower_count | INTEGER | DEFAULT 0 | Farcaster follower count |

**Business Rules**:
- FID is the primary authentication mechanism
- Users are created/updated when they interact with the platform
- Profile data synced from Farcaster/Neynar API

### stories
**Purpose**: Main collaborative story entries with metadata and lifecycle management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR | PRIMARY KEY, DEFAULT uuid | Unique story identifier |
| creator_fid | INTEGER | NOT NULL | FID of story creator |
| title | TEXT | NOT NULL | Story title |
| initial_content | TEXT | NOT NULL | Original story seed content |
| final_content | TEXT | NULLABLE | Compiled final story |
| original_cast_hash | TEXT | NULLABLE | Hash of originating Farcaster cast |
| latest_weave_cast_hash | TEXT | NULLABLE | Most recent weave cast hash |
| final_cast_hash | TEXT | NULLABLE | Final story cast hash |
| session_status | TEXT | DEFAULT 'active' | 'active' or 'closed' |
| like_count | INTEGER | DEFAULT 0 | Number of likes received |
| recast_count | INTEGER | DEFAULT 0 | Number of recasts |
| contributor_count | INTEGER | DEFAULT 1 | Number of contributors |
| max_contributions | INTEGER | DEFAULT 10 | Auto-close threshold |
| weave_cast_count | INTEGER | DEFAULT 0 | Number of weave casts posted |
| comment_count | INTEGER | DEFAULT 0 | Approved comments count |
| closed_by | TEXT | NULLABLE | 'auto' or 'manual' closure |
| ended_at | TIMESTAMP | NULLABLE | Story closure timestamp |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Business Rules**:
- Only FID 977521 (Story Weaver owner) can create new stories
- Stories auto-close after reaching max_contributions
- Stories created from cast actions populate original_cast_hash

### story_segments
**Purpose**: Approved story content pieces in chronological order

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR | PRIMARY KEY, DEFAULT uuid | Unique segment identifier |
| story_id | VARCHAR | NOT NULL, FK to stories.id | Parent story reference |
| author_fid | INTEGER | NOT NULL | FID of segment author |
| content | TEXT | NOT NULL | Approved story content |
| order_index | INTEGER | NOT NULL | Chronological ordering |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Approval timestamp |

**Business Rules**:
- Only approved comments become segments
- order_index determines story flow
- Immutable once created

### story_comments
**Purpose**: Pending user contributions awaiting creator approval

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR | PRIMARY KEY, DEFAULT uuid | Unique comment identifier |
| story_id | VARCHAR | NOT NULL, FK to stories.id | Parent story reference |
| author_fid | INTEGER | NOT NULL | FID of comment author |
| content | TEXT | NOT NULL | Proposed story content |
| approval_status | TEXT | DEFAULT 'pending' | 'pending', 'approved', 'declined' |
| is_incorporated | BOOLEAN | DEFAULT false | Whether included in story |
| incorporated_at | TIMESTAMP | NULLABLE | Incorporation timestamp |
| incorporated_by_fid | INTEGER | NULLABLE | FID of approving creator |
| cast_hash | TEXT | NULLABLE | Associated cast hash |
| shared_cast_hash | TEXT | NULLABLE | Sharing cast hash |
| notification_sent | BOOLEAN | DEFAULT false | Notification status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Submission timestamp |

**Business Rules**:
- Users must like story to submit comments
- Creator approval required for incorporation
- Approved comments become story_segments

### story_likes
**Purpose**: User likes that enable commenting permissions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR | PRIMARY KEY, DEFAULT uuid | Unique like identifier |
| story_id | VARCHAR | NOT NULL, FK to stories.id | Parent story reference |
| user_fid | INTEGER | NOT NULL | FID of liking user |
| cast_hash | TEXT | NULLABLE | Associated cast hash |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Like timestamp |

**Business Rules**:
- Required for commenting permissions
- One like per user per story
- Cannot be revoked once granted

### story_locks
**Purpose**: Prevents simultaneous editing conflicts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR | PRIMARY KEY, DEFAULT uuid | Unique lock identifier |
| story_id | VARCHAR | NOT NULL, UNIQUE, FK to stories.id | Parent story reference |
| locked_by_fid | INTEGER | NOT NULL | FID of locking user |
| locked_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Lock acquisition time |
| expires_at | TIMESTAMP | NOT NULL | Lock expiration time |

**Business Rules**:
- Maximum 1-minute lock duration
- Only one lock per story
- Automatic cleanup of expired locks

### cast_comments
**Purpose**: Farcaster cast-based collaboration workflow

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR | PRIMARY KEY, DEFAULT uuid | Unique comment identifier |
| story_id | VARCHAR | NOT NULL, FK to stories.id | Parent story reference |
| comment_cast_hash | TEXT | NOT NULL, UNIQUE | Hash of comment cast |
| author_fid | INTEGER | NOT NULL | FID of comment author |
| content | TEXT | NOT NULL | Cast comment content |
| approval_status | TEXT | DEFAULT 'pending' | 'pending', 'approved', 'declined' |
| incorporated_at | TIMESTAMP | NULLABLE | Incorporation timestamp |
| incorporated_in_cast_hash | TEXT | NULLABLE | Weave cast hash |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Comment timestamp |

**Business Rules**:
- Tracks Farcaster cast comments
- Creator approval workflow
- Links to weave casts when approved

## Data Dictionary

### Data Types Used

| Type | Description | Usage |
|------|-------------|-------|
| VARCHAR | Variable-length character string | IDs, hashes, status values |
| TEXT | Unlimited text | Content fields, descriptions |
| INTEGER | 32-bit signed integer | Counts, FIDs, indices |
| BOOLEAN | True/false value | Flags, status indicators |
| TIMESTAMP | Date and time | Creation/update timestamps |

### Key Patterns

1. **UUID Primary Keys**: All tables use UUID primary keys for scalability
2. **FID References**: Farcaster IDs used for user relationships
3. **Timestamp Tracking**: created_at/updated_at for audit trails
4. **Status Enums**: Controlled vocabulary for status fields
5. **Hash Storage**: Farcaster cast hashes for content linkage

## Indexes and Performance

### Recommended Indexes

```sql
-- Performance optimization indexes
CREATE INDEX idx_stories_creator_fid ON stories(creator_fid);
CREATE INDEX idx_stories_original_cast_hash ON stories(original_cast_hash);
CREATE INDEX idx_stories_session_status ON stories(session_status);
CREATE INDEX idx_story_comments_story_id ON story_comments(story_id);
CREATE INDEX idx_story_comments_approval_status ON story_comments(approval_status);
CREATE INDEX idx_story_likes_story_id ON story_likes(story_id);
CREATE INDEX idx_story_likes_user_fid ON story_likes(user_fid);
CREATE INDEX idx_users_fid ON users(fid);
```

### Query Patterns

1. **Story Retrieval**: Frequent joins between stories and related tables
2. **Permission Checks**: Like verification for commenting access
3. **Dashboard Queries**: Pending comments and cast stories for creators
4. **Cleanup Operations**: Expired lock removal and story lifecycle

## Business Logic Constraints

### Access Control
- Story creation restricted to FID 977521
- Comment submission requires story likes
- Only creators can approve/decline contributions

### Content Lifecycle
1. Story created with initial content
2. Users like story to unlock commenting
3. Users submit comments (pending status)
4. Creator approves/declines comments
5. Approved comments become segments
6. Story auto-closes at contribution limit

### Data Integrity
- Cascade deletes for story relationships
- Unique constraints on critical fields
- Default values for optional fields
- Timestamp tracking for audit trails

## Maintenance and Cleanup

### Automated Cleanup
- Expired story locks removed automatically
- Old pending comments archived after story closure
- Notification flags reset on story completion

### Manual Administration
- Story deletion removes all related data
- User profile updates sync with Farcaster
- Database statistics updated for performance

## Security Considerations

1. **Authentication**: FID-based with Farcaster verification
2. **Authorization**: Role-based access control
3. **Data Validation**: Input sanitization and type checking
4. **Audit Trail**: Complete timestamp tracking
5. **Privacy**: User data synchronized with Farcaster permissions

## Migration Strategy

The database uses Drizzle ORM's schema push functionality:
```bash
npm run db:push
```

This approach:
- Automatically detects schema changes
- Applies migrations without manual SQL
- Maintains data integrity during updates
- Supports development and production environments