/**
 * Server Routes - Main API Handler
 * 
 * This file contains all the API endpoints that handle requests from the frontend
 * and external services like Farcaster. It acts as the bridge between user interactions
 * and the database.
 * 
 * Key sections:
 * - Static file serving (images, manifests)
 * - Story management APIs
 * - User authentication APIs
 * - Comment and like system APIs
 * - Farcaster cast action integration
 * 
 * For detailed API documentation, see API_REFERENCE.md
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStorySegmentSchema, insertStoryLikeSchema, insertUserSchema, insertStorySchema, insertStoryCommentSchema, stories } from "@shared/schema";
import { z } from "zod";
import { generalRateLimit, contributionRateLimit } from "./middleware/rate-limiter";
import { serverNeynarClient } from "./lib/neynar";
import { URLEncryption } from "./lib/encryption";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Helper function to create Farcaster-friendly cast text
function createFarcasterCastText(title: string, content: string, storyId: string): string {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN ? 
    `https://${process.env.REPLIT_DEV_DOMAIN}` : 
    'https://storyweaver.replit.app';
  
  // Encrypt the story ID for URL security
  const encryptedStoryId = URLEncryption.encryptStoryId(storyId);
  const storyUrl = `${baseUrl}/story/${encryptedStoryId}`;
  
  // If the full content fits in a cast (320 chars with URL), use it
  const fullText = `📖 ${title}\n\n${content}\n\n🔗 Continue the story: ${storyUrl}`;
  
  if (fullText.length <= 320) {
    return fullText;
  }
  
  // Otherwise, create a snippet
  const availableChars = 320 - `📖 ${title}\n\n...\n\n🔗 Continue the story: ${storyUrl}`.length;
  const truncatedContent = content.length > availableChars ? 
    content.substring(0, availableChars - 3) + '...' : 
    content;
  
  return `📖 ${title}\n\n${truncatedContent}...\n\n🔗 Continue the story: ${storyUrl}`;
}

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

  // Image proxy endpoint to solve CORS issues
  app.get("/api/proxy/image", async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "URL parameter required" });
      }

      console.log(`Image proxy request for: ${url}`);
      
      // Validate URL to prevent SSRF
      const validDomains = ['i.imgur.com', 'wrpcd.net', 'imagedelivery.net', 'githubusercontent.com'];
      const urlObj = new URL(url);
      
      if (!validDomains.some(domain => urlObj.hostname.includes(domain))) {
        return res.status(403).json({ error: "Domain not allowed" });
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch image" });
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) {
        return res.status(400).json({ error: "URL does not point to an image" });
      }

      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      const imageBuffer = await response.arrayBuffer();
      res.send(Buffer.from(imageBuffer));
      
    } catch (error) {
      console.error("Image proxy error:", error);
      res.status(500).json({ 
        error: "Image proxy failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Cast Action Installation Endpoint
  app.get("/api/cast-actions", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    const baseUrl = process.env.REPLIT_DEV_DOMAIN ? 
      `https://${process.env.REPLIT_DEV_DOMAIN}` : 
      'https://worthifyme.in';
    
    res.json({
      "actions": [
        {
          "name": "Weave My Part",
          "icon": "magic-wand",
          "description": "Transform this cast into a collaborative story seed",
          "aboutUrl": `${baseUrl}/about`,
          "action": {
            "type": "post",
            "url": `${baseUrl}/api/cast-actions/weave-story`
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
  
  // Validate cast status endpoint
  app.get("/api/validate-cast/:hash", async (req, res) => {
    try {
      const { hash } = req.params;
      
      if (!hash) {
        return res.status(400).json({ error: "Cast hash required" });
      }
      
      const castExists = await serverNeynarClient.verifyCastExists(hash);
      const cast = castExists ? await serverNeynarClient.getCastByHash(hash) : null;
      
      res.json({
        exists: castExists,
        status: castExists ? "active" : "deleted",
        message: castExists 
          ? "Cast is active and accessible" 
          : "Cast has been deleted or is no longer accessible",
        cast: cast || null
      });
    } catch (error) {
      console.error("Error validating cast:", error);
      res.status(500).json({ 
        error: "Cast validation failed",
        exists: false,
        status: "error",
        message: "Unable to verify cast status due to API error"
      });
    }
  });

  // Get story with contributors (supports encrypted IDs)
  app.get("/api/stories/:id", async (req, res) => {
    try {
      let { id } = req.params;
      const viewerFid = req.query.viewerFid ? parseInt(req.query.viewerFid as string) : undefined;
      
      // Check if ID looks like a UUID (plain ID) or encrypted
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (!isUUID) {
        // Try to decrypt the ID if it doesn't look like a plain UUID
        try {
          const decryptedId = URLEncryption.decryptStoryId(id);
          if (decryptedId && decryptedId !== id) {
            id = decryptedId;
          }
        } catch (error) {
          return res.status(400).json({ error: "Invalid story ID format" });
        }
      }
      
      const story = await storage.getStoryWithContributors(id, viewerFid);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      // Add cast validation for stories with original cast hash
      if (story.originalCastHash) {
        try {
          const castExists = await serverNeynarClient.verifyCastExists(story.originalCastHash);
          story.castStatus = {
            exists: castExists,
            status: castExists ? "active" : "deleted",
            message: castExists 
              ? "Original cast is active" 
              : "⚠️ Warning: The original seed cast has been deleted from Farcaster"
          };
        } catch (error) {
          story.castStatus = {
            exists: false,
            status: "error",
            message: "Unable to verify original cast status"
          };
        }
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
      
      // Post to Farcaster when story is created from dashboard
      try {
        const { title, initialContent } = storyData;
        
        // Create a snippet version for Farcaster due to character limits
        const castText = createFarcasterCastText(title, initialContent, story.id);
        
        const castResult = await serverNeynarClient.publishCast(castText);
        
        if (castResult.success) {
          console.log('Story posted to Farcaster successfully:', castResult.cast?.hash);
          
          // Update the story with the cast hash if we get one back
          // Note: For simulated casts, we skip updating the hash
          if (castResult.cast?.hash && !castResult.cast.hash.startsWith('simulated_')) {
            await storage.updateStorySharedCast(story.id, creatorFid, castResult.cast.hash);
            console.log('Updated story with cast hash:', castResult.cast.hash);
          }
        } else {
          console.warn('Failed to post story to Farcaster:', castResult.error);
        }
      } catch (error) {
        console.error('Error posting to Farcaster:', error);
        // Don't fail the story creation if Farcaster posting fails
      }
      
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

  // Check if user is an owner/co-owner
  const isOwnerOrCoOwner = (userFid: number): boolean => {
    // Main owner
    if (userFid === 977521) return true;
    
    // TODO: Add co-owner check from database when table is ready
    // For now, only main owner has access
    return false;
  };

  // Get stories created from cast actions for dashboard
  app.get("/api/cast-stories", async (req, res) => {
    try {
      const { creatorFid } = req.query;
      
      if (!creatorFid || !isOwnerOrCoOwner(parseInt(creatorFid as string))) {
        return res.status(403).json({ error: "Unauthorized access to cast stories" });
      }
      
      const castStories = await storage.getCastStories();
      
      // Verify original casts still exist and add validation status
      const validatedStories = await Promise.all(
        castStories.map(async (story) => {
          let castStatus = "exists";
          let castValidationMessage = "";
          
          if (story.originalCastHash) {
            try {
              const castExists = await serverNeynarClient.verifyCastExists(story.originalCastHash);
              if (!castExists) {
                castStatus = "deleted";
                castValidationMessage = "⚠️ Original seed cast has been deleted from Farcaster";
              }
            } catch (error) {
              castStatus = "error";
              castValidationMessage = "❌ Unable to verify cast status";
              console.warn(`Error verifying cast ${story.originalCastHash}:`, error);
            }
          } else {
            castStatus = "no_cast";
            castValidationMessage = "📝 Created directly (not from cast action)";
          }
          
          return {
            ...story,
            castStatus,
            castValidationMessage
          };
        })
      );
      
      res.json(validatedStories);
    } catch (error) {
      console.error("Error fetching cast stories:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get pending comments for a specific story
  app.get("/api/stories/:storyId/pending-comments", async (req, res) => {
    try {
      const { storyId } = req.params;
      const { creatorFid } = req.query;
      
      if (!creatorFid || !isOwnerOrCoOwner(parseInt(creatorFid as string))) {
        return res.status(403).json({ error: "Unauthorized access to pending comments" });
      }
      
      const [storyComments, castComments] = await Promise.all([
        storage.getStoryPendingComments(storyId),
        storage.getCastCommentsByStoryId(storyId)
      ]);
      
      res.json({
        storyComments,
        castComments
      });
    } catch (error) {
      console.error("Error fetching pending comments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Approve a story comment
  app.post("/api/comments/:commentId/approve", async (req, res) => {
    try {
      const { commentId } = req.params;
      const { userFid } = req.body;
      
      if (!userFid || !isOwnerOrCoOwner(userFid)) {
        return res.status(403).json({ error: "Only Story Weaver owners can approve comments" });
      }
      
      const result = await storage.approveAndIncorporateComment(commentId, userFid);
      if (!result) {
        return res.status(404).json({ error: "Comment not found or cannot be approved" });
      }
      
      res.json({ success: true, comment: result.comment, segment: result.segment });
    } catch (error) {
      console.error("Error approving comment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Reject a story comment
  app.post("/api/comments/:commentId/reject", async (req, res) => {
    try {
      const { commentId } = req.params;
      const { userFid } = req.body;
      
      if (!userFid || !isOwnerOrCoOwner(userFid)) {
        return res.status(403).json({ error: "Only Story Weaver owners can reject comments" });
      }
      
      const result = await storage.declineComment(commentId);
      if (!result) {
        return res.status(404).json({ error: "Comment not found" });
      }
      
      res.json({ success: true, comment: result });
    } catch (error) {
      console.error("Error rejecting comment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Approve a cast comment
  app.post("/api/cast-comments/:commentId/approve", async (req, res) => {
    try {
      const { commentId } = req.params;
      const { userFid, weaveCastHash } = req.body;
      
      if (!userFid || userFid !== 977521) {
        return res.status(403).json({ error: "Only the Story Weaver owner can approve cast comments" });
      }
      
      const result = await storage.approveCastComment(commentId, userFid, weaveCastHash || `weave_${Date.now()}`);
      if (!result) {
        return res.status(404).json({ error: "Cast comment not found or cannot be approved" });
      }
      
      res.json({ success: true, comment: result });
    } catch (error) {
      console.error("Error approving cast comment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Reject a cast comment
  app.post("/api/cast-comments/:commentId/reject", async (req, res) => {
    try {
      const { commentId } = req.params;
      const { userFid } = req.body;
      
      if (!userFid || userFid !== 977521) {
        return res.status(403).json({ error: "Only the Story Weaver owner can reject cast comments" });
      }
      
      const result = await storage.declineCastComment(commentId, userFid);
      if (!result) {
        return res.status(404).json({ error: "Cast comment not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting cast comment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Remove/delete a story (admin only)
  app.delete("/api/stories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { userFid } = req.body;
      
      if (!userFid || userFid !== 977521) {
        return res.status(403).json({ error: "Only the Story Weaver owner can delete stories" });
      }
      
      const success = await storage.deleteStory(id);
      if (!success) {
        return res.status(404).json({ error: "Story not found" });
      }
      
      res.json({ success: true, message: "Story deleted successfully" });
    } catch (error) {
      console.error("Error deleting story:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Complete story and post to Farcaster
  app.post("/api/stories/:storyId/complete", async (req, res) => {
    try {
      const { storyId } = req.params;
      const { userFid } = req.body;
      
      if (!userFid || !isOwnerOrCoOwner(userFid)) {
        return res.status(403).json({ error: "Only Story Weaver owners can complete stories" });
      }
      
      // Complete the story and get full content
      const result = await storage.completeStory(storyId, userFid);
      const { story, completeContent } = result;
      
      // Generate summary for Farcaster post
      const maxLength = 280; // Farcaster character limit
      let summary = completeContent;
      
      // If content is too long, create a summary
      if (completeContent.length > maxLength - 50) { // Leave room for link
        // Try to get the first paragraph or sentence
        const firstParagraph = completeContent.split('\n\n')[0];
        if (firstParagraph.length <= maxLength - 50) {
          summary = firstParagraph + "...";
        } else {
          // Truncate to fit
          summary = completeContent.substring(0, maxLength - 50) + "...";
        }
      }
      
      // Create Farcaster post content
      const baseUrl = process.env.REPLIT_DEV_DOMAIN ? 
        `https://${process.env.REPLIT_DEV_DOMAIN}` : 
        'https://worthifyme.in';
      const encryptedStoryId = URLEncryption.encryptStoryId(story.id);
      const storyUrl = `${baseUrl}/story/${encryptedStoryId}`;
      
      const castText = `📖 Story Complete: "${story.title}"\n\n${summary}\n\nRead the full collaborative story: ${storyUrl}`;
      
      // Post to Farcaster using Neynar API
      try {
        // For now, return the cast content - implement actual posting when ready
        const finalCastHash = `final_${story.id}_${Date.now()}`;
        
        // Update story with final cast hash
        await db
          .update(stories)
          .set({ 
            finalCastHash,
            updatedAt: new Date()
          })
          .where(eq(stories.id, story.id));
        
        res.json({ 
          success: true, 
          story: { ...story, finalCastHash },
          castText,
          storyUrl,
          message: "Story completed successfully! Cast content generated for Farcaster posting."
        });
        
      } catch (castError) {
        console.error("Error posting to Farcaster:", castError);
        // Story is still completed, just posting failed
        res.json({ 
          success: true, 
          story,
          message: "Story completed successfully, but Farcaster posting failed. You can manually share the story.",
          castText,
          storyUrl
        });
      }
      
    } catch (error) {
      console.error("Error completing story:", error);
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

  // CORS preflight for cast actions
  app.options("/api/cast-actions/weave-story", (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
  });

  // Cast Action Metadata - Required for action installation
  app.get("/api/cast-actions/weave-story", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    console.log("Action metadata requested from:", req.get('User-Agent'));
    
    // Official Farcaster Actions specification format
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
   * Response Format (Farcaster Action Response):
   * - type: "message" with message < 80 characters
   * - Optional: link field for external URL
   */
  
  // Helper function to validate and truncate message to 80 characters
  function validateActionMessage(message: string): string {
    if (message.length <= 80) return message;
    
    // Truncate and add ellipsis while staying under 80 chars
    return message.substring(0, 77) + "...";
  }
  app.post("/api/cast-actions/weave-story", async (req, res) => {
    // Set CORS headers for action responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    try {
      console.log("=== Cast Action Request Debug ===");
      console.log("User-Agent:", req.get('User-Agent'));
      console.log("Content-Type:", req.get('Content-Type'));
      console.log("Origin:", req.get('Origin'));
      console.log("Body keys:", Object.keys(req.body || {}));
      console.log("Body:", JSON.stringify(req.body, null, 2));
      
      // Check if this is a valid Farcaster frame message
      const hasFrameMessage = req.body?.trustedData?.messageBytes || req.body?.untrustedData;
      console.log("Has Frame Message Format:", hasFrameMessage);
      console.log("================================");
      
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
        return res.json({
          type: "message",
          message: validateActionMessage("Invalid action context")
        });
      }
      
      // Check if user has Story Weaver mini app installed (for action availability)
      // Only users with the miniapp should see "Weave My Part" action
      
      // Fetch the cast content to determine context and action
      let cast = null;
      try {
        cast = await serverNeynarClient.getCastByHash(castHash);
      } catch (error) {
        console.warn("Neynar API error, proceeding with fallback:", error);
        // Continue with fallback logic when API fails
      }
      
      if (!cast) {
        // Try to get cast from the request body context
        cast = {
          text: req.body.cast?.text || "A fascinating story seed from a Farcaster cast",
          author: { fid: castAuthorFid || triggerFid },
          hash: castHash,
          parent_hash: req.body.cast?.parent_hash || null
        };
      }

      // Check if this cast is a reply to an existing story seed cast (including own replies)
      if (cast.parent_hash) {
        console.log("Cast is a reply, checking for parent story...");
        
        // Look for existing story with this parent cast hash
        const existingStory = await storage.getStoryByCastHash(cast.parent_hash);
        
        if (existingStory) {
          console.log("Found parent story:", existingStory.id);
          
          // This is a reply to a story seed cast - save as cast comment for approval
          try {
            const user = await storage.getUserByFid(triggerFid);
            if (!user) {
              // Create user if doesn't exist - handle API errors gracefully
              try {
                const neynarUser = await serverNeynarClient.getUserByFid(triggerFid);
                if (neynarUser) {
                  await storage.createUser({
                    fid: triggerFid,
                    username: neynarUser.username,
                    displayName: neynarUser.display_name,
                    pfpUrl: neynarUser.pfp_url
                  });
                }
              } catch (apiError) {
                console.warn("Failed to fetch user from Neynar, creating with FID only:", apiError);
                // Create minimal user record
                await storage.createUser({
                  fid: triggerFid,
                  username: `user${triggerFid}`,
                  displayName: `User ${triggerFid}`,
                  pfpUrl: null
                });
              }
            }

            // Save the reply as a cast comment for owner approval
            await storage.addCastComment({
              storyId: existingStory.id,
              commentCastHash: castHash,
              authorFid: triggerFid,
              content: cast.text,
              approvalStatus: "pending"
            });

            console.log("Saved cast comment for approval");

            // Encrypt story ID for secure link
            const encryptedStoryId = URLEncryption.encryptStoryId(existingStory.id);
            const baseUrl = process.env.REPLIT_DEV_DOMAIN ? 
              `https://${process.env.REPLIT_DEV_DOMAIN}` : 
              'https://storyweaver.replit.app';

            return res.json({
              type: "message",
              message: validateActionMessage("📖 Story Part Added"),
              link: `${baseUrl}/story/${encryptedStoryId}`
            });

          } catch (error) {
            console.error("Error saving cast comment:", error);
            return res.json({
              type: "message",
              message: validateActionMessage("Error saving your contribution. Please try again.")
            });
          }
        }
      }

      if (triggerFid === 977521) {
        // Owner triggered - can create seed stories
        
        // Check if a story already exists for this cast
        const existingStory = await storage.getStoryByCastHash(castHash);
        if (existingStory) {
          const baseUrl = process.env.REPLIT_DEV_DOMAIN ? 
            `https://${process.env.REPLIT_DEV_DOMAIN}` : 
            'https://storyweaver.replit.app';
          const encryptedStoryId = URLEncryption.encryptStoryId(existingStory.id);
          const message = `🔗 Story already exists!`;
          return res.json({
            type: "message",
            message: validateActionMessage(message),
            link: `${baseUrl}/story/${encryptedStoryId}`
          });
        }
        
        // Use cast content if available, otherwise fallback
        const castText = cast?.text || req.body.text || "A fascinating cast that sparked collaborative storytelling";
        const username = cast?.author?.username || req.body.username || `storyweaver`;
        
        // Create collaborative story from seed cast
        const storyData = {
          creatorFid: 977521, // Story owner manages all stories
          title: `Story from Cast`,
          initialContent: `🌱 Story Seed:\n\n"${castText}"\n\n✨ This has been transformed into a collaborative story! Others can like this story to unlock commenting, then add their continuation. I'll review and incorporate the best contributions into our shared narrative.`,
          originalCastHash: castHash
        };
        
        const story = await storage.createStory(storyData);
        
        // Return proper cast action JSON response (80 char limit)
        const baseUrl = process.env.REPLIT_DEV_DOMAIN ? 
          `https://${process.env.REPLIT_DEV_DOMAIN}` : 
          'https://storyweaver.replit.app';
        const encryptedStoryId = URLEncryption.encryptStoryId(story.id);
        const message = `🧙‍♂️ New story created!`;
        return res.json({
          type: "message",
          message: validateActionMessage(message),
          link: `${baseUrl}/story/${encryptedStoryId}`
        });
      } else {
        // Non-owner users can comment on existing stories via "Weave My Part"
        
        // Check if there's an existing story for this cast
        const existingStory = await storage.getStoryByCastHash(castHash);
        
        if (existingStory) {
          // User is contributing to an existing story
          // For now, we'll create a generic comment that the owner can review
          const castText = req.body.text || "Contributed to the collaborative story";
          
          // Create a pending comment for owner approval
          const commentData = {
            storyId: existingStory.id,
            authorFid: triggerFid,
            content: `🎭 Cast Action Contribution:\n\n"${castText}"\n\n✨ This contribution was submitted via the Weave My Part action and awaits approval to be incorporated into the story.`,
            approvalStatus: "pending" as const,
            castHash: castHash
          };
          
          const comment = await storage.createStoryComment(commentData);
          
          // Also create cast comment for the enhanced workflow
          const castCommentData = {
            storyId: existingStory.id,
            commentCastHash: castHash,
            authorFid: triggerFid,
            content: `🎭 Cast Action Contribution:\n\n"${castText}"\n\n✨ This contribution was submitted via the Weave My Part action and awaits approval to be incorporated into the story.`,
            approvalStatus: "pending" as const
          };
          
          await storage.addCastComment(castCommentData);
          
          const baseUrl = process.env.REPLIT_DEV_DOMAIN ? 
            `https://${process.env.REPLIT_DEV_DOMAIN}` : 
            'https://storyweaver.replit.app';
          const encryptedStoryId = URLEncryption.encryptStoryId(existingStory.id);
          const message = `📖 Story Part Added`;
          return res.json({
            type: "message",
            message: validateActionMessage(message),
            link: `${baseUrl}/story/${encryptedStoryId}`
          });
        } else {
          // No existing story for this cast - suggest they can participate in existing stories
          const baseUrl = process.env.REPLIT_DEV_DOMAIN ? 
            `https://${process.env.REPLIT_DEV_DOMAIN}` : 
            'https://storyweaver.replit.app';
          const message = `🧙‍♂️ No story yet! Explore existing stories.`;
          return res.json({
            type: "message",
            message: validateActionMessage(message),
            link: baseUrl
          });
        }
      }
      
    } catch (error) {
      console.error("=== Cast Action Error Debug ===");
      console.error("Error:", error);
      console.error("Stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("Request body:", JSON.stringify(req.body, null, 2));
      console.error("Request headers:", JSON.stringify(req.headers, null, 2));
      console.error("===============================");
      
      // Return error response (also limited to 80 characters)
      const errorMessage = error instanceof Error ? error.message : "Story weaving failed";
      res.json({ 
        type: "message",
        message: validateActionMessage("Something went wrong. Please try again.")
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
