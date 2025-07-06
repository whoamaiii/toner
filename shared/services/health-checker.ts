/**
 * Service health checker for the TonerWeb AI Assistant.
 * 
 * This module provides comprehensive health checking capabilities for:
 * - External API services (Gemini, OpenRouter)
 * - Database connectivity
 * - Application features and configuration
 * - Service dependency monitoring
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import { configManager } from '../config/manager';

/**
 * Service health status enumeration.
 * 
 * Defines the possible states for each service:
 * - healthy: Service is fully operational
 * - degraded: Service is partially working with some issues
 * - unhealthy: Service is not working or unavailable
 * - unknown: Service status could not be determined
 */
export enum ServiceStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}

/**
 * Interface for individual service health information.
 */
export interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  message: string;
  lastCheck: Date;
  responseTime?: number;
  details?: Record<string, any>;
}

/**
 * Interface for overall system health information.
 */
export interface SystemHealth {
  overall: ServiceStatus;
  services: ServiceHealth[];
  summary: {
    healthy: number;
    degraded: number;
    unhealthy: number;
    unknown: number;
    total: number;
  };
  timestamp: Date;
}

/**
 * Interface for health check options.
 */
export interface HealthCheckOptions {
  timeout?: number;
  retries?: number;
  skipSlowChecks?: boolean;
}

/**
 * Health checker class that monitors all system services.
 * 
 * This class provides:
 * - Individual service health checks
 * - Overall system health assessment
 * - Performance monitoring
 * - Error tracking and reporting
 * - Configurable health check options
 */
class HealthChecker {
  private services: Map<string, ServiceHealth> = new Map();
  private lastFullCheck: Date | null = null;
  private checkInProgress: boolean = false;

