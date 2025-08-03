# Database Management Scripts

## Cleanup Database

Performs cascading deletion of all stories and related data from the database.

### Usage

```bash
# Run the cleanup script
npx tsx scripts/cleanup-database.js
```

### What it deletes

The script deletes records in the correct dependency order:

1. **Cast Comments** - Comments from Farcaster cast replies
2. **Story Comments** - Pending story contributions  
3. **Story Segments** - Approved story parts
4. **Story Likes** - User likes that grant permissions
5. **Story Locks** - Writing locks for editing
6. **Stories** - Main story records

### Safety Features

- Shows count of records before deletion
- Deletes in proper dependency order to avoid foreign key conflicts
- Provides detailed progress logging
- Returns summary of deleted records

### Example Output

```
🧹 Starting database cleanup...
📊 Records to delete:
   Stories: 6
   Story Segments: 0
   Story Comments: 0
   Story Likes: 0
   Story Locks: 0
   Cast Comments: 0

🗑️  Deleting cast comments...
   ✓ Deleted 0 cast comments
🗑️  Deleting story comments...
   ✓ Deleted 0 story comments
🗑️  Deleting story segments...
   ✓ Deleted 0 story segments
🗑️  Deleting story likes...
   ✓ Deleted 0 story likes
🗑️  Deleting story locks...
   ✓ Deleted 0 story locks
🗑️  Deleting stories...
   ✓ Deleted 6 stories

✅ Database cleanup completed successfully!
📈 Summary:
   Total stories deleted: 6
   Total related records deleted: 0
```

## Notes

- The script preserves user accounts and profiles
- Only story-related data is deleted
- Safe to run multiple times
- Uses transactions for data integrity