# Deployment Security Guidelines

## Files to Keep Private

### Never Commit to Public Repositories

1. **Farcaster Manifest with Real Credentials**
   - `client/public/.well-known/farcaster.json` - Contains real accountAssociation signature
   - Use `farcaster.json.example` for reference instead

2. **Private Keys and Authentication**
   - `generate-accountAssociation.*` - Account association generation scripts
   - `farcaster-deploy-script.sh` - Deployment scripts with credentials
   - Any files containing `FARCASTER_PRIVATE_KEY`

3. **Environment Variables**
   - `.env` files with real database credentials
   - Production `DATABASE_URL` connections
   - API keys and secrets

## Safe for Public Sharing

### Configuration Examples
- `farcaster.json.example` - Template with placeholder values
- `package.json` - Dependencies and scripts (no secrets)
- `components.json` - UI component configuration
- `tailwind.config.ts` - Styling configuration
- `tsconfig.json` - TypeScript configuration

### Source Code
- All `client/src/` files - React components and logic
- All `server/` files - API routes and business logic (no hardcoded secrets)
- All `shared/` files - Common types and schemas
- `Documentation/` folder - All documentation files

## Gitignore Protection

The `.gitignore` file includes:
```
# Sensitive configuration files
client/public/.well-known/farcaster.json

# Private keys and secrets
*.key
*.pem
generate-accountAssociation.*
farcaster-deploy-script.sh
```

## Pre-Deployment Checklist

### Before Deploying to Production
1. ✅ Generate real `accountAssociation` using your Farcaster private key
2. ✅ Update domain URLs in manifest from localhost to production domain
3. ✅ Set environment variables on production platform
4. ✅ Verify `.gitignore` excludes sensitive files

### Before Sharing Code Publicly
1. ✅ Confirm no real credentials in any committed files
2. ✅ Use example/template files for sensitive configurations
3. ✅ Remove any hardcoded API keys or private information
4. ✅ Test that the application works with example configurations

## Account Association Security

### What is accountAssociation?
The `accountAssociation` in the Farcaster manifest proves domain ownership by signing a message with your Farcaster private key. This signature:
- Links your Farcaster identity (FID) to your domain
- Enables cast actions and mini app functionality
- Should be unique per domain and FID combination

### Security Implications
- **Private Key**: Never expose your Farcaster private key
- **Signature**: The accountAssociation signature is domain-specific and safe to use
- **Regeneration**: Generate new signatures for different domains/environments

## Environment Variable Security

### Production Environment
```bash
# Required for database connectivity
DATABASE_URL=postgresql://user:pass@host:5432/db
PGHOST=your-db-host
PGPORT=5432
PGUSER=your-db-user
PGPASSWORD=your-db-password
PGDATABASE=your-db-name

# Required for Farcaster integration
FARCASTER_PRIVATE_KEY=0x...your-ed25519-private-key
```

### Development Environment
- Use local database or development credentials
- Generate separate accountAssociation for development domains
- Never use production secrets in development

## Best Practices

1. **Separate Environments**: Use different Farcaster keys/signatures for dev vs prod
2. **Version Control**: Never commit real secrets to any repository
3. **Access Control**: Limit who has access to production credentials
4. **Regular Rotation**: Periodically rotate API keys and credentials
5. **Monitoring**: Monitor for any exposed credentials in public repositories

## Recovery Procedures

### If Credentials Are Accidentally Exposed
1. **Immediate**: Revoke/rotate the exposed credentials
2. **Clean History**: Remove from git history if committed
3. **Generate New**: Create new keys/signatures for affected services
4. **Update Systems**: Deploy with new credentials
5. **Monitor**: Watch for any unauthorized usage of old credentials