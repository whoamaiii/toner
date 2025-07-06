/**
 * Error classification and handling system for the TonerWeb AI Assistant.
 * 
 * This module provides a comprehensive error handling framework with:
 * - Standardized error types and classifications
 * - User-friendly error messages
 * - Error context and metadata tracking
 * - Operational vs programming error distinction
 * - HTTP status code mapping
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

/**
 * Enumeration of all error types in the application.
 * 
 * This provides a centralized way to categorize errors for
 * consistent handling, logging, and user messaging.
 */
export enum ErrorType {
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SCHEMA_VALIDATION_ERROR = 'SCHEMA_VALIDATION_ERROR',
  IMAGE_VALIDATION_ERROR = 'IMAGE_VALIDATION_ERROR',
  INPUT_VALIDATION_ERROR = 'INPUT_VALIDATION_ERROR',
  
  // Authentication and Authorization
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  TOKEN_EXPIRED_ERROR = 'TOKEN_EXPIRED_ERROR',
  INVALID_CREDENTIALS_ERROR = 'INVALID_CREDENTIALS_ERROR',
  
  // Service and API Errors
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Processing Errors
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  IMAGE_PROCESSING_ERROR = 'IMAGE_PROCESSING_ERROR',
  FILE_PROCESSING_ERROR = 'FILE_PROCESSING_ERROR',
  DATA_PROCESSING_ERROR = 'DATA_PROCESSING_ERROR',
  
  // Resource Errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RESOURCE_GONE = 'RESOURCE_GONE',
  
  // Rate Limiting and Capacity
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  QUOTA_EXCEEDED_ERROR = 'QUOTA_EXCEEDED_ERROR',
  CAPACITY_ERROR = 'CAPACITY_ERROR',
  
  // Configuration and Environment
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  ENVIRONMENT_ERROR = 'ENVIRONMENT_ERROR',
  
  // Internal System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Interface for error context metadata.
 * 
 * This provides additional context about where and why an error occurred,
 * helping with debugging and error tracking.
 */
export interface ErrorContext {
  // Request Context
  userId?: string;
  sessionId?: string;
  requestId?: string;
  
  // Operation Context
  operation?: string;
  service?: string;
  method?: string;
  url?: string;
  
  // Technical Context
  statusCode?: number;
  duration?: number;
  retryCount?: number;
  
  // User Context
  userAgent?: string;
  ip?: string;
  
  // Additional Metadata
  metadata?: Record<string, any>;
  originalError?: Error;
  
  // Debugging Information
  timestamp?: Date;
  stackTrace?: string;
  
