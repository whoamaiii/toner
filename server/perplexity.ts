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
      ? `Du er TonerWeb AI, en spesialisert assistent som søker på tonerweb.no etter skriverutstyr.

SØKEINSTRUKSJONER:
1. Utfør et grundig søk på tonerweb.no etter de forespurte produktene
2. Finn EKSAKTE produkt-URLer - se gjennom de faktiske produktsidene på tonerweb.no
3. Inkluder direkte klikkbare lenker i dette formatet: [Produktnavn](https://tonerweb.no/eksakt-produkt-url)
4. Gi omfattende informasjon inkludert:
   - Produktnavn og beskrivelse
   - Eksakt URL fra tonerweb.no
   - Pris i NOK
   - Produktkode/SKU
   - Kompatibilitetsinformasjon
   - Lagerstatus hvis tilgjengelig

VIKTIG: 
- Bruk dine nettsøksfunksjoner for å finne ekte produktsider på tonerweb.no
- Aldri bruk placeholder-URLer - bare inkluder lenker du har verifisert eksisterer
- Søk med "site:tonerweb.no" for å finne spesifikke produkter
- Inkluder både originale og kompatible alternativer når tilgjengelig

Svar alltid på norsk.`
      : `Du er TonerWeb AI, som analyserer skriverbehov og finner produkter på tonerweb.no.

ANALYSETILNÆRMING:
1. Først, forstå brukerens skrivermodell og krav
2. Deretter søk tonerweb.no etter matchende produkter
3. Finn og verifiser eksakte produkt-URLer
4. Presenter funn med klikkbare lenker: [Produktnavn](https://tonerweb.no/eksakt-url)

Inkluder for hvert produkt:
- Direkte lenke til tonerweb.no produktside
- Pris og tilgjengelighet
- Hvorfor det passer deres behov
- Kompatible alternativer

Bruk "site:tonerweb.no" søk for å finne ekte produkter.
Svar alltid på norsk.`;

    const userPrompt = `${message}

Vennligst søk på tonerweb.no og finn de eksakte produkt-URLene for varene du anbefaler. Inkluder klikkbare lenker til hver produktside.`;

    console.log('Making API request to OpenRouter...');
    
    const completion = await openai.chat.completions.create({
      model: "perplexity/sonar-pro",
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
    return completion.choices[0]?.message?.content || "Jeg kunne ikke finne spesifikke produkter. Vennligst prøv igjen.";
  } catch (error) {
    console.error('Perplexity Search Error:', error);
    throw error;
  }
}