
import React, { createContext, useState, useContext, ReactNode } from "react";
import {
  type Language,
  type TranslationSet,
  LANGUAGE_NATIVE_NAMES,
  resolveTranslation,
} from "@/constants/languages";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (translations: Partial<Record<Language, string>> | TranslationSet | undefined) => string;
  getLanguageName: (code: Language) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("mr");

  const t = (translations: Partial<Record<Language, string>> | TranslationSet | undefined) => {
    if (!translations) {
      console.warn("[LanguageContext] Translation is undefined");
      return "";
    }
    return resolveTranslation(translations, language);
  };

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
