/**
 * API route definitions for the TonerWeb AI Assistant.
 * 
 * This module defines all HTTP endpoints for the application including:
 * - AI chat endpoints for product search and analysis
 * - Image generation endpoints (placeholder)
 * - News endpoints (placeholder)
 * - Chat session management endpoints
 * - Message management endpoints
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertChatSessionSchema, insertMessageSchema } from "@shared/schema";
import { searchTonerWebProducts } from "./perplexity";
import { logger } from "@shared/logger";
import { isFeatureEnabled, getFeatureMessage } from "@shared/features";
import { classifyQuery, shouldUseClaude, shouldUsePerplexity, shouldUseUnifiedReasoning } from "./query_classifier";
import { analyzeComplexQuery } from "./claude_reasoning";
import { logSearchEvent, logErrorEvent, addAnalyticsEndpoint } from "./analytics";

/**
 * Interface for AI chat requests.
 * 
 * @interface AIRequest
 * @property {string} message - The user's text message or query
 * @property {string} mode - The AI processing mode ('DeepSearch' or 'Think')
 * @property {string} [image] - Optional base64 encoded image for analysis
 */
interface AIRequest {
  message: string;
  mode: string;
  image?: string; // Base64 encoded image
}

/**
 * Zod schema for validating AI chat requests.
 * 
 * Ensures that:
 * - message is a non-empty string
 * - mode is either 'DeepSearch' or 'Think'
 * - image is optional and should be a base64 string
 */
const aiRequestSchema = z.object({
  message: z.string().min(1),
  mode: z.enum(['DeepSearch', 'Think']),
  image: z.string().optional(), // Base64 encoded image
});

/**
 * Zod schema for validating session ID parameters.
 * 
 * Ensures that session IDs are positive integers.
 */
const sessionIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number).refine((n: number) => n > 0, {
    message: "Session ID must be a positive integer"
  })
});

/**
 * Validates and parses a session ID from route parameters.
 * 
 * @param {string} id - The session ID string from route parameters
 * @returns {number} The validated session ID
 * @throws {Error} If the ID is invalid
 */
function validateSessionId(id: string): number {
  const result = sessionIdSchema.safeParse({ id });
  if (!result.success) {
    throw new Error(`Invalid session ID: ${result.error.errors[0].message}`);
  }
  return result.data.id;
}

