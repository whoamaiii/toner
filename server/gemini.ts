/**
 * Google Gemini AI integration for the TonerWeb AI Assistant.
 * 
 * This module provides integration with Google's Gemini AI model for:
 * - Image analysis of toner/ink cartridges and office products
 * - Text generation for product searches and recommendations
 * - Vision capabilities for product identification from images
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import { GoogleGenAI } from "@google/genai";
import { geminiClient } from "./ai/clients";
import { analyzeTonerImage as sharedAnalyzeTonerImage } from "./ai/imageAnalysis";
import { buildTonerPrompt } from "./ai/prompts";

/**
 * Google Gemini AI client instance.
 * 
 * Initialized with the API key from environment variables.
 * Falls back to empty string if no API key is provided.
 */
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Analyzes uploaded images of toner cartridges, ink cartridges, or office products.
 * 
 * This function uses Google Gemini's vision capabilities to:
 * - Identify product type (ink cartridge, toner cartridge, or office product)
 * - Extract model numbers, brand information, and specifications
 * - Generate Norwegian search terms for tonerweb.no
 * - Provide detailed product analysis for accurate search queries
 * 
 * The analysis includes:
 * - Product type identification (critical for search strategy)
 * - Brand and model number extraction
 * - Compatibility information
 * - Size/capacity details (XL, XXL, etc.)
 * - Color codes for ink cartridges
 * - Norwegian search terms for optimal results
 * 
 * @param {string} imageBase64 - Base64 encoded image data including data URL prefix
 * @returns {Promise<string>} Detailed analysis of the image in Norwegian
 * 
 * @example
 * const analysis = await analyzeTonerImage("data:image/jpeg;base64,/9j/4AAQ...");
 * // Returns: "PRODUKTTYPE: BLEKKPATRON - Canon PG-540XL, sort blekk..."
 * 
 * @throws {Error} When image analysis fails or API key is invalid
 */
export const analyzeTonerImage = sharedAnalyzeTonerImage;

/**
 * Generates AI responses for product searches and recommendations using Gemini.
 * 
 * This function creates detailed responses for product searches on tonerweb.no using
 * Google's Gemini AI with search grounding capabilities. It can operate in two modes:
 * 
 * **DeepSearch Mode:**
 * - Performs comprehensive product searches with exact URLs
 * - Finds specific product pages on tonerweb.no
 * - Includes pricing, availability, and product details
 * - Uses Google Search integration for accurate results
 * 
 * **Think Mode:**
 * - Analyzes user needs step-by-step
 * - Provides reasoning for product recommendations
 * - Explains compatibility and alternatives
 * - Shows decision-making process
 * 
 * @param {string} message - User's search query or product request
 * @param {string} mode - Processing mode ('DeepSearch' or 'Think')
 * @returns {Promise<string>} AI-generated response with product recommendations
 * 
 * @example
 * const response = await generateTonerWebResponse(
 *   "Find Canon PG-540 ink cartridge", 
 *   "DeepSearch"
 * );
 * // Returns detailed product information with tonerweb.no URLs
 * 
 * @throws {Error} When API request fails or response generation fails
 */
export async function generateTonerWebResponse(
  message: string,
  mode: "DeepSearch" | "Think" = "DeepSearch",
): Promise<string> {
  try {
    const systemPrompt = buildTonerPrompt(mode, "en");
    const fullPrompt = `${systemPrompt}\n\nUser query: ${message}`;

    const response = await geminiClient.models.generateContent({
      model: "gemini-2.5-flash",
      config: { tools: [{ googleSearch: {} }] },
      contents: fullPrompt,
    });

    return (
      // Some SDK versions return the text directly, others wrap it
      // in a `text` property – handle both.
      (response as any).text ?? response ??
      "I apologise, but I couldn't generate a response. Please try again."
    );
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
