# Complete Farcaster Mini App Setup Guide

## Prerequisites
- Your deployed app URL (after clicking Deploy above)
- Your Farcaster account with FID 977521
- Warpcast app on your phone

## Step 1: Update Domain References

After deployment, replace `your-app-name.replit.app` with your actual URL in:

### File: `client/public/.well-known/farcaster.json`
```json
{
  "accountAssociation": {
    "header": "eyJmaWQiOjk3NzUyMSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDEyMyJ9",
    "payload": "eyJkb21haW4iOiJZT1VSX0FDVFVBTF9ET01BSU4uY29tIn0",
    "signature": "UPDATE_AFTER_DOMAIN_SETUP"
  },
  "miniApp": {
    "name": "Story Weaver",
    "description": "Collaborative storytelling where users co-create dynamic narratives",
    "icon": "https://YOUR_ACTUAL_DOMAIN.com/icon.svg",
    "url": "https://YOUR_ACTUAL_DOMAIN.com",
    "backgroundColor": "#8a63d2",
    "splashBackgroundColor": "#8a63d2"
  }
}
```

## Step 2: Generate Account Association Signature

### Option A: Using Warpcast Developer Tools
1. Open Warpcast app on your phone
2. Go to Settings > Advanced > Developer Settings
3. Select "Sign Account Association"
4. Enter your domain: `yourdomain.replit.app`
5. Copy the generated signature

### Option B: Using Farcaster Frames CLI
```bash
# Install Farcaster CLI (if you have Node.js)
npx @farcaster/frames
# Follow prompts to generate signature for your domain
```

### Option C: Manual Generation (Advanced)
1. Create message: `{"domain": "yourdomain.replit.app"}`
2. Base64 encode it for payload
3. Sign with your Farcaster private key
4. Format as hex signature

## Step 3: Test Your Manifest

Visit: `https://yourdomain.replit.app/.well-known/farcaster.json`

Should return valid JSON with your signature.

## Step 4: Register Your Mini App

### Method 1: Direct Farcaster Integration
1. Create a cast with your app URL
2. Include frame meta tags (already in your HTML)
3. Share in Farcaster to test

### Method 2: Farcaster Directory Submission
1. Go to Farcaster's Mini App directory
2. Submit your app URL and details
3. Wait for approval (usually 1-3 days)

## Step 5: Create Your First Story

1. Open your deployed app
2. As FID 977521, you can create new stories
3. Create an engaging story starter like:
   - "A mysterious package arrives at your door..."
   - "In the year 2050, AI discovers..."
   - "The last human on Earth finds..."

## Step 6: Share on Farcaster

### Sample Launch Cast:
```
🧙‍♂️ Story Weaver is LIVE! 

A new collaborative storytelling app where the community writes together.

How it works:
✨ Like a story to unlock writing
📝 Add your part (280 chars)
🔒 Writing locks prevent conflicts

Start writing: https://yourstoryweaver.replit.app

#Farcaster #Storytelling #MiniApp
```

## Step 7: Monitor and Engage

- Watch for users liking and contributing
- Respond to early adopters
- Share interesting story developments
- Create new story threads regularly

## Troubleshooting

### App Won't Load in Farcaster
- Check manifest JSON is valid
- Verify all URLs use HTTPS
- Test signature authentication

### Users Can't Write
- Ensure they liked the story first
- Check if writing lock is properly released
- Verify rate limiting isn't too strict

### No New Stories Appearing
- Only your FID (977521) can create stories
- Share warps to enable others (if desired)
- Create stories regularly to keep engagement

## Success Metrics to Track

- Story likes and contributions
- User retention (return contributors)
- Story completion rates
- Community engagement in casts

Your Story Weaver is ready for the Farcaster community!