/**
 * Registers all API routes with the Express application.
 * 
 * This function sets up all the HTTP endpoints for the application and returns
 * an HTTP server instance for further configuration.
 * 
 * @param app - Express application instance
 * @returns {Promise<Server>} HTTP server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {
  
  // Add analytics endpoints
  addAnalyticsEndpoint(app);

  // Health check endpoint
  app.get("/api/health", async (req: Request, res: Response) => {
    try {
      const health = {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        apis: {
          gemini: {
            configured: !!process.env.GEMINI_API_KEY,
            status: "unknown"
          },
          openrouter: {
            configured: !!process.env.OPENROUTER_API_KEY,
            status: "unknown"
          }
        }
      };
      
      // Quick test of Gemini API with timeout
      if (process.env.GEMINI_API_KEY) {
        try {
          // Set timeout for health check
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Health check timeout')), 5000);
          });
          
          const healthCheckPromise = (async () => {
            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
            const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            const gemResp = await model.generateContent("Hello");
            return gemResp.response.text() ? "ok" : "error";
          })();
          
          health.apis.gemini.status = await Promise.race([healthCheckPromise, timeoutPromise]);
        } catch (error) {
          health.apis.gemini.status = "error";
          logger.debug('Gemini health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      
      // Quick test of OpenRouter API with timeout
      if (process.env.OPENROUTER_API_KEY) {
        try {
          // Set timeout for health check
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Health check timeout')), 5000);
          });
          
          const healthCheckPromise = fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "perplexity/sonar-pro",
              messages: [{ role: "user", content: "Hello" }],
              max_tokens: 10
            }),
            // Add request timeout
            signal: AbortSignal.timeout(4000)
          });
          
          const response = await Promise.race([healthCheckPromise, timeoutPromise]) as Response;
          health.apis.openrouter.status = response.ok ? "ok" : "error";
        } catch (error) {
          health.apis.openrouter.status = "error";
          logger.debug('OpenRouter health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      
      res.json(health);
    } catch (error) {
      logger.error('Health check error', error);
      res.status(500).json({
        status: "error",
        message: "Health check failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  /**
   * POST /api/ai/chat
   * 
   * Main AI chat endpoint for product search and analysis.
   * 
   * This endpoint:
   * - Validates the request using Zod schema
   * - Processes text messages and optional images
   * - Uses different AI modes for different types of searches
   * - Returns AI-generated responses with product recommendations
   * 
   * @route POST /api/ai/chat
   * @param {AIRequest} req.body - The chat request payload
   * @returns {Object} JSON response with AI-generated content
   * 
   * @example
   * // Request
   * POST /api/ai/chat
   * {
   *   "message": "Find Canon PG-540 ink cartridge",
   *   "mode": "DeepSearch"
   * }
   * 
   * // Response
   * {
   *   "content": "Found Canon PG-540 ink cartridge on tonerweb.no..."
   * }
   */
  app.post("/api/ai/chat", async (req, res) => {
    const startTime = Date.now();
    logger.debug('AI Chat endpoint called', { hasBody: !!req.body });
    
    let message: string, mode: string, image: string | undefined;
    
    try {
      const parsedBody = aiRequestSchema.parse(req.body);
      message = parsedBody.message;
      mode = parsedBody.mode;
      image = parsedBody.image;
      
      logger.debug('Parsed request', { message: message.substring(0, 100) + '...', mode, hasImage: !!image });
      
      const classification = classifyQuery(message, !!image);
      logger.debug('Query classification', classification);
      
      let response;
      let modelUsed = 'unknown';
      let cacheHit = false;

      try {
        if (shouldUseUnifiedReasoning(classification)) {
          modelUsed = 'Sonar-Reasoning-Pro';
          response = await searchTonerWebProducts(message, mode, image);
        } else if (shouldUsePerplexity(classification) && !shouldUseClaude(classification)) {
          modelUsed = 'Perplexity';
          response = await searchTonerWebProducts(message, mode, image);
        } else if (shouldUseClaude(classification) && !shouldUsePerplexity(classification)) {
          modelUsed = 'Claude';
          response = await analyzeComplexQuery(message, undefined, image);
        } else if (classification.strategy === 'search-then-reason') {
          modelUsed = 'Perplexity+Claude';
          const searchResults = await searchTonerWebProducts(message, mode, image);
          response = await analyzeComplexQuery(message, searchResults, image);
        } else {
          modelUsed = 'Perplexity (default)';
          response = await searchTonerWebProducts(message, mode, image);
        }
        
        logSearchEvent({
          query: message,
          mode,
          hasImage: !!image,
          classification,
          responseTime: Date.now() - startTime,
          success: true,
          cacheHit, // This needs to be properly implemented in search/reasoning functions
          modelUsed,
          responseLength: response.length
        });
        
        res.json({ content: response });
        
      } catch (aiError) {
        logErrorEvent(aiError, 'AI Processing');
        logSearchEvent({
          query: message,
          mode,
          hasImage: !!image,
          classification,
          responseTime: Date.now() - startTime,
          success: false,
          cacheHit: false,
          modelUsed,
          responseLength: 0
        });
        
        return res.status(500).json({ 
          message: 'AI service temporarily unavailable',
          error: 'The AI service is experiencing issues. Please try again later.',
          details: aiError instanceof Error ? aiError.message : 'Unknown AI error'
        });
      }
      
    } catch (error: unknown) {
      logger.error('AI Chat Error', error);
      
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Invalid request data',
          error: 'Please check your request format',
          details: error.errors
        });
      }
      
      // Handle specific error types
      let statusCode = 500;
      let errorMessage = 'Failed to process AI request';
      
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('No auth credentials')) {
          statusCode = 401;
          errorMessage = 'API authentication failed';
        } else if (error.message.includes('429')) {
          statusCode = 429;
          errorMessage = 'Rate limit exceeded';
        } else if (error.message.includes('ECONNREFUSED')) {
          statusCode = 503;
          errorMessage = 'Service unavailable';
        }
      }
      
      res.status(statusCode).json({ 
        message: errorMessage,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/ai/generate-image
   * 
   * Image generation endpoint with feature flag support.
   * 
   * This endpoint checks if image generation is enabled before processing.
   * When disabled, it returns a "coming soon" message.
   * 
   * @route POST /api/ai/generate-image
   * @param {Object} req.body - Request body containing the image prompt
   * @param {string} req.body.prompt - Text prompt for image generation
   * @returns {Object} JSON response with generated image or feature status message
   */
  app.post("/api/ai/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }

      if (isFeatureEnabled('imageGeneration')) {
        // TODO: Implement actual image generation when feature is enabled
        res.json({ 
          message: 'Image generation is now available!',
          prompt,
          imageUrl: 'https://example.com/generated-image.jpg' // Placeholder
        });
      } else {
        res.json({ 
          message: getFeatureMessage('imageGeneration'),
          prompt,
          status: 'coming_soon'
        });
      }
    } catch (error) {
      logger.error('Image Generation Error', error);
      res.status(500).json({ message: 'Failed to generate image' });
    }
  });

  /**
   * GET /api/ai/news
   * 
   * Latest news endpoint with feature flag support.
   * 
   * This endpoint checks if news feeds are enabled before processing.
   * When disabled, it returns a "coming soon" message.
   * 
   * @route GET /api/ai/news
   * @param {string} [query] - Optional query parameter for news filtering
   * @returns {Object} JSON response with news data or feature status message
   */
  app.get("/api/ai/news", async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      
      if (isFeatureEnabled('newsFeeds')) {
        // TODO: Implement actual news fetching when feature is enabled
        res.json({
          message: 'Latest news is now available!',
          query: query || 'general',
          articles: [] // Placeholder for actual news articles
        });
      } else {
        res.json({
          message: getFeatureMessage('newsFeeds'),
          query: query || 'general',
          status: 'coming_soon',
          articles: []
        });
      }
    } catch (error) {
      logger.error('News Error', error);
      res.status(500).json({ message: 'Failed to fetch news' });
    }
  });

  /**
   * POST /api/chat/sessions
   * 
   * Creates a new chat session.
   * 
   * Chat sessions are used to organize conversations and maintain context
   * between multiple messages in a conversation thread.
   * 
   * @route POST /api/chat/sessions
   * @param {InsertChatSession} req.body - Chat session data
   * @returns {Object} JSON response with created session data
   */
  app.post("/api/chat/sessions", async (req: Request, res: Response) => {
    try {
      const sessionData = insertChatSessionSchema.parse(req.body);
      const session = await storage.createChatSession(sessionData);
      res.json(session);
    } catch (error) {
      logger.error('Create Session Error', error);
      res.status(500).json({ message: 'Failed to create chat session' });
    }
  });

  /**
   * GET /api/chat/sessions/:id
   * 
   * Retrieves a specific chat session by ID.
   * 
   * @route GET /api/chat/sessions/:id
   * @param {number} req.params.id - The chat session ID
   * @returns {Object} JSON response with session data or 404 if not found
   */
  app.get("/api/chat/sessions/:id", async (req: Request, res: Response) => {
    try {
      const sessionId = validateSessionId(req.params.id);
      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      res.json(session);
    } catch (error) {
      logger.error('Get Session Error', error);
      if (error instanceof Error && error.message.includes('Invalid session ID')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to get chat session' });
    }
  });

  /**
   * GET /api/chat/sessions/:id/messages
   * 
   * Retrieves all messages for a specific chat session.
   * 
   * @route GET /api/chat/sessions/:id/messages
   * @param {number} req.params.id - The chat session ID
   * @returns {Object} JSON response with array of messages
   */
  app.get("/api/chat/sessions/:id/messages", async (req: Request, res: Response) => {
    try {
      const sessionId = validateSessionId(req.params.id);
      const messages = await storage.getSessionMessages(sessionId);
      res.json(messages);
    } catch (error) {
      logger.error('Get Messages Error', error);
      if (error instanceof Error && error.message.includes('Invalid session ID')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to get messages' });
    }
  });

  /**
   * POST /api/chat/messages
   * 
   * Creates a new message in a chat session.
   * 
   * Messages can be from users or AI assistants and are stored with
   * metadata about the conversation context.
   * 
   * @route POST /api/chat/messages
   * @param {InsertMessage} req.body - Message data including content and role
   * @returns {Object} JSON response with created message data
   */
  app.post("/api/chat/messages", async (req: Request, res: Response) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      logger.error('Create Message Error', error);
      res.status(500).json({ message: 'Failed to create message' });
    }
  });

  // Create and return HTTP server instance
  const httpServer = createServer(app);
  return httpServer;
}
