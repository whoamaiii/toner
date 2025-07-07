/**
 * Query Classification and Routing System
 * 
 * This module analyzes incoming queries to determine the appropriate
 * AI model and processing strategy. It routes queries to:
 * - Perplexity Sonar Pro Online for simple product searches
 * - Claude 3.5 Sonnet for complex reasoning and compatibility
 * - Combined approach for queries requiring both search and reasoning
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import { logger } from "@shared/logger";
import { CONFIG } from "./config";

export type QueryType = 'simple' | 'complex' | 'compatibility' | 'comparison' | 'recommendation';
export type ProcessingStrategy = 'search-only' | 'reasoning-only' | 'search-then-reason' | 'unified-reasoning';

interface QueryClassification {
  type: QueryType;
  strategy: ProcessingStrategy;
  confidence: number;
  reasoning: string;
  requiresImage: boolean;
}

interface CompiledPattern {
  keywords: string[];
  patterns: RegExp[];
}

/**
 * Pre-compiled regex patterns for better performance
 */
const COMPILED_PATTERNS: Record<QueryType, CompiledPattern> = {
  // Simple search patterns
  simple: {
    keywords: [
      'finn', 'søk', 'pris', 'kjøp', 'bestill', 'har dere', 'finnes',
      'hvor mye koster', 'hva koster', 'på lager', 'leveringstid'
    ],
    patterns: [
      /^(finn|søk|kjøp)\s+\w+/i,
      /\b(pris|koster)\s+(på|for)\b/i,
      /\bpå\s+lager\b/i,
      /\b(Canon|HP|Epson|Brother)\s+[A-Z0-9-]+\b/i
    ]
  },
  
  // Complex reasoning patterns
  complex: {
    keywords: [
      'hvilken', 'hva er forskjellen', 'anbefaler', 'best', 'bør jeg',
      'fordeler', 'ulemper', 'hvorfor', 'forklar', 'hjelp meg',
      'trenger råd', 'usikker', 'alternativer', 'budsjett'
    ],
    patterns: [
      /\b(hvilken|hvilket|hvilke)\s+.+\s+(best|anbefaler|bør)\b/i,
      /\bforskjell(en)?\s+(mellom|på)\b/i,
      /\b(fordeler|ulemper)\s+(med|ved)\b/i,
      /\bhjelp\s+meg\s+(velge|finne)\b/i,
      /\btrenger\s+(råd|hjelp|veiledning)\b/i
    ]
  },
  
  // Compatibility specific patterns
  compatibility: {
    keywords: [
      'kompatibel', 'passer', 'fungerer', 'virker', 'til min',
      'for min', 'skriver', 'printer', 'modell'
    ],
    patterns: [
      /\b(kompatibel|passer)\s+(med|til|for)\b/i,
      /\b(fungerer|virker)\s+.+\s+(med|på|i)\b/i,
      /\btil\s+min\s+\w+/i,
      /\bfor\s+\w+\s+(skriver|printer)\b/i,
      /\b(Canon|HP|Epson|Brother)\s+\w+\s+\d+/i
    ]
  },
  
  // Comparison patterns
  comparison: {
    keywords: [
      'sammenlign', 'versus', 'eller', 'bedre enn', 'forskjell mellom',
      'vs', 'kontra', 'mot'
    ],
    patterns: [
      /\b(sammenlign|compare)\b/i,
      /\b\w+\s+(vs|versus|eller|kontra)\s+\w+\b/i,
      /\b(bedre|verre)\s+enn\b/i,
      /\bforskjell\s+mellom\s+.+\s+og\b/i
    ]
  },
  
  // Recommendation patterns
  recommendation: {
    keywords: [
      'anbefal', 'foreslå', 'tips', 'råd', 'hva bør', 'hva skal',
      'trenger', 'ønsker', 'vil ha'
    ],
    patterns: [
      /\b(anbefal|foreslå)\s+.+\s+for\b/i,
      /\bhva\s+(bør|skal)\s+jeg\b/i,
      /\btrenger\s+.+\s+som\b/i,
      /\b(tips|råd)\s+(om|for|til)\b/i
    ]
  }
};

/**
 * Analyzes a query to determine its type and complexity.
 * 
 * This function uses keyword matching, pattern recognition, and
 * heuristics to classify queries and determine the best processing strategy.
 * 
 * @param {string} query - The user's query to analyze
 * @param {boolean} hasImage - Whether the query includes an image
 * @returns {QueryClassification} Classification result with routing recommendation
 */
