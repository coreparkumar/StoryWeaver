import { 
  type User, 
  type InsertUser,
  type Story,
  type InsertStory,
  type StorySegment,
  type InsertStorySegment,
  type StoryLike,
  type InsertStoryLike,
  type StoryWithContributors,
  users,
  stories,
  storySegments,
  storyLikes
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

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
  createStorySegment(segment: InsertStorySegment): Promise<StorySegment>;

  // Story like operations
  getStoryLikes(storyId: string): Promise<StoryLike[]>;
  createStoryLike(like: InsertStoryLike): Promise<StoryLike>;
  deleteStoryLike(storyId: string, userFid: number): Promise<boolean>;
  hasUserLikedStory(storyId: string, userFid: number): Promise<boolean>;
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
        castHash: "0x6932a9256f34e18892d498abb6d00ccf9f1c50d6"
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

    const hasLiked = viewerFid ? await this.hasUserLikedStory(id, viewerFid) : false;

    return {
      ...story,
      creator,
      segments: segments.map(s => ({ ...s, author: s.author! })),
      contributors,
      hasLiked
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

  async createStorySegment(insertSegment: InsertStorySegment): Promise<StorySegment> {
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
}

export const storage = new DatabaseStorage();
