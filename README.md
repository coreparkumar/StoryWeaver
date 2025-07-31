# Story Weaver - Collaborative Farcaster Storytelling

A collaborative storytelling platform built as a Farcaster Mini App where users co-create dynamic narratives through interactive story segments.

## Features

- **Like-to-Write System**: Users must like a story before they can contribute
- **Writing Lock Prevention**: 1-minute maximum locks prevent editing conflicts
- **Story Creation Control**: New stories require warp sharing for quality control
- **Real-time Collaboration**: Live updates as users add story segments
- **Farcaster Integration**: Native Mini App with user authentication
- **Character Limits**: 280-character contributions (40-60 words each)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **UI**: shadcn/ui + TailwindCSS
- **Integration**: Farcaster Mini App SDK

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Farcaster account for testing

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/story-weaver.git
cd story-weaver

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and other settings

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=development
```

## Database Schema

- **users**: Farcaster user profiles with FID identification
- **stories**: Main story entries with metadata
- **storySegments**: Individual user contributions
- **storyLikes**: Like tracking for write permissions
- **writingLocks**: Conflict prevention system

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Farcaster Mini App Setup

1. Deploy to your hosting platform
2. Update `client/public/.well-known/farcaster.json` with your domain
3. Register with Farcaster Mini App directory
4. Share your app URL in Farcaster casts

## API Endpoints

- `GET /api/stories` - List all stories
- `GET /api/stories/:id` - Get story details
- `POST /api/stories` - Create new story (requires warp sharing)
- `POST /api/stories/:id/segments` - Add story contribution
- `POST /api/stories/:id/like` - Like/unlike story
- `POST /api/stories/:id/lock` - Acquire writing lock
- `DELETE /api/stories/:id/lock` - Release writing lock

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details