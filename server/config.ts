/**
 * Centralized configuration for the TonerWeb AI Assistant.
 * 
 * This module provides a single source of truth for all configuration values,
 * environment variables, and application settings.
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

// Application configuration
export const APP_CONFIG = {
  // Server settings
  PORT: parseInt(process.env.PORT || '3000'),
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Request limits
  JSON_LIMIT: process.env.JSON_LIMIT || '10mb',
  URL_ENCODED_LIMIT: process.env.URL_ENCODED_LIMIT || '10mb',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_MAX_LINE_LENGTH: parseInt(process.env.LOG_MAX_LINE_LENGTH || '80'),
  LOG_TRUNCATE_SUFFIX: '…',
  
  // Request timeout
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
  
  // Development settings
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  // TTL values in seconds
  SEARCH_TTL: parseInt(process.env.CACHE_SEARCH_TTL || '3600'), // 1 hour
  REASONING_TTL: parseInt(process.env.CACHE_REASONING_TTL || '900'), // 15 minutes
  
  // Cache limits
  MAX_KEYS: parseInt(process.env.CACHE_MAX_KEYS || '500'),
  CHECK_PERIOD: parseInt(process.env.CACHE_CHECK_PERIOD || '300'), // 5 minutes
  
  // Cache key settings
  MAX_KEY_LENGTH: parseInt(process.env.CACHE_MAX_KEY_LENGTH || '250'),
  MAX_QUERY_LENGTH: parseInt(process.env.CACHE_MAX_QUERY_LENGTH || '200'),
  
  // Features
  USE_CLONES: process.env.CACHE_USE_CLONES !== 'false',
  ENABLE_METRICS: process.env.CACHE_ENABLE_METRICS !== 'false',
} as const;

// API configuration
export const API_CONFIG = {
  // OpenRouter/Perplexity settings
  OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_TIMEOUT: parseInt(process.env.OPENROUTER_TIMEOUT || '30000'),
  OPENROUTER_MAX_RETRIES: parseInt(process.env.OPENROUTER_MAX_RETRIES || '3'),
  OPENROUTER_REFERRER: process.env.OPENROUTER_REFERRER || 'https://tonerweb.no',
  OPENROUTER_TITLE: process.env.OPENROUTER_TITLE || 'TonerWeb AI Assistant',
  
  // Gemini settings
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
  GEMINI_TIMEOUT: parseInt(process.env.GEMINI_TIMEOUT || '30000'),
  GEMINI_MAX_RETRIES: parseInt(process.env.GEMINI_MAX_RETRIES || '3'),
  
  // Model parameters
  DEFAULT_MAX_TOKENS: parseInt(process.env.DEFAULT_MAX_TOKENS || '2000'),
  DEFAULT_TEMPERATURE: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.2'),
  
  // Health check settings
  HEALTH_CHECK_TIMEOUT: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000'),
  
  // Validation timeouts
  API_VALIDATION_TIMEOUT: parseInt(process.env.API_VALIDATION_TIMEOUT || '5000'),
} as const;

// Database configuration
export const DB_CONFIG = {
  // Connection settings
  DATABASE_URL: process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_NAME: process.env.DB_NAME || 'tonerweb',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD,
  
  // Pool settings
  DB_POOL_MIN: parseInt(process.env.DB_POOL_MIN || '2'),
  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX || '10'),
  DB_POOL_IDLE_TIMEOUT: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
  DB_POOL_ACQUIRE_TIMEOUT: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000'),
  
  // Query settings
  DB_QUERY_TIMEOUT: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
  DB_STATEMENT_TIMEOUT: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
} as const;

// Security configuration
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // Input validation
  MAX_MESSAGE_LENGTH: parseInt(process.env.MAX_MESSAGE_LENGTH || '10000'),
  MAX_IMAGE_SIZE: parseInt(process.env.MAX_IMAGE_SIZE || '10485760'), // 10MB
  ALLOWED_IMAGE_TYPES: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(','),
  
  // CORS settings
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  CORS_CREDENTIALS: process.env.CORS_CREDENTIALS !== 'false',
  
  // Session settings
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret-change-this',
  SESSION_MAX_AGE: parseInt(process.env.SESSION_MAX_AGE || '86400000'), // 24 hours
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_IMAGE_GENERATION: process.env.ENABLE_IMAGE_GENERATION === 'true',
  ENABLE_NEWS_FEEDS: process.env.ENABLE_NEWS_FEEDS === 'true',
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS !== 'false',
  ENABLE_CACHING: process.env.ENABLE_CACHING !== 'false',
  ENABLE_QUERY_CLASSIFICATION: process.env.ENABLE_QUERY_CLASSIFICATION !== 'false',
  ENABLE_DEBUG_LOGGING: process.env.ENABLE_DEBUG_LOGGING === 'true' || APP_CONFIG.isDevelopment,
} as const;

// Query classification configuration
export const QUERY_CONFIG = {
  // Scoring weights
  KEYWORD_SCORE: parseInt(process.env.QUERY_KEYWORD_SCORE || '2'),
  PATTERN_SCORE: parseInt(process.env.QUERY_PATTERN_SCORE || '3'),
  LENGTH_BONUS_THRESHOLD: parseInt(process.env.QUERY_LENGTH_BONUS_THRESHOLD || '5'),
  LENGTH_PENALTY_THRESHOLD: parseInt(process.env.QUERY_LENGTH_PENALTY_THRESHOLD || '15'),
  
  // Classification thresholds
  CONFIDENCE_THRESHOLD: parseFloat(process.env.QUERY_CONFIDENCE_THRESHOLD || '0.6'),
  SIMPLE_QUERY_MAX_WORDS: parseInt(process.env.SIMPLE_QUERY_MAX_WORDS || '5'),
  COMPLEX_QUERY_MIN_WORDS: parseInt(process.env.COMPLEX_QUERY_MIN_WORDS || '15'),
  
  // Pattern matching
  ENABLE_REGEX_CACHE: process.env.ENABLE_REGEX_CACHE !== 'false',
  MAX_PATTERN_CACHE_SIZE: parseInt(process.env.MAX_PATTERN_CACHE_SIZE || '100'),
} as const;

// Analytics configuration
export const ANALYTICS_CONFIG = {
  // Event tracking
  ENABLE_SEARCH_EVENTS: process.env.ENABLE_SEARCH_EVENTS !== 'false',
  ENABLE_ERROR_EVENTS: process.env.ENABLE_ERROR_EVENTS !== 'false',
  ENABLE_PERFORMANCE_EVENTS: process.env.ENABLE_PERFORMANCE_EVENTS !== 'false',
  
  // Batch settings
  BATCH_SIZE: parseInt(process.env.ANALYTICS_BATCH_SIZE || '50'),
  BATCH_TIMEOUT: parseInt(process.env.ANALYTICS_BATCH_TIMEOUT || '5000'),
  
  // Retention
  EVENT_RETENTION_DAYS: parseInt(process.env.EVENT_RETENTION_DAYS || '30'),
  
  // Metrics
  ENABLE_METRICS_COLLECTION: process.env.ENABLE_METRICS_COLLECTION !== 'false',
  METRICS_COLLECTION_INTERVAL: parseInt(process.env.METRICS_COLLECTION_INTERVAL || '60000'), // 1 minute
} as const;

// Validation functions
export function validateConfig(): void {
  const errors: string[] = [];
  
  // Validate required environment variables
  const requiredVars = [
    'OPENROUTER_API_KEY',
    'GEMINI_API_KEY',
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    errors.push(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Validate numeric values
  if (APP_CONFIG.PORT < 1 || APP_CONFIG.PORT > 65535) {
    errors.push(`Invalid PORT value: ${APP_CONFIG.PORT}`);
  }
  
  if (API_CONFIG.DEFAULT_TEMPERATURE < 0 || API_CONFIG.DEFAULT_TEMPERATURE > 2) {
    errors.push(`Invalid DEFAULT_TEMPERATURE value: ${API_CONFIG.DEFAULT_TEMPERATURE}`);
  }
  
  // Validate cache settings
  if (CACHE_CONFIG.SEARCH_TTL < 60) {
    errors.push(`CACHE_SEARCH_TTL too low: ${CACHE_CONFIG.SEARCH_TTL} (minimum: 60)`);
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

// Environment-specific configurations
export function getEnvironmentConfig() {
  const base = {
    app: APP_CONFIG,
    cache: CACHE_CONFIG,
    api: API_CONFIG,
    db: DB_CONFIG,
    security: SECURITY_CONFIG,
    features: FEATURE_FLAGS,
    query: QUERY_CONFIG,
    analytics: ANALYTICS_CONFIG,
  };
  
  if (APP_CONFIG.isDevelopment) {
    return {
      ...base,
      // Development-specific overrides
      cache: {
        ...base.cache,
        SEARCH_TTL: 300, // 5 minutes for faster development
        REASONING_TTL: 180, // 3 minutes
      },
      api: {
        ...base.api,
        OPENROUTER_TIMEOUT: 10000, // Shorter timeout for development
        GEMINI_TIMEOUT: 10000,
      },
    };
  }
  
  if (APP_CONFIG.isProduction) {
    return {
      ...base,
      // Production-specific overrides
      security: {
        ...base.security,
        RATE_LIMIT_MAX_REQUESTS: 50, // Stricter rate limiting
      },
    };
  }
  
  return base;
}

// Export the current environment configuration
export const CONFIG = getEnvironmentConfig();

// Configuration summary for logging
export function getConfigSummary(): Record<string, any> {
  return {
    environment: APP_CONFIG.NODE_ENV,
    port: APP_CONFIG.PORT,
    features: {
      imageGeneration: FEATURE_FLAGS.ENABLE_IMAGE_GENERATION,
      newsFeeds: FEATURE_FLAGS.ENABLE_NEWS_FEEDS,
      analytics: FEATURE_FLAGS.ENABLE_ANALYTICS,
      caching: FEATURE_FLAGS.ENABLE_CACHING,
    },
    apis: {
      openRouter: !!API_CONFIG.OPENROUTER_API_KEY,
      gemini: !!API_CONFIG.GEMINI_API_KEY,
    },
    cache: {
      searchTTL: CACHE_CONFIG.SEARCH_TTL,
      reasoningTTL: CACHE_CONFIG.REASONING_TTL,
      maxKeys: CACHE_CONFIG.MAX_KEYS,
    },
  };
}