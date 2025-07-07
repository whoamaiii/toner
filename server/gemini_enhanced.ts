import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@shared/logger";

// Validate API key at startup
if (!process.env.GEMINI_API_KEY) {
  logger.error('GEMINI_API_KEY environment variable is required for enhanced Gemini functionality');
  throw new Error('GEMINI_API_KEY is required');
}

// Initialize Gemini with your API key
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function analyzeTonerImage(imageBase64: string): Promise<string> {
  try {
    logger.debug('Analyzing printer cartridge image with Gemini Vision');
    
    const mimeTypeMatch = imageBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    if (!mimeTypeMatch || !mimeTypeMatch[1]) {
      // Return user-friendly error instead of throwing
      return "Ugyldig bildeformat. Vennligst last opp et gyldig JPEG- eller PNG-bilde.";
    }
    const mimeType = mimeTypeMatch[1];
    
    const imageData = {
      inlineData: {
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ''), // Remove data URL prefix
        mimeType: mimeType
      }
    };

    const prompt = `🎯 KRITISK OPPGAVE: Identifiser produkt for presist søk på tonerweb.no

🔍 ANALYSER BILDET GRUNDIG:

**1. 🏷️ PRODUKTTYPE IDENTIFIKASJON (VIKTIGST!):**
Identifiser hovedkategorien først:

**SKRIVERFORBRUK:**
- [ ] BLEKKPATRON (ink cartridge) - væske i patron
- [ ] TONERPATRON (toner cartridge) - pulver i kassett

**KONTORPRODUKTER:**
- [ ] Penner & Skriveredskaper (kulepenn, blyant, tusj, marker)
- [ ] Post-it & Notater (selvklebende lapper, notatbok)
- [ ] Arkivering (perm, mappe, ringperm, arkivboks)
- [ ] Smårekvisita (tape, lim, saks, stiftemaskin)
- [ ] Etiketter & Labels (etikettskriver, klistremerker)

**KAFFE & DRIKKE:**
- [ ] Kaffekapser (Nespresso, Dolce Gusto, andre merker)
- [ ] Kaffebønner (hele, malt, instant)
- [ ] Kaffemaskin-tilbehør

**PAPIR & MEDIA:**
- [ ] Kopipapir (A4, A3, fargede)
- [ ] Spesialpapir (fotopapir, labels, kartong)
- [ ] Blokker & Notatbøker

**RENHOLD & HYGIENE:**
- [ ] Tørkepapir (kjøkkenrull, toalettpapir)
- [ ] Rengjøringsmidler (såpe, desinfeksjon)
- [ ] Hansker (gummi, nitril, engangshansker)

**EMBALLASJE:**
- [ ] Konvolutter (C4, C5, DL, kuverter)
- [ ] Pakkmateriale (bobblefolie, tape, bokser)
- [ ] Poser (plast, papir, søppel)

**ELEKTRONIKK:**
- [ ] Batterier (AA, AAA, 9V, knappceller)
- [ ] Kabler & Tilbehør (USB, strøm, adaptere)

**2. 🔍 FOR BLEKK/TONER - EKSTRAKT NØYAKTIG:**
- **MERKE:** Canon, HP, Epson, Brother, Samsung, Xerox
- **MODELLNUMMER:** Skriv EKSAKT som på etiketten
  - Behold XL/XXL/L markering
  - Inkluder bindestrek: PG-540, ikke PG540
  - Noter fargeKODE: BK (black), C (cyan), M (magenta), Y (yellow), CL (color)
- **ORIGINAL vs KOMPATIBEL:** Se etter merkelogo/markering
- **STØRRELSE:** Standard, XL, XXL, L
- **MULTIPACK:** Antall patroner i pakken
- **SKRIVERKOMPATIBILITET:** Hvilke skrivermodeller som støttes

**3. 🖊️ FOR KONTORPRODUKTER:**
- **PRODUKTTYPE:** Presis norsk betegnelse
  - Kulepenn (ikke ballpoint pen)
  - Blyant (ikke pencil)
  - Tusj/Marker (ikke felt-tip pen)
  - Post-it (ikke sticky notes)
  - Notatbok (ikke notebook)
- **MERKE:** BIC, Stabilo, Pilot, Pentel, Faber-Castell, Post-it
- **FARGE:** Spesifiser farger (blå, sort, rød, flerfarget)
- **PAKKETSTØRRELSE:** Antall i pakken
- **MATERIALE:** Plast, metall, gummi, papp

**4. ☕ FOR KAFFE/DRIKKE:**
- **KAFFEKAPSELTYPE:** Nespresso Original, Dolce Gusto, Tassimo, Senseo
- **KAFFEBØNNER:** Hele bønner, malt, instant
- **MERKE:** Nespresso, Lavazza, Illy, Jacobs, Friele
- **SMAK/INTENSITET:** Mild, medium, strong, spesialisert smak
- **PAKKETSTØRRELSE:** Antall kapsler eller gram

**5. 📄 FOR PAPIR & MEDIA:**
- **PAPIRTYPE:** Kopipapir, fotopapir, labels, kartong
- **STØRRELSE:** A4, A3, A5, letter
- **KVALITET:** Gram pr. kvadratmeter (80g, 90g, 100g)
- **FARGE:** Hvit, crème, farget
- **PAKKETSTØRRELSE:** Antall ark eller pakker

**6. 🧹 FOR RENHOLD & HYGIENE:**
- **PRODUKTTYPE:** Tørkepapir, rengjøringsmiddel, hansker
- **MERKE:** Plenty, Lambi, Katrin, Tork
- **ANVENDELSE:** Kjøkken, bad, industri, kontor
- **STØRRELSE:** Antall ruller, ark, eller volum

**7. 📦 FOR EMBALLASJE:**
- **KONVOLUTTTYPE:** C4, C5, DL, kuverter
- **PAKKMATERIALE:** Bobblefolie, tape, bokser
- **POSETYPE:** Plastposer, papirposer, søppelposer
- **STØRRELSE:** Dimensjoner eller volum

**8. 🔋 FOR ELEKTRONIKK:**
- **BATTERITYPE:** AA, AAA, 9V, knappceller, oppladbare
- **KABELTYPE:** USB, strøm, HDMI, nettverk
- **MERKE:** Duracell, Energizer, Varta, Panasonic

**9. 📝 ALL SYNLIG TEKST:**
Registrer ALT du kan lese:
- Produktnavn (både norsk og engelsk)
- Modellnummer og produktkoder
- Strekkoder og SKU-numre
- "Kompatibel med..." informasjon
- Merkelogoer og sertifiseringer
- Pakketstørrelse og mengdeangivelser
- Priser og tilbudsinformasjon
- Produsent og distributør

**10. 🎯 SØKEORD FOR TONERWEB:**
Generer 8-12 søkeord basert på analysen:

**Norske termer (prioritet):**
- Norsk produktnavn
- Norsk merkebetegnelse
- Norsk kategori-navn

**Produktspesifikke søkeord:**
- Eksakt modellnummer
- Merke + modellnummer
- Produkttype + merke
- Alternativ stavemåte/forkortelser

**Kategoribaserte søkeord:**
- Hovedkategori (f.eks. "blekkpatron")
- Underkategori (f.eks. "Canon blekkpatron")
- Anvendelsesområde (f.eks. "kontorskriver")

**11. 🔄 ALTERNATIVER & VARIANTER:**
- Lignende produkter fra samme merke
- Kompatible alternativer
- Forskjellige pakketstørrelser
- Fargealternativer

**KRITISK VIKTIG:**
Din produktidentifikasjon avgjør hele søkestrategien på tonerweb.no!
- Vær EKSTREMT presis med modellnummer
- Spesifiser produkttype med norske termer
- Inkluder alle relevante detaljer
- Foreslå alternative søkeord

**📊 SVAR STRUKTURERT PÅ NORSK:**

**PRODUKTTYPE:** [Spesifikk kategori]
**MERKE:** [Eksakt merke]
**MODELL:** [Presis modellbetegnelse]
**DETALJER:** [Alle viktige spesifikasjoner]
**SØKEORD:** [Liste med 8-12 søkeord for tonerweb.no]
**ALTERNATIVER:** [Lignende produkter å søke etter]`;

    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const response = await model.generateContent([prompt, imageData]);

    const analysisResult = response.response.text() || "Kunne ikke analysere bildet.";
    logger.debug('Gemini analysis completed');
    return analysisResult;
  } catch (error) {
    logger.error('Gemini Vision Analysis Error', error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
      return "Feil: Gemini API-nøkkelen er ugyldig. Vennligst sjekk .env-filen.";
    }
    return `Beklager, en feil oppstod under bildeanalysen. Vennligst prøv igjen med et annet bilde.`;
  }
}

