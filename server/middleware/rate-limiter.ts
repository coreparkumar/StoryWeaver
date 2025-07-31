import type { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export function createRateLimit(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = (req.ip || req.socket.remoteAddress || 'unknown').toString();
    const now = Date.now();
    
    // Clean up expired entries
    const entries = Array.from(rateLimitStore.entries());
    for (const [k, v] of entries) {
      if (now > v.resetTime) {
        rateLimitStore.delete(k);
      }
    }
    
    const record = rateLimitStore.get(key);
    
    if (!record) {
      // First request from this IP
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return next();
    }
    
    if (now > record.resetTime) {
      // Window has expired, reset
      record.count = 1;
      record.resetTime = now + config.windowMs;
      return next();
    }
    
    if (record.count >= config.maxRequests) {
      // Rate limit exceeded
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds.`
      });
    }
    
    // Increment counter
    record.count++;
    next();
  };
}

// Pre-configured rate limiters
export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // 100 requests per 15 minutes
});

export const storyCreationRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5 // 5 story creations per hour
});

export const contributionRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10 // 10 contributions per minute
});