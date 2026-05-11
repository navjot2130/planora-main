import React, { createContext, useEffect, useMemo, useState } from 'react';

export const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {}
});

const STORAGE_KEY = 'planora_theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
      const next = prefersDark ? 'dark' : 'light';
      setTheme(next);
      document.documentElement.setAttribute('data-theme', next);
    }
  }, []);

  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

