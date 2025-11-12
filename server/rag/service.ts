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

export const detectLanguageFromText = (value: string): "mr" | "hi" | "en" => {
  if (!value) {
    return "en";
  }

  if (DEVANAGARI_REGEX.test(value)) {
    if (MARATHI_HINT_REGEX.test(value)) {
      return "mr";
    }
    if (HINDI_HINT_REGEX.test(value)) {
      return "hi";
    }
    // Default to Marathi for Devanagari script when uncertain.
    return "mr";
  }

  return "en";
};

export const retrieveKnowledgeContext = (
  query: string,
  options?: RetrieveOptions
): RetrievedKnowledge[] => {
  const cleanedQuery = sanitize(query);
  const tokens = tokenize(cleanedQuery);

  const results = knowledgeBase
    .map<RetrievedKnowledge>((entry) => ({
      ...entry,
      score: computeScore(entry, tokens, options),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, options?.limit ?? 3);

  return results;
};

export const buildContextText = (entries: RetrievedKnowledge[]): string => {
  if (!entries.length) {
    return "No matching government or agricultural references found in the local knowledge base.";
  }

  return entries
    .map((entry, index) =>
      [
        `Source #${index + 1}: ${entry.title}`,
        `Authority: ${entry.source}`,
        `Updated: ${entry.updated}`,
        `Summary: ${entry.summary}`,
        `Details:\n${entry.details}`,
        entry.url ? `Reference URL: ${entry.url}` : "Reference URL: Not available",
      ].join("\n")
    )
    .join("\n\n");
};


