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

// Pre-configured rate limiters - more lenient for development
export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000 // increased from 100 to 1000 for development
});

export const storyCreationRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20 // increased from 5 to 20 for development
});

export const contributionRateLimit = createRateLimit({
  windowMs: 10 * 1000, // 10 seconds - much shorter window
  maxRequests: 100 // very high limit for testing
});