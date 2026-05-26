/** Supported app languages — pan-India plus Northeast India */
export type Language =
  | "en"
  | "hi"
  | "pa"
  | "ta"
  | "te"
  | "bn"
  | "mr"
  | "as"
  | "mni"
  | "lus"
  | "ne"
  | "kha"
  | "brx";

export const ALL_LANGUAGES: readonly Language[] = [
  "en",
  "hi",
  "pa",
  "ta",
  "te",
  "bn",
  "mr",
  "as",
  "mni",
  "lus",
  "ne",
  "kha",
  "brx",
] as const;

export const NORTHEAST_LANGUAGES: readonly Language[] = [
  "as",
  "mni",
  "lus",
  "ne",
  "kha",
  "brx",
] as const;

export type TranslationSet = Partial<Record<Language, string>> & { en: string };

export const LANGUAGE_NATIVE_NAMES: Record<Language, string> = {
  en: "English",
  hi: "हिंदी",
  pa: "ਪੰਜਾਬੀ",
  ta: "தமிழ்",
  te: "తెలుగు",
  bn: "বাংলা",
  mr: "मराठी",
  as: "অসমীয়া",
  mni: "মৈতৈলোন্",
  lus: "Mizo ṭawng",
  ne: "नेपाली",
  kha: "Khasi",
  brx: "बड़ो",
};

export const LANGUAGE_DISPLAY_LABELS: Record<Language, string> = {
  en: "English",
  hi: "हिंदी (Hindi)",
  pa: "ਪੰਜਾਬੀ (Punjabi)",
  ta: "தமிழ் (Tamil)",
  te: "తెలుగు (Telugu)",
  bn: "বাংলা (Bengali)",
  mr: "मराठी (Marathi)",
  as: "অসমীয়া (Assamese)",
  mni: "মৈতৈলোন্ (Manipuri)",
  lus: "Mizo ṭawng (Mizo)",
  ne: "नेपाली (Nepali)",
  kha: "Khasi",
  brx: "बड़ो (Bodo)",
};

export type LanguageOption = {
  code: Language;
  label: string;
  group: "india" | "northeast";
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "mr", label: LANGUAGE_DISPLAY_LABELS.mr, group: "india" },
  { code: "en", label: LANGUAGE_DISPLAY_LABELS.en, group: "india" },
  { code: "hi", label: LANGUAGE_DISPLAY_LABELS.hi, group: "india" },
  { code: "pa", label: LANGUAGE_DISPLAY_LABELS.pa, group: "india" },
  { code: "ta", label: LANGUAGE_DISPLAY_LABELS.ta, group: "india" },
  { code: "te", label: LANGUAGE_DISPLAY_LABELS.te, group: "india" },
  { code: "bn", label: LANGUAGE_DISPLAY_LABELS.bn, group: "india" },
  { code: "as", label: LANGUAGE_DISPLAY_LABELS.as, group: "northeast" },
  { code: "mni", label: LANGUAGE_DISPLAY_LABELS.mni, group: "northeast" },
  { code: "lus", label: LANGUAGE_DISPLAY_LABELS.lus, group: "northeast" },
  { code: "ne", label: LANGUAGE_DISPLAY_LABELS.ne, group: "northeast" },
  { code: "kha", label: LANGUAGE_DISPLAY_LABELS.kha, group: "northeast" },
  { code: "brx", label: LANGUAGE_DISPLAY_LABELS.brx, group: "northeast" },
];

/** Regional fallback before Hindi/English for incomplete translation sets */
const REGIONAL_FALLBACK: Partial<Record<Language, Language[]>> = {
  as: ["bn", "hi"],
  brx: ["hi"],
  mni: ["bn", "hi"],
  lus: ["hi"],
  ne: ["hi"],
  kha: ["hi"],
  bn: ["as"],
};

export function getLanguageFallbackChain(language: Language): Language[] {
  const chain: Language[] = [language];
  const regional = REGIONAL_FALLBACK[language];
  if (regional) {
    for (const code of regional) {
      if (!chain.includes(code)) chain.push(code);
    }
  }
  if (!chain.includes("hi")) chain.push("hi");
  if (!chain.includes("en")) chain.push("en");
  return chain;
}

export function resolveTranslation(
  translations: Partial<Record<Language, string>> | undefined,
  language: Language,
): string {
  if (!translations) return "";
  for (const code of getLanguageFallbackChain(language)) {
    const value = translations[code];
    if (value) return value;
  }
  return translations.en ?? "";
}

/** BCP 47 locale tags for speech recognition and synthesis */
export function mapLanguageToLocale(code: Language | string): string {
  switch (code) {
    case "mr":
      return "mr-IN";
    case "hi":
      return "hi-IN";
    case "pa":
      return "pa-IN";
    case "ta":
      return "ta-IN";
    case "te":
      return "te-IN";
    case "bn":
      return "bn-IN";
    case "as":
      return "as-IN";
    case "mni":
      return "mni-IN";
    case "lus":
      return "lus-IN";
    case "ne":
      return "ne-NP";
    case "kha":
      return "kha-IN";
    case "brx":
      return "brx-IN";
    default:
      return "en-IN";
  }
}

/** Languages that use Devanagari or related scripts for voice fallbacks */
export function usesDevanagariVoiceFallback(language: Language): boolean {
  return ["mr", "hi", "ne", "brx"].includes(language);
}

export function usesBengaliVoiceFallback(language: Language): boolean {
  return ["bn", "as", "mni"].includes(language);
}
