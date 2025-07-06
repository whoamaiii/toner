import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

/**
 * Shared singleton instances for external AI services so we don\'t create
 * multiple SDK clients on every import. Keeping them in one place also makes
 * it easier to add retries / circuit-breakers later.
 */

export const geminiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export const openRouterClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  defaultHeaders: {
    "HTTP-Referer": "https://tonerweb.no", // Optional, helps ranking on OpenRouter
    "X-Title": "TonerWeb AI Assistant",   // Optional, helps ranking on OpenRouter
  },
});