import OpenAI from "openai";
import { analyzeTonerImage } from "./gemini";
import { logger } from "@shared/logger";
import { generateCacheKey, getCachedSearchResult, cacheSearchResult } from "./cache";
import crypto from "crypto";

// Validate API key at startup
if (!process.env.OPENROUTER_API_KEY) {
  logger.error('OPENROUTER_API_KEY environment variable is required for enhanced Perplexity functionality');
  throw new Error('OPENROUTER_API_KEY is required');
}

// Initialize OpenRouter client with Perplexity Sonar model
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://tonerweb.no", // Optional, for ranking on OpenRouter
    "X-Title": "TonerWeb AI Assistant", // Optional, for ranking on OpenRouter
  }
});

export async function searchTonerWebProducts(message: string, mode: string, image?: string): Promise<string> {
  const imageHash = image ? crypto.createHash('md5').update(image).digest('hex') : undefined;
  const cacheKey = generateCacheKey(message, mode, imageHash);
  
  const cachedResult = getCachedSearchResult(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  logger.debug('searchTonerWebProducts called', { message: message.substring(0, 50) + '...', mode, hasImage: !!image });
  logger.debug('API Key present', { hasKey: !!(globalThis as any).process?.env?.OPENROUTER_API_KEY });
  
  try {
    // First, analyze the image if provided
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

    const systemPrompt = mode === 'DeepSearch' 
      ? `Du er TonerWeb AI - ekspert på å finne produkter på tonerweb.no.

**🎯 PRODUKTTYPE IDENTIFIKASJON (basert på faktiske kategorier):**

**HOVEDKATEGORIER PÅ TONERWEB.NO:**
1. **BLEKK/TONER** - Blekkpatroner og tonerpatroner
2. **KONTORPRODUKTER** - Penner, arkivering, post-it, smårekvisita
3. **SKOLE OG FORMING** - Skolemateriell og formprodukter
4. **TØRK OG RENHOLD** - Tørkepapir, rengjøring, hansker, desinfeksjon
5. **EMBALLASJE OG OPPBEVARING** - Konvolutter, pakkmateriale
6. **PAPIR** - Kopipapir, spesialpapir
7. **HELSE OG SIKKERHET** - Sikkerhetsutstyr og helseprodukter
8. **SPISE OG DRIKKE** - Kaffe, te, kantineprodukter
9. **WHITEBOARD/MØTEROM** - Møteromsutstyr
10. **KONTORMASKINER** - Maskiner og utstyr
11. **DATATILBEHØR** - Datamaskin-tilbehør, batterier
12. **MOBIL OG NETTBRETT** - Mobiltelefon og nettbrett-tilbehør
13. **HOBBY OG FRITID** - Hobbyartikler

**🔍 TONERWEB.NO URL-STRUKTUR:**
- Produktsider: `https://tonerweb.no/pv.php?pid=XXXXX`
- Søk: `https://tonerweb.no/search.php?query=XXX`
- Generiske søk: `site:tonerweb.no [søkeord]`

**🗣️ NORSK TERMINOLOGI (kun bekreftet):**

**Kontorprodukter:**
- Penner: kulepenn, penn, ballpoint, blå penn, sort penn
- Post-it: post-it, selvklebende lapper, sticky notes
- Arkivering: perm, mappe, ringperm, arkivboks
- Smårekvisita: tape, lim, saks, stiftemaskin

**Tørk og Renhold:**
- Tørkepapir: tørkepapir, kjøkkenrull, papirhåndkle
- Hansker: hansker, gummihansker, engangshansker
- Desinfeksjon: desinfeksjon, håndsprit, rengjøringsmiddel

**Spise og Drikke:**
- Kaffe: kaffe, kaffekapsel, kaffebønner, instant kaffe
- Te: te, teposer

**Datatilbehør:**
- Batterier: batterier, AA, AAA, oppladbare

**🎯 SØKESTRATEGI (forsiktig tilnærming):**

**FOR BLEKK/TONER:**
1. `site:tonerweb.no "[merke] [modellnummer]"`
2. `site:tonerweb.no "blekk" "[merke]"`
3. `site:tonerweb.no "toner" "[merke]"`

**FOR KONTORPRODUKTER:**
1. `site:tonerweb.no "kontorprodukter" "[produkttype]"`
2. `site:tonerweb.no "[produkttype]" "[merke]"`
3. `site:tonerweb.no "[produktnavn]"`

**FOR ANDRE KATEGORIER:**
1. `site:tonerweb.no "[kategorinavn]" "[produkttype]"`
2. `site:tonerweb.no "[produktnavn]"`
3. `site:tonerweb.no/search.php?query=[søkeord]`

**VIKTIGE PRINSIPPER:**
- ALDRI oppfinn URL-strukturer som `/k/kategori/underkategori`
- Bruk kun generiske `site:tonerweb.no` søk
- Hvis usikker på kategoristruktur, bruk direkte produktsøk
- Fokuser på faktiske produktnavn og merker

**📋 RESPONSFORMAT:**

**Ved suksess:**
✅ **[Produktnavn](https://tonerweb.no/pv.php?pid=XXXXX)** - kr XXX,-
   - 🏷️ Varenummer: XXXXX
   - 📦 Lagerstatus: X stk på lager
   - 🚚 Leveringstid: 0-2 dager
   - 🏪 Type: [Original/Kompatibel/Merkevare]

**Ved ingen treff:**
❌ **Fant ikke eksakt match for [produkt]**

**Alternative løsninger:**
1. ** Prøv direkte søk:**
   - https://tonerweb.no/search.php?query=[søkeord]

2. **📞 Kontakt kundeservice:**
   - 📧 post@tonerweb.no | 📞 400 22 111
   - De har over 15.000 varer og kan bestille spesialprodukter

**ALDRI påstå at spesifikke underkategorier eller URL-strukturer eksisterer med mindre du har bekreftet dem.**

${imageAnalysis ? `\n**🖼️ BILDANALYSE MOTTATT:**\n${imageAnalysis}\n\n**⚠️ VIKTIG:** Bruk analysen til å bestemme søkestrategi og produkttype!` : ''}

Svar på norsk og vær ærlig om hva som faktisk finnes.`
      : `Du er TonerWeb AI, som analyserer alle typer produktbehov og finner produkter på tonerweb.no.

**PRODUKTIDENTIFIKASJON (UTVIDET):**
1. ALLTID identifiser produkttype først:
   - BLEKKPATRON (ink) - væske i patron
   - TONERPATRON (toner) - pulver i kassett
   - KONTORPRODUKTER - penner, post-it, arkivering
   - KAFFE/DRIKKE - kaffekapser, kaffebønner
   - ANNET - renhold, papir, emballasje
2. Noter merke og modellnummer/produktnavn
3. Søk etter RIKTIG produktkategori

**NORSK TERMINOLOGI:**
- Skriveredskaper: kulepenn, penn, blyant, tusj, marker
- Notater: post-it, selvklebende lapper, huskelapper
- Kaffe: kaffekapsel, kaffebønner, Nespresso, Dolce Gusto
- Arkivering: perm, mappe, ringperm, arkivboks

**TONERWEB.NO STRUKTUR:**
- Produktsider: https://tonerweb.no/pv.php?pid=XXXXX
- Søk: https://tonerweb.no/search.php?query=XXX
- Kategorier: /k/[kategori]/[underkategori]

**SØKESTRATEGI:**
1. Identifiser produkttype og merke/modell
2. Bruk riktig kategori: 
   - Printer: /k/blekkpatroner eller /k/tonerpatroner
   - Kontor: /k/kontorprodukter/[underkategori]
   - Kaffe: /k/spise_drikke/kaffe
3. Søk med "site:tonerweb.no [kategori] [søkeord]"
4. Finn eksakte produktsider (pv.php?pid=)
5. Presenter både originale og kompatible alternativer (for printer)

${imageAnalysis ? 'BILDANALYSE: ' + imageAnalysis.substring(0, 200) + '...' : ''}

Svar alltid på norsk og vær ærlig om du ikke finner produkter.`;

    const userPrompt = `${message}

${imageAnalysis ? `\n\nBILDANALYSE FRA GEMINI:\n${imageAnalysis}\n\nVIKTIG: Les analysen nøye for å se om dette er BLEKK eller TONER. Søk etter riktig produkttype på tonerweb.no basert på analysen. Fokuser på merke, modellnummer og andre detaljer fra analysen.` : ''}

Vennligst søk på tonerweb.no og finn de eksakte produkt-URLene for varene du anbefaler. Inkluder klikkbare lenker til hver produktside.`;

    logger.debug('Making API request to OpenRouter');
    
    const completion = await openai.chat.completions.create({
      model: "perplexity/sonar-reasoning-pro",
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
      max_tokens: 4000, // Increased for CoT responses
    });

    logger.debug('API response received');
    const responseContent = completion.choices[0]?.message?.content || "Jeg kunne ikke finne spesifikke produkter. Vennligst prøv igjen.";
    
    cacheSearchResult(cacheKey, responseContent);
    
    return responseContent;
  } catch (error) {
    logger.error('Perplexity Search Error', error);
    throw error;
  }
}
