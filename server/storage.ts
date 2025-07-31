import { 
  type User, 
  type InsertUser,
  type Story,
  type InsertStory,
  type StorySegment,
  type InsertStorySegment,
  type StoryLike,
  type InsertStoryLike,
  type StoryWithContributors
} from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private usersByFid: Map<number, User>;
  private stories: Map<string, Story>;
  private storySegments: Map<string, StorySegment[]>;
  private storyLikes: Map<string, StoryLike[]>;

  constructor() {
    this.users = new Map();
    this.usersByFid = new Map();
    this.stories = new Map();
    this.storySegments = new Map();
    this.storyLikes = new Map();

    // Initialize with sample story
    this.initializeSampleData();
  }

  private async initializeSampleData() {
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
      castHash: "0x6932a9256f34e18892d498abb6d00ccf9f1c50d6",
      likeCount: 42,
      recastCount: 8
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
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByFid(fid: number): Promise<User | undefined> {
    return this.usersByFid.get(fid);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      followerCount: insertUser.followerCount || 0
    };
    this.users.set(id, user);
    this.usersByFid.set(user.fid, user);
    return user;
  }

  async updateUser(fid: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.usersByFid.get(fid);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(user.id, updatedUser);
    this.usersByFid.set(fid, updatedUser);
    return updatedUser;
  }

  async getStory(id: string): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async getStoryWithContributors(id: string, viewerFid?: number): Promise<StoryWithContributors | undefined> {
    const story = this.stories.get(id);
    if (!story) return undefined;

    const creator = this.usersByFid.get(story.creatorFid);
    if (!creator) return undefined;

    const segments = this.storySegments.get(id) || [];
    const segmentsWithAuthors = await Promise.all(
      segments.map(async (segment) => {
        const author = this.usersByFid.get(segment.authorFid);
        return { ...segment, author: author! };
      })
    );

    // Get unique contributors
    const contributorFids = new Set([story.creatorFid, ...segments.map(s => s.authorFid)]);
    const contributors = Array.from(contributorFids)
      .map(fid => this.usersByFid.get(fid))
      .filter(Boolean) as User[];

    const hasLiked = viewerFid ? await this.hasUserLikedStory(id, viewerFid) : false;

    return {
      ...story,
      creator,
      segments: segmentsWithAuthors,
      contributors,
      hasLiked
    };
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = randomUUID();
    const now = new Date();
    const story: Story = { 
      ...insertStory, 
      id,
      likeCount: insertStory.likeCount || 0,
      recastCount: insertStory.recastCount || 0,
      contributorCount: 1,
      createdAt: now,
      updatedAt: now
    };
    this.stories.set(id, story);
    return story;
  }

  async updateStory(id: string, updates: Partial<Story>): Promise<Story | undefined> {
    const story = this.stories.get(id);
    if (!story) return undefined;
    
    const updatedStory = { ...story, ...updates, updatedAt: new Date() };
    this.stories.set(id, updatedStory);
    return updatedStory;
  }

  async getAllStories(): Promise<Story[]> {
    return Array.from(this.stories.values());
  }

  async getStorySegments(storyId: string): Promise<StorySegment[]> {
    return this.storySegments.get(storyId) || [];
  }

  async createStorySegment(insertSegment: InsertStorySegment): Promise<StorySegment> {
    const id = randomUUID();
    const segment: StorySegment = { 
      ...insertSegment, 
      id,
      createdAt: new Date()
    };
    
    const segments = this.storySegments.get(insertSegment.storyId) || [];
    segments.push(segment);
    segments.sort((a, b) => a.orderIndex - b.orderIndex);
    this.storySegments.set(insertSegment.storyId, segments);

    // Update story contributor count
    const story = this.stories.get(insertSegment.storyId);
    if (story) {
      const uniqueContributors = new Set([story.creatorFid, ...segments.map(s => s.authorFid)]);
      await this.updateStory(insertSegment.storyId, { 
        contributorCount: uniqueContributors.size,
        updatedAt: new Date()
      });
    }

    return segment;
  }

  async getStoryLikes(storyId: string): Promise<StoryLike[]> {
    return this.storyLikes.get(storyId) || [];
  }

  async createStoryLike(insertLike: InsertStoryLike): Promise<StoryLike> {
    const id = randomUUID();
    const like: StoryLike = { 
      ...insertLike, 
      id,
      createdAt: new Date()
    };
    
    const likes = this.storyLikes.get(insertLike.storyId) || [];
    likes.push(like);
    this.storyLikes.set(insertLike.storyId, likes);

    // Update story like count
    const story = this.stories.get(insertLike.storyId);
    if (story) {
      await this.updateStory(insertLike.storyId, { 
        likeCount: likes.length 
      });
    }

    return like;
  }

  async deleteStoryLike(storyId: string, userFid: number): Promise<boolean> {
    const likes = this.storyLikes.get(storyId) || [];
    const filteredLikes = likes.filter(like => like.userFid !== userFid);
    
    if (filteredLikes.length === likes.length) return false;
    
    this.storyLikes.set(storyId, filteredLikes);

    // Update story like count
    const story = this.stories.get(storyId);
    if (story) {
      await this.updateStory(storyId, { 
        likeCount: filteredLikes.length 
      });
    }

    return true;
  }

  async hasUserLikedStory(storyId: string, userFid: number): Promise<boolean> {
    const likes = this.storyLikes.get(storyId) || [];
    return likes.some(like => like.userFid === userFid);
  }
}

export const storage = new MemStorage();
