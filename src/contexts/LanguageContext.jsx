import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import de from '../locales/de.json';

const translations = { en, de };

const LanguageContext = createContext();

export const LanguageProvider = ({ children, initialLanguage = 'en' }) => {
  const [language, setLanguage] = useState(initialLanguage);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return value || key;
  };

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('preferredLanguage', lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

