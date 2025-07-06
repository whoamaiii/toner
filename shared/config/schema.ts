/**
 * Type-safe configuration schema for the TonerWeb AI Assistant.
 * 
 * This module defines the complete configuration structure using Zod for:
 * - Environment variable validation
 * - Type safety across the application
 * - Default value management
 * - Runtime configuration validation
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import { z } from 'zod';

/**
 * Main configuration schema defining all environment variables and their validation rules.
 * 
 * This schema ensures that:
 * - All required environment variables are present
 * - Values are properly typed and validated
 * - Default values are provided where appropriate
 * - URLs and other formats are validated
 */
export const ConfigSchema = z.object({
  // Environment Configuration
  NODE_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development')
    .describe('Application environment'),
  
  PORT: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val < 65536, 'PORT must be between 1 and 65535')
    .default('3000')
    .describe('Server port number'),

  // Database Configuration
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid URL')
    .describe('Database connection URL'),

  // AI Services Configuration
  GEMINI_API_KEY: z
    .string()
    .min(1, 'GEMINI_API_KEY must not be empty')
    .optional()
    .describe('Google Gemini API key for image analysis'),

  OPENROUTER_API_KEY: z
    .string()
    .min(1, 'OPENROUTER_API_KEY must not be empty')
    .optional()
    .describe('OpenRouter API key for AI text processing'),

  // Logging Configuration
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info')
    .describe('Application logging level'),

  LOG_FILE_PATH: z
    .string()
    .default('logs')
    .describe('Directory path for log files'),

  LOG_MAX_SIZE: z
    .string()
    .default('20m')
    .describe('Maximum size for log files before rotation'),

  LOG_MAX_FILES: z
    .string()
    .default('14d')
    .describe('Maximum number of log files to retain'),

  // Feature Flags
  ENABLE_IMAGE_GENERATION: z
    .string()
    .transform(val => val === 'true' || val === '1')
    .default('false')
    .describe('Enable image generation feature'),

  ENABLE_NEWS_FEEDS: z
    .string()
    .transform(val => val === 'true' || val === '1')
    .default('false')
    .describe('Enable news feeds feature'),

  ENABLE_DEBUG_LOGGING: z
    .string()
    .transform(val => val === 'true' || val === '1')
    .default('false')
    .describe('Enable debug logging in production'),

  // Security Configuration
  CORS_ORIGIN: z
    .string()
    .default('*')
    .describe('CORS allowed origins'),

  RATE_LIMIT_REQUESTS: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'RATE_LIMIT_REQUESTS must be positive')
    .default('100')
    .describe('Maximum requests per window'),

  RATE_LIMIT_WINDOW: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'RATE_LIMIT_WINDOW must be positive')
    .default('900000')
    .describe('Rate limit window in milliseconds (15 minutes)'),

  // Performance Configuration
  REQUEST_TIMEOUT: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'REQUEST_TIMEOUT must be positive')
    .default('30000')
    .describe('Request timeout in milliseconds'),

  MAX_UPLOAD_SIZE: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'MAX_UPLOAD_SIZE must be positive')
    .default('10485760')
    .describe('Maximum file upload size in bytes (10MB)'),

  // Image Processing Configuration
  IMAGE_MAX_WIDTH: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'IMAGE_MAX_WIDTH must be positive')
    .default('4096')
    .describe('Maximum image width in pixels'),

  IMAGE_MAX_HEIGHT: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'IMAGE_MAX_HEIGHT must be positive')
    .default('4096')
    .describe('Maximum image height in pixels'),

  IMAGE_MIN_WIDTH: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'IMAGE_MIN_WIDTH must be positive')
    .default('32')
    .describe('Minimum image width in pixels'),

  IMAGE_MIN_HEIGHT: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'IMAGE_MIN_HEIGHT must be positive')
    .default('32')
    .describe('Minimum image height in pixels'),

  // AI Configuration
  AI_REQUEST_TIMEOUT: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'AI_REQUEST_TIMEOUT must be positive')
    .default('60000')
    .describe('AI request timeout in milliseconds'),

  AI_MAX_RETRIES: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 0, 'AI_MAX_RETRIES must be non-negative')
    .default('3')
    .describe('Maximum number of AI request retries'),

  AI_RETRY_DELAY: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'AI_RETRY_DELAY must be positive')
    .default('1000')
    .describe('Base delay between AI request retries in milliseconds'),
});

/**
 * Type definition for the validated configuration object.
 * 
 * This type is automatically inferred from the Zod schema and provides
 * full type safety throughout the application.
 */
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Helper type for environment variables (string-based).
 * 
 * This type represents the raw environment variables before validation
 * and transformation by the schema.
 */
export type EnvVars = Record<string, string | undefined>;

/**
 * Configuration validation result.
 * 
 * This type represents the result of configuration validation,
 * including both success and error states.
 */
export type ConfigValidationResult = {
  success: boolean;
  config?: Config;
  errors?: string[];
};

/**
 * Service availability configuration.
 * 
 * This type defines which services are available based on configuration.
 */
export type ServiceAvailability = {
  gemini: boolean;
  openrouter: boolean;
  database: boolean;
  imageGeneration: boolean;
  newsFeeds: boolean;
};

/**
 * Default configuration values for development environment.
 * 
 * These values are used when no environment variables are set,
 * providing a working configuration for development.
 */
export const DEFAULT_CONFIG: Partial<Config> = {
  NODE_ENV: 'development',
  PORT: 3000,
  LOG_LEVEL: 'debug',
  LOG_FILE_PATH: 'logs',
  LOG_MAX_SIZE: '20m',
  LOG_MAX_FILES: '14d',
  ENABLE_IMAGE_GENERATION: false,
  ENABLE_NEWS_FEEDS: false,
  ENABLE_DEBUG_LOGGING: true,
  CORS_ORIGIN: '*',
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW: 900000,
  REQUEST_TIMEOUT: 30000,
  MAX_UPLOAD_SIZE: 10485760,
  IMAGE_MAX_WIDTH: 4096,
  IMAGE_MAX_HEIGHT: 4096,
  IMAGE_MIN_WIDTH: 32,
  IMAGE_MIN_HEIGHT: 32,
  AI_REQUEST_TIMEOUT: 60000,
  AI_MAX_RETRIES: 3,
  AI_RETRY_DELAY: 1000,
};

/**
 * Required environment variables that must be present.
 * 
 * These variables are critical for application functionality
 * and must be configured in production.
 */
export const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
] as const;

/**
 * Optional environment variables that enable additional features.
 * 
 * These variables are optional but enable specific functionality
 * when configured.
 */
export const OPTIONAL_ENV_VARS = [
  'GEMINI_API_KEY',
  'OPENROUTER_API_KEY',
] as const;