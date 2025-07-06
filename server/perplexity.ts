import OpenAI from "openai";
import { analyzeTonerImage } from "./gemini";

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
  console.log('searchTonerWebProducts called with:', { message, mode, hasImage: !!image });
  console.log('API Key present:', !!process.env.OPENROUTER_API_KEY);
  
  try {
    // First, analyze the image if provided
    let imageAnalysis = "";
    if (image) {
      try {
        imageAnalysis = await analyzeTonerImage(image);
        console.log('Image analysis completed:', imageAnalysis.substring(0, 200) + '...');
      } catch (error) {
        console.error('Image analysis failed:', error);
        imageAnalysis = "Kunne ikke analysere bildet. Vennligst prøv igjen eller beskriv tonerpatronen manuelt.";
      }
    }

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

    const userPrompt = `${message}

${imageAnalysis ? `\n\nBILDANALYSE FRA GEMINI:\n${imageAnalysis}\n\nVIKTIG: Les analysen nøye for å se om dette er BLEKK eller TONER. Søk etter riktig produkttype på tonerweb.no basert på analysen. Fokuser på merke, modellnummer og andre detaljer fra analysen.` : ''}

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
