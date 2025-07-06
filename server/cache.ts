/**
 * In-memory caching system for search results and AI responses.
 * 
 * This module provides a simple in-memory cache to store results
 * from Perplexity, Claude, and Gemini to reduce API costs and
 * improve response times for frequent queries.
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import NodeCache from "node-cache";
import { logger } from "@shared/logger";

// Cache configuration
const CACHE_CONFIG = {
  // Standard TTL for cached items (in seconds)
  // 1 hour for search results, 15 minutes for reasoning
  searchTTL: 3600, // 1 hour
  reasoningTTL: 900, // 15 minutes
  
  // Check for expired items every 5 minutes
  checkperiod: 300,
  
  // Allow cloning of cached values to prevent mutation
  useClones: true,
  
  // Max number of keys in cache
  maxKeys: 500
};

// Create separate caches for different data types
const searchCache = new NodeCache({
  stdTTL: CACHE_CONFIG.searchTTL,
  checkperiod: CACHE_CONFIG.checkperiod,
  useClones: CACHE_CONFIG.useClones,
  maxKeys: CACHE_CONFIG.maxKeys
});

const reasoningCache = new NodeCache({
  stdTTL: CACHE_CONFIG.reasoningTTL,
  checkperiod: CACHE_CONFIG.checkperiod,
  useClones: CACHE_CONFIG.useClones,
  maxKeys: CACHE_CONFIG.maxKeys
});

/**
 * Generates a unique cache key for a given query and context.
 * 
 * @param {string} query - The user's query
 * @param {string} mode - The search mode ('DeepSearch' or 'Think')
 * @param {string} [imageHash] - Optional hash of the image data
 * @returns {string} A unique cache key
 */
export function generateCacheKey(query: string, mode: string, imageHash?: string): string {
  let key = `q:${query}|m:${mode}`;
  if (imageHash) {
    key += `|i:${imageHash}`;
  }
  return key;
}

/**
 * Caches a search result.
 * 
 * @param {string} key - The cache key
 * @param {any} value - The value to cache
 */
export function cacheSearchResult(key: string, value: any): void {
  searchCache.set(key, value);
  logger.debug('Search result cached', { key, ttl: CACHE_CONFIG.searchTTL });
}

/**
 * Retrieves a cached search result.
 * 
 * @param {string} key - The cache key
 * @returns {any | undefined} The cached value or undefined if not found
 */
export function getCachedSearchResult(key: string): any | undefined {
  const value = searchCache.get(key);
  if (value) {
    logger.debug('Search result retrieved from cache', { key });
  }
  return value;
}

/**
 * Caches a reasoning result.
 * 
 * @param {string} key - The cache key
 * @param {any} value - The value to cache
 */
export function cacheReasoningResult(key: string, value: any): void {
  reasoningCache.set(key, value);
  logger.debug('Reasoning result cached', { key, ttl: CACHE_CONFIG.reasoningTTL });
}

/**
 * Retrieves a cached reasoning result.
 * 
 * @param {string} key - The cache key
 * @returns {any | undefined} The cached value or undefined if not found
 */
export function getCachedReasoningResult(key: string): any | undefined {
  const value = reasoningCache.get(key);
  if (value) {
    logger.debug('Reasoning result retrieved from cache', { key });
  }
  return value;
}

/**
 * Returns statistics for all caches.
 * 
 * @returns {object} Cache statistics
 */
export function getCacheStats(): object {
  return {
    searchCache: searchCache.getStats(),
    reasoningCache: reasoningCache.getStats()
  };
}

/**
 * Flushes all caches.
 */
export function flushAllCaches(): void {
  searchCache.flushAll();
  reasoningCache.flushAll();
  logger.info('All caches flushed');
}

// Event listeners for cache events
searchCache.on('set', (key, value) => {
  logger.debug(`Search cache SET: ${key}`);
});

searchCache.on('del', (key, value) => {
  logger.debug(`Search cache DEL: ${key}`);
});

reasoningCache.on('set', (key, value) => {
  logger.debug(`Reasoning cache SET: ${key}`);
});

reasoningCache.on('del', (key, value) => {
  logger.debug(`Reasoning cache DEL: ${key}`);
});
