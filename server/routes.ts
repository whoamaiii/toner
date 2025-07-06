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

import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertChatSessionSchema, insertMessageSchema } from "@shared/schema";
import { searchTonerWebProducts } from "./perplexity";

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
    console.log('AI Chat endpoint called with body:', req.body);
    try {
      const { message, mode, image } = aiRequestSchema.parse(req.body);
      console.log('Parsed request:', { message, mode, hasImage: !!image });
      
      let response;
      try {
        response = await searchTonerWebProducts(message, mode, image);
        console.log('Response received from searchTonerWebProducts');
      } catch (aiError) {
        console.error('Error in searchTonerWebProducts:', aiError);
        return res.status(500).json({ 
          message: 'AI service temporarily unavailable',
          error: 'The AI service is experiencing issues. Please try again later.',
          details: aiError instanceof Error ? aiError.message : 'Unknown AI error'
        });
      }
      
      res.json({ content: response });
    } catch (error: unknown) {
      console.error('AI Chat Error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Invalid request data',
          error: 'Please check your request format',
          details: error.errors
        });
      }
      
      res.status(500).json({ 
        message: 'Failed to process AI request',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/ai/generate-image
   * 
   * Image generation endpoint (placeholder implementation).
   * 
   * This endpoint is planned for future implementation to generate
   * product images or promotional materials.
   * 
   * @route POST /api/ai/generate-image
   * @param {Object} req.body - Request body containing the image prompt
   * @param {string} req.body.prompt - Text prompt for image generation
   * @returns {Object} JSON response with generated image or placeholder message
   */
  app.post("/api/ai/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }

      // Placeholder response for image generation
      res.json({ 
        message: 'Image generation feature is coming soon!',
        prompt 
      });
    } catch (error) {
      console.error('Image Generation Error:', error);
      res.status(500).json({ message: 'Failed to generate image' });
    }
  });

  /**
   * GET /api/ai/news
   * 
   * Latest news endpoint (placeholder implementation).
   * 
   * This endpoint is planned for future implementation to fetch
   * news related to printing, toner products, or technology.
   * 
   * @route GET /api/ai/news
   * @param {string} [query] - Optional query parameter for news filtering
   * @returns {Object} JSON response with news data or placeholder message
   */
  app.get("/api/ai/news", async (req, res) => {
    try {
      const { query } = req.query;
      
      // Placeholder response for news
      res.json({
        message: 'Latest news feature is coming soon!',
        query: query || 'general'
      });
    } catch (error) {
      console.error('News Error:', error);
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
  app.post("/api/chat/sessions", async (req, res) => {
    try {
      const sessionData = insertChatSessionSchema.parse(req.body);
      const session = await storage.createChatSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error('Create Session Error:', error);
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
  app.get("/api/chat/sessions/:id", async (req, res) => {
    try {
      const sessionId = validateSessionId(req.params.id);
      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      res.json(session);
    } catch (error) {
      console.error('Get Session Error:', error);
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
  app.get("/api/chat/sessions/:id/messages", async (req, res) => {
    try {
      const sessionId = validateSessionId(req.params.id);
      const messages = await storage.getSessionMessages(sessionId);
      res.json(messages);
    } catch (error) {
      console.error('Get Messages Error:', error);
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
  app.post("/api/chat/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error('Create Message Error:', error);
      res.status(500).json({ message: 'Failed to create message' });
    }
  });

  // Create and return HTTP server instance
  const httpServer = createServer(app);
  return httpServer;
}




