import {
  ALL_LANGUAGES,
  type Language,
  type TranslationSet,
} from "@/constants/languages";
import { NORTHEAST_UI_BY_ENGLISH } from "@/constants/northeastUiByEnglish";

/** Preferred source language when a northeast entry is missing */
const NE_FILL_SOURCES: Partial<Record<Language, Language[]>> = {
  as: ["bn", "hi", "en"],
  mni: ["bn", "hi", "en"],
  ne: ["hi", "en"],
  brx: ["hi", "en"],
  lus: ["en", "hi"],
  kha: ["en", "hi"],
};

const expandedCache = new WeakMap<object, TranslationSet>();

/**
 * Ensures every TranslationSet includes all 13 supported languages.
 * Uses northeast-specific strings when available, then regional fallbacks.
 */
export function expandTranslationSet(
  translations: Partial<Record<Language, string>> | TranslationSet | undefined,
): TranslationSet {
  if (!translations) {
    return { en: "" };
  }

  const cached = expandedCache.get(translations);
  if (cached) return cached;

  const base = { ...translations } as Partial<Record<Language, string>>;
  const english = base.en?.trim();

  if (english && NORTHEAST_UI_BY_ENGLISH[english]) {
    Object.assign(base, NORTHEAST_UI_BY_ENGLISH[english]);
  }

  for (const lang of ALL_LANGUAGES) {
    if (base[lang]) continue;

    const sources = NE_FILL_SOURCES[lang];
    if (sources) {
      for (const source of sources) {
        const value = base[source];
        if (value) {
          base[lang] = value;
          break;
        }
      }
    }

    if (!base[lang]) {
      base[lang] = base.hi ?? base.en ?? "";
    }
  }

  const result = base as TranslationSet;
  expandedCache.set(translations, result);
  return result;
}

export function expandTranslationRecord(
  record: Record<string, Partial<Record<Language, string>> & { en: string }>,
): Record<string, TranslationSet> {
  const expanded: Record<string, TranslationSet> = {};
  for (const [key, set] of Object.entries(record)) {
    expanded[key] = expandTranslationSet(set);
  }
  return expanded;
}

/** Build a full Record<Language, string> from a partial set (inline t() blocks, help desk copy). */
export function toAllLanguages(
  partial: Partial<Record<Language, string>> & { en: string },
): Record<Language, string> {
  const expanded = expandTranslationSet(partial);
  return Object.fromEntries(
    ALL_LANGUAGES.map((lang) => [lang, expanded[lang] ?? expanded.en]),
  ) as Record<Language, string>;
}
