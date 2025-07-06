/**
 * Professional logging system for the TonerWeb AI Assistant.
 * 
 * This module provides a Winston-based logging infrastructure with:
 * - Environment-aware log levels
 * - Structured logging with metadata
 * - File rotation for production
 * - Zero console output in production
 * - Request tracking and performance monitoring
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { configManager } from '../config/manager';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for log context metadata.
 * 
 * This interface defines the structure for additional context
 * that can be included with log messages.
 */
export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  operation?: string;
  service?: string;
  duration?: number;
  statusCode?: number;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  error?: Error | string;
  [key: string]: any;
}

/**
 * Interface for performance log data.
 */
export interface PerformanceLogData {
  operation: string;
  duration: number;
  success: boolean;
  details?: Record<string, any>;
}

/**
 * Production-ready logger class using Winston.
 * 
 * This class provides:
 * - Environment-specific log levels and outputs
 * - Structured JSON logging for production
 * - Human-readable console output for development
 * - Automatic log rotation and cleanup
 * - Performance monitoring capabilities
 * - Request tracking and correlation
 */
class ProductionLogger {
  private logger: winston.Logger;
  private config: any;

  constructor() {
    this.config = configManager.getServiceConfig('logging');
    this.logger = this.createLogger();
  }

  /**
   * Creates and configures the Winston logger instance.
   * 
   * @returns {winston.Logger} Configured Winston logger
   */
  private createLogger(): winston.Logger {
    const environment = configManager.get().NODE_ENV;
    const logLevel = this.config?.level || 'info';

    return winston.createLogger({
      level: logLevel,
      format: this.createLogFormat(),
      transports: this.createTransports(),
      exitOnError: false,
      // Handle uncaught exceptions and rejections
      handleExceptions: true,
      handleRejections: true,
    });
  }

