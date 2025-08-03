/**
 * Database Schema for Story Weaver
 * 
 * This file defines the PostgreSQL database schema using Drizzle ORM.
 * It includes all tables, relationships, and TypeScript types for the
 * collaborative storytelling platform.
 * 
 * Schema Overview:
 * - users: Farcaster user profiles with FID as primary key
 * - stories: Main story entries with creator info and metadata
 * - storySegments: Incorporated story content (ordered sequence)
 * - storyComments: Pending contributions awaiting approval
 * - storyLikes: User likes that enable commenting permissions
 * - storyLocks: Writing locks to prevent simultaneous editing
 * - castComments: Farcaster cast-based comments for native workflow
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, uuid, bigint, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fid: integer("fid").notNull().unique(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  pfpUrl: text("pfp_url"),
  followerCount: integer("follower_count").default(0),
});

export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorFid: integer("creator_fid").notNull(),
  title: text("title").notNull(),
  initialContent: text("initial_content").notNull(),
  finalContent: text("final_content"), // Final story after closure
  originalCastHash: text("original_cast_hash"), // Hash of the original Farcaster cast that started the story
  latestWeaveCastHash: text("latest_weave_cast_hash"), // Hash of the most recent weave cast
  finalCastHash: text("final_cast_hash"), // Hash of the final story cast when closed
  sessionStatus: text("session_status").notNull().default("active"), // "active" | "closed"
  likeCount: integer("like_count").default(0),
  recastCount: integer("recast_count").default(0),
  contributorCount: integer("contributor_count").default(1),
  maxContributions: integer("max_contributions").default(10), // Auto-close after this many comments
  weaveCastCount: integer("weave_cast_count").default(0), // Number of weave casts posted
  commentCount: integer("comment_count").default(0), // Current number of approved comments
  closedBy: text("closed_by"), // "auto" | "manual" 
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const storySegments = pgTable("story_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull(),
  authorFid: integer("author_fid").notNull(),
  content: text("content").notNull(),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const storyLikes = pgTable("story_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull(),
  userFid: integer("user_fid").notNull(),
  castHash: text("cast_hash"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const storyLocks = pgTable("story_locks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().unique(),
  lockedByFid: integer("locked_by_fid").notNull(),
  lockedAt: timestamp("locked_at").default(sql`CURRENT_TIMESTAMP`),
  expiresAt: timestamp("expires_at").notNull(),
});

// Track Farcaster cast comments for story weaving
export const castComments = pgTable("cast_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull(),
  commentCastHash: text("comment_cast_hash").notNull().unique(), // Hash of the comment cast
  authorFid: integer("author_fid").notNull(),
  content: text("content").notNull(),
  approvalStatus: text("approval_status").notNull().default("pending"), // "pending" | "approved" | "declined"
  incorporatedAt: timestamp("incorporated_at"), // When comment was woven into story
  incorporatedInCastHash: text("incorporated_in_cast_hash"), // Hash of the weave cast that included this comment
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const storyComments = pgTable("story_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull(),
  authorFid: integer("author_fid").notNull(),
  content: text("content").notNull(),
  approvalStatus: text("approval_status").notNull().default("pending"), // "pending" | "approved" | "declined"
  isIncorporated: boolean("is_incorporated").default(false),
  incorporatedAt: timestamp("incorporated_at"),
  incorporatedByFid: integer("incorporated_by_fid"),
  castHash: text("cast_hash"),
  sharedCastHash: text("shared_cast_hash"), // Cast hash when user shares to Farcaster
  notificationSent: boolean("notification_sent").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  finalContent: true,
  finalCastHash: true,
  likeCount: true,
  recastCount: true,
  contributorCount: true,
  commentCount: true,
  closedBy: true,
  endedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStorySegmentSchema = createInsertSchema(storySegments).omit({
  id: true,
  createdAt: true,
  orderIndex: true, // This will be calculated server-side
});

export const insertStoryLikeSchema = createInsertSchema(storyLikes).omit({
  id: true,
  createdAt: true,
});

export const insertStoryLockSchema = createInsertSchema(storyLocks).omit({
  id: true,
  lockedAt: true,
});

export const insertStoryCommentSchema = createInsertSchema(storyComments).omit({
  id: true,
  approvalStatus: true,
  isIncorporated: true,
  incorporatedAt: true,
  incorporatedByFid: true,
  notificationSent: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;

export type StoryLock = typeof storyLocks.$inferSelect;
export type InsertStoryLock = z.infer<typeof insertStoryLockSchema>;

export type StorySegment = typeof storySegments.$inferSelect;
export type InsertStorySegment = z.infer<typeof insertStorySegmentSchema>;

export type StoryLike = typeof storyLikes.$inferSelect;
export type InsertStoryLike = z.infer<typeof insertStoryLikeSchema>;

export type StoryComment = typeof storyComments.$inferSelect;
export type InsertStoryComment = z.infer<typeof insertStoryCommentSchema>;

export type CastComment = typeof castComments.$inferSelect;
export const insertCastCommentSchema = createInsertSchema(castComments).omit({
  id: true,
  approvalStatus: true,
  incorporatedAt: true,
  incorporatedInCastHash: true,
  createdAt: true,
});
export type InsertCastComment = z.infer<typeof insertCastCommentSchema>;

// Pending weaves for owner approval workflow
export const pendingWeaves = pgTable("pending_weaves", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  storyId: text("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  originalCastHash: text("original_cast_hash").notNull(),
  triggerFid: integer("trigger_fid").notNull(),
  seedContent: text("seed_content").notNull(),
  seedAuthor: text("seed_author").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, declined
  createdAt: timestamp("created_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  weaveCastHash: text("weave_cast_hash"), // Hash of resulting weave cast
});

export const insertPendingWeaveSchema = createInsertSchema(pendingWeaves).omit({
  id: true,
  createdAt: true,
});

export type PendingWeave = typeof pendingWeaves.$inferSelect;
export type InsertPendingWeave = z.infer<typeof insertPendingWeaveSchema>;

// Co-owners table for managing multiple miniapp owners
export const miniappOwners = pgTable("miniapp_owners", {
  id: uuid("id").defaultRandom().primaryKey(),
  userFid: bigint("user_fid", { mode: "number" }).notNull(),
  role: text("role").default("owner").notNull(), // "owner", "admin"
  addedBy: bigint("added_by", { mode: "number" }).notNull(), // FID of who added them
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMiniappOwnerSchema = createInsertSchema(miniappOwners).omit({
  id: true,
  createdAt: true,
});

export type MiniappOwner = typeof miniappOwners.$inferSelect;
export type InsertMiniappOwner = z.infer<typeof insertMiniappOwnerSchema>;

// Extended types for frontend
export type StoryWithContributors = Story & {
  creator: User;
  segments: (StorySegment & { author: User })[];
  contributors: User[];
  hasLiked: boolean;
  comments: (StoryComment & { author: User })[];
  castStatus?: {
    exists: boolean;
    status: "active" | "deleted" | "error";
    message: string;
  };
};
