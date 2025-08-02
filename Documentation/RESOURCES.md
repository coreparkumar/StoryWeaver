# Story Weaver - Resources & Assets Index

## Images & Visual Assets

### App Icons & Branding
| Asset | Location | Public URL | Usage | Dimensions |
|-------|----------|------------|--------|------------|
| **Story Weaver Icon** | `client/public/story-weaver-icon.png` | `https://worthifyme.in/story-weaver-icon.png` | App icon, manifest iconUrl | PNG |
| **Promotional Image** | `client/public/story-weaver-promo.jpg` | `https://worthifyme.in/story-weaver-promo.jpg` | Social sharing, splash screen | 1200x630 |
| **SVG Icon** | `client/public/icon.svg` | `https://worthifyme.in/icon.svg` | Alternative vector icon | SVG format |

### Development Assets (attached_assets/)
| Asset | Location | Usage |
|-------|----------|-------|
| **Original Icon Design** | `attached_assets/StoryWeaver-Icon_1754057236771.png` | Source material for app icon |
| **Final Promotional** | `attached_assets/story-weaver-final_1754021633899.jpg` | Source for promotional image |
| **Requirements Doc** | `attached_assets/StoryWeaverPrompts (1)_1754042661019.docx` | Project requirements |

### Referenced in Code
```typescript
// Farcaster Manifest (client/public/.well-known/farcaster.json)
"iconUrl": "https://worthifyme.in/story-weaver-icon.png"
"imageUrl": "https://worthifyme.in/story-weaver-promo.jpg" 
"splashImageUrl": "https://worthifyme.in/story-weaver-promo.jpg"

// HTML Meta Tags (client/index.html)
<meta name="fc:miniapp" content='{"imageUrl":"https://worthifyme.in/story-weaver-promo.jpg"...}' />
<meta property="og:image" content="https://worthifyme.in/story-weaver-promo.jpg" />
<meta name="twitter:image" content="https://worthifyme.in/story-weaver-promo.jpg" />
```

## External Resources & APIs

### Farcaster Integration
| Resource | URL | Usage | Authentication |
|----------|-----|-------|----------------|
| **Farcaster SDK** | `https://cdn.jsdelivr.net/npm/@farcaster/miniapp-sdk/dist/index.min.js` | Mini App SDK integration | None required |
| **Neynar API** | `https://api.neynar.com/` | Enhanced user data, cast details | API key via environment |
| **Farcaster Protocol** | Various endpoints | Cast actions, user verification | Private key signing |

### UI Libraries & Frameworks
| Resource | CDN/Import | Usage | Version |
|----------|------------|--------|---------|
| **Inter Font** | `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap` | Primary typography | Google Fonts |
| **Font Awesome** | `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css` | Icon system | 6.4.0 |
| **Lucide React** | NPM package | React icons | Latest |
| **Radix UI** | NPM packages | Component primitives | Latest |

## Development Tools

### Build Assets (Generated)
| Asset | Build Location | Production URL | Source |
|-------|----------------|---------------|---------|
| **Main JS Bundle** | `dist/public/assets/index-[hash].js` | `https://worthifyme.in/assets/index-[hash].js` | Vite build |
| **Main CSS Bundle** | `dist/public/assets/index-[hash].css` | `https://worthifyme.in/assets/index-[hash].css` | Vite build |
| **Promotional Image** | `dist/public/assets/story-weaver-promo-[hash].jpg` | `https://worthifyme.in/assets/story-weaver-promo-[hash].jpg` | Asset optimization |

### Configuration Files
| File | Purpose | Contains |
|------|---------|----------|
| `client/public/.well-known/farcaster.json` | Farcaster app manifest | Account association, actions, triggers |
| `client/public/actions.json` | Cast actions definition | Action metadata for installation |
| `components.json` | shadcn/ui configuration | Component library settings |
| `tailwind.config.ts` | Styling configuration | Custom colors, theme settings |

## Documentation Structure

### Documentation Files
| File | Location | Purpose |
|------|----------|---------|
| **Main README** | `Documentation/README.md` | Project overview, quick start |
| **Code Index** | `Documentation/CODE_INDEX.md` | Feature location map |
| **Implementation Guide** | `Documentation/FEATURE_DOCUMENTATION.md` | Deep dive technical docs |
| **Resource Index** | `Documentation/RESOURCES.md` | This file - assets & resources |
| **Project Context** | `replit.md` | Project history, user preferences |

### Code Documentation
```
server/
├── routes.ts          # API endpoints with JSDoc comments
├── storage.ts         # Database operations
├── db.ts             # Database connection
└── index.ts          # Server entry point

client/src/
├── hooks/
│   └── use-farcaster.tsx    # SDK integration (documented)
├── components/              # UI components
├── pages/                   # Route components
└── lib/                     # Utilities & clients

shared/
└── schema.ts               # Database schema (documented)
```

## Environment Resources

### Required Environment Variables
| Variable | Purpose | Example | Source |
|----------|---------|---------|--------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` | Neon/PostgreSQL provider |
| `FARCASTER_PRIVATE_KEY` | Cast action signing | `0x123abc...` | Generated Ed25519 key |
| `PGHOST` | Database host | `ep-cool-breeze-123.us-east-1.aws.neon.tech` | Auto-provided |
| `PGPORT` | Database port | `5432` | Auto-provided |
| `PGUSER` | Database user | `neondb_owner` | Auto-provided |
| `PGPASSWORD` | Database password | `secretpassword` | Auto-provided |
| `PGDATABASE` | Database name | `neondb` | Auto-provided |

### Domain & Deployment
| Resource | URL | Purpose |
|----------|-----|---------|
| **Production App** | `https://worthifyme.in/` | Main application |
| **Cast Action Installation** | `https://worthifyme.in/api/cast-actions` | Manual action installation |
| **Farcaster Manifest** | `https://worthifyme.in/.well-known/farcaster.json` | App registration |
| **About Page** | `https://worthifyme.in/about` | Cast action information |
| **Action Installation UI** | `https://worthifyme.in/install-action` | User-friendly installation |

## Asset Usage Guidelines

### Image Optimization
- **Icons**: PNG format for transparency support
- **Promotional**: JPG format for smaller file size
- **Dimensions**: Follow Farcaster specifications (1200x630 for og:image)
- **Compression**: Optimize for web without quality loss

### URL Patterns
```
Static Assets:    https://worthifyme.in/[filename]
Built Assets:     https://worthifyme.in/assets/[filename]-[hash].[ext]
API Endpoints:    https://worthifyme.in/api/[endpoint]
Special Files:    https://worthifyme.in/.well-known/[filename]
```

### Adding New Assets
1. **Static Files**: Place in `client/public/`
2. **Imported Assets**: Place in `client/src/assets/` (use `@assets/` import)
3. **Update Manifest**: Add to Farcaster manifest if needed for app functionality
4. **Document Here**: Add entry to this resource index

## Performance Considerations

### Asset Loading
- **Critical Assets**: Inline in HTML or preload
- **Non-Critical**: Lazy load or defer
- **CDN Usage**: External resources use CDN when possible
- **Caching**: Set appropriate cache headers for static assets

### Bundle Optimization
- **Code Splitting**: Vite handles automatic splitting
- **Tree Shaking**: Remove unused code
- **Asset Optimization**: Vite optimizes images and other assets
- **Compression**: Enable gzip/brotli compression in production