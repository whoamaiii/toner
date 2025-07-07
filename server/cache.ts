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
import crypto from "crypto";
import { CONFIG } from "./config";

// Use centralized cache configuration
const CACHE_CONFIG = {
  searchTTL: CONFIG.cache.SEARCH_TTL,
  reasoningTTL: CONFIG.cache.REASONING_TTL,
  checkperiod: CONFIG.cache.CHECK_PERIOD,
  useClones: CONFIG.cache.USE_CLONES,
  maxKeys: CONFIG.cache.MAX_KEYS,
  maxKeyLength: CONFIG.cache.MAX_KEY_LENGTH,
  maxQueryLength: CONFIG.cache.MAX_QUERY_LENGTH,
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
  // Escape special characters and limit length using configuration
  const sanitizedQuery = query.replace(/[\|:]/g, '_').substring(0, CACHE_CONFIG.maxQueryLength);
  const sanitizedMode = mode.replace(/[\|:]/g, '_');
  
  // Create a hash of the full query for uniqueness
  const queryHash = crypto.createHash('md5').update(query).digest('hex').substring(0, 8);
  
  let key = `q:${sanitizedQuery}|h:${queryHash}|m:${sanitizedMode}`;
  if (imageHash) {
    key += `|i:${imageHash}`;
  }
  
  // Ensure key doesn't exceed configured length limit
  if (key.length > CACHE_CONFIG.maxKeyLength) {
    // If too long, use only hashes
    const fullHash = crypto.createHash('md5').update(`${query}|${mode}|${imageHash || ''}`).digest('hex');
    key = `hash:${fullHash}`;
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
