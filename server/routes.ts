import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStorySegmentSchema, insertStoryLikeSchema, insertUserSchema, insertStorySchema, insertStoryCommentSchema } from "@shared/schema";
import { z } from "zod";
import { generalRateLimit, storyCreationRateLimit, contributionRateLimit } from "./middleware/rate-limiter";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply general rate limiting to all routes
  app.use(generalRateLimit);
  
  // Get story with contributors
  app.get("/api/stories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const viewerFid = req.query.viewerFid ? parseInt(req.query.viewerFid as string) : undefined;
      
      const story = await storage.getStoryWithContributors(id, viewerFid);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }
      
      res.json(story);
    } catch (error) {
      console.error("Error fetching story:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all stories
  app.get("/api/stories", async (req, res) => {
    try {
      const stories = await storage.getAllStories();
      res.json(stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create new story (restricted)
  app.post("/api/stories", storyCreationRateLimit, async (req, res) => {
    try {
      const AUTHORIZED_FID = 977521; // Your Farcaster FID
      const { creatorFid } = req.body;

      // Only allow authorized users to create stories
      if (creatorFid !== AUTHORIZED_FID) {
        return res.status(403).json({ 
          error: "Story creation is restricted. Please share warps with the story creator to enable new stories." 
        });
      }

      const storyData = insertStorySchema.parse(req.body);
      const story = await storage.createStory(storyData);
      
      res.json(story);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid story data", details: error.errors });
      }
      console.error("Error creating story:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create or update user
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user exists
      let user = await storage.getUserByFid(userData.fid);
      if (user) {
        // Update existing user
        user = await storage.updateUser(userData.fid, userData);
      } else {
        // Create new user
        user = await storage.createUser(userData);
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      console.error("Error creating/updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user by FID
  app.get("/api/users/:fid", async (req, res) => {
    try {
      const fid = parseInt(req.params.fid);
      const user = await storage.getUserByFid(fid);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Acquire writing lock for a story
  app.post("/api/stories/:id/lock", async (req, res) => {
    try {
      const { id: storyId } = req.params;
      const { userFid } = req.body;

      if (!userFid) {
        return res.status(400).json({ error: "User FID is required" });
      }

      // Verify user has liked the story
      const hasLiked = await storage.hasUserLikedStory(storyId, userFid);
      if (!hasLiked) {
        return res.status(403).json({ error: "You must like the story before writing" });
      }

      const lock = await storage.acquireLock(storyId, userFid);
      if (!lock) {
        // Check who has the lock
        const existingLock = await storage.checkLock(storyId);
        if (existingLock) {
          const lockedUser = await storage.getUserByFid(existingLock.lockedByFid);
          return res.status(423).json({ 
            error: "Story is currently being edited", 
            lockedBy: lockedUser?.displayName || "Another user",
            expiresAt: existingLock.expiresAt
          });
        }
        return res.status(500).json({ error: "Failed to acquire lock" });
      }

      res.json(lock);
    } catch (error) {
      console.error("Error acquiring lock:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Release writing lock for a story
  app.delete("/api/stories/:id/lock", async (req, res) => {
    try {
      const { id: storyId } = req.params;
      const { userFid } = req.body;

      if (!userFid) {
        return res.status(400).json({ error: "User FID is required" });
      }

      const success = await storage.releaseLock(storyId, userFid);
      res.json({ success });
    } catch (error) {
      console.error("Error releasing lock:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Check lock status for a story
  app.get("/api/stories/:id/lock", async (req, res) => {
    try {
      const { id: storyId } = req.params;
      const lock = await storage.checkLock(storyId);
      
      if (lock) {
        const lockedUser = await storage.getUserByFid(lock.lockedByFid);
        res.json({
          isLocked: true,
          lockedBy: lockedUser?.displayName || "Unknown user",
          lockedByFid: lock.lockedByFid,
          expiresAt: lock.expiresAt
        });
      } else {
        res.json({ isLocked: false });
      }
    } catch (error) {
      console.error("Error checking lock:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add story segment (only if user has liked the story and has the lock)
  app.post("/api/stories/:id/segments", async (req, res) => {
    try {
      const { id: storyId } = req.params;
      const segmentData = insertStorySegmentSchema.parse({
        ...req.body,
        storyId
      });

      // Verify story exists
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      // Verify user has liked the story
      const hasLiked = await storage.hasUserLikedStory(storyId, segmentData.authorFid);
      if (!hasLiked) {
        return res.status(403).json({ error: "You must like the story before contributing" });
      }

      // Verify user has the writing lock
      const lock = await storage.checkLock(storyId);
      if (!lock || lock.lockedByFid !== segmentData.authorFid) {
        return res.status(423).json({ error: "You must acquire the writing lock first" });
      }

      // Get next order index
      const existingSegments = await storage.getStorySegments(storyId);
      const nextOrderIndex = Math.max(0, ...existingSegments.map(s => s.orderIndex)) + 1;

      const segment = await storage.createStorySegment({
        ...segmentData,
        orderIndex: nextOrderIndex
      });

      // Release the lock after successful contribution
      await storage.releaseLock(storyId, segmentData.authorFid);

      res.json(segment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid segment data", details: error.errors });
      }
      console.error("Error creating story segment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Toggle story like
  app.post("/api/stories/:id/like", async (req, res) => {
    try {
      const { id: storyId } = req.params;
      const { userFid, castHash } = req.body;

      if (!userFid) {
        return res.status(400).json({ error: "User FID is required" });
      }

      // Verify story exists
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      // Check if user has already liked
      const hasLiked = await storage.hasUserLikedStory(storyId, userFid);

      if (hasLiked) {
        // Unlike
        await storage.deleteStoryLike(storyId, userFid);
        res.json({ liked: false });
      } else {
        // Like
        const likeData = insertStoryLikeSchema.parse({
          storyId,
          userFid,
          castHash
        });
        await storage.createStoryLike(likeData);
        res.json({ liked: true });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid like data", details: error.errors });
      }
      console.error("Error toggling story like:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Check if user has liked story
  app.get("/api/stories/:id/like/:userFid", async (req, res) => {
    try {
      const { id: storyId, userFid } = req.params;
      const fid = parseInt(userFid);
      
      const hasLiked = await storage.hasUserLikedStory(storyId, fid);
      res.json({ hasLiked });
    } catch (error) {
      console.error("Error checking like status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add comment to story (users can comment with story parts)
  app.post("/api/stories/:id/comments", async (req, res) => {
    try {
      const { id: storyId } = req.params;
      const commentData = insertStoryCommentSchema.parse({
        ...req.body,
        storyId
      });

      // Verify story exists
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      // Verify user has liked the story
      const hasLiked = await storage.hasUserLikedStory(storyId, commentData.authorFid);
      if (!hasLiked) {
        return res.status(403).json({ error: "You must like the story before commenting" });
      }

      const comment = await storage.createStoryComment(commentData);
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid comment data", details: error.errors });
      }
      console.error("Error creating story comment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Incorporate comment into story (only story creator can do this)
  app.post("/api/stories/:id/comments/:commentId/incorporate", async (req, res) => {
    try {
      const { id: storyId, commentId } = req.params;
      const { userFid } = req.body;

      if (!userFid) {
        return res.status(400).json({ error: "User FID is required" });
      }

      // Verify story exists and user is the creator
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      if (story.creatorFid !== userFid) {
        return res.status(403).json({ error: "Only the story creator can incorporate comments" });
      }

      const segment = await storage.incorporateComment(commentId, userFid);
      if (!segment) {
        return res.status(400).json({ error: "Could not incorporate comment" });
      }

      res.json(segment);
    } catch (error) {
      console.error("Error incorporating comment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
