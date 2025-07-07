/**
 * Search Analytics and Monitoring System
 * 
 * This module provides functionality for tracking search performance,
 * usage patterns, and other key metrics to help improve the AI assistant.
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import { logger } from "@shared/logger";
import { getCacheStats } from "./cache";
import type { Request, Response } from "express-serve-static-core";

interface SearchEvent {
  timestamp: number;
  query: string;
  mode: string;
  hasImage: boolean;
  classification: any;
  responseTime: number;
  success: boolean;
  cacheHit: boolean;
  modelUsed: string;
  responseLength: number;
}

// In-memory store for analytics data (for demonstration purposes)
// In a production environment, this should be a database or analytics service.
const analyticsStore: {
  searchEvents: SearchEvent[];
  errorEvents: any[];
} = {
  searchEvents: [],
  errorEvents: []
};

/**
 * Logs a search event to the analytics store.
 * 
 * @param {Omit<SearchEvent, 'timestamp'>} eventData - The search event data
 */
export function logSearchEvent(eventData: Omit<SearchEvent, 'timestamp'>): void {
  const event: SearchEvent = {
    timestamp: Date.now(),
    ...eventData
  };
  analyticsStore.searchEvents.push(event);
  logger.debug('Search event logged', { query: event.query });
}

/**
 * Logs an error event to the analytics store.
 * 
 * @param {any} error - The error object
 * @param {string} context - The context in which the error occurred
 */
export function logErrorEvent(error: any, context: string): void {
  const event = {
    timestamp: Date.now(),
    error: error.message || 'Unknown error',
    stack: error.stack,
    context
  };
  analyticsStore.errorEvents.push(event);
  logger.error(`Analytics error logged in context: ${context}`, error);
}

/**
 * Returns a summary of search analytics.
 * 
 * @returns {object} Analytics summary
 */
export function getAnalyticsSummary(): object {
  const totalSearches = analyticsStore.searchEvents.length;
  if (totalSearches === 0) {
    return { message: "No search events logged yet." };
  }

  const successfulSearches = analyticsStore.searchEvents.filter(e => e.success).length;
  const failedSearches = totalSearches - successfulSearches;
  const cacheHits = analyticsStore.searchEvents.filter(e => e.cacheHit).length;
  
  const averageResponseTime = analyticsStore.searchEvents.reduce((sum, e) => sum + e.responseTime, 0) / totalSearches;
  
  const modelUsage = analyticsStore.searchEvents.reduce((acc, e) => {
    acc[e.modelUsed] = (acc[e.modelUsed] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const queryTypes = analyticsStore.searchEvents.reduce((acc, e) => {
    const type = e.classification?.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalSearches,
    successfulSearches,
    failedSearches,
    successRate: (successfulSearches / totalSearches) * 100,
    cacheHits,
    cacheHitRate: (cacheHits / totalSearches) * 100,
    averageResponseTime,
    modelUsage,
    queryTypes,
    totalErrors: analyticsStore.errorEvents.length
  };
}

/**
 * Returns the most recent search events.
 * 
 * @param {number} limit - The number of events to return
 * @returns {SearchEvent[]} Array of recent search events
 */
export function getRecentSearches(limit: number = 20): SearchEvent[] {
  return analyticsStore.searchEvents.slice(-limit).reverse();
}

/**
 * Returns the most recent error events.
 * 
 * @param {number} limit - The number of events to return
 * @returns {any[]} Array of recent error events
 */
export function getRecentErrors(limit: number = 20): any[] {
  return analyticsStore.errorEvents.slice(-limit).reverse();
}

/**
 * Adds an analytics endpoint to the Express app.
 * 
 * @param {any} app - The Express app instance
 */
export function addAnalyticsEndpoint(app: any): void {
  app.get("/api/analytics", (_req: Request, res: Response) => {
    res.json({
      summary: getAnalyticsSummary(),
      cacheStats: getCacheStats()
    });
  });
  
  app.get("/api/analytics/searches", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    res.json(getRecentSearches(limit));
  });
  
  app.get("/api/analytics/errors", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    res.json(getRecentErrors(limit));
  });
  
  logger.info('Analytics endpoints registered at /api/analytics');
}
