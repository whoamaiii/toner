/**
 * Configuration manager for the TonerWeb AI Assistant.
 * 
 * This module provides centralized configuration management with:
 * - Type-safe environment variable access
 * - Configuration validation and error handling
 * - Service availability checking
 * - Graceful fallback for missing configuration
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import { ConfigSchema, type Config, type ConfigValidationResult, type ServiceAvailability, DEFAULT_CONFIG } from './schema';

/**
 * Configuration manager class that handles all configuration-related operations.
 * 
 * This class provides:
 * - Safe environment variable loading
 * - Configuration validation using Zod
 * - Service availability checking
 * - Error handling and logging
 * - Fallback configuration for development
 */
class ConfigurationManager {
  private config: Config;
  private validationErrors: string[] = [];
  private isInitialized: boolean = false;

  constructor() {
    this.config = this.loadAndValidateConfig();
    this.isInitialized = true;
  }

  /**
   * Safely loads environment variables from process.env.
   * 
   * This method provides a safe way to access environment variables
   * without the risk of runtime errors from globalThis access.
   * 
   * @returns {Record<string, string | undefined>} Environment variables
   */
  private loadEnvironmentVariables(): Record<string, string | undefined> {
    try {
      // Use direct process.env access instead of unsafe globalThis patterns
      return {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DATABASE_URL: process.env.DATABASE_URL,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
        LOG_LEVEL: process.env.LOG_LEVEL,
        LOG_FILE_PATH: process.env.LOG_FILE_PATH,
        LOG_MAX_SIZE: process.env.LOG_MAX_SIZE,
        LOG_MAX_FILES: process.env.LOG_MAX_FILES,
        ENABLE_IMAGE_GENERATION: process.env.ENABLE_IMAGE_GENERATION,
        ENABLE_NEWS_FEEDS: process.env.ENABLE_NEWS_FEEDS,
        ENABLE_DEBUG_LOGGING: process.env.ENABLE_DEBUG_LOGGING,
        CORS_ORIGIN: process.env.CORS_ORIGIN,
        RATE_LIMIT_REQUESTS: process.env.RATE_LIMIT_REQUESTS,
        RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
        REQUEST_TIMEOUT: process.env.REQUEST_TIMEOUT,
        MAX_UPLOAD_SIZE: process.env.MAX_UPLOAD_SIZE,
        IMAGE_MAX_WIDTH: process.env.IMAGE_MAX_WIDTH,
        IMAGE_MAX_HEIGHT: process.env.IMAGE_MAX_HEIGHT,
        IMAGE_MIN_WIDTH: process.env.IMAGE_MIN_WIDTH,
        IMAGE_MIN_HEIGHT: process.env.IMAGE_MIN_HEIGHT,
        AI_REQUEST_TIMEOUT: process.env.AI_REQUEST_TIMEOUT,
        AI_MAX_RETRIES: process.env.AI_MAX_RETRIES,
        AI_RETRY_DELAY: process.env.AI_RETRY_DELAY,
      };
    } catch (error) {
      // Fallback to empty object if process.env is not available
      console.warn('Warning: Could not access process.env, using fallback configuration');
      return {};
    }
  }

