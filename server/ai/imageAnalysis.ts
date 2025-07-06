import { geminiClient } from "./clients";

/**
 * Shared image-analysis helper that forwards the request to Google Gemini
 * Vision. A custom prompt can be supplied; if omitted, the default Norwegian
 * cartridge prompt is used.
 */
export async function analyzeTonerImage(
  imageBase64: string,
  prompt?: string,
): Promise<string> {
  try {
    const defaultPrompt = `KRITISK OPPGAVE: Identifiser produkt for nøyaktig søk på tonerweb.no

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

    const finalPrompt = prompt ?? defaultPrompt;

    const mimeTypeMatch = imageBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    if (!mimeTypeMatch || !mimeTypeMatch[1]) {
      throw new Error("Could not determine image MIME type from base64 string.");
    }
    const mimeType = mimeTypeMatch[1];

    const imageData = {
      inlineData: {
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ""), // Remove data URL prefix
        mimeType,
      },
    };

    const response = await geminiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: finalPrompt }, imageData],
        },
      ],
    });

    return response.text || "Kunne ikke analysere bildet.";
  } catch (error: any) {
    console.error("Gemini Vision Analysis Error:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
      return "Feil: Gemini API-nøkkelen er ugyldig. Vennligst sjekk .env-filen.";
    }
    return `Beklager, en feil oppstod under bildeanalysen: ${
      error instanceof Error ? error.message : "Ukjent feil"
    }`;
  }
}