# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Somus is a privacy-first, on-device financial transaction tracker built with React Native 0.76.5 (New Architecture/Fabric enabled) targeting Android. It reads bank SMS messages and classifies them using an on-device AI model (LEAP SDK) — no data ever leaves the device except for a one-time model download.

## Build & Development Commands

```bash
# Install JS dependencies
npm install

# Start Metro bundler (Terminal 1)
npx react-native start

# Build & deploy debug APK (Terminal 2, device connected via USB)
npx react-native run-android

# Build debug APK only (no deploy)
cd android && ./gradlew assembleDebug

# Build release APK
cd android && ./gradlew assembleRelease

# Lint
npm run lint
```

**Requirements**: Android SDK 36, NDK 27.x, Java 17, Node 18+, Android device API 31+ (Android 12+).

## Architecture

### Two-Layer Native Bridge

The app has two custom Kotlin native modules exposed to React Native via the bridge:

- **SmsModule** (`android/.../sms/SmsModule.kt` ↔ `src/modules/SmsModule.ts`) — Reads SMS inbox via Android ContentResolver. Methods: `fetchPeriod`, `fetchSince`, `countInPeriod`, `hasPermission`. Emits `SmsProgress` and `SmsBatch` events.

- **LeapModule** (`android/.../leap/LeapAll.kt` ↔ `src/modules/LeapModule.ts`) — Controls LEAP AI model lifecycle: download, load, single/batch inference, unload. Emits `LeapModelProgress`, `LeapBatchProgress` events.

Both modules are registered via `SmsPackage` and `LeapPackage` in `MainApplication.kt`.

### Data Flow

1. **SMS fetched** (SmsModule) → **batched in groups of 50** (SmsOrchestrator) → **AI inference** (LeapModule) → **stored in SQLite** (TransactionRepository) → **Zustand store updated** → UI re-renders.
2. **Pending SMS path**: On dashboard, user taps "Run" → `SmsOrchestrator.syncPending()` fetches all unprocessed SMS → runs inference → stores results → updates UI. No live SMS detection — user-triggered only.

### State Management

Single Zustand store (`src/store/index.ts`) holds transactions array, model status, download/sync progress, `pendingCount`, `syncProgress`, and `themeMode` (`'dark' | 'light'`). All screens subscribe to relevant slices.

### Navigation

Root stack: `Onboarding` → `Main` (tabs) | `TransactionDetail` (modal). Tabs: Dashboard, Transactions, Settings. Navigation types in `src/App.tsx`.

### Database

SQLite via `react-native-quick-sqlite`. Schema in `src/database/Database.ts`. Key table: `transactions` (deduped by `sms_id`), plus `sync_state` for tracking last sync timestamp. Repository pattern in `TransactionRepository.ts`.

### LEAP AI Integration

- SDK: `ai.liquid.leap:leap-sdk:0.9.7` from `https://maven.liquid.ai/repository/maven-public/`
- Model: LFM2-1.2B, ~700MB download, ~5GB RAM at inference
- Structured output via `@Generatable` annotation on `TransactionSchema` data class
- `BankFormatRegistry` provides sender-to-bank hints (40+ banks across 15 countries) to improve classification

### Liquid OS Design System

- **Design source**: `design/liquid-os/` — interactive HTML mockups (open `index.html` in browser). Uses CDN React + Babel, no build step.
- **Theme tokens** (`src/theme.ts`): Light (`#f6f5f0` bg) and Dark (`#0a0a0c` bg) theme objects in `themes` record. Amber accent (`#FFCD5B`) with `accentInk(mode)` for contrast-safe text. Surfaces: `surface`, `surfaceHi`, `surfaceLo`. Ink: `ink`, `inkDim`, `mute`. Rules: `rule`, `ruleStrong`. Chips: `chipBg`.
- **Fonts** bundled in `android/app/src/main/assets/fonts/`:
  - `SpaceGrotesk-Medium.ttf` — UI text (labels, buttons, section titles)
  - `Fraunces-Regular.ttf` — Display/hero amounts (variable font, variable axes)
  - `JetBrainsMono-Medium.ttf` — Monospace (numbers, metadata, category amounts)
  - `Inter-Regular.ttf` — Legacy body text (unused by Liquid OS screens)
  - `Manrope-Bold.ttf` — Legacy headlines (unused by Liquid OS screens)
  - Linked via `react-native.config.js` → `./android/app/src/main/assets/fonts/`
