# Story Weaver Documentation

This folder contains all technical and non-technical documentation for the Story Weaver collaborative storytelling platform.

## 📚 Documentation Files

### For Non-Technical Users
- **[CODE_STRUCTURE.md](CODE_STRUCTURE.md)** - High-level overview of how the app is organized and which files do what
- **[FUNCTION_MAPPING.md](FUNCTION_MAPPING.md)** - Detailed guide showing exactly which functions are in which files
- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete guide to all API endpoints and how they work

### For Technical Users
- **[test-action.md](test-action.md)** - Testing information for the Farcaster cast action integration

## 🎯 How to Use This Documentation

### If you're a **non-technical stakeholder**:
1. Start with **CODE_STRUCTURE.md** to understand the big picture
2. Use **FUNCTION_MAPPING.md** to find specific features
3. Reference **API_REFERENCE.md** for technical details

### If you're a **developer**:
1. Review **CODE_STRUCTURE.md** for architecture overview
2. Use **FUNCTION_MAPPING.md** for code navigation
3. Reference **API_REFERENCE.md** for API implementation details
4. Check **test-action.md** for Farcaster testing procedures

## 🔧 Keeping Documentation Updated

When making changes to the codebase:
- Update function mapping if adding new features
- Update API reference if changing endpoints
- Update code structure if modifying architecture
- Keep line numbers current in function mapping

## 📋 Quick Reference

### Main Application Files
- `server/routes.ts` - All API endpoints
- `server/storage.ts` - Database operations
- `client/src/pages/` - User interface pages
- `client/src/components/` - Reusable UI components
- `shared/schema.ts` - Database structure

### Key Features
- **Story Creation**: Cast action integration
- **Collaboration**: Comment approval system
- **Permissions**: Like-based access control
- **Real-time**: Writing locks and updates

For detailed implementation information, see the individual documentation files in this folder.