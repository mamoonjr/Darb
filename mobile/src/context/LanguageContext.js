import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import i18n from '../i18n';

const LANGUAGE_KEY = 'darb_language';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(i18n.language || 'ar');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(LANGUAGE_KEY);
        if (saved === 'ar' || saved === 'en') {
          await i18n.changeLanguage(saved);
          setLanguageState(saved);
        }
      } catch {
        // Keep default Arabic.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setLanguage = useCallback(async (lang) => {
    if (lang !== 'ar' && lang !== 'en') return;
    await i18n.changeLanguage(lang);
    setLanguageState(lang);
    try {
      await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
    } catch {
      // Preference not persisted; language still switches for this session.
    }
  }, []);

  const isRTL = language === 'ar';

  const layout = useMemo(
    () => ({
      language,
      isRTL,
      textAlign: isRTL ? 'right' : 'left',
      alignEnd: isRTL ? 'flex-end' : 'flex-start',
      alignStart: isRTL ? 'flex-start' : 'flex-end',
      direction: isRTL ? 'rtl' : 'ltr',
      row: { flexDirection: isRTL ? 'row-reverse' : 'row' },
    }),
    [language, isRTL]
  );

  const value = useMemo(
    () => ({
      ...layout,
      ready,
      setLanguage,
    }),
    [layout, ready, setLanguage]
  );

  if (!ready) return null;

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
