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

import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@shared/logger";

// Validate API key at startup
if (!process.env.GEMINI_API_KEY) {
  logger.error('GEMINI_API_KEY environment variable is required for Gemini functionality');
  throw new Error('GEMINI_API_KEY is required');
}

/**
 * Google Gemini AI client instance.
 * 
 * Initialized with the API key from environment variables.
 * Now validates API key at startup for proper error handling.
 */
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
export async function analyzeTonerImage(imageBase64: string): Promise<string> {
  try {
    logger.debug('Analyzing printer cartridge image with Gemini Vision');
    
    const mimeTypeMatch = imageBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    if (!mimeTypeMatch || !mimeTypeMatch[1]) {
      throw new Error("Could not determine image MIME type from base64 string.");
    }
    const mimeType = mimeTypeMatch[1];
    
    const imageData = {
      inlineData: {
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ''), // Remove data URL prefix
        mimeType: mimeType
      }
    };

    /**
     * Detailed Norwegian prompt for comprehensive product analysis.
     * 
     * This prompt instructs Gemini to:
     * 1. Identify product type (most critical for search strategy)
     * 2. Extract exact model numbers and brand information
     * 3. Determine if it's original or compatible
     * 4. Note size/capacity information
     * 5. Generate Norwegian search terms for tonerweb.no
     * 6. Provide structured output for easy parsing
     */
    const prompt = `KRITISK OPPGAVE: Identifiser produkt for nøyaktig søk på tonerweb.no

ANALYSER BILDET SVÆRT NØYE:

**1. PRODUKTTYPE** (VIKTIGST!):
- [ ] BLEKKPATRON (ink cartridge) - væske i patron
- [ ] TONERPATRON (toner cartridge) - pulver i kassett
- [ ] KONTORPRODUKT - spesifiser nøyaktig type:
  - Pennale/etui (pen case)
  - Notatbok/skrivebok
  - Perm/ringperm
  - Skrivesaker
  - Annet (beskriv)

**2. FOR BLEKK/TONER - EKSTRAKT NØYAKTIG**:
- MERKE: (Canon, HP, Epson, Brother, Samsung)
- MODELLNUMMER: Skriv EKSAKT som på produktet
  - Inkluder XL/XXL hvis det står
  - Ta med bindestrek (PG-540, ikke PG540)
  - Noter fargeKODE: BK, C, M, Y, CL
- ORIGINAL vs KOMPATIBEL: Se etter logo/merking
- STØRRELSE: Standard, XL, XXL
- MULTIPACK: Er det flere patroner?

**3. FOR KONTORPRODUKTER**:
- TYPE: Eksakt produkttype på norsk
- MERKE: Hvis synlig
- MATERIALE: Plast, skinn, stoff, metall
- FARGE/DESIGN: Beskriv utseende
- STØRRELSE: Hvis mulig å bedømme
- PRODUKTKODER: Alle synlige tall/koder

**4. ALL SYNLIG TEKST**:
- Skriv ned ALT du kan se
- Inkluder små detaljer
- Se etter:
  - Produktkoder/SKU
  - Strekkoder
  - "Compatible with..."
  - Merkelogo

**5. SØKEORD FOR TONERWEB**:
List opp 5-10 mulige søkeord basert på analysen:
- Norske termer (pennale, ikke pencil case)
- Varianter av modellnummer
- Alternative navn

KRITISK: Din identifikasjon avgjør hele søkestrategien!
Vær EKSTREMT presis med modellnummer og produkttype.

Svar strukturert på norsk.`;

    const model = ai.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp"
    });
    
    const response = await model.generateContent([prompt, imageData]);

    const analysisResult = response.response.text() || "Kunne ikke analysere bildet.";
    logger.debug('Gemini analysis completed');
    return analysisResult;
  } catch (error) {
    logger.error('Gemini Vision Analysis Error', error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
      return "Feil: Gemini API-nøkkelen er ugyldig. Vennligst sjekk .env-filen.";
    }
    return `Beklager, en feil oppstod under bildeanalysen: ${error instanceof Error ? error.message : 'Ukjent feil'}`;
  }
}

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
export async function generateTonerWebResponse(message: string, mode: string): Promise<string> {
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
- CRITICAL: You MUST search for and find the EXACT product URL on tonerweb.no - do NOT use generic links
- When recommending products, format them as: [Product Name](exact-url-from-tonerweb.no)
- The product URL must be the specific product page, NOT just https://tonerweb.no/

When in DeepSearch mode:
1. Search tonerweb.no for the specific products
2. Find the EXACT product page URLs on tonerweb.no
3. Include those specific URLs in your response
4. Never use placeholder or generic URLs

CRITICAL: If you cannot find the exact product URL, mention the product but note that you need to search for the specific URL on tonerweb.no.`
      : `You are the TonerWeb AI Assistant, a specialized product assistant for tonerweb.no. Your primary goal is to help customers find the correct products available on tonerweb.no.

IMPORTANT RESTRICTIONS:
- ONLY search and recommend products from tonerweb.no
- ONLY provide information about products that are actually available on tonerweb.no
- When users ask about printer compatibility, search tonerweb.no specifically for compatible toner cartridges
- Always mention that products are from tonerweb.no
- If a product is not available on tonerweb.no, clearly state this and suggest similar alternatives that ARE available on the site
- CRITICAL: You MUST search for and find the EXACT product URL on tonerweb.no - do NOT use generic links
- When recommending products, format them as: [Product Name](exact-url-from-tonerweb.no)
- The product URL must be the specific product page, NOT just https://tonerweb.no/

When in Think mode:
1. Analyze the user's printer or product needs step-by-step
2. Search tonerweb.no for specific matching products
3. Find the EXACT product page URLs on tonerweb.no
4. Include those specific URLs in your response
5. Show your reasoning for why these specific products from tonerweb.no are the best recommendations

CRITICAL: If you cannot find the exact product URL, mention the product but note that you need to search for the specific URL on tonerweb.no.`;

    const fullPrompt = `${systemPrompt}

IMPORTANT: Use Google Search to find the EXACT product URLs on tonerweb.no. Search for queries like:
- "site:tonerweb.no Canon PG-540XL"
- "site:tonerweb.no Canon CL-541XL"
- "site:tonerweb.no [product name]"

This will help you find the actual product page URLs to include in your response.

User query: ${message}`;

    const model = ai.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp"
    });
    
    const response = await model.generateContent(fullPrompt);

    return response.response.text() || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    logger.error('Gemini API Error', error);
    throw error;
  }
}
