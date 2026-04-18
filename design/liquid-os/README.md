# Liquid OS — Design Mockups

Interactive HTML mockups for the **Liquid OS** visual direction for Somus.

## What's in here

```
design/liquid-os/
├── index.html              ← open this in a browser
├── design-canvas.jsx       ← pan/zoom canvas shell
├── data.jsx                ← sample transactions, metrics, fmtCcy()
├── icons.jsx               ← inline SVG icon set + CAT_ICON map
├── liquid-theme.jsx        ← light + dark tokens, accent system, contrast-safe inkOn
├── liquid-dashboard.jsx    ← Dashboard + 3 hero variants (Editorial / Blob / Bubbles)
└── liquid-screens.jsx      ← Onboarding, Transactions, Detail, Settings
```

## How to view

Just open `design/liquid-os/index.html` in any modern browser — no build step, no install.
The page uses CDN React + Babel; everything runs from the file system.

To preview from the repo root:

```bash
open design/liquid-os/index.html
# or
python3 -m http.server 8000
# then visit http://localhost:8000/design/liquid-os/
```

## What it contains

5 screens in a Pixel-style frame, swappable via the **Tweaks** panel (bottom-right):

- **Onboarding** — model-download moment (lfm2-1.2b spec card, progress)
- **Dashboard** — month spend, category ledger, recent activity
- **Transactions** — grouped by day, filterable, multi-currency
- **Transaction Detail** — confidence pill, metadata, original SMS
- **Settings** — import controls, AI model status, privacy

Plus three **Dashboard hero variants** to compare:

- `editorial` — Fraunces serif moment for the big sum
- `blob` — original gradient hero card
- `bubbles` — big sum + horizontal category orbs

And four interchangeable accents (`green`, `lilac`, `amber`, `coral`) — each with theme-aware text color so light mode stays WCAG-legible.

## Status

Visual exploration only — these are not production components. The next step is porting Dashboard into `screens/Dashboard.tsx` as React Native, using `theme.ts` updated with the Liquid OS tokens.

## Open questions

- Light mode hero — does *Editorial* hold up, or does it want more presence?
- Should the green accent shift hue slightly in light mode (cooler / more saturated), or stay identical for brand consistency?
- Empty states, SMS-permission flow, and the edit-category bottom sheet are still missing.
