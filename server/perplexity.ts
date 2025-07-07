/**
 * Perplexity AI integration for TonerWeb product search and recommendations.
 * 
 * This module provides integration with Perplexity's Sonar model via OpenRouter for:
 * - Advanced product search capabilities on tonerweb.no
 * - Real-time web search for product availability and pricing
 * - Intelligent product recommendations based on user queries
 * - Image analysis integration with Gemini for visual product identification
 * 
 * The service uses detailed Norwegian prompts to ensure accurate product matching
 * and provides structured responses with direct links to tonerweb.no products.
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import OpenAI from "openai";
import { analyzeTonerImage } from "./gemini";
import { logger } from "@shared/logger";
import { generateCacheKey, getCachedSearchResult, cacheSearchResult } from "./cache";
import crypto from "crypto";

// --------------------------------------------------------------
// Lazy client initialisation & graceful degradation
// --------------------------------------------------------------

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  const apiKey: string | undefined = (globalThis as any).process?.env?.OPENROUTER_API_KEY;

  if (!apiKey) {
    // No key – return null so that callers can gracefully degrade
    logger.warn('OPENROUTER_API_KEY is missing – Perplexity search disabled.');
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      defaultHeaders: {
        "HTTP-Referer": "https://tonerweb.no",
        "X-Title": "TonerWeb AI Assistant",
      },
    });
  }

  return openaiClient;
}

/**
 * Main function for searching and recommending products from tonerweb.no.
 * 
 * This function combines image analysis (when provided) with intelligent text-based
 * search to find the most relevant products on tonerweb.no. It uses different
 * search strategies based on the mode and input type.
 * 
 * **Process Flow:**
 * 1. Analyze uploaded image (if provided) using Gemini Vision
 * 2. Generate appropriate system prompt based on mode
 * 3. Combine user query with image analysis results
 * 4. Send request to Perplexity Sonar for web search
 * 5. Return structured response with product recommendations
 * 
 * **Search Modes:**
 * - **DeepSearch**: Comprehensive product search with exact URLs, pricing, and availability
 * - **Think**: Step-by-step analysis with reasoning for product recommendations
 * 
 * @param {string} message - User's search query or product description
 * @param {string} mode - Search mode ('DeepSearch' or 'Think')
 * @param {string} [image] - Optional base64 encoded image for visual analysis
 * @returns {Promise<string>} Formatted response with product recommendations and links
 * 
 * @example
 * // Text-only search
 * const response = await searchTonerWebProducts(
 *   "Find Canon PG-540 ink cartridge", 
 *   "DeepSearch"
 * );
 * 
 * @example
 * // Image-based search
 * const response = await searchTonerWebProducts(
 *   "What is this product?", 
 *   "DeepSearch",
 *   "data:image/jpeg;base64,/9j/4AAQ..."
 * );
 * 
 * @throws {Error} When API request fails or image analysis fails
 */