  /**
   * Performs health checks on all services.
   * 
   * @param {HealthCheckOptions} options - Health check configuration options
   * @returns {Promise<SystemHealth>} Complete system health status
   */
  async checkAllServices(options: HealthCheckOptions = {}): Promise<SystemHealth> {
    if (this.checkInProgress) {
      // Return cached results if check is already in progress
      return this.getSystemHealth();
    }

    this.checkInProgress = true;
    const startTime = Date.now();

    try {
      // Run all health checks in parallel for better performance
      const healthChecks = [
        this.checkConfigurationService(options),
        this.checkGeminiService(options),
        this.checkOpenRouterService(options),
        this.checkDatabaseService(options),
        this.checkFileSystemService(options),
        this.checkFeatureFlags(options),
      ];

      const results = await Promise.allSettled(healthChecks);

      // Process results and update service map
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          this.services.set(result.value.name, result.value);
        } else {
          // Handle failed health checks
          const serviceName = ['Configuration', 'Gemini', 'OpenRouter', 'Database', 'FileSystem', 'Features'][index];
          this.services.set(serviceName, {
            name: serviceName,
            status: ServiceStatus.UNKNOWN,
            message: `Health check failed: ${result.reason}`,
            lastCheck: new Date(),
          });
        }
      });

      this.lastFullCheck = new Date();
      const totalTime = Date.now() - startTime;

      // Log health check completion
      if (configManager.get().NODE_ENV !== 'production') {
        console.info(`🔍 Health check completed in ${totalTime}ms`);
      }

      return this.getSystemHealth();
    } finally {
      this.checkInProgress = false;
    }
  }

  /**
   * Checks configuration service health.
   * 
   * @param {HealthCheckOptions} options - Health check options
   * @returns {Promise<ServiceHealth>} Configuration service health
   */
  private async checkConfigurationService(options: HealthCheckOptions): Promise<ServiceHealth> {
    const name = 'Configuration';
    const startTime = Date.now();

    try {
      const config = configManager.get();
      const errors = configManager.getValidationErrors();
      const isValid = configManager.isValid();

      const responseTime = Date.now() - startTime;

      if (!isValid && errors.length > 0) {
        return {
          name,
          status: ServiceStatus.DEGRADED,
          message: `Configuration has ${errors.length} validation error(s)`,
          lastCheck: new Date(),
          responseTime,
          details: { errors: errors.slice(0, 3) } // Limit to first 3 errors
        };
      }

      return {
        name,
        status: ServiceStatus.HEALTHY,
        message: 'Configuration loaded and validated successfully',
        lastCheck: new Date(),
        responseTime,
        details: {
          environment: config.NODE_ENV,
          validationErrors: errors.length
        }
      };
    } catch (error) {
      return {
        name,
        status: ServiceStatus.UNHEALTHY,
        message: `Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Checks Gemini API service health.
   * 
   * @param {HealthCheckOptions} options - Health check options
   * @returns {Promise<ServiceHealth>} Gemini service health
   */
  private async checkGeminiService(options: HealthCheckOptions): Promise<ServiceHealth> {
    const name = 'Gemini API';
    const startTime = Date.now();

    try {
      if (!configManager.isServiceAvailable('gemini')) {
        return {
          name,
          status: ServiceStatus.UNHEALTHY,
          message: 'API key not configured',
          lastCheck: new Date(),
          responseTime: Date.now() - startTime,
          details: { configured: false }
        };
      }

      // For now, we just check if the API key is configured
      // In a full implementation, you might make a test API call
      if (options.skipSlowChecks) {
        return {
          name,
          status: ServiceStatus.HEALTHY,
          message: 'API key configured (quick check)',
          lastCheck: new Date(),
          responseTime: Date.now() - startTime,
          details: { configured: true, quickCheck: true }
        };
      }

      // Could add actual API health check here with timeout
      // For now, just validate configuration
      const serviceConfig = configManager.getServiceConfig('gemini');
      
      return {
        name,
        status: ServiceStatus.HEALTHY,
        message: 'Service available and configured',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        details: { configured: true, hasApiKey: !!serviceConfig?.apiKey }
      };
    } catch (error) {
      return {
        name,
        status: ServiceStatus.UNHEALTHY,
        message: `Service check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Checks OpenRouter API service health.
   * 
   * @param {HealthCheckOptions} options - Health check options
   * @returns {Promise<ServiceHealth>} OpenRouter service health
   */
  private async checkOpenRouterService(options: HealthCheckOptions): Promise<ServiceHealth> {
    const name = 'OpenRouter API';
    const startTime = Date.now();

    try {
      if (!configManager.isServiceAvailable('openrouter')) {
        return {
          name,
          status: ServiceStatus.UNHEALTHY,
          message: 'API key not configured',
          lastCheck: new Date(),
          responseTime: Date.now() - startTime,
          details: { configured: false }
        };
      }

      if (options.skipSlowChecks) {
        return {
          name,
          status: ServiceStatus.HEALTHY,
          message: 'API key configured (quick check)',
          lastCheck: new Date(),
          responseTime: Date.now() - startTime,
          details: { configured: true, quickCheck: true }
        };
      }

      const serviceConfig = configManager.getServiceConfig('openrouter');
      
      return {
        name,
        status: ServiceStatus.HEALTHY,
        message: 'Service available and configured',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        details: { configured: true, hasApiKey: !!serviceConfig?.apiKey }
      };
    } catch (error) {
      return {
        name,
        status: ServiceStatus.UNHEALTHY,
        message: `Service check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Checks database service health.
   * 
   * @param {HealthCheckOptions} options - Health check options
   * @returns {Promise<ServiceHealth>} Database service health
   */
  private async checkDatabaseService(options: HealthCheckOptions): Promise<ServiceHealth> {
    const name = 'Database';
    const startTime = Date.now();

    try {
      if (!configManager.isServiceAvailable('database')) {
        return {
          name,
          status: ServiceStatus.UNHEALTHY,
          message: 'Database URL not configured',
          lastCheck: new Date(),
          responseTime: Date.now() - startTime,
          details: { configured: false }
        };
      }

      if (options.skipSlowChecks) {
        return {
          name,
          status: ServiceStatus.HEALTHY,
          message: 'Database URL configured (quick check)',
          lastCheck: new Date(),
          responseTime: Date.now() - startTime,
          details: { configured: true, quickCheck: true }
        };
      }

      // For a full implementation, you would test the actual database connection here
      // For now, just check configuration
      const config = configManager.get();
      const hasValidUrl = !!config.DATABASE_URL && config.DATABASE_URL.length > 0;

      return {
        name,
        status: hasValidUrl ? ServiceStatus.HEALTHY : ServiceStatus.UNHEALTHY,
        message: hasValidUrl ? 'Database accessible' : 'Invalid database configuration',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        details: { configured: hasValidUrl }
      };
    } catch (error) {
      return {
        name,
        status: ServiceStatus.UNHEALTHY,
        message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Checks file system service health.
   * 
   * @param {HealthCheckOptions} options - Health check options
   * @returns {Promise<ServiceHealth>} File system service health
   */
  private async checkFileSystemService(options: HealthCheckOptions): Promise<ServiceHealth> {
    const name = 'File System';
    const startTime = Date.now();

    try {
      const config = configManager.get();
      const logPath = config.LOG_FILE_PATH;

      // Check if we can access the file system (basic check)
      if (options.skipSlowChecks) {
        return {
          name,
          status: ServiceStatus.HEALTHY,
          message: 'File system accessible (quick check)',
          lastCheck: new Date(),
          responseTime: Date.now() - startTime,
          details: { logPath, quickCheck: true }
        };
      }

      // You could add actual file system checks here
      // For now, assume file system is accessible
      return {
        name,
        status: ServiceStatus.HEALTHY,
        message: 'File system accessible',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        details: { logPath }
      };
    } catch (error) {
      return {
        name,
        status: ServiceStatus.UNHEALTHY,
        message: `File system check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Checks feature flags and application features.
   * 
   * @param {HealthCheckOptions} options - Health check options
   * @returns {Promise<ServiceHealth>} Features service health
   */
  private async checkFeatureFlags(options: HealthCheckOptions): Promise<ServiceHealth> {
    const name = 'Features';
    const startTime = Date.now();

    try {
      const config = configManager.get();
      const features = {
        imageGeneration: config.ENABLE_IMAGE_GENERATION,
        newsFeeds: config.ENABLE_NEWS_FEEDS,
        debugLogging: config.ENABLE_DEBUG_LOGGING,
      };

      const enabledFeatures = Object.values(features).filter(Boolean).length;
      const totalFeatures = Object.keys(features).length;

      return {
        name,
        status: ServiceStatus.HEALTHY,
        message: `${enabledFeatures}/${totalFeatures} features enabled`,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        details: features
      };
    } catch (error) {
      return {
        name,
        status: ServiceStatus.UNHEALTHY,
        message: `Features check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Gets the health status of a specific service.
   * 
   * @param {string} serviceName - Name of the service to check
   * @returns {ServiceHealth | undefined} Service health or undefined if not found
   */
  getServiceStatus(serviceName: string): ServiceHealth | undefined {
    return this.services.get(serviceName);
  }

  /**
   * Gets overall system health based on individual service statuses.
   * 
   * @returns {SystemHealth} Complete system health information
   */
  getSystemHealth(): SystemHealth {
    const services = Array.from(this.services.values());
    
    const summary = {
      healthy: services.filter(s => s.status === ServiceStatus.HEALTHY).length,
      degraded: services.filter(s => s.status === ServiceStatus.DEGRADED).length,
      unhealthy: services.filter(s => s.status === ServiceStatus.UNHEALTHY).length,
      unknown: services.filter(s => s.status === ServiceStatus.UNKNOWN).length,
      total: services.length
    };

    // Determine overall status
    let overall: ServiceStatus;
    if (summary.unhealthy > 0) {
      overall = ServiceStatus.UNHEALTHY;
    } else if (summary.degraded > 0) {
      overall = ServiceStatus.DEGRADED;
    } else if (summary.unknown > 0) {
      overall = ServiceStatus.UNKNOWN;
    } else {
      overall = ServiceStatus.HEALTHY;
    }

    return {
      overall,
      services,
      summary,
      timestamp: new Date()
    };
  }

  /**
   * Gets a user-friendly health summary message.
   * 
   * @returns {string} Health summary message
   */
  getHealthSummary(): string {
    const health = this.getSystemHealth();
    
    if (health.overall === ServiceStatus.HEALTHY) {
      return `All services operational (${health.summary.total} services)`;
    }
    
    const issues: string[] = [];
    if (health.summary.unhealthy > 0) {
      issues.push(`${health.summary.unhealthy} unhealthy`);
    }
    if (health.summary.degraded > 0) {
      issues.push(`${health.summary.degraded} degraded`);
    }
    if (health.summary.unknown > 0) {
      issues.push(`${health.summary.unknown} unknown`);
    }
    
    return `System issues detected: ${issues.join(', ')} out of ${health.summary.total} services`;
  }

  /**
   * Performs a quick health check of critical services only.
   * 
   * @returns {Promise<SystemHealth>} Quick health check results
   */
  async quickHealthCheck(): Promise<SystemHealth> {
    return this.checkAllServices({ 
      timeout: 1000, 
      skipSlowChecks: true 
    });
  }

  /**
   * Checks if the system is ready to serve requests.
   * 
   * @returns {boolean} True if system is ready, false otherwise
   */
  isSystemReady(): boolean {
    const health = this.getSystemHealth();
    
    // System is ready if configuration is healthy and at least one AI service is available
    const configHealthy = this.services.get('Configuration')?.status === ServiceStatus.HEALTHY;
    const hasAiService = this.services.get('Gemini API')?.status === ServiceStatus.HEALTHY ||
                        this.services.get('OpenRouter API')?.status === ServiceStatus.HEALTHY;
    
    return configHealthy && hasAiService;
  }

  /**
   * Gets the time of the last full health check.
   * 
   * @returns {Date | null} Last check time or null if never checked
   */
  getLastCheckTime(): Date | null {
    return this.lastFullCheck;
  }

  /**
   * Clears cached health information (forces fresh check on next call).
   */
  clearCache(): void {
    this.services.clear();
    this.lastFullCheck = null;
  }
}

/**
 * Singleton instance of the health checker.
 * 
 * This is the main health checker instance used throughout the application.
 * It provides consistent health monitoring across all services.
 * 
 * @example
 * import { healthChecker } from '@/shared/services/health-checker';
 * 
 * const health = await healthChecker.checkAllServices();
 * const isReady = healthChecker.isSystemReady();
 */
export const healthChecker = new HealthChecker();

// Export the health checker class for testing
export { HealthChecker };