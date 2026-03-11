import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ko' | 'en';

interface ThemeContextType {
  isDarkMode: boolean;
  language: Language;
  toggleDarkMode: () => void;
  toggleLanguage: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jejuremaker_theme') === 'dark';
    }
    return false;
  });

  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('jejuremaker_language') as Language) || 'ko';
    }
    return 'ko';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jejuremaker_theme', isDarkMode ? 'dark' : 'light');
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jejuremaker_language', language);
    }
  }, [language]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const toggleLanguage = () => setLanguage(prev => prev === 'ko' ? 'en' : 'ko');

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      language,
      toggleDarkMode,
      toggleLanguage
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
