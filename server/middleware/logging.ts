/**
 * HTTP request logging middleware for the TonerWeb AI Assistant.
 * 
 * This module provides comprehensive request tracking including:
 * - Request/response logging with timing
 * - Performance monitoring and alerting
 * - Error tracking and correlation
 * - User agent and IP tracking
 * - Request ID generation for tracing
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../shared/logging/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extended Request interface with logging context.
 */
export interface RequestWithContext extends Request {
  requestId: string;
  startTime: number;
  logger: ReturnType<typeof logger.child>;
}

/**
 * Interface for request log data.
 */
interface RequestLogData {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  contentLength?: number;
  query?: any;
  params?: any;
}

/**
 * Interface for response log data.
 */
interface ResponseLogData extends RequestLogData {
  statusCode: number;
  duration: number;
  contentLength?: number;
  error?: boolean;
}

/**
 * Configuration for request logging middleware.
 */
export interface RequestLoggingOptions {
  /**
   * Whether to log request bodies (be careful with sensitive data)
   */
  logRequestBody?: boolean;
  
  /**
   * Whether to log response bodies (can be expensive for large responses)
   */
  logResponseBody?: boolean;
  
  /**
   * Maximum size of request/response body to log (in bytes)
   */
  maxBodySize?: number;
  
  /**
   * Threshold for slow request warnings (in milliseconds)
   */
  slowRequestThreshold?: number;
  
  /**
   * Whether to log query parameters
   */
  logQueryParams?: boolean;
  
  /**
   * Whether to log route parameters
   */
  logParams?: boolean;
  
  /**
   * Custom header fields to include in logs
   */
  customHeaders?: string[];
  
  /**
   * Paths to exclude from logging (e.g., health checks)
   */
  excludePaths?: string[];
}

/**
 * Default configuration for request logging.
 */
const DEFAULT_OPTIONS: RequestLoggingOptions = {
  logRequestBody: false,
  logResponseBody: false,
  maxBodySize: 1024, // 1KB
  slowRequestThreshold: 5000, // 5 seconds
  logQueryParams: true,
  logParams: true,
  customHeaders: ['user-agent', 'referer', 'x-forwarded-for'],
  excludePaths: ['/health', '/ping', '/favicon.ico'],
};

/**
 * Creates HTTP request logging middleware.
 * 
 * This middleware:
 * - Generates unique request IDs for tracing
 * - Logs incoming requests with timing
 * - Tracks response status and duration
 * - Identifies slow requests and errors
 * - Provides request-scoped logger instances
 * 
 * @param {RequestLoggingOptions} options - Middleware configuration options
 * @returns {Function} Express middleware function
 */
export function createRequestLoggingMiddleware(
  options: RequestLoggingOptions = {}
): (req: RequestWithContext, res: Response, next: NextFunction) => void {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return (req: RequestWithContext, res: Response, next: NextFunction) => {
    // Skip logging for excluded paths
    if (config.excludePaths?.includes(req.path)) {
      return next();
    }

    // Generate unique request ID and set timing
    req.requestId = uuidv4();
    req.startTime = Date.now();

    // Create request-scoped logger
    req.logger = logger.child({ requestId: req.requestId });

    // Collect request information
    const requestData = collectRequestData(req, config);
    
    // Log incoming request
    req.logger.request('Request received', requestData);

    // Capture original response methods for interception
    const originalJson = res.json;
    const originalSend = res.send;
    const originalEnd = res.end;

    let responseBody: any = null;
    let responseSent = false;

    // Intercept res.json to capture response data
    res.json = function (this: Response, body: any) {
      if (config.logResponseBody && !responseSent) {
        responseBody = body;
      }
      return originalJson.call(this, body);
    };

    // Intercept res.send to capture response data
    res.send = function (this: Response, body: any) {
      if (config.logResponseBody && !responseSent && typeof body === 'string') {
        try {
          responseBody = JSON.parse(body);
        } catch {
          responseBody = body.slice(0, config.maxBodySize || 1024);
        }
      }
      return originalSend.call(this, body);
    };

    // Intercept res.end to ensure we capture all responses
    res.end = function (this: Response, chunk?: any, encoding?: any) {
      if (!responseSent) {
        responseSent = true;
        logResponse();
      }
      return originalEnd.call(this, chunk, encoding);
    };

    // Log response when finished
    res.on('finish', () => {
      if (!responseSent) {
        responseSent = true;
        logResponse();
      }
    });

    // Log response when connection is closed
    res.on('close', () => {
      if (!responseSent) {
        responseSent = true;
        req.logger.warn('Request connection closed before response completed', {
          method: req.method,
          url: req.originalUrl,
          duration: Date.now() - req.startTime,
        });
      }
    });

    function logResponse() {
      const duration = Date.now() - req.startTime;
      const responseData = collectResponseData(req, res, duration, config, responseBody);
      
      // Determine log level based on status code and duration
      const { error: _, ...logData } = responseData; // Remove error boolean for logging
      
      if (res.statusCode >= 500) {
        req.logger.error('Request completed with server error', undefined, logData);
      } else if (res.statusCode >= 400) {
        req.logger.warn('Request completed with client error', logData);
      } else if (duration > (config.slowRequestThreshold || 5000)) {
        req.logger.warn('Slow request detected', logData);
      } else {
        req.logger.info('Request completed', logData);
      }

      // Log performance metric
      req.logger.performance({
        operation: `${req.method} ${req.route?.path || req.path}`,
        duration,
        success: res.statusCode < 400,
        details: {
          statusCode: res.statusCode,
          method: req.method,
          path: req.path,
        },
      });
    }

    next();
  };
}

