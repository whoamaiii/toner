import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";
import { insertChatSessionSchema, insertMessageSchema } from "@shared/schema";

// AI Service using OpenRouter's o3 model
interface AIRequest {
  message: string;
  mode: string;
}

const aiRequestSchema = z.object({
  message: z.string().min(1),
  mode: z.enum(['DeepSearch', 'Think']),
});

// Initialize Gemini client
const genAI = new GoogleGenAI({ apiKey: "AIzaSyCHlUphzuYLfs4TXJpftQuTDH1aBQ17rDA" });

export async function registerRoutes(app: Express): Promise<Server> {
  
  // AI Chat endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, mode } = aiRequestSchema.parse(req.body);
      
      const response = await generateO3Response(message, mode);
      
      res.json({ content: response });
    } catch (error) {
      console.error('AI Chat Error:', error);
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

// Gemini AI response generator
async function generateGeminiResponse(message: string, mode: string): Promise<string> {
  try {
    const systemPrompt = mode === 'DeepSearch' 
      ? `You are the TonerWeb AI Assistant, a specialized product assistant for tonerweb.no - an e-commerce store that sells printer toners and supplies. Your primary goal is to help customers find the correct products available on tonerweb.no.

IMPORTANT RESTRICTIONS:
- ONLY search and recommend products from tonerweb.no
- ONLY provide information about products that are actually available on tonerweb.no
- When users ask about printer compatibility, search tonerweb.no specifically for compatible toner cartridges
- Always mention that products are from tonerweb.no
- If a product is not available on tonerweb.no, clearly state this and suggest similar alternatives that ARE available on the site
- Include product codes, page yields, and other specific details from tonerweb.no when available

When in DeepSearch mode, thoroughly research tonerweb.no's inventory to provide comprehensive product recommendations with detailed specifications, compatibility information, and availability status. Always cite tonerweb.no as your source.`
      : `You are the TonerWeb AI Assistant, a specialized product assistant for tonerweb.no. Your primary goal is to help customers find the correct products available on tonerweb.no.

IMPORTANT RESTRICTIONS:
- ONLY search and recommend products from tonerweb.no
- ONLY provide information about products that are actually available on tonerweb.no
- When users ask about printer compatibility, search tonerweb.no specifically for compatible toner cartridges
- Always mention that products are from tonerweb.no
- If a product is not available on tonerweb.no, clearly state this and suggest similar alternatives that ARE available on the site

When in Think mode, provide thoughtful, step-by-step analysis of the user's printer or product needs, then systematically search tonerweb.no to find the best matching products. Show your reasoning process for why specific products from tonerweb.no are the best recommendations.`;

    const model = genAI.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }],
      },
    });

    const response = await model.generateContent(message);
    return response.text || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Fallback to ensure the app doesn't break
    if (mode === 'DeepSearch') {
      return `I encountered an issue accessing my deep search capabilities. Here's what I can tell you about "${message}" based on my knowledge:

This topic involves several key aspects that are worth exploring. While I'm currently unable to access live search results, I can provide analysis based on established information and reasoning.

Please try your question again, or let me know if you'd like me to approach this differently.`;
    } else {
      return `Let me think through "${message}" step by step:

1. **Understanding the question**: I need to break down the core components of what you're asking.
2. **Analyzing the context**: Considering the broader implications and related factors.
3. **Reasoning through possibilities**: Exploring different angles and potential outcomes.
4. **Synthesizing insights**: Bringing together the key points into a coherent response.

I'm currently experiencing some technical difficulties, but I wanted to show you my thought process. Please try your question again.`;
    }
  }
}


