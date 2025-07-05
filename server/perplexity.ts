import OpenAI from "openai";

// Initialize OpenRouter client with Perplexity Sonar model
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  defaultHeaders: {
    "HTTP-Referer": "https://tonerweb.no", // Optional, for ranking on OpenRouter
    "X-Title": "TonerWeb AI Assistant", // Optional, for ranking on OpenRouter
  }
});

export async function searchTonerWebProducts(message: string, mode: string): Promise<string> {
  console.log('searchTonerWebProducts called with:', { message, mode });
  console.log('API Key present:', !!process.env.OPENROUTER_API_KEY);
  
  try {
    const systemPrompt = mode === 'DeepSearch' 
      ? `You are TonerWeb AI, a specialized assistant that searches tonerweb.no for printer supplies.

SEARCH INSTRUCTIONS:
1. Perform a thorough search on tonerweb.no for the requested products
2. Find EXACT product URLs - browse the actual product pages on tonerweb.no
3. Include direct clickable links in this format: [Product Name](https://tonerweb.no/exact-product-url)
4. Provide comprehensive information including:
   - Product name and description
   - Exact URL from tonerweb.no
   - Price in NOK
   - Product code/SKU
   - Compatibility information
   - Stock status if available

IMPORTANT: 
- Use your web search capabilities to find real product pages on tonerweb.no
- Never use placeholder URLs - only include links you've verified exist
- Search using "site:tonerweb.no" to find specific products
- Include both original and compatible options when available`
      : `You are TonerWeb AI, analyzing printer needs and finding products on tonerweb.no.

ANALYSIS APPROACH:
1. First, understand the user's printer model and requirements
2. Then search tonerweb.no for matching products
3. Find and verify exact product URLs
4. Present findings with clickable links: [Product Name](https://tonerweb.no/exact-url)

Include for each product:
- Direct link to tonerweb.no product page
- Price and availability
- Why it's suitable for their needs
- Compatible alternatives

Use "site:tonerweb.no" searches to find real products.`;

    const userPrompt = `${message}

Please search tonerweb.no and find the exact product URLs for the items you recommend. Include clickable links to each product page.`;

    console.log('Making API request to OpenRouter...');
    
    const completion = await openai.chat.completions.create({
      model: "perplexity/sonar-reasoning",
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
      temperature: 0.2,
      max_tokens: 2000,
    });

    console.log('API response received');
    return completion.choices[0]?.message?.content || "I couldn't find specific products. Please try again.";
  } catch (error) {
    console.error('Perplexity Search Error:', error);
    throw error;
  }
}