/**
 * Collects request data for logging.
 * 
 * @param {RequestWithContext} req - Express request object
 * @param {RequestLoggingOptions} config - Middleware configuration
 * @returns {RequestLogData} Request data for logging
 */
function collectRequestData(req: RequestWithContext, config: RequestLoggingOptions): RequestLogData {
  const data: RequestLogData = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: getClientIp(req),
    userAgent: req.get('user-agent'),
  };

  // Add query parameters if enabled
  if (config.logQueryParams && Object.keys(req.query).length > 0) {
    data.query = req.query;
  }

  // Add route parameters if enabled
  if (config.logParams && Object.keys(req.params).length > 0) {
    data.params = req.params;
  }

  // Add content length if available
  const contentLength = req.get('content-length');
  if (contentLength) {
    data.contentLength = parseInt(contentLength, 10);
  }

  return data;
}

/**
 * Collects response data for logging.
 * 
 * @param {RequestWithContext} req - Express request object
 * @param {Response} res - Express response object
 * @param {number} duration - Request duration in milliseconds
 * @param {RequestLoggingOptions} config - Middleware configuration
 * @param {any} responseBody - Response body if captured
 * @returns {ResponseLogData} Response data for logging
 */
function collectResponseData(
  req: RequestWithContext,
  res: Response,
  duration: number,
  config: RequestLoggingOptions,
  responseBody: any
): ResponseLogData {
  const data: ResponseLogData = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration,
    error: res.statusCode >= 400,
    ip: getClientIp(req),
    userAgent: req.get('user-agent'),
  };

  // Add response content length if available
  const contentLength = res.get('content-length');
  if (contentLength) {
    data.contentLength = parseInt(contentLength, 10);
  }

  // Add query parameters if enabled
  if (config.logQueryParams && Object.keys(req.query).length > 0) {
    data.query = req.query;
  }

  // Add route parameters if enabled
  if (config.logParams && Object.keys(req.params).length > 0) {
    data.params = req.params;
  }

  return data;
}

/**
 * Extracts client IP address from request.
 * 
 * @param {Request} req - Express request object
 * @returns {string} Client IP address
 */
function getClientIp(req: Request): string {
  // Try various headers that might contain the real IP
  const xForwardedFor = req.get('x-forwarded-for');
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = req.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }

  const xClientIp = req.get('x-client-ip');
  if (xClientIp) {
    return xClientIp;
  }

  // Fall back to connection remote address
  return req.ip || req.connection.remoteAddress || 'unknown';
}

/**
 * Simple request logging middleware with default options.
 * 
 * This is a convenience export for basic request logging.
 * For more control, use createRequestLoggingMiddleware() with custom options.
 * 
 * @example
 * import { requestLoggingMiddleware } from './middleware/logging';
 * app.use(requestLoggingMiddleware);
 */
export const requestLoggingMiddleware = createRequestLoggingMiddleware();

/**
 * Error logging middleware that should be used after error handling.
 * 
 * This middleware specifically logs errors with full context and stack traces.
 * 
 * @param {Error} err - Error object
 * @param {RequestWithContext} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export function errorLoggingMiddleware(
  err: Error,
  req: RequestWithContext,
  res: Response,
  next: NextFunction
): void {
  // Use request-scoped logger if available, otherwise use global logger
  const requestLogger = req.logger || logger;

  requestLogger.error('Unhandled request error', err, {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('user-agent'),
    ip: getClientIp(req),
    statusCode: res.statusCode,
    duration: req.startTime ? Date.now() - req.startTime : undefined,
  });

  next(err);
}

/**
 * Health check endpoint middleware that provides system status.
 * 
 * This middleware can be used to create health check endpoints
 * that don't clutter the logs but provide useful system information.
 * 
 * @param {RequestWithContext} req - Express request object
 * @param {Response} res - Express response object
 */
export function healthCheckMiddleware(req: RequestWithContext, res: Response): void {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
  };

  // Log health check request only in debug mode
  if (req.logger) {
    req.logger.debug('Health check requested', { 
      ip: getClientIp(req),
      userAgent: req.get('user-agent') 
    });
  }

  res.json(health);
}