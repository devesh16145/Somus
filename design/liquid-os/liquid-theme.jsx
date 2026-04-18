// Liquid OS — design tokens for light + dark, shared accent system.
// Built around a single liquid-green brand color that stays vivid in both modes.

const LIQUID_THEMES = {
  dark: {
    name: 'dark',
    bg: '#0a0a0c',
    bgGlow: 'radial-gradient(720px circle at 18% -5%, var(--accent-glow), transparent 55%)',
    surface: '#141418',
    surfaceHi: '#1c1c22',
    surfaceLo: '#0f0f12',
    ink: '#f2f2f5',
    inkDim: '#b7b7c0',
    mute: '#72727d',
    rule: 'rgba(255,255,255,0.06)',
    ruleStrong: 'rgba(255,255,255,0.12)',
    accentInk: '#051911',          // text on accent fill
    chipBg: 'rgba(255,255,255,0.06)',
    statusInk: '#fff',
  },
  light: {
    name: 'light',
    // warm off-white, NOT pure white — sits well next to the green
    bg: '#f6f5f0',
    bgGlow: 'radial-gradient(720px circle at 18% -5%, var(--accent-glow-light), transparent 55%)',
    surface: '#ffffff',
    surfaceHi: '#fbfaf6',
    surfaceLo: '#efeee9',
    ink: '#0e110f',
    inkDim: '#3b403d',
    mute: '#7a7e7a',
    rule: 'rgba(14,17,15,0.07)',
    ruleStrong: 'rgba(14,17,15,0.14)',
    accentInk: '#051911',
    chipBg: 'rgba(14,17,15,0.05)',
    statusInk: '#0e110f',
  },
};

// Accent options.
//   v       — the brand color (used for FILLS, glows, dark-mode text). Stays vivid in both modes.
//   inkOn   — readable text color per theme. Same hue, but pushed darker for light mode (≥ 4.5:1 vs bg).
const LIQUID_ACCENTS = [
  { id: 'green',  v: '#7DFF9E',
    inkOn: { dark: '#7DFF9E', light: '#0c6b3a' },   // deep emerald
    glow:  'rgba(125,255,158,0.18)', glowL: 'rgba(125,255,158,0.35)' },
  { id: 'lilac',  v: '#B69CFF',
    inkOn: { dark: '#B69CFF', light: '#5a3edb' },   // deep iris
    glow:  'rgba(182,156,255,0.20)', glowL: 'rgba(182,156,255,0.35)' },
  { id: 'amber',  v: '#FFCD5B',
    inkOn: { dark: '#FFCD5B', light: '#8a5a00' },   // burnt amber
    glow:  'rgba(255,205,91,0.18)',  glowL: 'rgba(255,205,91,0.35)' },
  { id: 'coral',  v: '#FF8FA8',
    inkOn: { dark: '#FF8FA8', light: '#b8275a' },   // deep rose
    glow:  'rgba(255,143,168,0.18)', glowL: 'rgba(255,143,168,0.35)' },
];

// Helper to inject CSS vars onto a wrapper element so glows resolve correctly.
// Pass theme name so accent-text resolves to the legible variant.
function liquidVars(accent, themeName = 'dark') {
  return {
    '--accent': accent.v,
    '--accent-ink': accent.inkOn[themeName],   // accent color safe to use as TEXT
    '--accent-glow': accent.glow,
    '--accent-glow-light': accent.glowL,
  };
}

Object.assign(window, { LIQUID_THEMES, LIQUID_ACCENTS, liquidVars });
