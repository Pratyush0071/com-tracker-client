import React, { createContext, useContext, useState } from 'react';

export type AppLanguage = 'en' | 'hi';

const LANG_KEY = 'commission_tracker_lang';

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  toggleLang: () => void;
  t: (en: string, hi: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === 'hi' ? 'hi' : 'en';
  });

  const setLang = (next: AppLanguage) => {
    setLangState(next);
    localStorage.setItem(LANG_KEY, next);
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'hi' : 'en');
  };

  const t = (en: string, hi: string) => (lang === 'hi' ? hi : en);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
