# Story Weaver - Troubleshooting Guide

This guide helps resolve common issues you might encounter while using or developing Story Weaver.

## 🚨 Common Issues and Solutions

### 1. Browser Network 404 Errors

**Issue**: Seeing `404` errors for `https://client.farcaster.xyz/v2/cast-action` in browser network tab

**Explanation**: This is a **normal, expected behavior** and not a bug in our application.

**Why this happens**:
- The Farcaster Mini App SDK makes internal network calls to Farcaster services
- Some of these calls may fail due to CORS restrictions in iframe environments
- The SDK handles these failures gracefully with fallback behavior
- Our application continues to work normally

**Status**: ✅ **Not a problem** - Application functions correctly despite these network errors

**Action needed**: None - these errors can be safely ignored

### 2. Cast Action Installation Issues

**Issue**: "Weave My Part" action not appearing in Warpcast

**Possible causes and solutions**:

#### Solution 1: Install Mini App First
1. Install the Story Weaver mini app in Warpcast first
2. Then install the cast action using the install page
3. Cast actions only appear for users who have the mini app installed

#### Solution 2: Check Action Installation
1. Visit `/install-action` page in the app
2. Click "Install" button to add the action to Warpcast
3. Confirm installation in Warpcast when prompted

#### Solution 3: Verify User Permissions
- Only FID 977521 (owner) can create new stories
- Other users need to like existing stories to participate
- Action may appear differently for different permission levels

### 3. Story Creation Permissions

**Issue**: "Permission denied" when trying to create stories

**Explanation**: Story creation is restricted to maintain platform quality.

**Solution**:
- Only the platform owner (FID 977521) can create new story seeds
- Other users can participate by:
  1. Liking existing stories (unlocks commenting)
  2. Adding comments/story parts
  3. Waiting for creator approval

### 4. Comment Submission Issues

**Issue**: Cannot submit comments to stories

**Common causes and solutions**:

#### Solution 1: Like the Story First
- Users must like a story before they can comment
- Click the ❤️ button on the story
- Comment form will become available after liking

#### Solution 2: Check Story Status
- Stories may be closed if they have 10+ comments
- Closed stories don't accept new comments
- Look for "Story Closed" status indicator

#### Solution 3: Network Issues
- Ensure stable internet connection
- Try refreshing the page
- Check if the app is loading properly

### 5. Database Connection Issues

**Issue**: Error messages about database connectivity

**For developers**:
1. Check `DATABASE_URL` environment variable is set
2. Verify PostgreSQL database is running
3. Run `npm run db:push` to sync schema changes
4. Check database logs for connection errors

**For users**:
- This is a backend issue that needs developer attention
- Try refreshing the page after a few minutes
- Contact support if the issue persists

### 6. Farcaster SDK Errors

**Issue**: Console errors about Farcaster SDK initialization

**Common console messages** (these are normal):
- `"Content Security Policy"` errors
- `"Unable to redefine window.ethereum"` warnings
- Network errors to `farcaster.xyz` domains

**Status**: These are expected in iframe environments and don't affect functionality.

**Solutions**:
- No action needed - these are handled gracefully
- App falls back to mock SDK for development
- Real functionality works in actual Farcaster environment

### 7. CORS and CSP Errors

**Issue**: Various Cross-Origin Resource Sharing errors in console

**Explanation**: 
- Farcaster mini apps run in restricted iframe environments
- Some browser APIs are intentionally blocked for security
- Our app is designed to handle these restrictions

**Solutions**:
- No user action required
- Errors are suppressed in production
- Functionality remains intact despite these errors

## 🔧 Developer Debugging

### Enable Debug Logging
1. Open browser developer tools
2. Look for "Cast Action Request Debug" logs
3. Check network tab for actual HTTP requests vs. SDK calls

### Verify Endpoints
```bash
# Test action metadata
curl https://worthifyme.in/api/cast-actions/weave-story

# Test manifest
curl https://worthifyme.in/.well-known/farcaster.json

# Test story API
curl https://worthifyme.in/api/stories
```

### Check Environment Variables
- `DATABASE_URL` - PostgreSQL connection
- `FARCASTER_PRIVATE_KEY` - For advanced features
- All environment variables are properly configured in Replit

## 📞 Getting Help

### For Users
1. Try refreshing the page first
2. Check if you've followed installation steps correctly
3. Verify you have proper permissions for the action you're trying to take

### For Developers
1. Check the console for specific error messages
2. Review the logs in the workflow output
3. Use the comprehensive documentation in `/Documentation/`

### Contact Information
- Technical issues: Review documentation in `/Documentation/`
- Feature requests: Document in project requirements
- Bug reports: Check this troubleshooting guide first

## ✅ Normal vs. Problematic Behavior

### ✅ Normal (Expected) Behavior:
- Console errors about CSP and CORS in iframe environment
- 404 errors to `client.farcaster.xyz` in network tab
- "Unable to redefine window.ethereum" warnings
- SDK fallback to mock mode during development

### ❌ Problematic Behavior:
- App completely fails to load
- Database connection errors preventing basic functionality
- Users unable to install cast actions after following proper steps
- Story creation failing for authorized users (FID 977521)

Remember: Many "errors" in the console are actually expected behavior in the Farcaster iframe environment and don't indicate real problems with the application.