// Material 3 light theme — exact tokens from the HTML mock.
// Font families map to .ttf files in android/app/src/main/assets/fonts/.

// ── Colour tokens ─────────────────────────────────────────────
export const colors = {
  // Surfaces
  background:               '#fcf8ff',
  surface:                  '#fcf8ff',
  surfaceBright:            '#fcf8ff',
  surfaceDim:               '#dad6ff',
  surfaceContainerLowest:   '#ffffff',
  surfaceContainerLow:      '#f6f2ff',
  surfaceContainer:         '#f0ebff',
  surfaceContainerHigh:     '#e9e5ff',
  surfaceContainerHighest:  '#e3dfff',
  surfaceVariant:           '#e3dfff',

  // Primary
  primary:                  '#4456ba',
  primaryDim:               '#3749ad',
  primaryFixed:             '#b3bdff',
  primaryFixedDim:          '#a1aeff',
  onPrimary:                '#faf8ff',
  onPrimaryFixed:           '#00187b',
  onPrimaryFixedVariant:    '#273a9f',
  primaryContainer:         '#b3bdff',
  onPrimaryContainer:       '#1c3096',
  inversePrimary:           '#8596ff',

  // Secondary
  secondary:                '#5a6339',
  secondaryDim:             '#4e572f',
  secondaryFixed:           '#ebf6c1',
  secondaryFixedDim:        '#dde8b3',
  onSecondary:              '#f4fec8',
  onSecondaryFixed:         '#434c25',
  onSecondaryFixedVariant:  '#5f693e',
  secondaryContainer:       '#ebf6c1',
  onSecondaryContainer:     '#555e35',

  // Tertiary
  tertiary:                 '#596500',
  tertiaryDim:              '#4e5800',
  tertiaryFixed:            '#ecfd88',
  tertiaryFixedDim:         '#deef7c',
  onTertiary:               '#f6ffb8',
  onTertiaryFixed:          '#454e00',
  onTertiaryFixedVariant:   '#5f6c00',
  tertiaryContainer:        '#ecfd88',
  onTertiaryContainer:      '#566100',

  // Error
  error:                    '#ac3149',
  errorDim:                 '#770326',
  errorContainer:           '#f76a80',
  onError:                  '#fff7f7',
  onErrorContainer:         '#68001f',

  // On-surfaces
  onBackground:             '#302e56',
  onSurface:                '#302e56',
  onSurfaceVariant:         '#5d5a86',
  inverseSurface:           '#0d0c20',
  inverseOnSurface:         '#9d9ab5',

  // Outlines
  outline:                  '#7976a3',
  outlineVariant:           '#b1addd',

  // Tint
  surfaceTint:              '#4456ba',

  // Utility
  white:                    '#ffffff',
  white10:                  'rgba(255,255,255,0.10)',
  white20:                  'rgba(255,255,255,0.20)',
  white30:                  'rgba(255,255,255,0.30)',
  transparent:              'transparent',
} as const;

// ── Border radii ──────────────────────────────────────────────
export const radii = {
  DEFAULT: 16, // 1rem
  lg: 32,      // 2rem
  xl: 48,      // 3rem
  full: 9999,
} as const;

// ── Typography ────────────────────────────────────────────────
// Manrope = headline / display; Inter = body / label
export const font = {
  headline: 'Manrope-Bold',
  body:     'Inter-Regular',
  label:    'Inter-Regular',
  icons:    'MaterialCommunityIcons',
} as const;

// ── Spacing scale (4 px base) ─────────────────────────────────
export const sp = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl:32,
} as const;

// ── Opacity helper ────────────────────────────────────────────
export const alpha = (hex: string, a: number): string => {
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
};