- **Custom SVG icons** (`src/components/LiquidIcons.tsx`): Line icons matching the design spec (24x24 viewBox, 1.6px strokes). Includes `CAT_ICON` map for category-to-icon lookup.
- **Legacy exports**: `theme.ts` also exports a static `colors` object and `radii` for screens not yet migrated to Liquid OS (Onboarding, Transactions, Settings, App.tsx tab bar).

### Dashboard (Liquid OS — Editorial Hero)

The dashboard (`src/screens/DashboardScreen.tsx`) follows the Liquid OS design with:

1. **Top bar**: "somus" branding with amber dot logo + version label, offline chip, theme toggle button (sun/moon).
2. **Editorial hero**: Fraunces serif large spend amount (72sp), month label, "live" indicator, budget progress bar with amber accent, days remaining.
3. **Pending banner**: Surface card with chip icon, pending count, amber "Run →" button.
4. **Numbered category ledger**: Top 5 categories with sequential numbering (01, 02...), progress bars, amounts in mono font, percentages.
5. **Recent transactions strip**: Surface card, last 3 transactions with category icons, merchant name, amount (credits in accent color).
6. **Theme toggle**: Toggles between dark and light themes via Zustand `themeMode` state. All colors resolved dynamically from `themes[themeMode]`.

### InsightsChart Component

`src/components/InsightsChart.tsx` — Animated bar chart showing 6-month spending vs income trends. Uses `requestAnimationFrame` + React state for animations (not `Animated.createAnimatedComponent` which crashes with react-native-svg). Currently not rendered on the dashboard (was replaced by the Liquid OS ledger design) but still available.

## Key Patterns & Gotchas

- **Concatenated Kotlin files**: `LeapAll.kt` and `SmsSupport.kt` each contain multiple classes in a single file. They must have only ONE `package` declaration at the top — do not add duplicate package statements when editing.
- **Kotlin version**: Must match or exceed the version pulled transitively by LEAP SDK. The LEAP SDK BOM pins `kotlin-stdlib` to a specific version; the Kotlin compiler plugin in `android/build.gradle.kts` must be compatible. Currently uses `resolutionStrategy.force` in `app/build.gradle.kts` to align stdlib version.
- **`react-native-quick-sqlite`** uses legacy `apply plugin: 'com.facebook.react'` — requires both `pluginManagement { includeBuild(...) }` AND a root-level `includeBuild(...)` in `settings.gradle.kts`, plus the RN gradle plugin on the buildscript classpath.
- **`rootProject.ext` properties** (`ndkVersion`, `compileSdkVersion`, `minSdkVersion`, `targetSdkVersion`, `kotlinVersion`) in root `build.gradle.kts` are consumed by autolinked library build scripts.
- **SMS ContentProvider** does not support `COUNT(*)` as a projection column — use `cursor.count` instead.
- **Manifest merger**: WorkManager's `InitializationProvider` requires `tools:replace="android:value"` to avoid merge conflicts.
- **compileSdk 36** is required by transitive `androidx.core:core:1.17.0` strict version constraint, which also requires AGP 8.9.1+.
- **Live SMS removed**: The `SmsReceiver` BroadcastReceiver and `SmsForegroundService` have been removed. SMS processing is user-triggered only via the dashboard "Run" button.
- **SmsOrchestrator refactored**: Inference loop extracted into standalone `runInference()`. New methods: `getPendingCount()`, `syncPending()` for user-triggered processing.
- **TransactionRepository**: New `getTotalSpentByCategory(start, end)`, `getMonthlyTotals(6)`, `getAllTimeTotals()`, `getLatestByCategory()`, `deleteMultiple()`, `deleteAll()`.
- **react-native-reanimated incompatible**: v3.x has C++ compilation errors with NDK 27.x (`-Wdeprecated-this-capture`). Do NOT attempt to install it — use `Animated` API or `requestAnimationFrame` instead for animations.
- **Animated.createAnimatedComponent with SVG**: `Animated.createAnimatedComponent(Rect)` from react-native-svg crashes at runtime. Use plain state-driven animation with `requestAnimationFrame` for SVG chart animations.

## Android Permissions

READ_SMS (inbox access), INTERNET (model download only), POST_NOTIFICATIONS + FOREGROUND_SERVICE + FOREGROUND_SERVICE_DATA_SYNC (model downloader), WAKE_LOCK (inference). RECEIVE_SMS removed — no live SMS detection.

## GitHub Repository

Remote: `https://github.com/devesh16145/Somus` (pushed to `main` branch).
