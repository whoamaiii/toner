/**
 * Service validation utilities for the TonerWeb AI Assistant.
 * 
 * Provides health checks and validation for external APIs and services.
 * Helps with graceful degradation when services are unavailable.
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

interface ServiceStatus {
  name: string;
  available: boolean;
  message: string;
}

interface ServiceHealth {
  healthy: boolean;
  available: number;
  total: number;
  services: ServiceStatus[];
}

/**
 * Safe helper function to get environment variables
 */
const getEnvVar = (key: string): string | undefined => {
  try {
    return (globalThis as any).process?.env?.[key];
  } catch {
    return undefined;
  }
};

/**
 * Validate the status of all external services.
 * 
 * @returns Array of service status objects
 * 
 * @example
 * const services = validateServices();
 * services.forEach(service => {
 *   console.log(`${service.name}: ${service.message}`);
 * });
 */
export const validateServices = (): ServiceStatus[] => {
  const services: ServiceStatus[] = [];
  
  // Get environment variables safely
  const geminiApiKey = getEnvVar('GEMINI_API_KEY');
  const openRouterApiKey = getEnvVar('OPENROUTER_API_KEY');
  
  // Gemini API validation
  services.push({
    name: 'Gemini API',
    available: !!geminiApiKey,
    message: geminiApiKey 
      ? 'Image analysis available' 
      : 'Image analysis disabled - API key missing'
  });
  
  // OpenRouter API validation
  services.push({
    name: 'OpenRouter API',
    available: !!openRouterApiKey,
    message: openRouterApiKey 
      ? 'Text search available' 
      : 'Text search disabled - API key missing'
  });
  
  return services;
};

/**
 * Get overall health status of all services.
 * 
 * @returns Service health summary with counts and status
 * 
 * @example
 * const health = getServiceHealth();
 * if (health.healthy) {
 *   console.log('All services are operational');
 * } else {
 *   console.log(`${health.available}/${health.total} services available`);
 * }
 */
export const getServiceHealth = (): ServiceHealth => {
  const services = validateServices();
  const available = services.filter(s => s.available).length;
  const total = services.length;
  
  return {
    healthy: available === total,
    available,
    total,
    services
  };
};

/**
 * Get a user-friendly service status message.
 * 
 * @returns A formatted message about service availability
 * 
 * @example
 * const message = getServiceStatusMessage();
 * console.log(message); // "All services operational" or "Some services unavailable"
 */
export const getServiceStatusMessage = (): string => {
  const health = getServiceHealth();
  
  if (health.healthy) {
    return 'All services operational';
  } else {
    const unavailable = health.services.filter(s => !s.available);
    const names = unavailable.map(s => s.name).join(', ');
    return `Some services unavailable: ${names}`;
  }
};

/**
 * Check if a specific service is available.
 * 
 * @param serviceName - The name of the service to check
 * @returns True if the service is available, false otherwise
 * 
 * @example
 * if (isServiceAvailable('Gemini API')) {
 *   // Use Gemini API
 * } else {
 *   // Fallback or show error
 * }
 */
export const isServiceAvailable = (serviceName: string): boolean => {
  const services = validateServices();
  const service = services.find(s => s.name === serviceName);
  return service ? service.available : false;
};