/**
 * Claude 3.5 Sonnet integration for advanced reasoning and complex queries.
 * 
 * This module provides integration with Anthropic's Claude 3.5 Sonnet via OpenRouter for:
 * - Complex product compatibility analysis
 * - Multi-step reasoning for product recommendations
 * - Alternative product suggestions
 * - Detailed explanations of product choices
 * 
 * Used as a secondary processor for queries that require deeper analysis
 * than simple product searches.
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import OpenAI from "openai";
import { logger } from "@shared/logger";
import { generateCacheKey, getCachedReasoningResult, cacheReasoningResult } from "./cache";
import crypto from "crypto";

// --------------------------------------------------------------
// Lazy client initialisation & graceful degradation
// --------------------------------------------------------------

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  const apiKey: string | undefined = (globalThis as any).process?.env?.OPENROUTER_API_KEY;

  if (!apiKey) {
    logger.warn('OPENROUTER_API_KEY is missing – Claude reasoning disabled.');
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      defaultHeaders: {
        "HTTP-Referer": "https://tonerweb.no",
        "X-Title": "TonerWeb AI Assistant - Claude Reasoning",
      },
    });
  }

  return openaiClient;
}

/**
 * Analyzes complex product queries using Claude's advanced reasoning capabilities.
 * 
 * This function is designed for queries that require:
 * - Product compatibility analysis
 * - Multi-product comparisons
 * - Step-by-step reasoning
 * - Alternative recommendations
 * - Complex decision-making
 * 
 * @param {string} query - User's complex query or product request
 * @param {string} searchResults - Initial search results from Perplexity (if available)
 * @param {string} imageAnalysis - Image analysis results from Gemini (if available)
 * @returns {Promise<string>} Detailed analysis with reasoning and recommendations
 * 
 * @example
 * const analysis = await analyzeComplexQuery(
 *   "Which printer cartridge is best for my Canon PIXMA MG2550S if I print mostly documents?",
 *   searchResults,
 *   null
 * );
 * 
 * @throws {Error} When API request fails
 */
export async function analyzeComplexQuery(
  query: string, 
  searchResults?: string,
  imageAnalysis?: string
): Promise<string> {
  const imageHash = imageAnalysis ? crypto.createHash('md5').update(imageAnalysis).digest('hex') : undefined;
  const cacheKey = generateCacheKey(query, 'claude-reasoning', imageHash);
  
  const cachedResult = getCachedReasoningResult(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  // Ensure API client is available
  const openai = getOpenAIClient();

  if (!openai) {
    return "⚠️ Tjenesten for avansert analyse er for øyeblikket utilgjengelig. Vennligst prøv igjen senere.";
  }

  try {
    logger.debug('Claude reasoning analysis started', { 
      queryLength: query.length,
      hasSearchResults: !!searchResults,
      hasImageAnalysis: !!imageAnalysis
    });

    const systemPrompt = `Du er TonerWeb AI Assistant - en ekspert på produktanalyse og anbefalinger for tonerweb.no.

**DIN ROLLE:**
Du spesialiserer deg på komplekse spørsmål som krever:
- Produktkompatibilitetsanalyse
- Sammenligning av flere produkter
- Forklaring av tekniske forskjeller
- Anbefalinger basert på bruksmønstre
- Alternative løsninger

**ANALYSETILNÆRMING:**

1. **FORSTÅ BRUKERENS BEHOV:**
   - Hva er hovedformålet med forespørselen?
   - Hvilke faktorer er viktige for brukeren?
   - Er det budsjettbegrensninger eller preferanser?

2. **TEKNISK ANALYSE:**
   - Kompatibilitet med spesifikke skrivermodeller
   - Forskjeller mellom original og kompatibel
   - Kapasitet og sideutbytte
   - Kvalitetsforskjeller

3. **ANBEFALING MED BEGRUNNELSE:**
   - Forklar HVORFOR du anbefaler spesifikke produkter
   - Vis fordeler og ulemper
   - Gi alternative valg med forklaring

4. **PRAKTISKE RÅD:**
   - Installasjonsinstruksjoner hvis relevant
   - Vedlikeholdstips
   - Kostnadsbesparende tips

**RESPONSFORMAT:**

📋 **Analyse av forespørselen:**
[Kort oppsummering av hva brukeren trenger]

🔍 **Teknisk vurdering:**
[Detaljert analyse av kompatibilitet og tekniske aspekter]

✅ **Hovedanbefaling:**
[Primært produktvalg med full begrunnelse]

🔄 **Alternative valg:**
[2-3 alternativer med fordeler/ulemper]

💡 **Praktiske tips:**
[Nyttige råd for brukeren]

**VIKTIG:**
- Vær alltid ærlig om begrensninger
- Forklar tekniske termer på en forståelig måte
- Gi konkrete anbefalinger med begrunnelse
- Fokuser på brukerens faktiske behov

Svar alltid på norsk og vær pedagogisk i forklaringene.`;

    let userPrompt = `Brukerens spørsmål: ${query}`;
    
    if (searchResults) {
      userPrompt += `\n\n**SØKERESULTATER FRA TONERWEB.NO:**\n${searchResults}`;
    }
    
    if (imageAnalysis) {
      userPrompt += `\n\n**BILDANALYSE:**\n${imageAnalysis}`;
    }
    
    userPrompt += `\n\nVennligst gi en grundig analyse med steg-for-steg reasoning og konkrete anbefalinger.`;

    const completion = await openai.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent reasoning
      max_tokens: 2000,
    });

    logger.debug('Claude reasoning completed');
    const responseContent = completion.choices[0]?.message?.content || "Kunne ikke generere analyse. Vennligst prøv igjen.";
    
    cacheReasoningResult(cacheKey, responseContent);
    
    return responseContent;
  } catch (error) {
    logger.error('Claude Reasoning Error', error);
    
    // Fallback to simpler response if Claude fails
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('No auth credentials')) {
        throw new Error("Claude API authentication failed. Please check OpenRouter configuration.");
      }
      
      if (error.message.includes('429')) {
        throw new Error("Rate limit exceeded for Claude API. Please try again later.");
      }
    }
    
    throw error;
  }
}

/**
 * Analyzes product compatibility for specific printer models.
 * 
 * This specialized function focuses on:
 * - Verifying cartridge compatibility
 * - Finding all compatible options
 * - Explaining differences between options
 * 
 * @param {string} printerModel - The printer model to check compatibility for
 * @param {string} searchResults - Available products from search
 * @returns {Promise<string>} Detailed compatibility analysis
 */
export async function analyzeCompatibility(
  printerModel: string,
  searchResults: string
): Promise<string> {
  const query = `Which ink cartridges or toner are compatible with ${printerModel}? Please analyze all options and explain the differences.`;
  return analyzeComplexQuery(query, searchResults);
}

/**
 * Compares multiple products to help users make informed decisions.
 * 
 * @param {string[]} products - Array of product names or IDs to compare
 * @param {string} criteria - What aspects to compare (price, quality, capacity, etc.)
 * @param {string} searchResults - Product information from search
 * @returns {Promise<string>} Detailed comparison with recommendations
 */
export async function compareProducts(
  products: string[],
  criteria: string,
  searchResults: string
): Promise<string> {
  const query = `Compare these products: ${products.join(', ')}. Focus on: ${criteria}`;
  return analyzeComplexQuery(query, searchResults);
}
