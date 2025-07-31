# GitHub Deployment Guide

## Step-by-Step GitHub Deployment

### 1. Create GitHub Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit your code
git commit -m "Initial commit: Story Weaver collaborative storytelling app"

# Add your GitHub repository as origin
git remote add origin https://github.com/yourusername/story-weaver.git

# Push to GitHub
git push -u origin main
```

### 2. Set Up Environment Variables

For your hosting platform, you'll need these environment variables:

```env
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
AUTHORIZED_CREATOR_FID=your_farcaster_fid
```

### 3. Deployment Options

#### Option A: Vercel (Recommended for Farcaster)
1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

#### Option B: Railway
1. Connect GitHub repo to Railway
2. Add PostgreSQL addon
3. Set environment variables
4. Deploy

#### Option C: Render
1. Connect GitHub repo to Render
2. Create PostgreSQL database
3. Set environment variables
4. Deploy

### 4. Database Setup

After deployment, run database migrations:

```bash
npm run db:push
```

### 5. Farcaster Mini App Registration

1. Update `client/public/.well-known/farcaster.json` with your production URL
2. Replace placeholder values with real domain and signatures
3. Submit to Farcaster Mini App directory

### 6. Testing Your Deployment

1. Visit your deployed URL
2. Test Farcaster authentication
3. Create a test story
4. Verify like-to-write system works
5. Test writing locks and story contributions

## GitHub Actions

The included workflow will:
- ✅ Run tests on every push
- ✅ Build the application
- ✅ Deploy on successful builds to main branch

Configure your deployment secrets in GitHub Settings > Secrets:
- `DATABASE_URL`
- `VERCEL_TOKEN` (if using Vercel)
- `RAILWAY_TOKEN` (if using Railway)
- `RENDER_API_KEY` (if using Render)

## Monitoring

After deployment, monitor:
- Database connections and performance
- API response times
- Farcaster integration health
- User engagement metrics

## Troubleshooting

**Common Issues:**
1. Database connection errors - Check DATABASE_URL
2. Farcaster auth failures - Verify manifest file
3. Build failures - Check Node.js version compatibility
4. CORS issues - Configure proper origins for production