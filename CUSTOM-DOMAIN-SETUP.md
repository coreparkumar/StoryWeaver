# Custom Domain Setup Guide

## Step 1: Deploy Your App

First, deploy your Story Weaver app on Replit by clicking the "Deploy" button. This gives you a `.replit.app` domain.

## Step 2: Configure Custom Domain in Replit

1. Go to your Replit project
2. Navigate to "Deployments" tab
3. Click on your active deployment
4. Find "Custom Domains" section
5. Add your custom domain (e.g., `storyteller.com`)
6. Replit will provide DNS configuration instructions

## Step 3: DNS Configuration

At your domain registrar (GoDaddy, Namecheap, etc.), add these DNS records:

```
Type: CNAME
Name: www
Value: your-app-name.replit.app

Type: A  
Name: @
Value: [IP provided by Replit]
```

## Step 4: Update App Configuration

After domain is active, update these files with your new domain:

### Update Farcaster Manifest
File: `client/public/.well-known/farcaster.json`
- Replace `your-app-name.replit.app` with `yourdomain.com`

### Update Meta Tags
File: `client/index.html`
- Update Open Graph URLs
- Update canonical URLs

## Step 5: SSL Certificate

Replit automatically handles SSL certificates for custom domains. Your site will be accessible via HTTPS.

## Step 6: Test Your Setup

1. Visit `https://yourdomain.com`
2. Test Farcaster integration
3. Verify `https://yourdomain.com/.well-known/farcaster.json` loads properly
4. Test story creation and contribution features

## Troubleshooting

**Domain not working?**
- DNS changes can take 24-48 hours to propagate
- Verify DNS records are correct
- Check Replit deployment status

**Farcaster integration broken?**
- Ensure manifest file has correct domain
- Generate new signature for production domain
- Test manifest URL directly

**SSL issues?**
- Replit handles SSL automatically
- Allow time for certificate generation
- Contact Replit support if persistent issues

Your Story Weaver app will be accessible at your custom domain once setup is complete!