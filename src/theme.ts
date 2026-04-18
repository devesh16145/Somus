// Liquid OS theme — light + dark tokens, amber accent.
// Font families map to .ttf files in android/app/src/main/assets/fonts/.

export type ThemeMode = 'dark' | 'light';

interface ThemeTokens {
  name: ThemeMode;
  bg: string;
  surface: string;
  surfaceHi: string;
  surfaceLo: string;
  ink: string;
  inkDim: string;
  mute: string;
  rule: string;
  ruleStrong: string;
  accentInk: string;
  chipBg: string;
}

const LIGHT: ThemeTokens = {
  name: 'light',
  bg: '#f6f5f0',
  surface: '#ffffff',
  surfaceHi: '#fbfaf6',
  surfaceLo: '#efeee9',
  ink: '#0e110f',
  inkDim: '#3b403d',
  mute: '#7a7e7a',
  rule: 'rgba(14,17,15,0.07)',
  ruleStrong: 'rgba(14,17,15,0.14)',
  accentInk: '#8a5a00',
  chipBg: 'rgba(14,17,15,0.05)',
};

const DARK: ThemeTokens = {
  name: 'dark',
  bg: '#0a0a0c',
  surface: '#141418',
  surfaceHi: '#1c1c22',
  surfaceLo: '#0f0f12',
  ink: '#f2f2f5',
  inkDim: '#b7b7c0',
  mute: '#72727d',
  rule: 'rgba(255,255,255,0.06)',
  ruleStrong: 'rgba(255,255,255,0.12)',
  accentInk: '#FFCD5B',
  chipBg: 'rgba(255,255,255,0.06)',
};

// Amber accent — same fill in both modes, text adjusts for contrast
export const accent = {
  v: '#FFCD5B',
  glow: 'rgba(255,205,91,0.18)',
  glowStrong: 'rgba(255,205,91,0.55)',
};

export const themes: Record<ThemeMode, ThemeTokens> = { dark: DARK, light: LIGHT };

export function accentInk(mode: ThemeMode): string {
  return mode === 'dark' ? '#FFCD5B' : '#8a5a00';
}

// Typography
// Android RN does NOT synthesize bold from a single-weight TTF —
// every weight must be bundled as its own TTF and referenced by family name.
export const font = {
  ui: 'SpaceGrotesk-Medium',          // 500
  uiBold: 'SpaceGrotesk-Bold',        // 700 (also used where design says 600)
  display: 'Fraunces-Regular',        // 400 upright
  displayItalic: 'Fraunces-Italic',   // 400 italic
  mono: 'JetBrainsMono-Medium',       // 500
  monoBold: 'JetBrainsMono-Bold',     // 700
  icons: 'MaterialCommunityIcons',
} as const;

// Spacing
export const sp = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
} as const;

// Helper: hex to rgba
export function alpha(hex: string, a: number): string {
  let r = 0, g = 0, b = 0;
  if (hex.startsWith('#')) {
    const h = hex.slice(1);
    if (h.length === 3) {
      r = parseInt(h[0]+h[0], 16); g = parseInt(h[1]+h[1], 16); b = parseInt(h[2]+h[2], 16);
    } else if (h.length >= 6) {
      r = parseInt(h.slice(0,2), 16); g = parseInt(h.slice(2,4), 16); b = parseInt(h.slice(4,6), 16);
    }
  }
  return `rgba(${r},${g},${b},${a})`;
}

// ── Legacy exports for screens not yet migrated to Liquid OS ──
export const radii = { DEFAULT: 16, lg: 32, xl: 48, full: 9999 } as const;

export const colors = {
  background:               DARK.bg,
  surface:                  DARK.surface,
  surfaceBright:            DARK.surfaceHi,
  surfaceDim:               DARK.surfaceLo,
  surfaceContainerLowest:   DARK.surface,
  surfaceContainerLow:      DARK.surfaceLo,
  surfaceContainer:         DARK.surface,
  surfaceContainerHigh:     DARK.surfaceHi,
  surfaceContainerHighest:  DARK.surfaceHi,
  surfaceVariant:           DARK.rule,
  primary:                  accent.v,
  primaryDim:               '#c9a04a',
  primaryFixed:             '#FFCD5B',
  primaryFixedDim:          '#e6b84d',
  onPrimary:                '#0a0a0c',
  onPrimaryFixed:           '#4a3500',
  onPrimaryFixedVariant:    '#8a5a00',
  primaryContainer:         '#3a2800',
  onPrimaryContainer:       '#FFCD5B',
  inversePrimary:           '#FFCD5B',
  secondary:                '#b7b7c0',
  secondaryDim:             '#72727d',
  secondaryFixed:           '#2a2a32',
  secondaryFixedDim:        '#1c1c22',
  onSecondary:              '#f2f2f5',
  onSecondaryFixed:         '#b7b7c0',
  onSecondaryFixedVariant:  '#72727d',
  secondaryContainer:       '#1c1c22',
  onSecondaryContainer:    '#b7b7c0',
  tertiary:                 '#FFCD5B',
  tertiaryDim:              '#c9a04a',
  tertiaryFixed:            '#FFCD5B',
  tertiaryFixedDim:         '#e6b84d',
  onTertiary:               '#0a0a0c',
  onTertiaryFixed:          '#4a3500',
  onTertiaryFixedVariant:   '#8a5a00',
  tertiaryContainer:        '#3a2800',
  onTertiaryContainer:     '#FFCD5B',
  error:                    '#FF8FA8',
  errorDim:                 '#cc5c73',
  errorContainer:           '#3a1520',
  onError:                  '#0a0a0c',
  onErrorContainer:        '#FF8FA8',
  onBackground:             DARK.ink,
  onSurface:                DARK.ink,
  onSurfaceVariant:         DARK.inkDim,
  inverseSurface:           DARK.ink,
  inverseOnSurface:         DARK.bg,
  outline:                  DARK.mute,
  outlineVariant:           DARK.ruleStrong,
  surfaceTint:              accent.v,
  white:                    '#ffffff',
  white10:                  'rgba(255,255,255,0.10)',
  white20:                  'rgba(255,255,255,0.20)',
  white30:                  'rgba(255,255,255,0.30)',
  transparent:              'transparent',
} as const;
