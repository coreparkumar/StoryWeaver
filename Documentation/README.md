# 🧙‍♂️ Story Weaver - Collaborative Farcaster Storytelling

Transform any Farcaster cast into magical collaborative stories with the power of community-driven narrative creation.

## Quick Start

### Try Story Weaver
1. **Install Cast Action**: Visit [worthifyme.in/install-action](https://worthifyme.in/install-action)
2. **Use "Weave My Part"**: Click the action on any cast in Farcaster
3. **Collaborate**: Like stories to unlock commenting, contribute to narratives
4. **Watch Magic**: Stories grow through community collaboration

### Development Setup
```bash
# Install dependencies
npm install

# Set up database
npm run db:push

# Start development server
npm run dev
```

## 🌟 Features

### Cast Actions Integration
- **Universal Action**: "Weave My Part" appears on every cast in Farcaster
- **Instant Stories**: Transform any cast into a collaborative story seed
- **Viral Loop**: Weaved stories post back to Farcaster with engagement links

### Collaborative Writing System
- **Like to Unlock**: Social proof system - like stories to gain commenting privileges
- **Creator Control**: Story creators curate final content by approving comments
- **Order Preservation**: Comments become story segments in approved sequence
- **Writing Locks**: Prevent editing conflicts with 1-minute exclusive access

### Farcaster Native
- **SDK Integration**: Seamless user authentication via Farcaster identity
- **Cast Sharing**: Direct posting back to the protocol
- **Social Features**: Follower counts, profile pictures, verified usernames
- **Mini App Manifest**: Proper Farcaster app registration and discoverability

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Express.js + TypeScript + Drizzle ORM
- **Database**: PostgreSQL with UUID primary keys
- **Deployment**: Single Node.js app serving both frontend and API

### Key Components
```
├── Cast Action Handler    # Transform casts → stories
├── Permission System      # Like-based commenting access
├── Collaborative Engine   # Comment approval → story segments
├── Writing Locks         # Prevent editing conflicts
├── Farcaster SDK         # Authentication & social features
└── Viral Sharing         # Post weaved casts back to protocol
```

## 📊 Database Schema

### Core Tables
- **users**: Farcaster profiles (FID as primary key)
- **stories**: Collaborative story entries with metadata
- **storySegments**: Approved story content (ordered sequence)
- **storyComments**: Pending contributions awaiting creator approval
- **storyLikes**: Permission system - enables commenting
- **storyLocks**: Writing access management (1-minute duration)

### Relationships
```
Stories → Creator (User)
Stories → Segments (ordered content)
Stories → Comments (pending approval)
Stories → Likes (permission grants)
Stories → Locks (writing access)
```

## 🔐 Security & Permissions

### Authentication
- **Farcaster SDK**: Cryptographic proof of identity
- **No Passwords**: Leverages existing Farcaster accounts
- **FID Primary**: Farcaster ID as user identifier

### Authorization Levels
1. **Platform Owner** (FID 977521): Create new stories
2. **Story Creator**: Approve comments, incorporate content
3. **Engaged Users** (liked story): Submit story comments
4. **All Users**: View stories, like for access

## 🚀 API Reference

### Story Management
```
GET  /api/stories              # List all stories
GET  /api/stories/:id          # Get story with contributors
POST /api/stories              # Create story (owner only)
POST /api/stories/:id/segments # Add story segment
```

### User Interactions
```
POST /api/stories/:id/like                    # Toggle like (grants permissions)
POST /api/stories/:id/comments                # Submit comment (requires like)
POST /api/stories/:id/comments/:id/incorporate # Approve comment (creator only)
```

### Farcaster Integration
```
GET  /api/cast-actions                   # Action installation endpoint
POST /api/cast-actions/weave-story       # Cast action handler
GET  /.well-known/farcaster.json        # Mini app manifest
```

### Writing System
```
POST   /api/stories/:id/lock    # Acquire writing lock
DELETE /api/stories/:id/lock    # Release writing lock
GET    /api/stories/:id/lock    # Check lock status
```

## 🌐 Deployment

### Environment Variables
```bash
DATABASE_URL=postgresql://...      # PostgreSQL connection
FARCASTER_PRIVATE_KEY=0x...       # Cast action signatures
PORT=5000                         # Server port (default)
```

### Build Process
```bash
npm run build    # Builds both frontend and backend
npm start        # Production server
```

### Farcaster Setup
1. **Domain Verification**: `accountAssociation` signature in manifest
2. **HTTPS Required**: Cast actions only work on deployed domains
3. **Meta Tags**: Proper social sharing configuration

## 📁 File Structure

```
story-weaver/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities & API clients
│   │   ├── pages/            # Route components
│   │   └── App.tsx           # Main app with routing
│   └── public/               # Static assets & manifest
├── server/                   # Express backend
│   ├── routes.ts            # All API endpoints
│   ├── storage.ts           # Database operations
│   ├── db.ts               # Database connection
│   └── index.ts            # Server entry point
├── shared/                  # Common types & schema
│   └── schema.ts           # Database schema & types
└── Documentation/
    ├── README.md                 # This file - project overview
    ├── CODE_INDEX.md            # Feature location map  
    ├── FEATURE_DOCUMENTATION.md # Deep dive implementation guides
    ├── RESOURCES.md             # Assets, images, and external resources index
    └── DEPLOYMENT_SECURITY.md   # Security guidelines for public sharing
```

## 🔍 Find Features Quickly

Use the [CODE_INDEX.md](Documentation/CODE_INDEX.md) for a comprehensive feature location map, or the [FEATURE_DOCUMENTATION.md](Documentation/FEATURE_DOCUMENTATION.md) for detailed implementation guides.

### Common Locations
- **Cast Actions**: `server/routes.ts:714`
- **Like System**: `server/routes.ts:350`
- **Farcaster SDK**: `client/src/hooks/use-farcaster.tsx`
- **Story Pages**: `client/src/pages/story.tsx`
- **Database Schema**: `shared/schema.ts`

## 🤝 Contributing

### Development Workflow
1. **Local Development**: `npm run dev` (cast actions won't work on localhost)
2. **Database Changes**: `npm run db:push` (no manual migrations)
3. **Type Safety**: Shared schema ensures frontend/backend consistency
4. **Testing**: Deploy to HTTPS domain for full cast action testing

### Key Principles
- **Social First**: Leverage Farcaster's social graph and engagement
- **Creator Control**: Story creators curate final content quality
- **Viral Loops**: Every interaction creates opportunities for growth
- **Type Safety**: Comprehensive TypeScript across the full stack

## 📈 Metrics & Analytics

### Key Performance Indicators
- **Cast Action Usage**: How often users trigger "Weave My Part"
- **Story Completion**: Stories that receive ongoing engagement
- **Viral Coefficient**: Weaved casts generating new story seeds
- **Community Health**: Like-to-comment conversion rates

## 🎯 Roadmap

### Near Term
- [ ] Creator dashboard for comment management
- [ ] Story templates and guided creation
- [ ] Enhanced analytics and insights
- [ ] Community moderation tools

### Future Vision
- [ ] Real-time collaborative editing
- [ ] AI-assisted story suggestions
- [ ] Cross-platform story sharing
- [ ] Monetization and creator rewards

---

Built with ❤️ for the Farcaster community. Transform your casts into collaborative stories at [worthifyme.in](https://worthifyme.in)