# Story Weaver Database Dictionary

## Complete Data Dictionary Report

This document provides a comprehensive dictionary of all database tables, columns, relationships, and business rules for the Story Weaver collaborative storytelling platform.

## Database Summary

| Metric | Value |
|--------|--------|
| Total Tables | 6 |
| Primary Tables | 2 (users, stories) |
| Relationship Tables | 4 (segments, comments, likes, locks) |
| Integration Tables | 1 (cast_comments) |
| Total Columns | 63 |
| Foreign Key Relationships | 8 |
| Unique Constraints | 6 |

---

## Table: users
**Primary Purpose**: Farcaster user authentication and profile management

### Column Details

| # | Column | Data Type | Null | Default | Constraints | Description |
|---|--------|-----------|------|---------|-------------|-------------|
| 1 | id | varchar | NO | gen_random_uuid() | PRIMARY KEY | System-generated unique identifier |
| 2 | fid | integer | NO | - | UNIQUE, NOT NULL | Farcaster ID (primary auth) |
| 3 | username | text | NO | - | NOT NULL | Farcaster username handle |
| 4 | display_name | text | NO | - | NOT NULL | User's chosen display name |
| 5 | pfp_url | text | YES | NULL | - | Profile picture image URL |
| 6 | follower_count | integer | YES | 0 | - | Farcaster follower count |

### Business Rules
- **Authentication**: FID serves as primary authentication mechanism
- **Profile Sync**: Data synchronized from Farcaster/Neynar API
- **Uniqueness**: Each FID corresponds to exactly one user record
- **Required Fields**: username and display_name must be provided

### Usage Patterns
- Created/updated on first platform interaction
- Referenced by all user-generated content
- Profile data refreshed periodically

---

## Table: stories
**Primary Purpose**: Main collaborative story entries with complete lifecycle management

### Column Details

| # | Column | Data Type | Null | Default | Constraints | Description |
|---|--------|-----------|------|---------|-------------|-------------|
| 1 | id | varchar | NO | gen_random_uuid() | PRIMARY KEY | Unique story identifier |
| 2 | creator_fid | integer | NO | - | NOT NULL | Story creator's FID |
| 3 | title | text | NO | - | NOT NULL | Story title/headline |
| 4 | initial_content | text | NO | - | NOT NULL | Original seed content |
| 5 | final_content | text | YES | NULL | - | Compiled complete story |
| 6 | original_cast_hash | text | YES | NULL | - | Originating Farcaster cast |
| 7 | latest_weave_cast_hash | text | YES | NULL | - | Most recent weave cast |
| 8 | final_cast_hash | text | YES | NULL | - | Final story publication cast |
| 9 | session_status | text | NO | 'active' | NOT NULL | Story collaboration status |
| 10 | like_count | integer | YES | 0 | - | Total likes received |
| 11 | recast_count | integer | YES | 0 | - | Total recasts/shares |
| 12 | contributor_count | integer | YES | 1 | - | Number of contributors |
| 13 | max_contributions | integer | YES | 10 | - | Auto-close threshold |
| 14 | weave_cast_count | integer | YES | 0 | - | Published weave casts |
| 15 | comment_count | integer | YES | 0 | - | Approved comments |
| 16 | closed_by | text | YES | NULL | - | Closure method indicator |
| 17 | ended_at | timestamp | YES | NULL | - | Story completion time |
| 18 | created_at | timestamp | YES | CURRENT_TIMESTAMP | - | Creation timestamp |
| 19 | updated_at | timestamp | YES | CURRENT_TIMESTAMP | - | Last modification time |

### Status Values
- **session_status**: 'active' | 'closed'
- **closed_by**: 'auto' | 'manual'

### Business Rules
- **Creator Restriction**: Only FID 977521 can create stories
- **Auto-Closure**: Stories close at max_contributions limit
- **Cast Integration**: original_cast_hash links to Farcaster posts
- **Content Evolution**: initial_content → segments → final_content

### Calculated Fields
- contributor_count: Derived from approved segments
- comment_count: Approved story_comments count
- weave_cast_count: Published integration casts

---

## Table: story_segments
**Primary Purpose**: Approved story content pieces in chronological sequence

### Column Details