  [key: string]: any;
}

/**
 * Base application error class that all custom errors extend.
 * 
 * This class provides:
 * - Consistent error structure
 * - User-friendly messaging
 * - Error classification and HTTP status mapping
 * - Context preservation
 * - Operational vs programming error distinction
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly context: ErrorContext;
  public readonly userMessage: string;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  /**
   * Creates a new application error.
   * 
   * @param {ErrorType} type - The error type classification
   * @param {string} message - Technical error message for logging
   * @param {string} userMessage - User-friendly error message
   * @param {number} statusCode - HTTP status code
   * @param {ErrorContext} context - Additional error context
   * @param {boolean} isOperational - Whether this is an operational error
   */
  constructor(
    type: ErrorType,
    message: string,
    userMessage: string,
    statusCode: number = 500,
    context: ErrorContext = {},
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.type = type;
    this.statusCode = statusCode;
    this.context = { ...context, timestamp: new Date() };
    this.userMessage = userMessage;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    // Capture stack trace (exclude constructor from stack)
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts the error to a JSON object for logging or API responses.
   * 
   * @returns {object} JSON representation of the error
   */
  toJSON(): object {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      userMessage: this.userMessage,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }

  /**
   * Creates a user-safe representation of the error.
   * 
   * @returns {object} User-safe error object
   */
  toUserJSON(): object {
    return {
      type: this.type,
      message: this.userMessage,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      ...(this.context.requestId && { requestId: this.context.requestId }),
    };
  }
}

// ===== VALIDATION ERRORS =====

/**
 * Validation error for user input and data validation failures.
 */
export class ValidationError extends AppError {
  constructor(message: string, userMessage: string, context: ErrorContext = {}) {
    super(ErrorType.VALIDATION_ERROR, message, userMessage, 400, context);
  }
}

/**
 * Schema validation error for data structure validation failures.
 */
export class SchemaValidationError extends AppError {
  constructor(message: string, userMessage: string, context: ErrorContext = {}) {
    super(ErrorType.SCHEMA_VALIDATION_ERROR, message, userMessage, 400, context);
  }
}

/**
 * Image validation error for image processing and validation failures.
 */
export class ImageValidationError extends AppError {
  constructor(message: string, userMessage: string, context: ErrorContext = {}) {
    super(ErrorType.IMAGE_VALIDATION_ERROR, message, userMessage, 400, context);
  }
}

// ===== SERVICE ERRORS =====

/**
 * Service unavailable error for external service failures.
 */
export class ServiceUnavailableError extends AppError {
  constructor(service: string, message: string, context: ErrorContext = {}) {
    const userMessage = `The ${service} service is temporarily unavailable. Please try again later.`;
    super(
      ErrorType.SERVICE_UNAVAILABLE,
      `${service} service unavailable: ${message}`,
      userMessage,
      503,
      { ...context, service }
    );
  }
}

/**
 * External API error for third-party API failures.
 */
export class ExternalAPIError extends AppError {
  constructor(apiName: string, message: string, context: ErrorContext = {}) {
    const userMessage = `We're experiencing issues with our ${apiName} integration. Please try again later.`;
    super(
      ErrorType.EXTERNAL_API_ERROR,
      `${apiName} API error: ${message}`,
      userMessage,
      502,
      { ...context, service: apiName }
    );
  }
}

/**
 * AI service error for AI processing failures.
 */
export class AIServiceError extends AppError {
  constructor(operation: string, message: string, context: ErrorContext = {}) {
    const userMessage = 'We encountered an issue processing your request with our AI service. Please try again.';
    super(
      ErrorType.AI_SERVICE_ERROR,
      `AI service error during ${operation}: ${message}`,
      userMessage,
      503,
      { ...context, operation }
    );
  }
}

/**
 * Database error for database operation failures.
 */
export class DatabaseError extends AppError {
  constructor(operation: string, message: string, context: ErrorContext = {}) {
    const userMessage = 'We encountered a database issue. Please try again later.';
    super(
      ErrorType.DATABASE_ERROR,
      `Database error during ${operation}: ${message}`,
      userMessage,
      503,
      { ...context, operation }
    );
  }
}

// ===== PROCESSING ERRORS =====

/**
 * Processing error for general data processing failures.
 */
export class ProcessingError extends AppError {
  constructor(operation: string, message: string, userMessage: string, context: ErrorContext = {}) {
    super(
      ErrorType.PROCESSING_ERROR,
      `${operation} failed: ${message}`,
      userMessage,
      422,
      { ...context, operation }
    );
  }
}

/**
 * Image processing error for image manipulation failures.
 */
export class ImageProcessingError extends AppError {
  constructor(message: string, userMessage: string, context: ErrorContext = {}) {
    super(
      ErrorType.IMAGE_PROCESSING_ERROR,
      `Image processing failed: ${message}`,
      userMessage,
      422,
      context
    );
  }
}

// ===== RESOURCE ERRORS =====

/**
 * Resource not found error for missing resources.
 */
export class ResourceNotFoundError extends AppError {
  constructor(resource: string, identifier: string, context: ErrorContext = {}) {
    const userMessage = `The requested ${resource} could not be found.`;
    super(
      ErrorType.RESOURCE_NOT_FOUND,
      `${resource} not found: ${identifier}`,
      userMessage,
      404,
      { ...context, resource, identifier }
    );
  }
}

/**
 * Resource conflict error for conflicting operations.
 */
export class ResourceConflictError extends AppError {
  constructor(resource: string, message: string, context: ErrorContext = {}) {
    const userMessage = `This operation conflicts with the current state of the ${resource}.`;
    super(
      ErrorType.RESOURCE_CONFLICT,
      `${resource} conflict: ${message}`,
      userMessage,
      409,
      { ...context, resource }
    );
  }
}

// ===== RATE LIMITING ERRORS =====

/**
 * Rate limit error for request rate limiting.
 */
export class RateLimitError extends AppError {
  constructor(limit: number, window: number, context: ErrorContext = {}) {
    const userMessage = `Too many requests. Please wait a moment before trying again.`;
    super(
      ErrorType.RATE_LIMIT_ERROR,
      `Rate limit exceeded: ${limit} requests per ${window}ms`,
      userMessage,
      429,
      { ...context, limit, window }
    );
  }
}

// ===== CONFIGURATION ERRORS =====

/**
 * Configuration error for application configuration issues.
 */
export class ConfigurationError extends AppError {
  constructor(setting: string, message: string, context: ErrorContext = {}) {
    const userMessage = 'The application is not configured correctly. Please contact support.';
    super(
      ErrorType.CONFIGURATION_ERROR,
      `Configuration error for ${setting}: ${message}`,
      userMessage,
      500,
      { ...context, setting },
      false // Not operational - this is a programming error
    );
  }
}

// ===== TIMEOUT ERRORS =====

/**
 * Timeout error for operation timeouts.
 */
export class TimeoutError extends AppError {
  constructor(operation: string, timeout: number, context: ErrorContext = {}) {
    const userMessage = 'The operation took too long to complete. Please try again.';
    super(
      ErrorType.TIMEOUT_ERROR,
      `${operation} timed out after ${timeout}ms`,
      userMessage,
      408,
      { ...context, operation, timeout }
    );
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Checks if an error is an operational error (vs programming error).
 * 
 * @param {Error} error - The error to check
 * @returns {boolean} True if operational error, false if programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  
  // Built-in operational errors
  const operationalErrors = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ECONNABORTED',
    'ETIMEDOUT',
    'ENOTFOUND',
  ];
  
