import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';

// Allow max 20 requests per minute per IP address
const MAX_REQUESTS = 20;
const WINDOW_SECONDS = 60;

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Use the caller's IP address as the key
  const ip = req.ip || 'unknown';
  const key = `rate:${ip}`;

  // INCR does two things: creates the key if it doesn't exist (starting at 0),
  // then increments it by 1. Returns the new value.
  const requests = await redis.incr(key);

  if (requests === 1) {
    // First request from this IP — set the 60 second expiry window
    // EXPIRE only set on first request so the window doesn't reset on every call
    await redis.expire(key, WINDOW_SECONDS);
  }

  if (requests > MAX_REQUESTS) {
    res.status(429).json({
      message: 'Too many requests, please slow down',
    });
    return;
  }

  // Tell the client how many requests they have left
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - requests));

  next();
};