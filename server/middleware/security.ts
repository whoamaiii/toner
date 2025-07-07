/**
 * Security middleware for the TonerWeb AI Assistant.
 * 
 * This module provides rate limiting, input validation, and other security
 * measures to protect the API from abuse and malicious requests.
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from "express";
import { logger } from "@shared/logger";
import { CONFIG } from "../config";
import { AppError } from "../error-handler";

// Simple in-memory rate limiter (use Redis in production)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple rate limiting middleware.
 * 
 * This is a basic implementation suitable for development/small deployments.
 * For production, use a more robust solution like express-rate-limit with Redis.
 */
export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowStart = now - CONFIG.security.RATE_LIMIT_WINDOW;
  
  // Clean up old entries
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < windowStart) {
      rateLimitStore.delete(key);
    }
  }
  
  const entry = rateLimitStore.get(clientIP);
  
  if (!entry) {
    // First request from this IP
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now + CONFIG.security.RATE_LIMIT_WINDOW
    });
    next();
    return;
  }
  
  if (entry.resetTime < now) {
    // Window has expired, reset
    entry.count = 1;
    entry.resetTime = now + CONFIG.security.RATE_LIMIT_WINDOW;
    next();
    return;
  }
  
  if (entry.count >= CONFIG.security.RATE_LIMIT_MAX_REQUESTS) {
    // Rate limit exceeded
    logger.warn('Rate limit exceeded', { 
      ip: clientIP,
      count: entry.count,
      path: req.path
    });
    
    res.status(429).json({
      message: 'Too many requests',
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    });
    return;
  }
  
  // Increment counter
  entry.count++;
  next();
}

/**
 * Input validation middleware for text content.
 */
export function validateTextInput(maxLength: number = CONFIG.security.MAX_MESSAGE_LENGTH) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      throw new AppError('Message is required and must be a string', 400);
    }
    
    if (message.length > maxLength) {
      throw new AppError(
        `Message too long. Maximum length is ${maxLength} characters.`,
        400
      );
    }
    
    // Basic content validation
    if (message.trim().length === 0) {
      throw new AppError('Message cannot be empty', 400);
    }
    
    // Check for suspicious patterns (basic)
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(message)) {
        logger.warn('Suspicious content detected', {
          ip: req.ip,
          pattern: pattern.source,
          message: message.substring(0, 100)
        });
        throw new AppError('Invalid content detected', 400);
      }
    }
    
    next();
  };
}

/**
 * Image validation middleware.
 */
export function validateImageInput(req: Request, res: Response, next: NextFunction): void {
  const { image } = req.body;
  
  if (!image) {
    next();
    return;
  }
  
  if (typeof image !== 'string') {
    throw new AppError('Image must be a base64 string', 400);
  }
  
  // Validate data URL format
  const dataUrlMatch = image.match(/^data:([a-zA-Z0-9][a-zA-Z0-9!#$&-^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&-^_]*);base64,(.+)$/);
  
  if (!dataUrlMatch) {
    throw new AppError('Invalid image format. Must be a valid data URL.', 400);
  }
  
  const mimeType = dataUrlMatch[1];
  const base64Data = dataUrlMatch[2];
  
  // Check allowed MIME types
  if (!CONFIG.security.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    throw new AppError(
      `Unsupported image type: ${mimeType}. Allowed types: ${CONFIG.security.ALLOWED_IMAGE_TYPES.join(', ')}`,
      400
    );
  }
  
  // Estimate file size (base64 is roughly 4/3 the size of original)
  const estimatedSize = (base64Data.length * 3) / 4;
  
  if (estimatedSize > CONFIG.security.MAX_IMAGE_SIZE) {
    throw new AppError(
      `Image too large. Maximum size is ${CONFIG.security.MAX_IMAGE_SIZE / 1024 / 1024}MB.`,
      400
    );
  }
  
  next();
}

/**
 * Request logging middleware for security monitoring.
 */
export function securityLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  // Log security-relevant request details
  logger.debug('Security check', {
    ip: req.ip,
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent'],
    hasBody: !!req.body,
    contentLength: req.headers['content-length']
  });
  
  // Monitor response for security issues
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    if (res.statusCode >= 400) {
      logger.warn('Security event', {
        ip: req.ip,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userAgent: req.headers['user-agent']
      });
    }
  });
  
  next();
}

/**
 * CORS configuration middleware.
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  if (origin && CONFIG.security.CORS_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  if (CONFIG.security.CORS_CREDENTIALS) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
}

/**
 * Basic security headers middleware.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CSP for API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Security-Policy', "default-src 'none'");
  }
  
  next();
}

/**
 * Request timeout middleware.
 */
export function requestTimeout(timeout: number = CONFIG.app.REQUEST_TIMEOUT) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          ip: req.ip,
          method: req.method,
          path: req.path,
          timeout
        });
        
        res.status(504).json({
          message: 'Request timeout',
          error: 'The request took too long to process'
        });
      }
    }, timeout);
    
    // Clear timeout when response is finished
    res.on('finish', () => {
      clearTimeout(timer);
    });
    
    res.on('close', () => {
      clearTimeout(timer);
    });
    
    next();
  };
}

/**
 * Health check for security middleware.
 */
export function getSecurityHealth(): {
  rateLimiter: boolean;
  activeConnections: number;
  blockedRequests: number;
} {
  return {
    rateLimiter: true,
    activeConnections: rateLimitStore.size,
    blockedRequests: Array.from(rateLimitStore.values())
      .filter(entry => entry.count >= CONFIG.security.RATE_LIMIT_MAX_REQUESTS)
      .length
  };
}