/**
 * Feature flags system for the TonerWeb AI Assistant.
 * 
 * Controls which features are enabled or disabled, allowing for safe feature rollouts
 * and graceful handling of incomplete functionality.
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

interface FeatureFlags {
  imageGeneration: boolean;
  newsFeeds: boolean;
  [key: string]: boolean;
}

/**
 * Feature flags configuration.
 * 
 * Set to false for features that are not yet implemented or should be disabled.
 * Set to true for features that are ready for production use.
 */
export const features: FeatureFlags = {
  imageGeneration: false,  // Coming soon - AI image generation
  newsFeeds: false,        // Coming soon - Latest news feeds
};

/**
 * Check if a specific feature is enabled.
 * 
 * @param feature - The feature name to check
 * @returns True if the feature is enabled, false otherwise
 * 
 * @example
 * if (isFeatureEnabled('imageGeneration')) {
 *   // Handle image generation
 * } else {
 *   // Show "coming soon" message
 * }
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return features[feature] === true;
};

/**
 * Get the status of a feature as a string.
 * 
 * @param feature - The feature name to check
 * @returns 'enabled' if the feature is available, 'coming_soon' if not
 * 
 * @example
 * const status = getFeatureStatus('imageGeneration');
 * // Returns 'enabled' or 'coming_soon'
 */
export const getFeatureStatus = (feature: keyof FeatureFlags): string => {
  return features[feature] ? 'enabled' : 'coming_soon';
};

/**
 * Get user-friendly messages for features.
 * 
 * @param feature - The feature name
 * @returns A user-friendly message about the feature status
 */
export const getFeatureMessage = (feature: 'imageGeneration' | 'newsFeeds'): string => {
  const messages: Record<'imageGeneration' | 'newsFeeds', string> = {
    imageGeneration: features.imageGeneration
      ? 'AI image generation is available'
      : 'AI image generation is coming soon! We\'re working on bringing you powerful image creation capabilities.',
    newsFeeds: features.newsFeeds
      ? 'Latest news feeds are available'
      : 'Latest news feeds are coming soon! We\'re working on bringing you relevant industry news and updates.',
  };
  
  return messages[feature] || 'Feature status unknown';
};