export async function searchTonerWebProducts(message: string, mode: string, image?: string): Promise<string> {
  // Ensure we have a usable OpenAI client first
  const openai = getOpenAIClient();
  if (!openai) {
    return "⚠️ Tjenesten for avansert søk er for øyeblikket utilgjengelig. Vennligst prøv igjen senere.";
  }

  const imageHash = image ? crypto.createHash('md5').update(image).digest('hex') : undefined;
  const cacheKey = generateCacheKey(message, mode, imageHash);
  
  const cachedResult = getCachedSearchResult(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  logger.debug('searchTonerWebProducts called', { message: message.substring(0, 50) + '...', mode, hasImage: !!image });
  logger.debug('API Key present', { hasKey: !!(globalThis as any).process?.env?.OPENROUTER_API_KEY });
  
  try {
    // Analyze image if provided using Gemini Vision
    let imageAnalysis = "";
    if (image) {
      try {
        imageAnalysis = await analyzeTonerImage(image);
        logger.debug('Image analysis completed', { length: imageAnalysis.length });
      } catch (error) {
        logger.error('Image analysis failed', error);
        imageAnalysis = "Kunne ikke analysere bildet. Vennligst prøv igjen eller beskriv tonerpatronen manuelt.";
      }
    }

    /**
     * Generate system prompt based on search mode.
     * 
     * **DeepSearch Mode:**
     * - Provides comprehensive search instructions with tonerweb.no URL structure
     * - Includes known product IDs and pricing information
     * - Detailed search strategies for different product types
     * - Verification rules for URL accuracy
     * 
     * **Think Mode:**
     * - Focuses on step-by-step analysis and reasoning
     * - Explains product compatibility and alternatives
     * - Shows decision-making process for recommendations
     */
    const systemPrompt = mode === 'DeepSearch' 
      ? `Du er TonerWeb AI - ekspert på å finne produkter på tonerweb.no.

**KRITISK BILDANALYSE-INSTRUKSJON:**
Les bildanalysen SVÆRT nøye før du søker. Produkttypen avgjør HELE søkestrategien!

**TONERWEB.NO URL-STRUKTUR:**
- Produktsider: https://tonerweb.no/pv.php?pid=XXXXX (5-6 siffer)
- Søk: https://tonerweb.no/search.php?query=XXX
- Kategorier: https://tonerweb.no/k/[kategori]/[underkategori]
- Merker: https://tonerweb.no/m/[merke]

**HOVEDKATEGORIER:**
- /k/blekkpatroner - Blekkpatroner
- /k/tonerpatroner - Tonerpatroner  
- /k/kontorprodukter - Kontorrekvisita
  - /skriveredskaper - Penner, blyanter, etc.
  - /arkivering - Permer, mapper, etc.
  - /smaarekvisita - Småting til kontoret
- /k/renhold - Rengjøringsprodukter
- /k/spise_drikke - Mat og drikke

**DETALJERT SØKESTRATEGI:**

**STEG 1: EKSAKT PRODUKTSØK**
Prøv disse søkene i rekkefølge:
1. site:tonerweb.no/pv.php?pid= "[eksakt modellnummer]"
2. site:tonerweb.no "[merke] [modellnummer]" 
3. site:tonerweb.no inurl:pid "[modellnummer]"
4. site:tonerweb.no/search.php?query=[modellnummer]

**STEG 2: KATEGORISØK**
Hvis eksakt søk feiler:
- For blekk: site:tonerweb.no/m/[merke] blekkpatron
- For toner: site:tonerweb.no/m/[merke] toner
- For kontorprodukter: site:tonerweb.no/k/kontorprodukter/[kategori]

**STEG 3: ALTERNATIVE SØKEORD**
Bruk norske varianter:
- Pennale: pennale, pennal, etui, penneetui, skrivesaksetui
- Notatbok: notatbok, skrivebok, spiralhefte, notisblokk
- Perm: perm, ringperm, arkivperm, mappe
- Skrivesaker: kulepenner, blyanter, tusjer, merkepenner
- Smårekvisita: stiftemaskin, hullemaskin, tape, lim

**KJENTE PRODUKTER PÅ TONERWEB.NO:**
- Canon PG-540 Black: pid=232736 (kr 257,-)
- Canon PG-540L Black: pid=6244 (kr 325,-)
- Canon PG-540XL: pid=18529 (kr 485,-)
- Canon PG-540/CL-541 Multipack: pid=6242 (kr 854,-)
- HP, Epson, Brother produkter: søk /m/[merke]

**STEG 4: RELATERTE PRODUKTER**
Hvis ingen eksakt match:
- Søk etter lignende modeller (f.eks. PG-540 hvis PG-540XL ikke finnes)
- Sjekk multipakker eller verdipakker
- Se etter kompatible alternativer

**VERIFISERINGSREGLER:**
✓ ALDRI oppfinn produkt-IDer
✓ Sjekk at URLer faktisk eksisterer
✓ Priser må være i NOK med ",-"
✓ Se etter "X stk på lager"

**RESPONSFORMAT:**

**Hvis funnet:**
✅ [Produktnavn](https://tonerweb.no/pv.php?pid=XXXXX) - kr XXX,-
   - Varenummer: XXXXX
   - Lagerstatus: X stk på lager
   - Leveringstid: 0-2 dager
   - Type: Original/Kompatibel

**Hvis IKKE funnet:**
❌ Fant ikke eksakt match for [produkt]

**Alternative tilnærminger:**

1. **Prøv disse kategoriene:**
   - Skriveredskaper: https://tonerweb.no/k/kontorprodukter/skriveredskaper
   - Smårekvisita: https://tonerweb.no/k/kontorprodukter/smaarekvisita
   - Arkivering: https://tonerweb.no/k/kontorprodukter/arkivering

2. **Lignende produkter som kanskje passer:**
   - [Alternativ 1](faktisk URL) - kr XXX,-
   - [Alternativ 2](faktisk URL) - kr XXX,-

3. **Direkte søk:**
   - https://tonerweb.no/search.php?query=[søkeord]

**Kundeservice kan bestille inn produkter:**
📧 post@tonerweb.no
📞 400 22 111
"De har over 15.000 varer og kan skaffe det meste!"

${imageAnalysis ? `\n**BILDANALYSE MOTTATT:**\n${imageAnalysis}\n\n**VIKTIG:** Bruk denne analysen til å bestemme søkestrategi!` : ''}

Svar ALLTID på norsk. Vær ÆRLIG hvis produktet ikke finnes.`
      : `Du er TonerWeb AI, som analyserer skriverbehov og finner produkter på tonerweb.no.

PRODUKTIDENTIFIKASJON:
1. ALLTID identifiser produkttype først:
   - BLEKKPATRON (ink) - væske i patron
   - TONERPATRON (toner) - pulver i kassett
   - ANNET (kontorrekvisita, etc.)
2. Noter merke og modellnummer
3. Søk etter RIKTIG produkttype

TONERWEB.NO STRUKTUR:
- Produktsider: https://tonerweb.no/pv.php?pid=XXXXX
- Søk: https://tonerweb.no/search.php?query=XXX
- Kategorier: /k/[kategori]

ANALYSETILNÆRMING:
1. Identifiser produkttype og modell
2. Søk med "site:tonerweb.no [merke] [modell]"
3. Finn eksakte produktsider (pv.php?pid=)
4. Presenter både originale og kompatible alternativer

${imageAnalysis ? 'BILDANALYSE: ' + imageAnalysis.substring(0, 150) + '...' : ''}

Svar alltid på norsk og vær ærlig om du ikke finner produkter.`;

    /**
     * Construct the user prompt combining the original message with image analysis.
     * 
     * If an image was provided, the analysis is included with emphasis on using
     * the visual information to guide the search strategy.
     */
    const userPrompt = `${message}

${imageAnalysis ? `\n\nBILDANALYSE FRA GEMINI:\n${imageAnalysis}\n\nVIKTIG: Les analysen nøye for å se om dette er BLEKK eller TONER. Søk etter riktig produkttype på tonerweb.no basert på analysen. Fokuser på merke, modellnummer og andre detaljer fra analysen.` : ''}

Vennligst søk på tonerweb.no og finn de eksakte produkt-URLene for varene du anbefaler. Inkluder klikkbare lenker til hver produktside.`;

    logger.debug('Making API request to OpenRouter');
    
    /**
     * Send request to Perplexity Sonar model via OpenRouter.
     * 
     * Configuration:
     * - Model: perplexity/sonar-pro for advanced search capabilities
     * - Temperature: 0.2 for consistent, factual responses
     * - Max tokens: 2000 for comprehensive responses
     */
    const completion = await openai.chat.completions.create({
      model: "perplexity/sonar-pro",
      messages: [
        {
          role: "system",
          content: `Current date and time: ${new Date().toISOString()}\n\n${systemPrompt}`
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    logger.debug('API response received');
    const responseContent = completion.choices[0]?.message?.content || "Jeg kunne ikke finne spesifikke produkter. Vennligst prøv igjen.";
    
    cacheSearchResult(cacheKey, responseContent);
    
    return responseContent;
  } catch (error) {
    logger.error('Perplexity Search Error', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      // OpenRouter authentication errors
      if (error.message.includes('401') || error.message.includes('No auth credentials')) {
        return "⚠️ **API-konfigurasjonsfeil**: OpenRouter API-nøkkelen er ugyldig eller utløpt.\n\n" +
               "**Løsning**:\n" +
               "1. Gå til https://openrouter.ai/keys\n" +
               "2. Generer en ny API-nøkkel\n" +
               "3. Oppdater OPENROUTER_API_KEY i .env-filen\n" +
               "4. Start serveren på nytt\n\n" +
               "**Midlertidig løsning**: Prøv å beskrive produktet med tekst i stedet for bilde.";
      }
      
      // Rate limiting errors
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return "⏱️ **For mange forespørsler**: API-grensen er nådd.\n\n" +
               "Vennligst vent et øyeblikk før du prøver igjen.";
      }
      
      // Network errors
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        return "🌐 **Nettverksfeil**: Kan ikke nå API-tjenesten.\n\n" +
               "Sjekk internettforbindelsen og prøv igjen.";
      }
      
      // Gemini API errors
      if (error.message.includes('API key not valid')) {
        return "🔑 **Gemini API-feil**: API-nøkkelen er ugyldig.\n\n" +
               "**Løsning**:\n" +
               "1. Gå til https://aistudio.google.com/app/apikey\n" +
               "2. Generer en ny API-nøkkel\n" +
               "3. Oppdater GEMINI_API_KEY i .env-filen\n" +
               "4. Start serveren på nytt";
      }
    }
    
    // Generic error message for unknown errors
    return "❌ **Ukjent feil oppstod**: Kunne ikke behandle forespørselen.\n\n" +
           "**Prøv følgende**:\n" +
           "• Beskriv produktet med tekst i stedet for bilde\n" +
           "• Sjekk internettforbindelsen\n" +
           "• Kontakt support hvis problemet vedvarer\n\n" +
           `**Teknisk info**: ${error instanceof Error ? error.message : 'Ukjent feil'}`;
  }
}
