import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertChatSessionSchema, insertMessageSchema } from "@shared/schema";
import { searchTonerWebProducts } from "./perplexity";

// AI Service using Google Gemini 2.5 Flash with search grounding
interface AIRequest {
  message: string;
  mode: string;
  image?: string; // Base64 encoded image
}

const aiRequestSchema = z.object({
  message: z.string().min(1),
  mode: z.enum(['DeepSearch', 'Think']),
  image: z.string().optional(), // Base64 encoded image
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // AI Chat endpoint
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
    } catch (error: any) {
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

  // Image generation endpoint
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

  // Latest news endpoint
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

  // Chat session endpoints
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

  app.get("/api/chat/sessions/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      res.json(session);
    } catch (error) {
      console.error('Get Session Error:', error);
      res.status(500).json({ message: 'Failed to get chat session' });
    }
  });

  app.get("/api/chat/sessions/:id/messages", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const messages = await storage.getSessionMessages(sessionId);
      res.json(messages);
    } catch (error) {
      console.error('Get Messages Error:', error);
      res.status(500).json({ message: 'Failed to get messages' });
    }
  });

  // Message endpoints
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

  const httpServer = createServer(app);
  return httpServer;
}




