import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import OpenAI from "openai";

// AI Service using OpenRouter's o3 model
interface AIRequest {
  message: string;
  mode: string;
}

const aiRequestSchema = z.object({
  message: z.string().min(1),
  mode: z.enum(['DeepSearch', 'Think']),
});

// Initialize OpenRouter client
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: "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",
});

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

  const httpServer = createServer(app);
  return httpServer;
}

// O3 AI response generator using OpenRouter
async function generateO3Response(message: string, mode: string): Promise<string> {
  try {
    const systemPrompt = mode === 'DeepSearch' 
      ? `You are SuperGrok, an advanced AI assistant. When in DeepSearch mode, provide comprehensive, well-researched responses with multiple perspectives. Include relevant sources and detailed analysis. Be thorough and informative.`
      : `You are SuperGrok, an advanced AI assistant. When in Think mode, provide thoughtful, step-by-step analysis. Break down complex topics and show your reasoning process. Be analytical and methodical.`;

    const completion = await openai.chat.completions.create({
      model: "openai/o3",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    
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


