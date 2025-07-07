/**
 * Logging utility for the TonerWeb AI Assistant.
 * 
 * Provides environment-aware logging with proper log levels and timestamps.
 * Debug logs are only shown in development mode to improve production performance.
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

interface LogData {
  [key: string]: any;
}

/**
 * Helper function to safely determine if we're in development mode
 */
const isDevelopment = (): boolean => {
  try {
    const env = (globalThis as any).process?.env?.NODE_ENV;
    return env === 'development';
  } catch {
    return false;
  }
};

/**
 * Helper function to safely determine if we're in production mode
 */
const isProduction = (): boolean => {
  try {
    const env = (globalThis as any).process?.env?.NODE_ENV;
    return env === 'production';
  } catch {
    return false;
  }
};

/**
 * Production-safe logging utility with environment-aware log levels.
 * 
 * In production, logs are formatted as JSON for structured logging systems.
 * In development, logs are human-readable console output.
 * 
 * @example
 * import { logger } from '@shared/logger';
 * 
 * logger.debug('Debug message', { data: 'value' });
 * logger.info('Info message');
 * logger.warn('Warning message');
 * logger.error('Error message', error);
 */
export const logger = {
  /**
   * Debug logging - only shown in development mode
   * @param message - The log message
   * @param data - Optional data to log
   */
  debug: (message: string, data?: LogData) => {
    if (isDevelopment()) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || '');
    }
    // In production, debug logs are completely suppressed for performance
  },
  
  /**
   * Info logging - development console, production structured logging
   * @param message - The log message
   * @param data - Optional data to log
   */
  info: (message: string, data?: LogData) => {
    if (isDevelopment()) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
    } else if (isProduction()) {
      // In production, use structured JSON logging for log aggregation systems
      const logEntry = {
        level: 'info',
        timestamp: new Date().toISOString(),
        message,
        data: data || null
      };
      // Write to stdout for log aggregation systems to capture
      process.stdout.write(JSON.stringify(logEntry) + '\n');
    }
  },
  
  /**
   * Warning logging - shown in all environments with structured format in production
   * @param message - The log message
   * @param data - Optional data to log
   */
  warn: (message: string, data?: LogData) => {
    if (isDevelopment()) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
    } else if (isProduction()) {
      // In production, use structured JSON logging
      const logEntry = {
        level: 'warn',
        timestamp: new Date().toISOString(),
        message,
        data: data || null
      };
      // Write to stderr for warnings
      process.stderr.write(JSON.stringify(logEntry) + '\n');
    }
  },
  
  /**
   * Error logging - shown in all environments with structured format in production
   * @param message - The log message
   * @param error - Optional error object to log
   */
  error: (message: string, error?: any) => {
    if (isDevelopment()) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
    } else if (isProduction()) {
      // In production, use structured JSON logging with error serialization
      const logEntry = {
        level: 'error',
        timestamp: new Date().toISOString(),
        message,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : null
      };
      // Write to stderr for errors
      process.stderr.write(JSON.stringify(logEntry) + '\n');
    }
  }
};