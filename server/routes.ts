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
import aiRoutes from "./routes/aiRoutes";
import chatRoutes from "./routes/chatRoutes";

/**
 * Registers modular API routes and returns the underlying HTTP server.
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Mount modular routers
  app.use("/api/ai", aiRoutes);
  app.use("/api/chat", chatRoutes);

  // Create and return HTTP server
  return createServer(app);
}




