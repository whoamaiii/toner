import { GoogleGenAI } from "@google/genai";

// Initialize Gemini with your API key
const ai = new GoogleGenAI({ apiKey: "AIzaSyCHlUphzuYLfs4TXJpftQuTDH1aBQ17rDA" });

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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        tools: [{ googleSearch: {} }],
      },
      contents: fullPrompt,
    });

    return response.text || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}