  /**
   * Loads and validates the configuration from environment variables.
   * 
   * This method performs the complete configuration loading process:
   * 1. Load environment variables safely
   * 2. Validate against the Zod schema
   * 3. Handle validation errors gracefully
   * 4. Create fallback configuration if needed
   * 
   * @returns {Config} The validated configuration object
   */
  private loadAndValidateConfig(): Config {
    try {
      const envVars = this.loadEnvironmentVariables();
      
      // Validate against schema
      const result = ConfigSchema.safeParse(envVars);
      
      if (!result.success) {
        this.validationErrors = result.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );
        
        // Log validation errors
        console.error('Configuration validation failed:', this.validationErrors);
        
        // Return fallback configuration instead of crashing
        return this.createFallbackConfig(envVars);
      }

      // Validate critical services
      this.validateCriticalServices(result.data);
      
      // Log successful configuration loading
      if (result.data.NODE_ENV !== 'production') {
        console.info('✅ Configuration loaded successfully', {
          environment: result.data.NODE_ENV,
          servicesAvailable: this.getAvailableServices(result.data).length,
          hasErrors: this.validationErrors.length > 0
        });
      }
      
      return result.data;
    } catch (error) {
      console.error('Critical configuration error:', error);
      
      // Return a minimal fallback configuration
      return this.createMinimalFallbackConfig();
    }
  }

  /**
   * Creates a fallback configuration when validation fails.
   * 
   * This method ensures the application can still start even with
   * configuration issues, using safe defaults where possible.
   * 
   * @param {Record<string, string | undefined>} envVars - Raw environment variables
   * @returns {Config} Fallback configuration
   */
  private createFallbackConfig(envVars: Record<string, string | undefined>): Config {
    return {
      NODE_ENV: (envVars.NODE_ENV as any) || 'development',
      PORT: parseInt(envVars.PORT || '3000', 10),
      DATABASE_URL: envVars.DATABASE_URL || '',
      GEMINI_API_KEY: envVars.GEMINI_API_KEY || undefined,
      OPENROUTER_API_KEY: envVars.OPENROUTER_API_KEY || undefined,
      LOG_LEVEL: (envVars.LOG_LEVEL as any) || 'info',
      LOG_FILE_PATH: envVars.LOG_FILE_PATH || 'logs',
      LOG_MAX_SIZE: envVars.LOG_MAX_SIZE || '20m',
      LOG_MAX_FILES: envVars.LOG_MAX_FILES || '14d',
      ENABLE_IMAGE_GENERATION: envVars.ENABLE_IMAGE_GENERATION === 'true',
      ENABLE_NEWS_FEEDS: envVars.ENABLE_NEWS_FEEDS === 'true',
      ENABLE_DEBUG_LOGGING: envVars.ENABLE_DEBUG_LOGGING === 'true',
      CORS_ORIGIN: envVars.CORS_ORIGIN || '*',
      RATE_LIMIT_REQUESTS: parseInt(envVars.RATE_LIMIT_REQUESTS || '100', 10),
      RATE_LIMIT_WINDOW: parseInt(envVars.RATE_LIMIT_WINDOW || '900000', 10),
      REQUEST_TIMEOUT: parseInt(envVars.REQUEST_TIMEOUT || '30000', 10),
      MAX_UPLOAD_SIZE: parseInt(envVars.MAX_UPLOAD_SIZE || '10485760', 10),
      IMAGE_MAX_WIDTH: parseInt(envVars.IMAGE_MAX_WIDTH || '4096', 10),
      IMAGE_MAX_HEIGHT: parseInt(envVars.IMAGE_MAX_HEIGHT || '4096', 10),
      IMAGE_MIN_WIDTH: parseInt(envVars.IMAGE_MIN_WIDTH || '32', 10),
      IMAGE_MIN_HEIGHT: parseInt(envVars.IMAGE_MIN_HEIGHT || '32', 10),
      AI_REQUEST_TIMEOUT: parseInt(envVars.AI_REQUEST_TIMEOUT || '60000', 10),
      AI_MAX_RETRIES: parseInt(envVars.AI_MAX_RETRIES || '3', 10),
      AI_RETRY_DELAY: parseInt(envVars.AI_RETRY_DELAY || '1000', 10),
    };
  }

  /**
   * Creates a minimal fallback configuration for critical errors.
   * 
   * This method provides the absolute minimum configuration needed
   * for the application to start, even in worst-case scenarios.
   * 
   * @returns {Config} Minimal fallback configuration
   */
  private createMinimalFallbackConfig(): Config {
    return {
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_URL: '',
      GEMINI_API_KEY: undefined,
      OPENROUTER_API_KEY: undefined,
      LOG_LEVEL: 'info',
      LOG_FILE_PATH: 'logs',
      LOG_MAX_SIZE: '20m',
      LOG_MAX_FILES: '14d',
      ENABLE_IMAGE_GENERATION: false,
      ENABLE_NEWS_FEEDS: false,
      ENABLE_DEBUG_LOGGING: false,
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
  }

  /**
   * Validates critical services and logs warnings for missing services.
   * 
   * @param {Config} config - The validated configuration
   */
  private validateCriticalServices(config: Config): void {
    const warnings: string[] = [];
    
    if (!config.DATABASE_URL) {
      warnings.push('DATABASE_URL is missing - database features will be disabled');
    }
    
    if (!config.GEMINI_API_KEY) {
      warnings.push('GEMINI_API_KEY is missing - image analysis will be disabled');
    }
    
    if (!config.OPENROUTER_API_KEY) {
      warnings.push('OPENROUTER_API_KEY is missing - AI search will be disabled');
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️  Service availability warnings:', warnings);
    }
  }

  /**
   * Gets the list of available services based on configuration.
   * 
   * @param {Config} config - The configuration to check
   * @returns {string[]} Array of available service names
   */
  private getAvailableServices(config: Config): string[] {
    const services: string[] = [];
    
    if (config.GEMINI_API_KEY) services.push('Gemini');
    if (config.OPENROUTER_API_KEY) services.push('OpenRouter');
    if (config.DATABASE_URL) services.push('Database');
    
    return services;
  }

  /**
   * Gets the current configuration.
   * 
   * @returns {Config} The validated configuration object
   */
  public get(): Config {
    if (!this.isInitialized) {
      throw new Error('Configuration manager not initialized');
    }
    return this.config;
  }

  /**
   * Gets configuration validation errors.
   * 
   * @returns {string[]} Array of validation error messages
   */
  public getValidationErrors(): string[] {
    return this.validationErrors;
  }

  /**
   * Checks if the configuration has any validation errors.
   * 
   * @returns {boolean} True if configuration is valid, false otherwise
   */
  public isValid(): boolean {
    return this.validationErrors.length === 0;
  }

  /**
   * Checks if a specific service is available.
   * 
   * @param {string} serviceName - Name of the service to check
   * @returns {boolean} True if service is available, false otherwise
   */
  public isServiceAvailable(serviceName: string): boolean {
    const config = this.config;
    
    switch (serviceName.toLowerCase()) {
      case 'gemini':
        return !!config.GEMINI_API_KEY;
      case 'openrouter':
        return !!config.OPENROUTER_API_KEY;
      case 'database':
        return !!config.DATABASE_URL;
      case 'imagegeneration':
        return config.ENABLE_IMAGE_GENERATION;
      case 'newsfeeds':
        return config.ENABLE_NEWS_FEEDS;
      default:
        return false;
    }
  }

  /**
   * Gets service-specific configuration.
   * 
   * @param {string} serviceName - Name of the service
   * @returns {any} Service configuration object or null
   */
  public getServiceConfig(serviceName: string): any {
    const config = this.config;
    
    switch (serviceName.toLowerCase()) {
      case 'gemini':
        return config.GEMINI_API_KEY ? { apiKey: config.GEMINI_API_KEY } : null;
      case 'openrouter':
        return config.OPENROUTER_API_KEY ? { apiKey: config.OPENROUTER_API_KEY } : null;
      case 'database':
        return config.DATABASE_URL ? { url: config.DATABASE_URL } : null;
      case 'logging':
        return {
          level: config.LOG_LEVEL,
          filePath: config.LOG_FILE_PATH,
          maxSize: config.LOG_MAX_SIZE,
          maxFiles: config.LOG_MAX_FILES,
          debugEnabled: config.ENABLE_DEBUG_LOGGING,
        };
      case 'images':
        return {
          maxWidth: config.IMAGE_MAX_WIDTH,
          maxHeight: config.IMAGE_MAX_HEIGHT,
          minWidth: config.IMAGE_MIN_WIDTH,
          minHeight: config.IMAGE_MIN_HEIGHT,
          maxSize: config.MAX_UPLOAD_SIZE,
        };
      case 'ai':
        return {
          timeout: config.AI_REQUEST_TIMEOUT,
          maxRetries: config.AI_MAX_RETRIES,
          retryDelay: config.AI_RETRY_DELAY,
        };
      default:
        return null;
    }
  }

  /**
   * Gets service availability status.
   * 
   * @returns {ServiceAvailability} Service availability object
   */
  public getServiceAvailability(): ServiceAvailability {
    const config = this.config;
    
    return {
      gemini: !!config.GEMINI_API_KEY,
      openrouter: !!config.OPENROUTER_API_KEY,
      database: !!config.DATABASE_URL,
      imageGeneration: config.ENABLE_IMAGE_GENERATION,
      newsFeeds: config.ENABLE_NEWS_FEEDS,
    };
  }

  /**
   * Reloads the configuration from environment variables.
   * 
   * This method allows for runtime configuration updates
   * without restarting the application.
   * 
   * @returns {ConfigValidationResult} Result of the reload operation
   */
  public reload(): ConfigValidationResult {
    try {
      const previousConfig = this.config;
      this.validationErrors = [];
      this.config = this.loadAndValidateConfig();
      
      console.info('Configuration reloaded successfully');
      
      return {
        success: true,
        config: this.config,
        errors: this.validationErrors,
      };
    } catch (error) {
      console.error('Configuration reload failed:', error);
      
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Gets configuration summary for logging and debugging.
   * 
   * @returns {object} Configuration summary (without sensitive data)
   */
  public getSummary(): object {
    const config = this.config;
    
    return {
      environment: config.NODE_ENV,
      port: config.PORT,
      logLevel: config.LOG_LEVEL,
      services: {
        gemini: !!config.GEMINI_API_KEY,
        openrouter: !!config.OPENROUTER_API_KEY,
        database: !!config.DATABASE_URL,
      },
      features: {
        imageGeneration: config.ENABLE_IMAGE_GENERATION,
        newsFeeds: config.ENABLE_NEWS_FEEDS,
        debugLogging: config.ENABLE_DEBUG_LOGGING,
      },
      validationErrors: this.validationErrors.length,
    };
  }
}

/**
 * Singleton instance of the configuration manager.
 * 
 * This is the main configuration instance used throughout the application.
 * It provides consistent, type-safe access to all configuration values.
 * 
 * @example
 * import { configManager } from '@/shared/config/manager';
 * 
 * const config = configManager.get();
 * const isGeminiAvailable = configManager.isServiceAvailable('gemini');
 */
export const configManager = new ConfigurationManager();

// Export the configuration manager class for testing
export { ConfigurationManager };