export async function generateTonerWebResponse(message: string, mode: string): Promise<string> {
  try {
    const systemPrompt = mode === 'DeepSearch' 
      ? `Du er TonerWeb AI Assistant - spesialisert produktassistent for tonerweb.no, en norsk nettbutikk som selger skriverforbruk og kontorrekvisita. Ditt hovedmål er å hjelpe kunder med å finne riktige produkter tilgjengelig på tonerweb.no.

**VIKTIGE RESTRIKSJONER:**
- SØK og anbefal KUN produkter fra tonerweb.no
- Oppgi KUN informasjon om produkter som faktisk er tilgjengelig på tonerweb.no
- Når brukere spør om skriverkompatibilitet, søk tonerweb.no spesifikt etter kompatible tonerpatroner
- Nevn alltid at produkter er fra tonerweb.no
- Hvis et produkt ikke er tilgjengelig på tonerweb.no, oppgi dette tydelig og foreslå lignende alternativer som ER tilgjengelig på siden
- Inkluder produktkoder, sidetall og andre spesifikke detaljer fra tonerweb.no når tilgjengelig
- KRITISK: Du MÅ søke etter og finne den EKSAKTE produkt-URL på tonerweb.no - IKKE bruk generiske lenker
- Når du anbefaler produkter, formater dem som: [Produktnavn](eksakt-url-fra-tonerweb.no)
- Produkt-URL må være den spesifikke produktsiden, IKKE bare https://tonerweb.no/

**PRODUKTKATEGORIER PÅ TONERWEB.NO:**

**1. SKRIVERFORBRUK:**
- Blekkpatroner (/k/blekkpatroner)
- Tonerpatroner (/k/tonerpatroner)

**2. KONTORPRODUKTER (/k/kontorprodukter):**
- Skriveredskaper - penner, blyanter, tusjer, markere
- Arkivering - permer, mapper, ringpermer, arkivbokser  
- Smårekvisita - stiftemaskiner, tape, lim, saks, post-it

**3. KAFFE & DRIKKE (/k/spise_drikke):**
- Kaffekapser og kaffebønner
- Te og varm drikke
- Kaffemaskiner og tilbehør

**4. ANDRE KATEGORIER:**
- Papir (/k/papir) - kopipapir, skriverpapir
- Renhold (/k/tork_renhold) - rengjøring, hygiene

**NORSKE SØKEORD:**
- Skriveredskaper: kulepenn, penn, blyant, tusj, marker, merkepenn
- Notater: post-it, selvklebende lapper, huskelapper, notatbok
- Kaffe: kaffekapsel, kaffebønner, Nespresso, Dolce Gusto, instant kaffe
- Arkivering: perm, mappe, ringperm, arkivboks

**SØKESTRATEGI FOR DEEPSEARCH:**
1. Søk tonerweb.no etter de spesifikke produktene
2. Finn de EKSAKTE produktside-URL-ene på tonerweb.no
3. Inkluder disse spesifikke URL-ene i svaret ditt
4. Aldri bruk placeholder eller generiske URL-er

**GOOGLE SEARCH EKSEMPLER:**
- "site:tonerweb.no Canon PG-540XL"
- "site:tonerweb.no BIC kulepenn"
- "site:tonerweb.no post-it selvklebende"
- "site:tonerweb.no Nespresso kaffekapsel"
- "site:tonerweb.no/k/kontorprodukter/skriveredskaper [søkeord]"

KRITISK: Hvis du ikke kan finne den eksakte produkt-URL, nevn produktet men noter at du trenger å søke etter den spesifikke URL-en på tonerweb.no.

Svar alltid på norsk.`
      : `Du er TonerWeb AI Assistant - spesialisert produktassistent for tonerweb.no. Ditt hovedmål er å hjelpe kunder med å finne riktige produkter tilgjengelig på tonerweb.no.

**VIKTIGE RESTRIKSJONER:**
- SØK og anbefal KUN produkter fra tonerweb.no
- Oppgi KUN informasjon om produkter som faktisk er tilgjengelig på tonerweb.no
- Når brukere spør om skriverkompatibilitet, søk tonerweb.no spesifikt etter kompatible tonerpatroner
- Nevn alltid at produkter er fra tonerweb.no
- Hvis et produkt ikke er tilgjengelig på tonerweb.no, oppgi dette tydelig og foreslå lignende alternativer som ER tilgjengelig
- KRITISK: Du MÅ søke etter og finne den EKSAKTE produkt-URL på tonerweb.no - IKKE bruk generiske lenker
- Når du anbefaler produkter, formater dem som: [Produktnavn](eksakt-url-fra-tonerweb.no)
- Produkt-URL må være den spesifikke produktsiden, IKKE bare https://tonerweb.no/

**PRODUKTTYPER:**
- Skriverforbruk: blekkpatroner, tonerpatroner
- Kontorprodukter: penner, post-it, arkivering, smårekvisita
- Kaffe: kaffekapser, kaffebønner, kaffemaskiner
- Andre: papir, renhold, emballasje

**NORSKE TERMER:**
- Skriveredskaper: kulepenn, penn, blyant, tusj, marker
- Notater: post-it, selvklebende lapper, huskelapper
- Kaffe: kaffekapsel, kaffebønner, Nespresso, instant kaffe

**THINK MODE TILNÆRMING:**
1. Analyser brukerens skriver- eller produktbehov steg-for-steg
2. Søk tonerweb.no etter spesifikke matchende produkter
3. Finn de EKSAKTE produktside-URL-ene på tonerweb.no
4. Inkluder disse spesifikke URL-ene i svaret ditt
5. Vis din reasoning for hvorfor disse spesifikke produktene fra tonerweb.no er de beste anbefalingene

**GOOGLE SEARCH MØNSTRE:**
- "site:tonerweb.no [merke] [modell]" (for printer)
- "site:tonerweb.no/k/kontorprodukter [produkttype]" (for kontor)
- "site:tonerweb.no [kaffemerke] kaffekapsel" (for kaffe)

KRITISK: Hvis du ikke kan finne den eksakte produkt-URL, nevn produktet men noter at du trenger å søke etter den spesifikke URL-en på tonerweb.no.

Svar alltid på norsk.`;

    const fullPrompt = `${systemPrompt}

**VIKTIG: Bruk Google Search for å finne de EKSAKTE produkt-URL-ene på tonerweb.no. Søk etter spørringer som:**

**For skriverforbruk:**
- "site:tonerweb.no Canon PG-540XL"
- "site:tonerweb.no HP 05A toner"
- "site:tonerweb.no Brother blekkpatron"

**For kontorprodukter:**
- "site:tonerweb.no/k/kontorprodukter/skriveredskaper BIC penn"
- "site:tonerweb.no post-it selvklebende"
- "site:tonerweb.no/k/kontorprodukter Stabilo marker"

**For kaffe:**
- "site:tonerweb.no/k/spise_drikke Nespresso kaffekapsel"
- "site:tonerweb.no Dolce Gusto"
- "site:tonerweb.no kaffekapsel [merke]"

Dette vil hjelpe deg med å finne faktiske produktside-URL-er å inkludere i svaret ditt.

Brukerens spørsmål: ${message}`;

    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const response = await model.generateContent(fullPrompt);

    return response.response.text() || "Beklager, jeg kunne ikke generere et svar. Vennligst prøv igjen.";
  } catch (error) {
    logger.error('Gemini API Error', error);
    throw error;
  }
}
