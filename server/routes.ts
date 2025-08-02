import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStorySegmentSchema, insertStoryLikeSchema, insertUserSchema, insertStorySchema, insertStoryCommentSchema } from "@shared/schema";
import { z } from "zod";
import { generalRateLimit, contributionRateLimit } from "./middleware/rate-limiter";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply general rate limiting to all routes
  app.use(generalRateLimit);
  
  // Serve promotional image with proper headers
  app.get("/story-weaver-promo.jpg", (req, res) => {
    const imagePath = path.resolve(import.meta.dirname, "..", "client", "public", "story-weaver-promo.jpg");
    if (fs.existsSync(imagePath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.sendFile(imagePath);
    } else {
      res.status(404).json({ error: "Image not found" });
    }
  });

  // Serve Story Weaver icon with proper headers
  app.get("/story-weaver-icon.png", (req, res) => {
    const imagePath = path.resolve(import.meta.dirname, "..", "client", "public", "story-weaver-icon.png");
    if (fs.existsSync(imagePath)) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.sendFile(imagePath);
    } else {
      res.status(404).json({ error: "Icon not found" });
    }
  });
  
  // Serve Farcaster manifest with proper headers
  app.get("/.well-known/farcaster.json", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // Official schema-compliant manifest with cast actions
    const manifest = {
      "accountAssociation": {
        "header": "eyJmaWQiOjk3NzUyMSwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDhjQTBjMmI0MTgxMTc5MEQ5OTc1MTIyQkMzOTQ0OTZjRDgwQmI3MkQifQ",
        "payload": "eyJkb21haW4iOiJ3b3J0aGlmeW1lLmluIn0",
        "signature": "f+GecXW8N+jXAUiRrGn6m5FTMeTqr4HoAQyLrosM/VwZgdLrEWgdUtCNkdCNC5l8f6d6aETLBYPjGTGGt3rNMRw="
      },
      "frame": {
        "version": "1",
        "name": "Story Weaver",
        "homeUrl": "https://worthifyme.in",
        "iconUrl": "https://worthifyme.in/story-weaver-icon.png",
        "imageUrl": "https://worthifyme.in/story-weaver-promo.jpg",
        "buttonTitle": "🧙‍♂️ Start Weaving",
        "splashImageUrl": "https://worthifyme.in/story-weaver-promo.jpg",
        "splashBackgroundColor": "#8a63d2",
        "webhookUrl": "https://worthifyme.in/api/webhooks/farcaster"
      },
      "triggers": [
        {
          "type": "cast",
          "id": "weave-story",
          "url": "https://worthifyme.in/api/cast-actions/weave-story",
          "name": "Weave My Part"
        }
      ]
    };
    
    res.json(manifest);
  });

  // Cast Action Installation Endpoint
  app.get("/api/cast-actions", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    res.json({
      "actions": [
        {
          "name": "Weave My Part",
          "icon": "magic-wand",
          "description": "Transform this cast into a collaborative story seed",
          "aboutUrl": "https://worthifyme.in/about",
          "action": {
            "type": "post",
            "url": "https://worthifyme.in/api/cast-actions/weave-story"
          }
        }
      ]
    });
  });

  // Farcaster webhook endpoint
  app.post("/api/webhooks/farcaster", async (req, res) => {
    try {
      console.log("Farcaster webhook received:", JSON.stringify(req.body, null, 2));
      
      // Verify webhook signature if needed
      // const signature = req.headers['x-farcaster-signature'];
      
      const { type, data } = req.body;
      
      // Handle different webhook events
      switch (type) {
        case 'cast.like':
          console.log("Story liked:", data);
          // Update like count or trigger notifications
          break;
        case 'cast.recast':
          console.log("Story recasted:", data);
          // Update recast count
          break;
        case 'cast.reply':
          console.log("Story replied to:", data);
          // Handle replies/comments
          break;
        default:
          console.log("Unknown webhook type:", type);
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  
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

  /**
   * Get All Stories - Returns list of all collaborative stories
   * 
   * Used by homepage to display story cards with metadata:
   * - Basic story info (title, creator, creation date)
   * - Contributor count and like count
   * - Latest activity for sorting
   */
  app.get("/api/stories", async (req, res) => {
    try {
      const stories = await storage.getAllStories();
      res.json(stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create new story (restricted to Story Weaver owner)
  app.post("/api/stories", async (req, res) => {
    try {
      const AUTHORIZED_FID = 977521; // Story Weaver owner FID
      const { creatorFid } = req.body;

      // Only allow the Story Weaver owner to create stories
      if (!creatorFid) {
        return res.status(400).json({ 
          error: "Creator FID is required to create a story." 
        });
      }

      if (creatorFid !== AUTHORIZED_FID) {
        return res.status(403).json({ 
          error: "You are not the owner of Story Weaver. Only the owner can create new stories." 
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
      } as any);

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

      // Verify story exists and is active
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      if (story.sessionStatus === "closed") {
        return res.status(400).json({ error: "Cannot comment on a closed story" });
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

      if (story.sessionStatus === "closed") {
        return res.status(400).json({ error: "Cannot incorporate comments in a closed story" });
      }

      if (story.creatorFid !== userFid) {
        return res.status(403).json({ error: "Only the story creator can incorporate comments" });
      }

      const segment = await storage.incorporateComment(commentId, userFid);
      if (!segment) {
        return res.status(400).json({ error: "Could not incorporate comment" });
      }

      // Check if story should auto-close after this incorporation
      const updatedStory = await storage.getStory(storyId);
      if (updatedStory) {
        // Update comment count
        await storage.updateStory(storyId, { 
          commentCount: (updatedStory.commentCount || 0) + 1 
        });
        
        // Check for auto-close
        if ((updatedStory.commentCount || 0) + 1 >= (updatedStory.maxContributions || 10)) {
          await storage.closeStory(storyId, "auto");
        }
      }

      res.json(segment);
    } catch (error) {
      console.error("Error incorporating comment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Story session management endpoints
  
  // Close a story manually (creator only)
  app.post("/api/stories/:id/close", async (req, res) => {
    try {
      const { id: storyId } = req.params;
      const { userFid } = req.body;

      if (!userFid) {
        return res.status(400).json({ error: "User FID is required" });
      }

      // Get story to verify creator
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      if (story.sessionStatus === "closed") {
        return res.status(400).json({ error: "Story is already closed" });
      }

      // Only creator can close story
      if (story.creatorFid !== userFid) {
        return res.status(403).json({ error: "Only the story creator can close the story" });
      }

      // Close the story and cleanup comments
      const updatedStory = await storage.closeStory(storyId, "manual");
      res.json(updatedStory);
    } catch (error) {
      console.error("Error closing story:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Comment approval endpoints
  
  // Approve a comment and incorporate it into the story
  app.post("/api/comments/:commentId/approve", async (req, res) => {
    try {
      const { commentId } = req.params;
      const { userFid } = req.body;

      if (!userFid) {
        return res.status(400).json({ error: "User FID is required" });
      }

      // Get comment and verify permissions
      const comment = await storage.getStoryComment(commentId);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const story = await storage.getStory(comment.storyId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      // Only creator can approve comments
      if (story.creatorFid !== userFid) {
        return res.status(403).json({ error: "Only the story creator can approve comments" });
      }

      // Check if session is still active
      if (story.sessionStatus !== "active") {
        return res.status(400).json({ error: "Story session has ended" });
      }

      // Approve and incorporate the comment
      const result = await storage.approveAndIncorporateComment(commentId, userFid);
      res.json(result);
    } catch (error) {
      console.error("Error approving comment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Decline a comment
  app.post("/api/comments/:commentId/decline", async (req, res) => {
    try {
      const { commentId } = req.params;
      const { userFid } = req.body;

      if (!userFid) {
        return res.status(400).json({ error: "User FID is required" });
      }

      // Get comment and verify permissions
      const comment = await storage.getStoryComment(commentId);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const story = await storage.getStory(comment.storyId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      // Only creator can decline comments
      if (story.creatorFid !== userFid) {
        return res.status(403).json({ error: "Only the story creator can decline comments" });
      }

      // Decline the comment
      const updatedComment = await storage.declineComment(commentId);
      res.json(updatedComment);
    } catch (error) {
      console.error("Error declining comment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get pending comments for a story (creator only)
  app.get("/api/stories/:id/pending-comments", async (req, res) => {
    try {
      const { id: storyId } = req.params;
      const userFid = parseInt(req.query.userFid as string);

      if (!userFid) {
        return res.status(400).json({ error: "User FID is required" });
      }

      // Get story to verify creator
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      // Only creator can see pending comments
      if (story.creatorFid !== userFid) {
        return res.status(403).json({ error: "Only the story creator can view pending comments" });
      }

      const pendingComments = await storage.getPendingComments(storyId);
      res.json(pendingComments);
    } catch (error) {
      console.error("Error fetching pending comments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Cast sharing endpoint
  app.post("/api/stories/:id/share-to-farcaster", async (req, res) => {
    try {
      const { id: storyId } = req.params;
      const { userFid, castHash } = req.body;

      if (!userFid || !castHash) {
        return res.status(400).json({ error: "User FID and cast hash are required" });
      }

      // Update story with shared cast hash
      const result = await storage.updateStorySharedCast(storyId, userFid, castHash);
      res.json(result);
    } catch (error) {
      console.error("Error sharing to Farcaster:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Cast-based collaborative workflow endpoints
  app.post("/api/stories/:id/cast-comment", async (req, res) => {
    const { id: storyId } = req.params;
    const { commentCastHash, authorFid, content } = req.body;
    
    try {
      const comment = await storage.addCastComment({
        storyId,
        commentCastHash,
        authorFid,
        content
      });
      res.json(comment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/stories/:id/cast-comments", async (req, res) => {
    const { id: storyId } = req.params;
    const { status = "pending" } = req.query;
    
    const comments = await storage.getCastComments(storyId, status as string);
    res.json(comments);
  });

  app.post("/api/cast-comments/:id/approve", async (req, res) => {
    const { id: commentId } = req.params;
    const { userFid, weaveCastHash } = req.body;
    
    try {
      const result = await storage.approveCastComment(commentId, userFid, weaveCastHash);
      if (!result) {
        return res.status(404).json({ error: "Comment not found or unauthorized" });
      }
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/cast-comments/:id/decline", async (req, res) => {
    const { id: commentId } = req.params;
    const { userFid } = req.body;
    
    try {
      const success = await storage.declineCastComment(commentId, userFid);
      if (!success) {
        return res.status(404).json({ error: "Comment not found or unauthorized" });
      }
      res.json({ message: "Comment declined" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/stories/:id/weave-cast", async (req, res) => {
    const { id: storyId } = req.params;
    const { castHash, userFid } = req.body;
    
    try {
      const success = await storage.updateLatestWeaveCast(storyId, castHash, userFid);
      if (!success) {
        return res.status(404).json({ error: "Story not found or unauthorized" });
      }
      res.json({ message: "Weave cast updated successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Cast Action Metadata - Required for action installation
  app.get("/api/cast-actions/weave-story", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      name: "Weave My Part",
      icon: "paintbrush", 
      description: "Transform this cast into a collaborative story seed",
      aboutUrl: "https://worthifyme.in/about",
      action: {
        type: "post",
        postUrl: "https://worthifyme.in/api/cast-actions/weave-story"
      }
    });
  });

  /**
   * Cast Action Handler - Transforms Farcaster casts into collaborative stories
   * 
   * This endpoint processes Farcaster action requests when users click "Weave My Part"
   * on any cast. It creates a new collaborative story using the cast as a seed.
   * 
   * Request Format (Farcaster Action Spec):
   * - untrustedData: { fid, timestamp, castId: { hash, fid } }
   * - trustedData: { messageBytes } (signature verification)
   * 
   * Response Format (Frame Response):
   * - type: "frame"
   * - frameUrl: Link to the created story
   * - cast: Object with text and embeds to post back to Farcaster
   */
  app.post("/api/cast-actions/weave-story", async (req, res) => {
    try {
      console.log("Raw Farcaster action request:", JSON.stringify(req.body, null, 2));
      
      // Parse Farcaster action payload according to specification
      const { untrustedData, trustedData } = req.body;
      
      // Handle both Farcaster spec format and direct test format
      let triggerFid, castHash, castAuthorFid, timestamp;
      
      if (untrustedData) {
        // Official Farcaster action format
        triggerFid = untrustedData.fid;
        timestamp = untrustedData.timestamp;
        castHash = untrustedData.castId?.hash;
        castAuthorFid = untrustedData.castId?.fid;
      } else {
        // Direct test format (backwards compatibility)
        triggerFid = req.body.fid;
        castHash = req.body.castHash;
        castAuthorFid = req.body.authorFid;
        timestamp = req.body.timestamp;
      }
      
      console.log("Parsed action context:", { 
        triggerFid, castHash, castAuthorFid, timestamp 
      });
      
      // Validate required cast context
      if (!triggerFid || !castHash) {
        return res.status(400).json({ 
          error: "Invalid Farcaster action: missing required context" 
        });
      }
      
      // Check if user has Story Weaver mini app installed (for action availability)
      // Only users with the miniapp should see "Weave My Part" action
      
      if (triggerFid === 977521) {
        // Owner triggered - can create seed stories
        
        // For production, fetch cast details from Farcaster/Neynar API using castHash
        const castText = req.body.text || "A fascinating cast that sparked collaborative storytelling";
        const username = req.body.username || `storyweaver`;
        
        // Create collaborative story from seed cast
        const storyData = {
          creatorFid: 977521, // Story owner manages all stories
          title: `Story from Cast`,
          initialContent: `🌱 Story Seed:\n\n"${castText}"\n\n✨ This has been transformed into a collaborative story! Others can like this story to unlock commenting, then add their continuation. I'll review and incorporate the best contributions into our shared narrative.`,
          originalCastHash: castHash
        };
        
        const story = await storage.createStory(storyData);
        
        // Owner can immediately create and post weaved cast
        return res.json({
          type: "frame",
          frameUrl: `https://worthifyme.in/story/${story.id}`,
          cast: {
            text: `🧙‍♂️ Story Weaver: New collaborative story started!\n\n📖 "${castText.length > 120 ? castText.substring(0, 120) + "..." : castText}"\n\n✨ Join the weaving:`,
            embeds: [`https://worthifyme.in/story/${story.id}`],
            parent: castHash // Reply to original cast
          }
        });
      } else {
        // Non-owner users can see existing stories and comment via "Weave My Part" 
        // but only if they have the miniapp installed
        
        return res.status(403).json({
          error: "Only Story Weaver owner can create new seed stories. You can participate by commenting on existing stories!"
        });
      }
      
    } catch (error) {
      console.error("Error in Story Weaver action handler:", error);
      res.status(500).json({ 
        error: "Story weaving failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Cast share handler for when users select the miniapp
  app.get("/cast-share", (req, res) => {
    const { castHash, text } = req.query;
    
    // Ensure query params are strings
    const castHashStr = Array.isArray(castHash) ? castHash[0] : String(castHash || '');
    const textStr = Array.isArray(text) ? text[0] : String(text || '');
    
    // Redirect to the main app with cast data
    const redirectUrl = `https://worthifyme.in/?cast=${encodeURIComponent(castHashStr.toString())}&text=${encodeURIComponent(textStr.toString())}`;
    
    res.redirect(redirectUrl);
  });

  // About page for cast action
  app.get("/about", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Story Weaver - Collaborative Farcaster Storytelling</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                 max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; }
          .feature { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
          .workflow { background: #e8f4ff; border-left: 4px solid #8a63d2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🧙‍♂️ Story Weaver</h1>
          <p>Transform any Farcaster cast into a collaborative storytelling experience</p>
        </div>
        
        <div class="feature workflow">
          <h3>🌱 How Story Weaver Works</h3>
          <ol>
            <li><strong>Seed:</strong> Use the "Story Weaver" action on any cast to turn it into a story seed</li>
            <li><strong>Weave:</strong> We create a collaborative story starting with that cast's content</li>
            <li><strong>Collaborate:</strong> Users like the story to unlock commenting privileges</li>
            <li><strong>Grow:</strong> Story creators approve comments, incorporating them into the narrative</li>
            <li><strong>Share:</strong> Weaved stories get posted back to Farcaster for viral collaboration</li>
          </ol>
        </div>
        
        <div class="feature">
          <h3>✨ Features</h3>
          <ul>
            <li>Turn any cast into a collaborative story seed</li>
            <li>Like-to-comment permission system</li>
            <li>Creator-moderated content incorporation</li>
            <li>Native Farcaster cast integration</li>
            <li>Viral story sharing loops</li>
          </ul>
        </div>
        
        <div class="feature">
          <h3>🎯 Perfect For</h3>
          <ul>
            <li>Creative writing communities</li>
            <li>Interactive storytelling</li>
            <li>Collaborative world-building</li>
            <li>Community-driven narratives</li>
          </ul>
        </div>
        
        <p style="text-align: center; margin-top: 30px;">
          <a href="https://worthifyme.in" style="color: #8a63d2; text-decoration: none;">
            🏠 Visit Story Weaver →
          </a>
        </p>
      </body>
      </html>
    `);
  });

  const httpServer = createServer(app);
  return httpServer;
}
