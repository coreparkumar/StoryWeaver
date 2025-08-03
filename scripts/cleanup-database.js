#!/usr/bin/env node

/**
 * Database Cleanup Script
 * Performs cascading deletion of all stories and related data
 * Usage: node scripts/cleanup-database.js
 */

import { db } from '../server/db.js';
import { 
  stories, 
  storySegments, 
  storyComments, 
  storyLikes, 
  storyLocks,
  castComments 
} from '../shared/schema.js';

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...');
  
  try {
    // Get count of records before deletion
    const [storiesCount] = await db.select().from(stories);
    const [segmentsCount] = await db.select().from(storySegments);
    const [commentsCount] = await db.select().from(storyComments);
    const [likesCount] = await db.select().from(storyLikes);
    const [locksCount] = await db.select().from(storyLocks);
    const [castCommentsCount] = await db.select().from(castComments);
    
    console.log('📊 Records to delete:');
    console.log(`   Stories: ${storiesCount?.length || 0}`);
    console.log(`   Story Segments: ${segmentsCount?.length || 0}`);
    console.log(`   Story Comments: ${commentsCount?.length || 0}`);
    console.log(`   Story Likes: ${likesCount?.length || 0}`);
    console.log(`   Story Locks: ${locksCount?.length || 0}`);
    console.log(`   Cast Comments: ${castCommentsCount?.length || 0}`);
    
    // Delete in dependency order (children first, then parents)
    console.log('\n🗑️  Deleting cast comments...');
    const deletedCastComments = await db.delete(castComments).returning();
    console.log(`   ✓ Deleted ${deletedCastComments.length} cast comments`);
    
    console.log('🗑️  Deleting story comments...');
    const deletedComments = await db.delete(storyComments).returning();
    console.log(`   ✓ Deleted ${deletedComments.length} story comments`);
    
    console.log('🗑️  Deleting story segments...');
    const deletedSegments = await db.delete(storySegments).returning();
    console.log(`   ✓ Deleted ${deletedSegments.length} story segments`);
    
    console.log('🗑️  Deleting story likes...');
    const deletedLikes = await db.delete(storyLikes).returning();
    console.log(`   ✓ Deleted ${deletedLikes.length} story likes`);
    
    console.log('🗑️  Deleting story locks...');
    const deletedLocks = await db.delete(storyLocks).returning();
    console.log(`   ✓ Deleted ${deletedLocks.length} story locks`);
    
    console.log('🗑️  Deleting stories...');
    const deletedStories = await db.delete(stories).returning();
    console.log(`   ✓ Deleted ${deletedStories.length} stories`);
    
    console.log('\n✅ Database cleanup completed successfully!');
    console.log('📈 Summary:');
    console.log(`   Total stories deleted: ${deletedStories.length}`);
    console.log(`   Total related records deleted: ${
      deletedCastComments.length + 
      deletedComments.length + 
      deletedSegments.length + 
      deletedLikes.length + 
      deletedLocks.length
    }`);
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    process.exit(1);
  }
}

// Run cleanup if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupDatabase()
    .then(() => {
      console.log('🎉 Cleanup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Cleanup script failed:', error);
      process.exit(1);
    });
}

export { cleanupDatabase };