  return operationalErrors.some(code => error.message.includes(code));
}

/**
 * Extracts error details for logging.
 * 
 * @param {Error} error - The error to extract details from
 * @returns {object} Error details for logging
 */
export function extractErrorDetails(error: Error): object {
  if (error instanceof AppError) {
    return error.toJSON();
  }
  
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    type: 'UnknownError',
    isOperational: isOperationalError(error),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a safe error response for API endpoints.
 * 
 * @param {Error} error - The error to create a response for
 * @param {string} requestId - Optional request ID for tracking
 * @returns {object} Safe error response
 */
export function createErrorResponse(error: Error, requestId?: string): object {
  if (error instanceof AppError) {
    return {
      ...error.toUserJSON(),
      ...(requestId && { requestId }),
    };
  }
  
  // For non-AppError instances, provide generic response
  return {
    type: ErrorType.INTERNAL_ERROR,
    message: 'An unexpected error occurred. Please try again later.',
    statusCode: 500,
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
  };
}

/**
 * Wraps an unknown error in an AppError.
 * 
 * @param {unknown} error - The error to wrap
 * @param {string} operation - The operation that failed
 * @param {ErrorContext} context - Additional context
 * @returns {AppError} Wrapped error
 */
export function wrapError(error: unknown, operation: string, context: ErrorContext = {}): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new ProcessingError(
      operation,
      error.message,
      'An error occurred while processing your request. Please try again.',
      { ...context, originalError: error }
    );
  }
  
  return new ProcessingError(
    operation,
    String(error),
    'An unexpected error occurred. Please try again.',
    { ...context, metadata: { originalError: String(error) } }
  );
}