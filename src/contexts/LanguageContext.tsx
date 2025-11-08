
import React, { createContext, useState, useContext, ReactNode } from "react";

// Expanded language support for Indian languages including Marathi
type Language = "en" | "hi" | "pa" | "ta" | "te" | "bn" | "mr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (translations: Record<Language, string>) => string;
  getLanguageName: (code: Language) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language names in their native script
const languageNames: Record<Language, string> = {
  en: "English",
  hi: "हिंदी",
  pa: "ਪੰਜਾਬੀ",
  ta: "தமிழ்",
  te: "తెలుగు",
  bn: "বাংলা",
  mr: "मराठी"
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ 
  children 
}) => {
  const [language, setLanguage] = useState<Language>("mr"); // Default to Marathi

  // Updated translation function to handle multiple languages
  const t = (translations: Record<Language, string>) => {
    return translations[language] || translations.en; // Fallback to English if translation not found
  };

  // Function to get the language name from code
  const getLanguageName = (code: Language) => {
    return languageNames[code];
  };

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
