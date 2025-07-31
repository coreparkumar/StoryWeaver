import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
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
  castHash: text("cast_hash"),
  likeCount: integer("like_count").default(0),
  recastCount: integer("recast_count").default(0),
  contributorCount: integer("contributor_count").default(1),
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

export const storyComments = pgTable("story_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull(),
  authorFid: integer("author_fid").notNull(),
  content: text("content").notNull(),
  isIncorporated: boolean("is_incorporated").default(false),
  incorporatedAt: timestamp("incorporated_at"),
  incorporatedByFid: integer("incorporated_by_fid"),
  castHash: text("cast_hash"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  likeCount: true,
  recastCount: true,
  contributorCount: true,
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
  isIncorporated: true,
  incorporatedAt: true,
  incorporatedByFid: true,
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

// Extended types for frontend
export type StoryWithContributors = Story & {
  creator: User;
  segments: (StorySegment & { author: User })[];
  contributors: User[];
  hasLiked: boolean;
  comments: (StoryComment & { author: User })[];
};
