#!/usr/bin/env node

/**
 * Database Cleanup Script for Story Weaver
 * 
 * This script removes all stories, comments, and related data to start fresh.
 * Useful for development and testing purposes.
 * 
 * Usage: node scripts/clear-database.js
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

async function clearDatabase() {
  console.log("🧹 Starting database cleanup...\n");
  
  try {
    // Get counts before deletion
    const countQueries = [
      "SELECT COUNT(*) as count FROM cast_comments",
      "SELECT COUNT(*) as count FROM story_comments", 
      "SELECT COUNT(*) as count FROM story_segments",
      "SELECT COUNT(*) as count FROM story_likes",
      "SELECT COUNT(*) as count FROM story_locks",
      "SELECT COUNT(*) as count FROM stories",
      "SELECT COUNT(*) as count FROM users"
    ];
    
    console.log("📊 Current database counts:");
    for (const query of countQueries) {
      const result = await pool.query(query);
      const tableName = query.match(/FROM (\w+)/)[1];
      console.log(`   ${tableName}: ${result.rows[0].count}`);
    }
    
    console.log("\n🗑️  Deleting all data in dependency order...");
    
    // Delete in reverse dependency order to avoid foreign key constraints
    const deleteQueries = [
      "DELETE FROM cast_comments",
      "DELETE FROM story_comments", 
      "DELETE FROM story_segments",
      "DELETE FROM story_likes",
      "DELETE FROM story_locks",
      "DELETE FROM stories"
      // Note: Keeping users table as it contains Farcaster profile data
      // Note: pending_weaves table doesn't exist in current schema
    ];
    
    for (const query of deleteQueries) {
      const result = await pool.query(query);
      const tableName = query.match(/FROM (\w+)/)[1];
      console.log(`   ✅ Deleted ${result.rowCount} rows from ${tableName}`);
    }
    
    // Reset any sequences if they exist
    console.log("\n🔄 Resetting sequences...");
    try {
      // Check if any sequences need resetting (PostgreSQL auto-increment columns)
      const sequenceResult = await pool.query(`
        SELECT schemaname, sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public'
      `);
      
      if (sequenceResult.rows.length > 0) {
        for (const seq of sequenceResult.rows) {
          await pool.query(`ALTER SEQUENCE ${seq.sequencename} RESTART WITH 1`);
          console.log(`   ✅ Reset sequence ${seq.sequencename}`);
        }
      } else {
        console.log("   ℹ️  No sequences to reset (using UUIDs)");
      }
    } catch (seqError) {
      console.log("   ℹ️  No sequences to reset");
    }
    
    console.log("\n✨ Database cleanup completed successfully!");
    console.log("📝 All stories, comments, and related data have been removed.");
    console.log("👥 User profiles have been preserved for continued authentication.");
    
  } catch (error) {
    console.error("\n❌ Database cleanup failed:");
    console.error(error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Confirmation prompt in development
if (process.env.NODE_ENV === 'production') {
  console.error("❌ This script should not be run in production!");
  process.exit(1);
}

console.log("⚠️  WARNING: This will delete ALL stories and comments!");
console.log("Are you sure you want to continue? (This action cannot be undone)");
console.log("Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n");

setTimeout(() => {
  clearDatabase();
}, 5000);