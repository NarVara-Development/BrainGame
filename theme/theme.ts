// ============================================================
// NarVara BrainGame — BRUTALIST design system
// Hard edges, thick black borders, offset solid shadows,
// oversized uppercase type, vivid clashing accent blocks.
// ============================================================
import { Platform, TextStyle, ViewStyle } from 'react-native';

export const COLORS = {
  ink: '#0a0a0a', // near-black border/text
  paper: '#f5f1e8', // warm off-white background
  paperDark: '#11100c',
  white: '#ffffff',

  // Vivid brutalist accent palette
  yellow: '#ffd400',
  pink: '#ff5da2',
  blue: '#3b5bff',
  green: '#15d36a',
  orange: '#ff6b00',
  purple: '#8b5cf6',
  cyan: '#16e0e0',
  red: '#ff2e2e',

  // per-game accents
  logic: '#8b5cf6',
  math: '#ffd400',
  word: '#15d36a',
  crossword: '#ff5da2',
  memory: '#3b5bff',
  tap: '#ef4444',
  truefalse: '#a855f7',
  slide: '#0d9488',
  odd: '#d97706',
  simon: '#db2777',

  muted: '#6b6b6b',
};

export const ACCENTS = [
  COLORS.yellow,
  COLORS.pink,
  COLORS.blue,
  COLORS.green,
  COLORS.orange,
  COLORS.purple,
  COLORS.cyan,
];

export const BORDER = 3; // default thick border
export const BORDER_BOLD = 5;
export const RADIUS = 0; // brutalist = sharp corners

export const SPACE = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 36,
  xxl: 56,
};

export const FONT = {
  // System heavy fonts; swap for a custom display font (e.g. "Archivo Black") once loaded.
  display: Platform.select({ ios: 'Arial-BoldMT', android: 'sans-serif-black', default: 'System' }),
  body: Platform.select({ ios: 'Arial', android: 'sans-serif', default: 'System' }),
};

/** Hard offset shadow — the signature brutalist drop. */
export function hardShadow(offset = 6, color = COLORS.ink): ViewStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: offset, height: offset },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: offset, // Android approximation
  };
}

export const box: ViewStyle = {
  borderWidth: BORDER,
  borderColor: COLORS.ink,
  borderRadius: RADIUS,
  backgroundColor: COLORS.white,
};

export const boxBold: ViewStyle = {
  borderWidth: BORDER_BOLD,
  borderColor: COLORS.ink,
  borderRadius: RADIUS,
  backgroundColor: COLORS.white,
  ...hardShadow(8),
};

export const heading: TextStyle = {
  fontFamily: FONT.display,
  fontWeight: '900',
  color: COLORS.ink,
  textTransform: 'uppercase',
  letterSpacing: 1,
};

export const bodyText: TextStyle = {
  fontFamily: FONT.body,
  color: COLORS.ink,
  fontSize: 15,
};

export const TYPE = {
  hero: { ...heading, fontSize: 44, lineHeight: 46 } as TextStyle,
  h1: { ...heading, fontSize: 32, lineHeight: 34 } as TextStyle,
  h2: { ...heading, fontSize: 24 } as TextStyle,
  h3: { ...heading, fontSize: 18 } as TextStyle,
  label: { ...heading, fontSize: 13, letterSpacing: 1.5 } as TextStyle,
  body: bodyText,
  bodyBold: { ...bodyText, fontWeight: '700' } as TextStyle,
};
