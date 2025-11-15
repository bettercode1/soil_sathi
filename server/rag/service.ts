import type { KnowledgeBaseEntry } from "./knowledge-base.js";
import { knowledgeBase } from "./knowledge-base.js";

export type RetrievedKnowledge = KnowledgeBaseEntry & {
  score: number;
};

type RetrieveOptions = {
  limit?: number;
  regionHint?: string;
  preferredLanguages?: string[];
  tags?: string[];
};

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const MARATHI_HINT_REGEX =
  /(शेत|शेतकरी|महाराष्ट्र|कर्ज|योजना|उत्पादन|खत|पाऊस|माती|सल्ला|अनुदान)/;
const HINDI_HINT_REGEX =
  /(किसान|योजना|ऋण|उर्वरक|मौसम|पैदावार|फसल|खरीफ|रबी|बीमा)/;

const sanitize = (value: string) =>
  value
    .toLowerCase()
    // eslint-disable-next-line no-misleading-character-class -- We intentionally include the Devanagari Unicode block.
    .replace(/[^a-z0-9\u0900-\u097F\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value: string) => {
  if (!value) {
    return [];
  }
  return sanitize(value)
    .split(" ")
    .filter((token) => token.length > 1);
};

const computeScore = (
  entry: KnowledgeBaseEntry,
  queryTokens: string[],
  options?: RetrieveOptions
) => {
  if (queryTokens.length === 0) {
    return 0;
  }

  const entryTokens = new Set<string>([
    ...tokenize(entry.title),
    ...tokenize(entry.summary),
    ...tokenize(entry.details),
    ...entry.tags.map((tag) => tag.toLowerCase()),
  ]);

  let score = 0;

  for (const token of queryTokens) {
    if (entryTokens.has(token)) {
      score += 2;
    } else if (token.length > 4) {
      const partialMatches = Array.from(entryTokens).some((candidate) =>
        candidate.includes(token)
      );
      if (partialMatches) {
        score += 1;
      }
    }
  }

  if (options?.tags) {
    const tagMatches = entry.tags.filter((tag) =>
      options.tags?.includes(tag.toLowerCase())
    );
    score += tagMatches.length * 1.5;
  }

  if (options?.regionHint) {
    const hasRegion =
      entry.regions.some((item) =>
        item.toLowerCase().includes(options.regionHint!.toLowerCase())
      ) || entry.summary.toLowerCase().includes(options.regionHint.toLowerCase());
    if (hasRegion) {
      score += 1.25;
    }
  }

  if (options?.preferredLanguages?.length) {
    const languageMatch = options.preferredLanguages.some((language) =>
      entry.languages.includes(language as "en" | "hi" | "mr")
    );
    if (languageMatch) {
      score += 0.85;
    }
  }

  return score;
};

/**
 * Enhanced language detection with improved accuracy using:
 * 1. Script analysis (Devanagari detection)
 * 2. Contextual keyword matching with scoring
 * 3. Character frequency analysis
 * 4. Fallback strategies
 */
export const detectLanguageFromText = (value: string, preferredLanguage?: "mr" | "hi" | "en"): "mr" | "hi" | "en" => {
  if (!value || value.trim().length === 0) {
    return preferredLanguage || "en";
  }

  const trimmedValue = value.trim();
  
  // Check for Devanagari script
  if (DEVANAGARI_REGEX.test(trimmedValue)) {
    // Score-based detection for better accuracy
    let marathiScore = 0;
    let hindiScore = 0;
    
    // Count keyword matches (more matches = higher confidence)
    const marathiMatches = trimmedValue.match(MARATHI_HINT_REGEX);
    const hindiMatches = trimmedValue.match(HINDI_HINT_REGEX);
    
    if (marathiMatches) {
      marathiScore += marathiMatches.length * 2; // Weight matches
    }
    if (hindiMatches) {
      hindiScore += hindiMatches.length * 2;
    }
    
    // Character frequency analysis (Marathi-specific characters)
    // Marathi uses some unique characters like ॲ, ऑ, ळ, ऱ्
    const marathiSpecificChars = /[ॲऑळऱ्]/g;
    const marathiCharMatches = trimmedValue.match(marathiSpecificChars);
    if (marathiCharMatches) {
      marathiScore += marathiCharMatches.length * 1.5;
    }
    
    // Hindi-specific characters and patterns
    const hindiSpecificPatterns = /(क्या|है|हो|गया|आया|किया|दिया|लिया)/g;
    const hindiPatternMatches = trimmedValue.match(hindiSpecificPatterns);
    if (hindiPatternMatches) {
      hindiScore += hindiPatternMatches.length * 1.5;
    }
    
    // Length-based confidence (longer text = more reliable)
    const textLength = trimmedValue.length;
    const lengthMultiplier = Math.min(textLength / 50, 1.5); // Cap at 1.5x
    
    marathiScore *= lengthMultiplier;
    hindiScore *= lengthMultiplier;
    
    // Determine language based on scores
    if (marathiScore > hindiScore && marathiScore > 1) {
      return "mr";
    }
    if (hindiScore > marathiScore && hindiScore > 1) {
      return "hi";
    }
    
    // If scores are equal or low, use preferred language or default to Marathi
    // (since this is Maharashtra-focused)
    return preferredLanguage === "hi" ? "hi" : "mr";
  }

  // For non-Devanagari text, check for English patterns
  // If it contains mostly English characters, return English
  const englishPattern = /^[a-zA-Z0-9\s.,!?'"()-]+$/;
  if (englishPattern.test(trimmedValue) || trimmedValue.length > 0) {
    return preferredLanguage || "en";
  }

  // Fallback to preferred language or English
  return preferredLanguage || "en";
};

export const retrieveKnowledgeContext = (
  query: string,
  options?: RetrieveOptions
): RetrievedKnowledge[] => {
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return [];
  }

  try {
    const cleanedQuery = sanitize(query);
    const tokens = tokenize(cleanedQuery);

    if (!knowledgeBase || !Array.isArray(knowledgeBase) || knowledgeBase.length === 0) {
      console.warn("[RAG] Knowledge base is empty or not loaded");
      return [];
    }

    const results = knowledgeBase
      .map<RetrievedKnowledge>((entry) => {
        try {
          return {
            ...entry,
            score: computeScore(entry, tokens, options),
          };
        } catch (error) {
          console.error("[RAG] Error computing score for entry:", entry.id, error);
          return {
            ...entry,
            score: 0,
          };
        }
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, options?.limit ?? 3);

    return results;
  } catch (error) {
    console.error("[RAG] Error retrieving knowledge context:", error);
    return [];
  }
};

export const buildContextText = (entries: RetrievedKnowledge[]): string => {
  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return "No matching government or agricultural references found in the local knowledge base.";
  }

  try {
    return entries
      .map((entry, index) => {
        try {
          return [
            `Source #${index + 1}: ${entry.title || "Untitled"}`,
            `Authority: ${entry.source || "Unknown"}`,
            `Updated: ${entry.updated || "Unknown"}`,
            `Summary: ${entry.summary || "No summary available"}`,
            `Details:\n${entry.details || "No details available"}`,
            entry.url ? `Reference URL: ${entry.url}` : "Reference URL: Not available",
          ].join("\n");
        } catch (error) {
          console.error("[RAG] Error building context for entry:", entry.id, error);
          return `Source #${index + 1}: Error loading entry`;
        }
      })
      .filter(Boolean)
      .join("\n\n");
  } catch (error) {
    console.error("[RAG] Error building context text:", error);
    return "No matching government or agricultural references found in the local knowledge base.";
  }
};


