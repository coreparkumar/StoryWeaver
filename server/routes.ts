import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStorySegmentSchema, insertStoryLikeSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
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

  // Add story segment (only if user has liked the story)
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

      // Get next order index
      const existingSegments = await storage.getStorySegments(storyId);
      const nextOrderIndex = Math.max(0, ...existingSegments.map(s => s.orderIndex)) + 1;

      const segment = await storage.createStorySegment({
        ...segmentData,
        orderIndex: nextOrderIndex
      });

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

  const httpServer = createServer(app);
  return httpServer;
}
