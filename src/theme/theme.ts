import type { TextStyle } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  primary: string;
  accent: string;
  border: string;
  textOnPrimary: string;
}

export type TypographyToken = Required<Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight'>> &
  Pick<TextStyle, 'letterSpacing'>;

export interface ThemeTypography {
  fontFamily: string;
  largeTitle: TypographyToken;
  title1: TypographyToken;
  title2: TypographyToken;
  body: TypographyToken;
  callout: TypographyToken;
  footnote: TypographyToken;
}

export interface Theme {
  colors: ThemeColors;
  spacing: {
    cozy: number;
    standard: number;
    roomy: number;
  };
  borderRadius: {
    card: number;
    pill: number;
  };
  typography: ThemeTypography;
}

const baseSpacing = {
  cozy: 8,
  standard: 16,
  roomy: 24,
};

const baseBorderRadius = {
  card: 18,
  pill: 999,
};

const baseTypography: ThemeTypography = {
  fontFamily: 'System',
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '600' },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '400', letterSpacing: 0.2 },
  callout: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
};

export const lightTheme: Theme = {
  colors: {
    background: '#F2F2F7',
    card: '#FFFFFF',
    text: '#1C1C1E',
    primary: '#007AFF',
    accent: '#FF9500',
    border: '#D1D1D6',
    textOnPrimary: '#FFFFFF',
  },
  spacing: baseSpacing,
  borderRadius: baseBorderRadius,
  typography: baseTypography,
};

export const darkTheme: Theme = {
  colors: {
    background: '#1C1C1E',
    card: '#2C2C2E',
    text: '#F2F2F7',
    primary: '#0A84FF',
    accent: '#FF9F0A',
    border: '#3A3A3C',
    textOnPrimary: '#FFFFFF',
  },
  spacing: baseSpacing,
  borderRadius: baseBorderRadius,
  typography: baseTypography,
};
