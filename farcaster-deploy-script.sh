#!/bin/bash
# Story Weaver Farcaster Deployment Script
# Run this after getting your deployed URL

echo "🚀 Story Weaver Farcaster Deployment Setup"
echo "==========================================="

# Get deployed URL from user
read -p "Enter your deployed URL (e.g., https://yourapp.replit.app): " DEPLOYED_URL

# Remove trailing slash if present
DEPLOYED_URL=${DEPLOYED_URL%/}

echo "Updating configuration files..."

# Update Farcaster manifest
sed -i "s|https://your-app-name.replit.app|$DEPLOYED_URL|g" client/public/.well-known/farcaster.json

# Update robots.txt
sed -i "s|https://your-app-name.replit.app|$DEPLOYED_URL|g" client/public/robots.txt

echo "✅ Configuration updated!"
echo ""
echo "Next steps:"
echo "1. Test your manifest: $DEPLOYED_URL/.well-known/farcaster.json"
echo "2. Generate Farcaster signature for your domain"
echo "3. Update signature in farcaster.json"
echo "4. Create your first story"
echo "5. Share on Farcaster!"
echo ""
echo "Sample launch cast:"
echo "🧙‍♂️ Story Weaver is LIVE! Collaborative storytelling where the community writes together. Like to unlock writing! $DEPLOYED_URL #Farcaster #Storytelling"