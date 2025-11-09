import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadThemeMode, persistThemeMode } from '../utils/helpers/storage';
import { darkTheme, lightTheme, Theme, ThemeMode } from './theme';

export interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    let isMounted = true;
    loadThemeMode().then((stored) => {
      if (isMounted && stored) {
        setMode(stored);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const nextMode = prev === 'light' ? 'dark' : 'light';
      persistThemeMode(nextMode);
      return nextMode;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