  /**
   * Creates the log format based on environment.
   * 
   * @returns {winston.Logform.Format} Winston log format
   */
  private createLogFormat(): winston.Logform.Format {
    const environment = configManager.get().NODE_ENV;

    if (environment === 'production') {
      // Structured JSON format for production
      return winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
        winston.format.json()
      );
    } else {
      // Human-readable format for development
      return winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let output = `${timestamp} [${level}]: ${message}`;
          
          // Add metadata if present
          if (Object.keys(meta).length > 0) {
            const metaString = JSON.stringify(meta, null, 2);
            output += `\n${metaString}`;
          }
          
          return output;
        })
      );
    }
  }

  /**
   * Creates transport configurations based on environment.
   * 
   * @returns {winston.transport[]} Array of Winston transports
   */
  private createTransports(): winston.transport[] {
    const transports: winston.transport[] = [];
    const environment = configManager.get().NODE_ENV;
    const logConfig = this.config || {};

    // Console transport (only for non-production environments)
    if (environment !== 'production') {
      transports.push(
        new winston.transports.Console({
          level: logConfig.debugEnabled ? 'debug' : 'info',
        })
      );
    }

    // File transports for all environments
    const logPath = logConfig.filePath || 'logs';
    const maxSize = logConfig.maxSize || '20m';
    const maxFiles = logConfig.maxFiles || '14d';

    // General application log
    transports.push(
      new DailyRotateFile({
        filename: `${logPath}/app-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize,
        maxFiles,
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      })
    );

    // Error-specific log
    transports.push(
      new DailyRotateFile({
        filename: `${logPath}/error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize,
        maxFiles: '30d', // Keep error logs longer
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
      })
    );

    // Performance log
    transports.push(
      new DailyRotateFile({
        filename: `${logPath}/performance-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize,
        maxFiles,
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
          winston.format((info) => {
            // Only log performance entries
            return info.type === 'performance' ? info : false;
          })()
        ),
      })
    );

    return transports;
  }

  /**
   * Logs debug messages (only in development).
   * 
   * @param {string} message - The log message
   * @param {LogContext} context - Additional context data
   */
  debug(message: string, context: LogContext = {}): void {
    this.logger.debug(message, {
      ...context,
      logId: uuidv4().slice(0, 8),
    });
  }

  /**
   * Logs informational messages.
   * 
   * @param {string} message - The log message
   * @param {LogContext} context - Additional context data
   */
  info(message: string, context: LogContext = {}): void {
    this.logger.info(message, {
      ...context,
      logId: uuidv4().slice(0, 8),
    });
  }

  /**
   * Logs warning messages.
   * 
   * @param {string} message - The log message
   * @param {LogContext} context - Additional context data
   */
  warn(message: string, context: LogContext = {}): void {
    this.logger.warn(message, {
      ...context,
      logId: uuidv4().slice(0, 8),
    });
  }

  /**
   * Logs error messages with full error details.
   * 
   * @param {string} message - The log message
   * @param {Error | string} error - The error object or message
   * @param {LogContext} context - Additional context data
   */
  error(message: string, error?: Error | string, context: LogContext = {}): void {
    const errorDetails: any = {
      ...context,
      logId: uuidv4().slice(0, 8),
    };

    if (error) {
      if (error instanceof Error) {
        errorDetails.error = {
          message: error.message,
          stack: error.stack,
          name: error.name,
        };
      } else {
        errorDetails.error = error;
      }
    }

    this.logger.error(message, errorDetails);
  }

  /**
   * Logs performance metrics.
   * 
   * @param {PerformanceLogData} data - Performance data
   * @param {LogContext} context - Additional context data
   */
  performance(data: PerformanceLogData, context: LogContext = {}): void {
    this.logger.info('Performance metric', {
      ...context,
      ...data,
      type: 'performance',
      logId: uuidv4().slice(0, 8),
    });
  }

  /**
   * Logs HTTP request information.
   * 
   * @param {string} message - The log message
   * @param {LogContext} context - Request context data
   */
  request(message: string, context: LogContext = {}): void {
    this.logger.info(message, {
      ...context,
      type: 'request',
      logId: uuidv4().slice(0, 8),
    });
  }

  /**
   * Logs security-related events.
   * 
   * @param {string} message - The log message
   * @param {LogContext} context - Security context data
   */
  security(message: string, context: LogContext = {}): void {
    this.logger.warn(message, {
      ...context,
      type: 'security',
      logId: uuidv4().slice(0, 8),
    });
  }

  /**
   * Logs database operations.
   * 
   * @param {string} message - The log message
   * @param {LogContext} context - Database context data
   */
  database(message: string, context: LogContext = {}): void {
    this.logger.info(message, {
      ...context,
      type: 'database',
      logId: uuidv4().slice(0, 8),
    });
  }

  /**
   * Logs external API calls.
   * 
   * @param {string} message - The log message
   * @param {LogContext} context - API context data
   */
  api(message: string, context: LogContext = {}): void {
    this.logger.info(message, {
      ...context,
      type: 'api',
      logId: uuidv4().slice(0, 8),
    });
  }

  /**
   * Creates a child logger with persistent context.
   * 
   * @param {LogContext} defaultContext - Context to include in all logs
   * @returns {ChildLogger} Child logger instance
   */
  child(defaultContext: LogContext): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }

  /**
   * Flushes all log transports (useful for testing).
   * 
   * @returns {Promise<void>} Promise that resolves when flushing is complete
   */
  async flush(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.end(() => {
        resolve();
      });
    });
  }

  /**
   * Gets current log level.
   * 
   * @returns {string} Current log level
   */
  getLevel(): string {
    return this.logger.level;
  }

  /**
   * Sets log level dynamically.
   * 
   * @param {string} level - New log level
   */
  setLevel(level: string): void {
    this.logger.level = level;
  }
}

/**
 * Child logger class that includes persistent context.
 */
class ChildLogger {
  constructor(
    private parent: ProductionLogger,
    private defaultContext: LogContext
  ) {}

  debug(message: string, context: LogContext = {}): void {
    this.parent.debug(message, { ...this.defaultContext, ...context });
  }

  info(message: string, context: LogContext = {}): void {
    this.parent.info(message, { ...this.defaultContext, ...context });
  }

  warn(message: string, context: LogContext = {}): void {
    this.parent.warn(message, { ...this.defaultContext, ...context });
  }

  error(message: string, error?: Error | string, context: LogContext = {}): void {
    this.parent.error(message, error, { ...this.defaultContext, ...context });
  }

  performance(data: PerformanceLogData, context: LogContext = {}): void {
    this.parent.performance(data, { ...this.defaultContext, ...context });
  }

  request(message: string, context: LogContext = {}): void {
    this.parent.request(message, { ...this.defaultContext, ...context });
  }

  security(message: string, context: LogContext = {}): void {
    this.parent.security(message, { ...this.defaultContext, ...context });
  }

  database(message: string, context: LogContext = {}): void {
    this.parent.database(message, { ...this.defaultContext, ...context });
  }

  api(message: string, context: LogContext = {}): void {
    this.parent.api(message, { ...this.defaultContext, ...context });
  }
}

/**
 * Singleton instance of the production logger.
 * 
 * This is the main logger instance used throughout the application.
 * It provides consistent, environment-aware logging across all modules.
 * 
 * @example
 * import { logger } from '@/shared/logging/logger';
 * 
 * logger.info('User logged in', { userId: '123', ip: '192.168.1.1' });
 * logger.error('Database connection failed', error, { service: 'database' });
 * 
 * // Create child logger with context
 * const requestLogger = logger.child({ requestId: 'req-123' });
 * requestLogger.info('Processing request');
 */
export const logger = new ProductionLogger();

// Export the logger class for testing
export { ProductionLogger, ChildLogger };