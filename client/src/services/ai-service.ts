/**
 * AI Service client for the TonerWeb AI Assistant.
 * 
 * This service provides a clean interface for communicating with the AI backend
 * and handles all API interactions including:
 * - Chat/search requests with text and image support
 * - Image generation (coming soon)
 * - News fetching (coming soon)
 * - Error handling and response parsing
 * - HTTP request management
 * 
 * The service abstracts the complexity of API communication and provides
 * a simple interface for frontend components to interact with AI features.
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import { isFeatureEnabled, getFeatureMessage } from "@shared/features";

/**
 * Interface for AI API responses.
 * 
 * @interface AIResponse
 * @property {string} content - The main response content from the AI
 * @property {string[]} [sources] - Optional array of source URLs or references
 */
interface AIResponse {
  content: string;
  sources?: string[];
}

/**
 * Interface for news articles returned by the AI service.
 * 
 * @interface NewsArticle
 * @property {string} title - The article title
 * @property {string} content - The article content or summary
 * @property {string} url - The article URL
 * @property {string} publishedAt - Publication date in ISO format
 * @property {string} source - The news source name
 * @property {string[]} [tags] - Optional array of article tags
 */
interface NewsArticle {
  title: string;
  content: string;
  url: string;
  publishedAt: string;
  source: string;
  tags?: string[];
}

/**
 * AI Service class that handles all communication with the AI backend.
 * 
 * This class provides methods for:
 * - Sending chat messages with optional image analysis
 * - Image generation (planned feature)
 * - News fetching (planned feature)
 * - Error handling and response processing
 * 
 * The service is designed as a singleton and handles all HTTP communication
 * with proper error handling and response formatting.
 * 
 * @class AIService
 * 
 * @example
 * import { aiService } from '@/services/ai-service';
 * 
 * // Send a text message
 * const response = await aiService.sendMessage('Find Canon ink', 'DeepSearch');
 * 
 * // Send a message with image
 * const response = await aiService.sendMessage(
 *   'What is this product?', 
 *   'DeepSearch', 
 *   'data:image/jpeg;base64,/9j/4AAQ...'
 * );
 */
class AIService {
  /**
   * Makes an API call to the AI backend.
   * 
   * This private method handles the low-level HTTP communication with the AI endpoint.
   * It includes proper error handling, request formatting, and response parsing.
   * 
   * @private
   * @param {string} message - The user's message or query
   * @param {string} mode - The AI processing mode ('DeepSearch' or 'Think')
   * @param {string} [image] - Optional base64 encoded image data
   * @returns {Promise<string>} The AI's response content
   * 
   * @throws {Error} When the API request fails or returns an error
   * 
   * @example
   * // Internal usage only
   * const response = await this.callAPI('Find Canon ink', 'DeepSearch');
   */
  private async callAPI(message: string, mode: string, image?: string): Promise<string> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          mode,
          image,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  /**
   * Sends a message to the AI service for processing.
   * 
   * This is the main public method for interacting with the AI. It supports
   * both text-only and text+image requests and handles different processing modes.
   * 
   * **Processing Modes:**
   * - **DeepSearch**: Comprehensive search with exact product URLs and detailed information
   * - **Think**: Step-by-step analysis with reasoning and explanations
   * 
   * **Features:**
   * - Text-based product searches
   * - Image analysis for product identification
   * - Norwegian language support
   * - tonerweb.no specific product matching
   * - Error handling with user-friendly messages
   * 
   * @param {string} message - The user's message or search query
   * @param {'DeepSearch' | 'Think'} mode - The AI processing mode
   * @param {string} [image] - Optional base64 encoded image for visual analysis
   * @returns {Promise<string>} The AI's response with product recommendations
   * 
   * @throws {Error} When the API request fails or the service is unavailable
   * 
   * @example
   * // Text-only search
   * const response = await aiService.sendMessage(
   *   'Find Canon PG-540 ink cartridge', 
   *   'DeepSearch'
   * );
   * 
   * @example
   * // Image-based search
   * const response = await aiService.sendMessage(
   *   'Identify this product', 
   *   'DeepSearch',
   *   'data:image/jpeg;base64,/9j/4AAQ...'
   * );
   * 
   * @example
   * // Analytical mode with reasoning
   * const response = await aiService.sendMessage(
   *   'What printer is compatible with this toner?', 
   *   'Think'
   * );
   */
  async sendMessage(message: string, mode: 'DeepSearch' | 'Think', image?: string): Promise<string> {
    return this.callAPI(message, mode, image);
  }

  /**
   * Generates an image based on a text prompt.
   * 
   * This method provides a graceful fallback for image generation functionality.
   * When the feature is enabled, it will generate product images, promotional materials,
   * or visual content based on text descriptions.
   * 
   * @param {string} prompt - Text description for image generation
   * @returns {Promise<string>} Feature status message or generated image URL
   * 
   * @example
   * const response = await aiService.generateImage('Canon PG-540 ink cartridge');
   * // Returns: "AI image generation is coming soon! We're working on..."
   */
  async generateImage(prompt: string): Promise<string> {
    if (isFeatureEnabled('imageGeneration')) {
      // TODO: Implement actual image generation when feature is enabled
      try {
        const response = await fetch('/api/ai/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        });
        
        if (!response.ok) {
          throw new Error('Image generation request failed');
        }
        
        const data = await response.json();
        return data.imageUrl || data.message;
      } catch (error) {
        console.error('Image generation error:', error);
        return 'Sorry, image generation is temporarily unavailable. Please try again later.';
      }
    } else {
      return getFeatureMessage('imageGeneration');
    }
  }

  /**
   * Fetches the latest news related to printing, toner, or technology.
   * 
   * This method provides a graceful fallback for news fetching functionality.
   * When the feature is enabled, it will provide relevant news articles, product updates,
   * or industry information.
   * 
   * @param {string} [query] - Optional search query to filter news
   * @returns {Promise<NewsArticle[]>} Array of news articles or empty array with status message
   * 
   * @example
   * const news = await aiService.getLatestNews('printer technology');
   * // Returns: [] (empty array when feature is not enabled)
   */
  async getLatestNews(query?: string): Promise<NewsArticle[]> {
    if (isFeatureEnabled('newsFeeds')) {
      // TODO: Implement actual news fetching when feature is enabled
      try {
        const response = await fetch(`/api/ai/news${query ? `?query=${encodeURIComponent(query)}` : ''}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('News fetching request failed');
        }
        
        const data = await response.json();
        return data.articles || [];
      } catch (error) {
        console.error('News fetching error:', error);
        return [];
      }
    } else {
      // Return empty array - UI can check feature status separately
      return [];
    }
  }
}

/**
 * Singleton instance of the AI service.
 * 
 * This is the main service instance used throughout the application.
 * It provides a consistent interface for all AI-related operations.
 * 
 * @example
 * import { aiService } from '@/services/ai-service';
 * 
 * // Use the service in components
 * const response = await aiService.sendMessage('Find Canon ink', 'DeepSearch');
 */
export const aiService = new AIService();
