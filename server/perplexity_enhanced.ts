import OpenAI from "openai";
import { analyzeTonerImage } from "./gemini";
import { logger } from "@shared/logger";
import { generateCacheKey, getCachedSearchResult, cacheSearchResult } from "./cache";
import crypto from "crypto";

// Initialize OpenRouter client with Perplexity Sonar model
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
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

**PRODUKTTYPE IDENTIFIKASJON (VIKTIGST FØRST!):**
Les spørsmålet nøye og identifiser produkttype:

1. **BLEKKPATRONER/TONERPATRONER** - Skriverforbruk
2. **KONTORPRODUKTER** - Skriveredskaper, arkivering, smårekvisita  
3. **KAFFE/DRIKKE** - Kaffekapser, kaffebønner, kontordrikke
4. **ANDRE KATEGORIER** - Renhold, papir, emballasje

**KRITISK BILDANALYSE-INSTRUKSJON:**
Les bildanalysen SVÆRT nøye før du søker. Produkttypen avgjør HELE søkestrategien!

**TONERWEB.NO URL-STRUKTUR:**
- Produktsider: https://tonerweb.no/pv.php?pid=XXXXX (5-6 siffer)
- Søk: https://tonerweb.no/search.php?query=XXX
- Kategorier: https://tonerweb.no/k/[kategori]/[underkategori]
- Merker: https://tonerweb.no/m/[merke]

**HOVEDKATEGORIER MED DETALJERT STRUKTUR:**

**1. PRINTER FORBRUK:**
- /k/blekkpatroner - Blekkpatroner
- /k/tonerpatroner - Tonerpatroner  

**2. KONTORPRODUKTER (/k/kontorprodukter):**
- /skriveredskaper - Penner, blyanter, tusjer, markere
- /arkivering - Permer, mapper, ringpermer, arkivbokser
- /smaarekvisita - Stiftemaskiner, tape, lim, saks, linjal

**3. KAFFE & DRIKKE (/k/spise_drikke):**
- /kaffe - Kaffekapser, kaffebønner, instant kaffe
- /te - Te, teposer, varm drikke
- /kaffemaskiner - Kaffemaskiner, tilbehør

**4. ANDRE VIKTIGE KATEGORIER:**
- /k/papir - Kopipapir, skriverpapir, spesialpapir
- /k/tork_renhold - Rengjøring, hygiene, tørkepapir
- /k/emballasje - Konvolutter, pakkmaterialer

**NORSK TERMINOLOGI OVERSIKT:**

**Skriveredskaper (varianter):**
- Kulepenn: kulepenn, penn, ballpoint, blå penn, sort penn
- Blyant: blyant, pencil, mekanisk blyant, blyant HB
- Tusj: tusj, marker, felt-tip, boardmarker, whiteboardmarker
- Merkepenn: merkepenn, tekstmarker, highlighter, overstreker

**Post-it/Notater (varianter):**
- Post-it: post-it, selvklebende lapper, sticky notes, gule lapper
- Notater: notater, huskelapper, notatark, klebelapper
- Notatbok: notatbok, skrivebok, spiralhefte, blokk, notisbok

**Kaffe (varianter):**
- Kaffekapsel: kaffekapsel, coffee pods, Nespresso kapsler, kaffepads
- Kaffebønner: kaffebønner, coffee beans, hele bønner, malt kaffe
- Instant kaffe: instant kaffe, pulverkaffe, løskaffe

**DETALJERT SØKESTRATEGI PER PRODUKTTYPE:**

**FOR SKRIVEREDSKAPER:**
1. site:tonerweb.no/k/kontorprodukter/skriveredskaper "[merke] [produkttype]"
2. site:tonerweb.no/k/kontorprodukter "[produkttype]"
3. site:tonerweb.no "kulepenn" OR "penn" OR "blyant" (avhengig av type)
4. site:tonerweb.no/search.php?query=[produkttype+merke]

**FOR POST-IT/NOTATER:**
1. site:tonerweb.no "post-it" OR "selvklebende"
2. site:tonerweb.no/k/kontorprodukter/smaarekvisita "notater"
3. site:tonerweb.no "huskelapper" OR "sticky notes"
4. site:tonerweb.no/search.php?query=post-it

**FOR KAFFE:**
1. site:tonerweb.no/k/spise_drikke/kaffe "[merke] [type]"
2. site:tonerweb.no "kaffekapsel" OR "Nespresso"
3. site:tonerweb.no/k/spise_drikke "[kaffemerke]"
4. site:tonerweb.no/search.php?query=[kaffe+merke]

**FOR PRINTER FORBRUK (EKSISTERENDE LOGIKK BEVARES):**
1. site:tonerweb.no/pv.php?pid= "[eksakt modellnummer]"
2. site:tonerweb.no "[merke] [modellnummer]" 
3. site:tonerweb.no inurl:pid "[modellnummer]"
4. site:tonerweb.no/search.php?query=[modellnummer]

**KJENTE PRODUKTER PÅ TONERWEB.NO:**

**Printer Forbruk:**
- Canon PG-540 Black: pid=232736 (kr 257,-)
- Canon PG-540L Black: pid=6244 (kr 325,-)
- Canon PG-540XL: pid=18529 (kr 485,-)
- HP, Epson, Brother produkter: søk /m/[merke]

**Populære Kontorprodukter (eksempler for søk):**
- BIC penner: søk "BIC kulepenn" på /k/kontorprodukter/skriveredskaper
- Post-it: søk "post-it" eller "selvklebende"
- Stabilo markere: søk "Stabilo" på /k/kontorprodukter/skriveredskaper

**VERIFISERINGSREGLER:**
✓ ALDRI oppfinn produkt-IDer
✓ Sjekk at URLer faktisk eksisterer
✓ Priser må være i NOK med ",-"
✓ Se etter "X stk på lager"
✓ For kontorprodukter: sjekk merke, farge, pakketstørrelse

**RESPONSFORMAT:**

**Hvis funnet:**
✅ [Produktnavn](https://tonerweb.no/pv.php?pid=XXXXX) - kr XXX,-
   - Varenummer: XXXXX
   - Lagerstatus: X stk på lager
   - Leveringstid: 0-2 dager
   - Type: [Original/Kompatibel for printer, Merke/Pakketstørrelse for kontor]

**Hvis IKKE funnet:**
❌ Fant ikke eksakt match for [produkt]

**Alternative tilnærminger:**

1. **Prøv disse kategoriene:**
   - Skriveredskaper: https://tonerweb.no/k/kontorprodukter/skriveredskaper
   - Smårekvisita: https://tonerweb.no/k/kontorprodukter/smaarekvisita
   - Arkivering: https://tonerweb.no/k/kontorprodukter/arkivering
   - Kaffe: https://tonerweb.no/k/spise_drikke/kaffe

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
