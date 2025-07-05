import OpenAI from "openai";

// Initialize OpenRouter client with Perplexity Sonar model
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: "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",
});

export async function searchTonerWebProducts(message: string, mode: string): Promise<string> {
  try {
    const systemPrompt = `You are the TonerWeb AI Assistant. Your primary task is to search tonerweb.no and find EXACT product URLs and information.

CRITICAL INSTRUCTIONS:
1. Search tonerweb.no for the specific products mentioned
2. Find and include the EXACT product page URLs (e.g., https://tonerweb.no/canon-pg-540xl-black)
3. Include product codes, prices in NOK, and availability
4. Format product links as: [Product Name](exact-product-url)
5. ONLY recommend products actually available on tonerweb.no

When searching, use queries like:
- "site:tonerweb.no Canon PG-540XL"
- "site:tonerweb.no Canon PIXMA MG3650S compatible ink"

${mode === 'DeepSearch' ? 'Provide comprehensive product recommendations with all compatible options.' : 'Analyze the needs step-by-step, then find the best matching products.'}`;

    const completion = await openai.chat.completions.create({
      model: "perplexity/sonar-reasoning-pro",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Search tonerweb.no for: ${message}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return completion.choices[0]?.message?.content || "I couldn't find specific products. Please try again.";
  } catch (error) {
    console.error('Perplexity Search Error:', error);
    throw error;
  }
}