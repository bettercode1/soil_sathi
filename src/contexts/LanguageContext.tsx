
import React, { createContext, useState, useContext, ReactNode, useCallback } from "react";
import {
  type Language,
  type TranslationSet,
  LANGUAGE_NATIVE_NAMES,
  resolveTranslation,
  ALL_LANGUAGES,
} from "@/constants/languages";
import { expandTranslationSet } from "@/utils/expandTranslations";

const LANGUAGE_STORAGE_KEY = "soilsathi-language";

const readStoredLanguage = (): Language => {
  if (typeof window === "undefined") return "mr";
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && (ALL_LANGUAGES as readonly string[]).includes(stored)) {
    return stored as Language;
  }
  return "mr";
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (translations: Partial<Record<Language, string>> | TranslationSet | undefined) => string;
  getLanguageName: (code: Language) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  }, []);

  const t = useCallback(
    (translations: Partial<Record<Language, string>> | TranslationSet | undefined) => {
      if (!translations) {
        console.warn("[LanguageContext] Translation is undefined");
        return "";
      }
      return resolveTranslation(expandTranslationSet(translations), language);
    },
    [language],
  );

  const getLanguageName = (code: Language) => LANGUAGE_NATIVE_NAMES[code];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getLanguageName }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export type { Language };
