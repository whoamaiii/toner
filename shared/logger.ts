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
 * Logger utility with different log levels.
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
    // Only show debug logs in development mode
    const isDevelopment = (globalThis as any).process?.env?.NODE_ENV === 'development';
    if (isDevelopment) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || '');
    }
  },
  
  /**
   * Info logging - shown in all environments
   * @param message - The log message
   * @param data - Optional data to log
   */
  info: (message: string, data?: LogData) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
  },
  
  /**
   * Warning logging - shown in all environments
   * @param message - The log message
   * @param data - Optional data to log
   */
  warn: (message: string, data?: LogData) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
  },
  
  /**
   * Error logging - shown in all environments
   * @param message - The log message
   * @param error - Optional error object to log
   */
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  }
};