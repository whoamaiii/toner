/**
 * Main server entry point for the TonerWeb AI Assistant application.
 * 
 * This file sets up the Express server with necessary middleware, routes, and error handling.
 * The server handles both API endpoints and serves the frontend application.
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { logger } from "@shared/logger";
import { getServiceHealth, getServiceStatusMessage } from "@shared/service-validator";

const app = express();

// Configure request body parsing with increased limits for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Request logging middleware that captures and logs API requests with their duration and response data.
 * 
 * Features:
 * - Tracks request duration
 * - Captures JSON responses for logging
 * - Truncates long log lines to prevent console spam
 * - Only logs API routes (paths starting with /api)
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Intercept res.json to capture response data
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log request details when response is finished
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      // Truncate long log lines to keep console readable
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/**
 * Self-executing async function that initializes the server.
 * 
 * This function:
 * - Validates required environment variables and service health
 * - Registers API routes
 * - Sets up error handling middleware
 * - Configures development/production serving
 * - Starts the server on port 3000
 */
(async () => {
  // Comprehensive service validation
  const serviceHealth = getServiceHealth();
  const statusMessage = getServiceStatusMessage();
  
  if (serviceHealth.healthy) {
    logger.info('All services operational', {
      available: serviceHealth.available,
      total: serviceHealth.total
    });
  } else {
    logger.warn('Some services are unavailable', {
      available: serviceHealth.available,
      total: serviceHealth.total,
      message: statusMessage
    });
    
    // Log detailed service status
    serviceHealth.services.forEach(service => {
      if (service.available) {
        logger.info(`✅ ${service.name}: ${service.message}`);
      } else {
        logger.warn(`❌ ${service.name}: ${service.message}`);
      }
    });
    
    // Provide guidance for missing services
    if (!serviceHealth.healthy) {
      logger.info('Server will start with limited functionality');
      logger.info('To enable all features, configure missing API keys in .env file');
    }
  }
  
  // Register all API routes
  const server = await registerRoutes(app);

  /**
   * Global error handling middleware.
   * 
   * Catches all errors thrown in route handlers and returns appropriate HTTP responses.
   * Uses proper logging instead of console.error.
   * 
   * @param err - The error object (can be any type)
   * @param _req - Express request object (unused)
   * @param res - Express response object
   * @param _next - Express next function (unused)
   */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Only send response if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
    
    // Log error with proper logging instead of console.error
    logger.error('Error handled by global error middleware', {
      status,
      message,
      stack: err.stack,
      name: err.name
    });
  });

  // Configure serving based on environment
  // In development: use Vite dev server with HMR
  // In production: serve static files from build
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start the server
  // Port 3000 is used for both API and client serving
  // This is the only port that's not firewalled in the deployment environment
  const port = 3000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