| # | Column | Data Type | Null | Default | Constraints | Description |
|---|--------|-----------|------|---------|-------------|-------------|
| 1 | id | varchar | NO | gen_random_uuid() | PRIMARY KEY | Unique segment identifier |
| 2 | story_id | varchar | NO | - | FK → stories.id | Parent story reference |
| 3 | author_fid | integer | NO | - | NOT NULL | Segment author's FID |
| 4 | content | text | NO | - | NOT NULL | Approved story content |
| 5 | order_index | integer | NO | - | NOT NULL | Sequential ordering |
| 6 | created_at | timestamp | YES | CURRENT_TIMESTAMP | - | Approval timestamp |

### Business Rules
- **Approval Required**: Only created from approved story_comments
- **Immutable**: Cannot be modified once created
- **Sequential**: order_index determines story flow
- **Attribution**: author_fid preserves contributor credit

### Relationships
- **Parent**: story_id → stories.id (REQUIRED)
- **Author**: author_fid → users.fid (IMPLIED)

---

## Table: story_comments
**Primary Purpose**: User-submitted content awaiting creator approval

### Column Details

| # | Column | Data Type | Null | Default | Constraints | Description |
|---|--------|-----------|------|---------|-------------|-------------|
| 1 | id | varchar | NO | gen_random_uuid() | PRIMARY KEY | Unique comment identifier |
| 2 | story_id | varchar | NO | - | FK → stories.id | Parent story reference |
| 3 | author_fid | integer | NO | - | NOT NULL | Comment author's FID |
| 4 | content | text | NO | - | NOT NULL | Proposed story content |
| 5 | approval_status | text | NO | 'pending' | NOT NULL | Moderation status |
| 6 | is_incorporated | boolean | YES | false | - | Inclusion flag |
| 7 | incorporated_at | timestamp | YES | NULL | - | Approval timestamp |
| 8 | incorporated_by_fid | integer | YES | NULL | - | Approving creator FID |
| 9 | cast_hash | text | YES | NULL | - | Associated cast reference |
| 10 | shared_cast_hash | text | YES | NULL | - | User sharing cast |
| 11 | notification_sent | boolean | YES | false | - | Notification status |
| 12 | created_at | timestamp | YES | CURRENT_TIMESTAMP | - | Submission timestamp |

### Status Values
- **approval_status**: 'pending' | 'approved' | 'declined'

### Business Rules
- **Permission Required**: User must have liked story to comment
- **Creator Approval**: Only story creator can approve/decline
- **State Transition**: pending → approved/declined (one-way)
- **Incorporation**: Approved comments become story_segments

### Workflow
1. User submits comment (pending status)
2. Creator reviews in dashboard
3. Creator approves → becomes story_segment
4. Creator declines → remains as declined record

---

## Table: story_likes
**Primary Purpose**: Permission tracking for story participation

### Column Details

| # | Column | Data Type | Null | Default | Constraints | Description |
|---|--------|-----------|------|---------|-------------|-------------|
| 1 | id | varchar | NO | gen_random_uuid() | PRIMARY KEY | Unique like identifier |
| 2 | story_id | varchar | NO | - | FK → stories.id | Target story reference |
| 3 | user_fid | integer | NO | - | NOT NULL | Liking user's FID |
| 4 | cast_hash | text | YES | NULL | - | Associated cast hash |
| 5 | created_at | timestamp | YES | CURRENT_TIMESTAMP | - | Like timestamp |

### Business Rules
- **Permission Grant**: Required for commenting access
- **One Per User**: Single like per user per story
- **Permanent**: Cannot be revoked once given
- **Prerequisite**: Must exist before comment submission

### Relationships
- **Target**: story_id → stories.id (REQUIRED)
- **User**: user_fid → users.fid (IMPLIED)

---

## Table: story_locks
**Primary Purpose**: Collaborative editing conflict prevention

### Column Details

| # | Column | Data Type | Null | Default | Constraints | Description |
|---|--------|-----------|------|---------|-------------|-------------|
| 1 | id | varchar | NO | gen_random_uuid() | PRIMARY KEY | Unique lock identifier |
| 2 | story_id | varchar | NO | - | UNIQUE, FK → stories.id | Target story (unique) |
| 3 | locked_by_fid | integer | NO | - | NOT NULL | Lock holder's FID |
| 4 | locked_at | timestamp | YES | CURRENT_TIMESTAMP | - | Lock acquisition time |
| 5 | expires_at | timestamp | NO | - | NOT NULL | Lock expiration time |

### Business Rules
- **Exclusive Access**: One lock per story maximum
- **Time Limited**: Maximum 1-minute duration
- **Auto-Cleanup**: Expired locks removed automatically
- **Conflict Prevention**: Prevents simultaneous edits

