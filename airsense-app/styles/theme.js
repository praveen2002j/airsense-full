import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const shared = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    pill: 999,
  },
};

export const lightTheme = {
  ...shared,
  colors: {
    background: '#F4F7FB',
    backgroundAlt: '#E9F0F7',
    surface: '#FFFFFF',
    surfaceAlt: '#F3F8FC',
    card: '#FFFFFF',
    cardMuted: '#F7FAFD',
    elevated: '#FFFFFF',
    textPrimary: '#172635',
    textSecondary: '#526A7F',
    textMuted: '#8699AC',
    divider: '#D7E3EE',
    blue: '#1877C9',
    blueDeep: '#115B9A',
    cyan: '#179C96',
    red: '#D95C4F',
    yellow: '#C8921C',
    green: '#2F9D79',
    purple: '#5F6EEA',
    white: '#FFFFFF',
    overlay: 'rgba(23, 38, 53, 0.28)',
  },
  shadows: {
    card: {
      shadowColor: '#8DA7BF',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
    soft: {
      shadowColor: '#8DA7BF',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 14,
      elevation: 4,
    },
  },
};

export const darkTheme = {
  ...shared,
  colors: {
    background: '#07111F',
    backgroundAlt: '#0D1B2A',
    surface: '#102338',
    surfaceAlt: '#183451',
    card: '#132B43',
    cardMuted: '#0E2032',
    elevated: '#183551',
    textPrimary: '#F4F8FC',
    textSecondary: '#A8B7C7',
    textMuted: '#7C92A9',
    divider: '#23415D',
    blue: '#5BB6FF',
    blueDeep: '#1D7FCD',
    cyan: '#66E1D9',
    red: '#E86B5A',
    yellow: '#D9A441',
    green: '#43D39E',
    purple: '#7D8CFF',
    white: '#FFFFFF',
    overlay: 'rgba(4, 10, 18, 0.72)',
  },
  shadows: {
    card: {
      shadowColor: '#02060C',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.24,
      shadowRadius: 18,
      elevation: 8,
    },
    soft: {
      shadowColor: '#02060C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
      elevation: 4,
    },
  },
};

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = 'airsense-theme-mode';

const readStoredTheme = () => {
  if (typeof globalThis === 'undefined' || !globalThis.localStorage) return false;
  try {
    return globalThis.localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
  } catch {
    return false;
  }
};

export function AppThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(readStoredTheme);

  useEffect(() => {
    if (typeof globalThis === 'undefined' || !globalThis.localStorage) return;
    try {
      globalThis.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {}
  }, [isDark]);

  const value = useMemo(() => ({
    isDark,
    theme: isDark ? darkTheme : lightTheme,
    toggleTheme: () => setIsDark((prev) => !prev),
  }), [isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return context;
}

export const theme = lightTheme;