export function classifyQuery(query: string, hasImage: boolean = false): QueryClassification {
  const lowerQuery = query.toLowerCase();
  const queryLength = query.split(' ').length;
  
  // Initialize scores for each type
  const scores: Record<QueryType, number> = {
    simple: 0,
    complex: 0,
    compatibility: 0,
    comparison: 0,
    recommendation: 0
  };
  
  // Score based on keywords and patterns (optimized)
  for (const [type, config] of Object.entries(COMPILED_PATTERNS)) {
    // Check keywords (optimized single pass)
    for (const keyword of config.keywords) {
      if (lowerQuery.includes(keyword)) {
        scores[type as QueryType] += CONFIG.query.KEYWORD_SCORE;
      }
    }
    
    // Check patterns (pre-compiled regex)
    for (const pattern of config.patterns) {
      if (pattern.test(query)) {
        scores[type as QueryType] += CONFIG.query.PATTERN_SCORE;
      }
    }
  }
  
  // Adjust scores based on query characteristics (using configuration)
  if (queryLength < CONFIG.query.SIMPLE_QUERY_MAX_WORDS) {
    scores.simple += CONFIG.query.KEYWORD_SCORE + 1; // Short queries are usually simple searches
  } else if (queryLength > CONFIG.query.COMPLEX_QUERY_MIN_WORDS) {
    scores.complex += CONFIG.query.KEYWORD_SCORE; // Longer queries often need reasoning
  }
  
  // If query contains specific product models, boost simple search
  if (/\b[A-Z]{2,}-?\d{2,}/i.test(query)) {
    scores.simple += CONFIG.query.KEYWORD_SCORE;
  }
  
  // Find the highest scoring type
  let bestType: QueryType = 'simple';
  let highestScore = scores.simple;
  
  for (const [type, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestType = type as QueryType;
    }
  }
  
  // Determine processing strategy
  let strategy: ProcessingStrategy;
  let reasoning: string;
  
  switch (bestType) {
    case 'simple':
      strategy = 'search-only';
      reasoning = 'Direct product search query - using Perplexity for real-time results';
      break;
      
    case 'compatibility':
      strategy = 'unified-reasoning';
      reasoning = 'Compatibility question - using sonar-reasoning-pro for search + reasoning in one call';
      break;
      
    case 'comparison':
    case 'recommendation':
      strategy = 'unified-reasoning';
      reasoning = 'Complex query requiring search and analysis - using sonar-reasoning-pro with CoT';
      break;
      
    case 'complex':
    default:
      if (lowerQuery.includes('pris') || lowerQuery.includes('kjøp')) {
        strategy = 'unified-reasoning';
        reasoning = 'Complex query with pricing needs - using sonar-reasoning-pro for search + analysis';
      } else {
        strategy = 'reasoning-only';
        reasoning = 'Pure reasoning query - using Claude for detailed analysis';
      }
  }
  
  // Calculate confidence (0-1)
  const maxPossibleScore = 25; // Approximate max score
  const confidence = Math.min(highestScore / maxPossibleScore, 1);
  
  logger.debug('Query classified', {
    type: bestType,
    strategy,
    confidence,
    scores,
    queryLength
  });
  
  return {
    type: bestType,
    strategy,
    confidence,
    reasoning,
    requiresImage: hasImage || query.toLowerCase().includes('bilde')
  };
}

/**
 * Determines if a query should use Claude reasoning based on classification.
 * 
 * @param {QueryClassification} classification - The query classification
 * @returns {boolean} True if Claude reasoning should be used
 */
export function shouldUseClaude(classification: QueryClassification): boolean {
  return classification.strategy === 'reasoning-only' || 
         classification.strategy === 'search-then-reason';
}

/**
 * Determines if a query should use Perplexity search based on classification.
 * 
 * @param {QueryClassification} classification - The query classification
 * @returns {boolean} True if Perplexity search should be used
 */
export function shouldUsePerplexity(classification: QueryClassification): boolean {
  return classification.strategy === 'search-only' || 
         classification.strategy === 'search-then-reason';
}

/**
 * Determines if a query should use unified reasoning (sonar-reasoning-pro).
 * 
 * @param {QueryClassification} classification - The query classification
 * @returns {boolean} True if unified reasoning should be used
 */
export function shouldUseUnifiedReasoning(classification: QueryClassification): boolean {
  return classification.strategy === 'unified-reasoning';
}

/**
 * Extracts potential product identifiers from a query.
 * 
 * This function identifies product models, codes, and names that can
 * be used for more targeted searches.
 * 
 * @param {string} query - The query to extract identifiers from
 * @returns {string[]} Array of potential product identifiers
 */
export function extractProductIdentifiers(query: string): string[] {
  const identifiers: string[] = [];
  
  // Match common printer cartridge patterns
  const patterns = [
    /\b(PG|CL|HP|CN|CB|CC|CD|CE|CF)-?\d+\w*/gi,
    /\b\d{3,4}[A-Z]{1,2}\b/g,
    /\b(Canon|HP|Epson|Brother)\s+\w+-?\d+/gi,
    /\b(PIXMA|LaserJet|OfficeJet|DeskJet)\s+\w+/gi
  ];
  
  for (const pattern of patterns) {
    const matches = query.match(pattern);
    if (matches) {
      identifiers.push(...matches);
    }
  }
  
  return Array.from(new Set(identifiers)); // Remove duplicates
}

/**
 * Suggests alternative search terms based on the query.
 * 
 * @param {string} query - The original query
 * @param {QueryType} type - The classified query type
 * @returns {string[]} Array of alternative search terms
 */
export function suggestAlternativeTerms(query: string, type: QueryType): string[] {
  const alternatives: string[] = [];
  const lowerQuery = query.toLowerCase();
  
  // Product type alternatives
  if (lowerQuery.includes('blekk')) {
    alternatives.push('blekkpatron', 'ink cartridge');
  }
  if (lowerQuery.includes('toner')) {
    alternatives.push('tonerpatron', 'toner cartridge');
  }
  
  // Brand alternatives
  const brandMap: Record<string, string[]> = {
    'canon': ['Canon PIXMA', 'Canon imageCLASS'],
    'hp': ['HP LaserJet', 'HP OfficeJet', 'HP DeskJet'],
    'epson': ['Epson WorkForce', 'Epson Expression'],
    'brother': ['Brother MFC', 'Brother HL', 'Brother DCP']
  };
  
  for (const [brand, models] of Object.entries(brandMap)) {
    if (lowerQuery.includes(brand)) {
      alternatives.push(...models);
    }
  }
  
  return alternatives;
}
