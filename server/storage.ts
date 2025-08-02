import { 
  type User, 
  type InsertUser,
  type Story,
  type InsertStory,
  type StorySegment,
  type InsertStorySegment,
  type StoryLike,
  type InsertStoryLike,
  type StoryLock,
  type InsertStoryLock,
  type StoryComment,
  type InsertStoryComment,
  type CastComment,
  type InsertCastComment,
  type StoryWithContributors,
  users,
  stories,
  storySegments,
  storyLikes,
  storyLocks,
  storyComments,
  castComments
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, lt } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByFid(fid: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(fid: number, updates: Partial<User>): Promise<User | undefined>;

  // Story operations
  getStory(id: string): Promise<Story | undefined>;
  getStoryWithContributors(id: string, viewerFid?: number): Promise<StoryWithContributors | undefined>;
  createStory(story: InsertStory): Promise<Story>;
  updateStory(id: string, updates: Partial<Story>): Promise<Story | undefined>;
  getAllStories(): Promise<Story[]>;

  // Story segment operations
  getStorySegments(storyId: string): Promise<StorySegment[]>;
  createStorySegment(segment: InsertStorySegment & { orderIndex: number }): Promise<StorySegment>;

  // Story like operations
  getStoryLikes(storyId: string): Promise<StoryLike[]>;
  createStoryLike(like: InsertStoryLike): Promise<StoryLike>;
  deleteStoryLike(storyId: string, userFid: number): Promise<boolean>;
  hasUserLikedStory(storyId: string, userFid: number): Promise<boolean>;

  // Story lock operations
  acquireLock(storyId: string, userFid: number): Promise<StoryLock | null>;
  releaseLock(storyId: string, userFid: number): Promise<boolean>;
  checkLock(storyId: string): Promise<StoryLock | null>;
  cleanupExpiredLocks(): Promise<void>;

  // Story comment operations
  getStoryComments(storyId: string): Promise<(StoryComment & { author: User })[]>;
  createStoryComment(comment: InsertStoryComment): Promise<StoryComment>;
  incorporateComment(commentId: string, incorporatorFid: number): Promise<StorySegment | null>;
  
  // Enhanced story session management
  endStorySession(storyId: string): Promise<Story | undefined>;
  closeStory(storyId: string, closedBy: string): Promise<Story | undefined>;
  
  // Enhanced comment operations
  getStoryComment(commentId: string): Promise<StoryComment | undefined>;
  approveAndIncorporateComment(commentId: string, approverFid: number): Promise<{ comment: StoryComment; segment: StorySegment }>;
  declineComment(commentId: string): Promise<StoryComment | undefined>;
  getPendingComments(storyId: string): Promise<(StoryComment & { author: User })[]>;
  updateStorySharedCast(storyId: string, userFid: number, castHash: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize with sample story
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    try {
      // Check if sample data already exists
      const existingStories = await db.select().from(stories).limit(1);
      if (existingStories.length > 0) return;

      // Create sample users
      const creator = await this.createUser({
        fid: 1,
        username: "sarahm",
        displayName: "Sarah Martinez",
        pfpUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
        followerCount: 1250
      });

      const contributor1 = await this.createUser({
        fid: 2,
        username: "techwriter99",
        displayName: "Marcus Tech",
        pfpUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
        followerCount: 890
      });

      const contributor2 = await this.createUser({
        fid: 3,
        username: "mysticalcoder",
        displayName: "Luna Mystical",
        pfpUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
        followerCount: 567
      });

      // Create sample story
      const story = await this.createStory({
        creatorFid: 1,
        title: "Digital Magic Adventures",
        initialContent: "Once upon a time, in a world where digital realms collided with ancient magic, there lived a young programmer named Zara who discovered that her late-night coding sessions were actually casting spells...",
        originalCastHash: "0x6932a9256f34e18892d498abb6d00ccf9f1c50d6"
      });

      // Create sample segments
      await this.createStorySegment({
        storyId: story.id,
        authorFid: 2,
        content: "Each line of code she wrote began to glow with ethereal light, and her computer screen became a portal to dimensions unknown. The debugging process took on a whole new meaning when the bugs were actually tiny magical creatures causing mischief in her programs.",
        orderIndex: 1
      });

      await this.createStorySegment({
        storyId: story.id,
        authorFid: 3,
        content: "As Zara's fingers danced across the keyboard, she realized that the ancient tome of programming languages she'd inherited from her grandmother wasn't just a reference book—it was a spellbook. Every function call was an incantation, every variable declaration a binding ritual.",
        orderIndex: 2
      });

      // Create sample likes
      await this.createStoryLike({
        storyId: story.id,
        userFid: 2,
        castHash: "0x6932a9256f34e18892d498abb6d00ccf9f1c50d6"
      });

      await this.createStoryLike({
        storyId: story.id,
        userFid: 3,
        castHash: "0x6932a9256f34e18892d498abb6d00ccf9f1c50d6"
      });
    } catch (error) {
      console.warn("Error initializing sample data:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByFid(fid: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.fid, fid));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Check if user already exists
    const existing = await this.getUserByFid(insertUser.fid);
    if (existing) {
      return existing;
    }

    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(fid: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.fid, fid))
      .returning();
    return user || undefined;
  }

  async getStory(id: string): Promise<Story | undefined> {
    const [story] = await db.select().from(stories).where(eq(stories.id, id));
    return story || undefined;
  }

  async getStoryWithContributors(id: string, viewerFid?: number): Promise<StoryWithContributors | undefined> {
    const story = await this.getStory(id);
    if (!story) return undefined;

    const creator = await this.getUserByFid(story.creatorFid);
    if (!creator) return undefined;

    // Get story segments with authors
    const segments = await db
      .select({
        id: storySegments.id,
        storyId: storySegments.storyId,
        authorFid: storySegments.authorFid,
        content: storySegments.content,
        orderIndex: storySegments.orderIndex,
        createdAt: storySegments.createdAt,
        author: users
      })
      .from(storySegments)
      .leftJoin(users, eq(storySegments.authorFid, users.fid))
      .where(eq(storySegments.storyId, id))
      .orderBy(storySegments.orderIndex);

    // Get unique contributors
    const contributorFids = new Set([story.creatorFid, ...segments.map(s => s.authorFid)]);
    const contributors = await db
      .select()
      .from(users)
      .where(sql`${users.fid} IN ${Array.from(contributorFids)}`);

    // Get comments with authors
    const comments = await this.getStoryComments(id);

    const hasLiked = viewerFid ? await this.hasUserLikedStory(id, viewerFid) : false;

    return {
      ...story,
      creator,
      segments: segments.map(s => ({ ...s, author: s.author! })),
      contributors,
      hasLiked,
      comments
    };
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const [story] = await db
      .insert(stories)
      .values(insertStory)
      .returning();
    return story;
  }

  async updateStory(id: string, updates: Partial<Story>): Promise<Story | undefined> {
    const [story] = await db
      .update(stories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(stories.id, id))
      .returning();
    return story || undefined;
  }

  async getAllStories(): Promise<Story[]> {
    return await db.select().from(stories).orderBy(desc(stories.createdAt));
  }

  async getStorySegments(storyId: string): Promise<StorySegment[]> {
    return await db
      .select()
      .from(storySegments)
      .where(eq(storySegments.storyId, storyId))
      .orderBy(storySegments.orderIndex);
  }

  async createStorySegment(insertSegment: InsertStorySegment & { orderIndex: number }): Promise<StorySegment> {
    const [segment] = await db
      .insert(storySegments)
      .values(insertSegment)
      .returning();

    // Update story contributor count
    const story = await this.getStory(insertSegment.storyId);
    if (story) {
      const segments = await this.getStorySegments(insertSegment.storyId);
      const uniqueContributors = new Set([story.creatorFid, ...segments.map(s => s.authorFid)]);
      await this.updateStory(insertSegment.storyId, { 
        contributorCount: uniqueContributors.size
      });
    }

    return segment;
  }

  async getStoryLikes(storyId: string): Promise<StoryLike[]> {
    return await db
      .select()
      .from(storyLikes)
      .where(eq(storyLikes.storyId, storyId));
  }

  async createStoryLike(insertLike: InsertStoryLike): Promise<StoryLike> {
    // Check if like already exists
    const existing = await this.hasUserLikedStory(insertLike.storyId, insertLike.userFid);
    if (existing) {
      // Return existing like
      const [existingLike] = await db
        .select()
        .from(storyLikes)
        .where(and(
          eq(storyLikes.storyId, insertLike.storyId),
          eq(storyLikes.userFid, insertLike.userFid)
        ));
      return existingLike;
    }

    const [like] = await db
      .insert(storyLikes)
      .values(insertLike)
      .returning();

    // Update story like count
    const likes = await this.getStoryLikes(insertLike.storyId);
    await this.updateStory(insertLike.storyId, { 
      likeCount: likes.length 
    });

    return like;
  }

  async deleteStoryLike(storyId: string, userFid: number): Promise<boolean> {
    const result = await db
      .delete(storyLikes)
      .where(and(
        eq(storyLikes.storyId, storyId),
        eq(storyLikes.userFid, userFid)
      ))
      .returning();

    if (result.length === 0) return false;

    // Update story like count
    const likes = await this.getStoryLikes(storyId);
    await this.updateStory(storyId, { 
      likeCount: likes.length 
    });

    return true;
  }

  async hasUserLikedStory(storyId: string, userFid: number): Promise<boolean> {
    const [like] = await db
      .select()
      .from(storyLikes)
      .where(and(
        eq(storyLikes.storyId, storyId),
        eq(storyLikes.userFid, userFid)
      ))
      .limit(1);

    return !!like;
  }

  async acquireLock(storyId: string, userFid: number): Promise<StoryLock | null> {
    try {
      // Clean up expired locks first
      await this.cleanupExpiredLocks();

      // Check if story is already locked by someone else
      const existingLock = await this.checkLock(storyId);
      if (existingLock && existingLock.lockedByFid !== userFid) {
        return null; // Story is locked by someone else
      }

      // If locked by same user, extend the lock
      if (existingLock && existingLock.lockedByFid === userFid) {
        const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute from now
        const [updatedLock] = await db
          .update(storyLocks)
          .set({ expiresAt })
          .where(eq(storyLocks.id, existingLock.id))
          .returning();
        return updatedLock;
      }

      // Create new lock
      const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute from now
      const [lock] = await db
        .insert(storyLocks)
        .values({
          storyId,
          lockedByFid: userFid,
          expiresAt
        })
        .returning();

      return lock;
    } catch (error) {
      console.warn("Error acquiring lock:", error);
      return null;
    }
  }

  async releaseLock(storyId: string, userFid: number): Promise<boolean> {
    try {
      const result = await db
        .delete(storyLocks)
        .where(and(
          eq(storyLocks.storyId, storyId),
          eq(storyLocks.lockedByFid, userFid)
        ))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.warn("Error releasing lock:", error);
      return false;
    }
  }

  async checkLock(storyId: string): Promise<StoryLock | null> {
    try {
      const [lock] = await db
        .select()
        .from(storyLocks)
        .where(and(
          eq(storyLocks.storyId, storyId),
          sql`${storyLocks.expiresAt} > NOW()`
        ))
        .limit(1);

      return lock || null;
    } catch (error) {
      console.warn("Error checking lock:", error);
      return null;
    }
  }

  async cleanupExpiredLocks(): Promise<void> {
    try {
      await db
        .delete(storyLocks)
        .where(sql`${storyLocks.expiresAt} <= NOW()`);
    } catch (error) {
      console.warn("Error cleaning up expired locks:", error);
    }
  }

  // Story comment operations
  async getStoryComments(storyId: string): Promise<(StoryComment & { author: User })[]> {
    const comments = await db
      .select({
        id: storyComments.id,
        storyId: storyComments.storyId,
        authorFid: storyComments.authorFid,
        content: storyComments.content,
        approvalStatus: storyComments.approvalStatus,
        isIncorporated: storyComments.isIncorporated,
        incorporatedAt: storyComments.incorporatedAt,
        incorporatedByFid: storyComments.incorporatedByFid,
        castHash: storyComments.castHash,
        sharedCastHash: storyComments.sharedCastHash,
        notificationSent: storyComments.notificationSent,
        createdAt: storyComments.createdAt,
        author: {
          id: users.id,
          fid: users.fid,
          username: users.username,
          displayName: users.displayName,
          pfpUrl: users.pfpUrl,
          followerCount: users.followerCount
        }
      })
      .from(storyComments)
      .leftJoin(users, eq(storyComments.authorFid, users.fid))
      .where(eq(storyComments.storyId, storyId))
      .orderBy(desc(storyComments.createdAt));

    return comments.map(comment => ({
      ...comment,
      author: comment.author as User
    }));
  }

  async createStoryComment(insertComment: InsertStoryComment): Promise<StoryComment> {
    const [comment] = await db
      .insert(storyComments)
      .values(insertComment)
      .returning();

    return comment;
  }

  async incorporateComment(commentId: string, incorporatorFid: number): Promise<StorySegment | null> {
    const comment = await this.getStoryComment(commentId);
    if (!comment || comment.isIncorporated) {
      return null;
    }

    // Get current segment count for ordering
    const segments = await this.getStorySegments(comment.storyId);
    const orderIndex = segments.length + 1;

    // Create story segment from comment
    const segment = await this.createStorySegment({
      storyId: comment.storyId,
      authorFid: comment.authorFid,
      content: comment.content,
      orderIndex
    });

    // Mark comment as incorporated
    await db
      .update(storyComments)
      .set({
        isIncorporated: true,
        incorporatedAt: new Date(),
        incorporatedByFid: incorporatorFid
      })
      .where(eq(storyComments.id, commentId));

    return segment;
  }

  // Enhanced story session management
  async endStorySession(storyId: string): Promise<Story | undefined> {
    const [updatedStory] = await db
      .update(stories)
      .set({
        sessionStatus: "ended",
        endedAt: new Date()
      })
      .where(eq(stories.id, storyId))
      .returning();

    return updatedStory;
  }

  async closeStory(storyId: string, closedBy: string): Promise<Story | undefined> {
    try {
      // Get current story segments to create final content
      const segments = await this.getStorySegments(storyId);
      const story = await this.getStory(storyId);
      
      if (!story) return undefined;

      // Create final content combining initial + all segments
      let finalContent = story.initialContent;
      if (segments.length > 0) {
        finalContent += "\n\n" + segments
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map(segment => segment.content)
          .join("\n\n");
      }

      // Update story as closed
      const [updatedStory] = await db
        .update(stories)
        .set({
          sessionStatus: "closed",
          finalContent,
          closedBy,
          endedAt: new Date()
        })
        .where(eq(stories.id, storyId))
        .returning();

      // Cleanup: Delete all pending comments
      await db
        .delete(storyComments)
        .where(and(
          eq(storyComments.storyId, storyId),
          eq(storyComments.isIncorporated, false)
        ));

      // Cleanup: Delete all cast comments
      await db
        .delete(castComments)
        .where(eq(castComments.storyId, storyId));

      return updatedStory;
    } catch (error) {
      console.error("Error closing story:", error);
      return undefined;
    }
  }

  // Enhanced comment operations
  async getStoryComment(commentId: string): Promise<StoryComment | undefined> {
    const [comment] = await db
      .select()
      .from(storyComments)
      .where(eq(storyComments.id, commentId))
      .limit(1);

    return comment;
  }

  async approveAndIncorporateComment(commentId: string, approverFid: number): Promise<{ comment: StoryComment; segment: StorySegment }> {
    // Update comment status
    const [updatedComment] = await db
      .update(storyComments)
      .set({
        approvalStatus: "approved"
      })
      .where(eq(storyComments.id, commentId))
      .returning();

    // Incorporate into story
    const segment = await this.incorporateComment(commentId, approverFid);
    if (!segment) {
      throw new Error("Failed to incorporate comment");
    }

    return { comment: updatedComment, segment };
  }

  async declineComment(commentId: string): Promise<StoryComment | undefined> {
    const [updatedComment] = await db
      .update(storyComments)
      .set({
        approvalStatus: "declined"
      })
      .where(eq(storyComments.id, commentId))
      .returning();

    return updatedComment;
  }

  async getPendingComments(storyId: string): Promise<(StoryComment & { author: User })[]> {
    const comments = await db
      .select({
        id: storyComments.id,
        storyId: storyComments.storyId,
        authorFid: storyComments.authorFid,
        content: storyComments.content,
        approvalStatus: storyComments.approvalStatus,
        isIncorporated: storyComments.isIncorporated,
        incorporatedAt: storyComments.incorporatedAt,
        incorporatedByFid: storyComments.incorporatedByFid,
        castHash: storyComments.castHash,
        sharedCastHash: storyComments.sharedCastHash,
        notificationSent: storyComments.notificationSent,
        createdAt: storyComments.createdAt,
        author: {
          id: users.id,
          fid: users.fid,
          username: users.username,
          displayName: users.displayName,
          pfpUrl: users.pfpUrl,
          followerCount: users.followerCount
        }
      })
      .from(storyComments)
      .leftJoin(users, eq(storyComments.authorFid, users.fid))
      .where(and(
        eq(storyComments.storyId, storyId),
        eq(storyComments.approvalStatus, "pending")
      ))
      .orderBy(desc(storyComments.createdAt));

    return comments.map(comment => ({
      ...comment,
      author: comment.author as User
    }));
  }

  async updateStorySharedCast(storyId: string, userFid: number, castHash: string): Promise<boolean> {
    const result = await db
      .update(stories)
      .set({ originalCastHash: castHash })
      .where(eq(stories.id, storyId))
      .returning();

    return result.length > 0;
  }

  // Cast-based collaborative workflow methods
  async addCastComment(data: any): Promise<any> {
    const [comment] = await db
      .insert(castComments)
      .values(data)
      .returning();

    return comment;
  }

  async getCastComments(storyId: string, status: string = "pending"): Promise<any[]> {
    const comments = await db
      .select({
        id: castComments.id,
        storyId: castComments.storyId,
        commentCastHash: castComments.commentCastHash,
        authorFid: castComments.authorFid,
        content: castComments.content,
        approvalStatus: castComments.approvalStatus,
        incorporatedAt: castComments.incorporatedAt,
        incorporatedInCastHash: castComments.incorporatedInCastHash,
        createdAt: castComments.createdAt,
        author: {
          id: users.id,
          fid: users.fid,
          username: users.username,
          displayName: users.displayName,
          pfpUrl: users.pfpUrl,
          followerCount: users.followerCount
        }
      })
      .from(castComments)
      .leftJoin(users, eq(castComments.authorFid, users.fid))
      .where(and(
        eq(castComments.storyId, storyId),
        eq(castComments.approvalStatus, status)
      ))
      .orderBy(desc(castComments.createdAt));

    return comments.map(comment => ({
      ...comment,
      author: comment.author as User
    }));
  }

  async approveCastComment(commentId: string, userFid: number, weaveCastHash: string): Promise<any | null> {
    try {
      // First verify the user owns the story
      const comment = await db
        .select({
          castComment: castComments,
          story: stories
        })
        .from(castComments)
        .leftJoin(stories, eq(castComments.storyId, stories.id))
        .where(eq(castComments.id, commentId))
        .limit(1);

      if (!comment[0] || !comment[0].story || comment[0].story.creatorFid !== userFid) {
        return null;
      }

      // Update comment to approved
      const [updatedComment] = await db
        .update(castComments)
        .set({
          approvalStatus: "approved",
          incorporatedAt: new Date(),
          incorporatedInCastHash: weaveCastHash
        })
        .where(eq(castComments.id, commentId))
        .returning();

      // Update weave cast count
      await db
        .update(stories)
        .set({
          latestWeaveCastHash: weaveCastHash,
          weaveCastCount: sql`${stories.weaveCastCount} + 1`
        })
        .where(eq(stories.id, comment[0].castComment.storyId));

      return updatedComment;
    } catch (error) {
      console.warn("Error approving cast comment:", error);
      return null;
    }
  }

  async declineCastComment(commentId: string, userFid: number): Promise<boolean> {
    try {
      // First verify the user owns the story
      const comment = await db
        .select({
          castComment: castComments,
          story: stories
        })
        .from(castComments)
        .leftJoin(stories, eq(castComments.storyId, stories.id))
        .where(eq(castComments.id, commentId))
        .limit(1);

      if (!comment[0] || !comment[0].story || comment[0].story.creatorFid !== userFid) {
        return false;
      }

      // Update comment to declined
      await db
        .update(castComments)
        .set({ approvalStatus: "declined" })
        .where(eq(castComments.id, commentId));

      return true;
    } catch (error) {
      console.warn("Error declining cast comment:", error);
      return false;
    }
  }

  async updateLatestWeaveCast(storyId: string, castHash: string, userFid: number): Promise<boolean> {
    try {
      // Verify user owns the story
      const story = await this.getStory(storyId);
      if (!story || story.creatorFid !== userFid) {
        return false;
      }

      await db
        .update(stories)
        .set({ latestWeaveCastHash: castHash })
        .where(eq(stories.id, storyId));

      return true;
    } catch (error) {
      console.warn("Error updating weave cast:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
