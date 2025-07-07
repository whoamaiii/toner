/**
 * Centralized error handling utilities for the TonerWeb AI Assistant.
 * 
 * This module provides standardized error handling, response formatting,
 * and error classification for consistent API responses.
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import { Response } from "express";
import { ZodError } from "zod";
import { logger } from "@shared/logger";

export interface ErrorResponse {
  message: string;
  error?: string;
  details?: any;
  timestamp: string;
  statusCode: number;
}

export interface ErrorContext {
  operation?: string;
  userId?: string;
  requestId?: string;
  additionalData?: any;
}

/**
 * Custom error class for application-specific errors.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: ErrorContext;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: ErrorContext
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * API-specific error types for better error handling.
 */
export class APIError extends AppError {
  constructor(message: string, statusCode: number = 500, context?: ErrorContext) {
    super(message, statusCode, true, context);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any, context?: ErrorContext) {
    super(message, 400, true, context);
    this.context = { ...context, details };
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', context?: ErrorContext) {
    super(message, 401, true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: ErrorContext) {
    super(message, 429, true, context);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable', context?: ErrorContext) {
    super(message, 503, true, context);
  }
}

/**
 * Classifies errors and determines appropriate HTTP status codes.
 */
export function classifyError(error: any): { statusCode: number; message: string; details?: any } {
  // Handle custom app errors
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      details: error.context
    };
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      message: 'Invalid request data',
      details: error.errors
    };
  }

  // Handle specific error patterns
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('401') || message.includes('no auth credentials')) {
      return {
        statusCode: 401,
        message: 'API authentication failed'
      };
    }
    
    if (message.includes('429') || message.includes('rate limit')) {
      return {
        statusCode: 429,
        message: 'Rate limit exceeded'
      };
    }
    
    if (message.includes('econnrefused') || message.includes('fetch failed')) {
      return {
        statusCode: 503,
        message: 'Service unavailable'
      };
    }
    
    if (message.includes('timeout')) {
      return {
        statusCode: 504,
        message: 'Request timeout'
      };
    }
  }

  // Default to internal server error
  return {
    statusCode: 500,
    message: 'Internal server error'
  };
}

/**
 * Formats error responses consistently.
 */
export function formatErrorResponse(
  error: any,
  operation?: string,
  includeStack: boolean = false
): ErrorResponse {
  const classification = classifyError(error);
  
  const response: ErrorResponse = {
    message: classification.message,
    statusCode: classification.statusCode,
    timestamp: new Date().toISOString()
  };

  // Add error details for client debugging
  if (error instanceof Error) {
    response.error = error.message;
    
    if (includeStack && process.env.NODE_ENV === 'development') {
      response.details = {
        stack: error.stack,
        name: error.name,
        operation
      };
    }
  }

  // Add classification details
  if (classification.details) {
    response.details = classification.details;
  }

  return response;
}

/**
 * Sends standardized error response to client.
 */
export function sendErrorResponse(
  res: Response,
  error: any,
  operation?: string,
  context?: ErrorContext
): void {
  const errorResponse = formatErrorResponse(error, operation, true);
  
  // Log error with proper context
  logger.error('API Error', {
    operation,
    statusCode: errorResponse.statusCode,
    message: errorResponse.message,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    context
  });

  // Only send response if headers haven't been sent
  if (!res.headersSent) {
    res.status(errorResponse.statusCode).json(errorResponse);
  }
}

/**
 * Async error handler wrapper for Express routes.
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handler middleware for Express.
 */
export function globalErrorHandler(err: any, req: any, res: Response, next: any) {
  // Don't handle if response already sent
  if (res.headersSent) {
    return next(err);
  }

  sendErrorResponse(res, err, `${req.method} ${req.path}`, {
    operation: `${req.method} ${req.path}`,
    requestId: req.headers['x-request-id'] as string,
    userId: req.user?.id,
    additionalData: {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      body: req.body ? Object.keys(req.body) : undefined
    }
  });
}

/**
 * Validates that all required environment variables are present.
 */
export function validateEnvironment(requiredVars: string[]): void {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new AppError(
      `Missing required environment variables: ${missing.join(', ')}`,
      500,
      false,
      { operation: 'environment-validation', missing }
    );
  }
}

/**
 * Creates a timeout wrapper for async operations.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new AppError(
          `Operation timed out after ${timeoutMs}ms`,
          504,
          true,
          { operation, timeout: timeoutMs }
        ));
      }, timeoutMs);
    })
  ]);
}