### Lock Lifecycle
1. User acquires lock for editing
2. Lock expires after 1 minute
3. System automatically removes expired locks
4. Other users wait for lock release

---

## Table: cast_comments
**Primary Purpose**: Farcaster cast-based collaboration workflow

### Column Details

| # | Column | Data Type | Null | Default | Constraints | Description |
|---|--------|-----------|------|---------|-------------|-------------|
| 1 | id | varchar | NO | gen_random_uuid() | PRIMARY KEY | Unique comment identifier |
| 2 | story_id | varchar | NO | - | FK → stories.id | Parent story reference |
| 3 | comment_cast_hash | text | NO | - | UNIQUE, NOT NULL | Cast comment hash |
| 4 | author_fid | integer | NO | - | NOT NULL | Comment author's FID |
| 5 | content | text | NO | - | NOT NULL | Cast comment content |
| 6 | approval_status | text | NO | 'pending' | NOT NULL | Moderation status |
| 7 | incorporated_at | timestamp | YES | NULL | - | Approval timestamp |
| 8 | incorporated_in_cast_hash | text | YES | NULL | - | Weave cast reference |
| 9 | created_at | timestamp | YES | CURRENT_TIMESTAMP | - | Comment timestamp |

### Status Values
- **approval_status**: 'pending' | 'approved' | 'declined'

### Business Rules
- **Cast Integration**: Links Farcaster cast system
- **Unique Casts**: Each cast hash appears once
- **Creator Workflow**: Approval creates weave casts
- **Native Experience**: Seamless Farcaster integration

---

## Relationships Summary

### Primary Relationships

| Child Table | Parent Table | Relationship | Constraint |
|-------------|--------------|--------------|------------|
| story_segments | stories | 1:N | story_id → stories.id |
| story_comments | stories | 1:N | story_id → stories.id |
| story_likes | stories | 1:N | story_id → stories.id |
| story_locks | stories | 1:1 | story_id → stories.id (UNIQUE) |
| cast_comments | stories | 1:N | story_id → stories.id |

### Implied Relationships

| Table | User Reference | Purpose |
|-------|----------------|---------|
| stories | creator_fid | Story ownership |
| story_segments | author_fid | Content attribution |
| story_comments | author_fid | Comment attribution |
| story_likes | user_fid | Permission tracking |
| story_locks | locked_by_fid | Lock ownership |
| cast_comments | author_fid | Cast attribution |

## Data Constraints

### Unique Constraints
1. `users.fid` - One record per Farcaster user
2. `story_locks.story_id` - One active lock per story
3. `cast_comments.comment_cast_hash` - One record per cast

### Check Constraints (Business Logic)
1. `stories.max_contributions` ≥ 1
2. `story_segments.order_index` ≥ 0
3. `story_locks.expires_at` > `locked_at`
4. `stories.session_status` IN ('active', 'closed')

### Default Values
- All `id` fields: `gen_random_uuid()`
- All `created_at` fields: `CURRENT_TIMESTAMP`
- Counters default to 0
- Boolean flags default to `false`
- Status fields have defined defaults

## Query Performance Considerations

### High-Volume Queries
1. **Story retrieval**: stories + segments + comments JOINs
2. **Permission checks**: story_likes lookups by user_fid
3. **Dashboard data**: pending comments by story_id
4. **Cleanup operations**: expired locks removal

### Recommended Indexes
```sql
-- User lookup
CREATE INDEX idx_users_fid ON users(fid);

-- Story queries  
CREATE INDEX idx_stories_creator_fid ON stories(creator_fid);
CREATE INDEX idx_stories_status ON stories(session_status);
CREATE INDEX idx_stories_cast_hash ON stories(original_cast_hash);

-- Comments and moderation
CREATE INDEX idx_story_comments_story_approval ON story_comments(story_id, approval_status);
CREATE INDEX idx_cast_comments_story_approval ON cast_comments(story_id, approval_status);

-- Permission system
CREATE INDEX idx_story_likes_story_user ON story_likes(story_id, user_fid);

-- Content ordering
CREATE INDEX idx_story_segments_story_order ON story_segments(story_id, order_index);
```

## Business Intelligence Queries

### Key Metrics
- Active stories count
- Total user engagement
- Average story length
- Approval rates
- Collaboration patterns

### Analytical Views
- Creator dashboard summaries  
- User participation metrics
- Story lifecycle analytics
- Farcaster integration statistics

This dictionary serves as the authoritative reference for all database structure, relationships, and business logic within the Story Weaver platform.