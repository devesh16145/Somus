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

- **LeapModule** (`android/.../leap/LeapAll.kt` ↔ `src/modules/LeapModule.ts`) — Controls LEAP AI model lifecycle: download, load, single/batch inference, unload. Emits `LeapModelProgress`, `LeapBatchProgress`, `LeapLiveTransaction` events.

Both modules are registered via `SmsPackage` and `LeapPackage` in `MainApplication.kt`.

### Data Flow

1. **SMS fetched** (SmsModule) → **batched in groups of 50** (SmsOrchestrator) → **AI inference** (LeapModule) → **stored in SQLite** (TransactionRepository) → **Zustand store updated** → UI re-renders.
2. **Live SMS path**: `SmsReceiver` (BroadcastReceiver) detects financial keywords → `SmsForegroundService` runs single inference → emits `LeapLiveTransaction` event → app stores & prepends to UI.

### State Management

Single Zustand store (`src/store/index.ts`) holds transactions array, model status, download/sync progress. All screens subscribe to relevant slices.

### Navigation

Root stack: `Onboarding` → `Main` (tabs) | `TransactionDetail` (modal). Tabs: Dashboard, Transactions, Settings. Navigation types in `src/App.tsx`.

### Database

SQLite via `react-native-quick-sqlite`. Schema in `src/database/Database.ts`. Key table: `transactions` (deduped by `sms_id`), plus `sync_state` for tracking last sync timestamp. Repository pattern in `TransactionRepository.ts`.

### LEAP AI Integration

- SDK: `ai.liquid.leap:leap-sdk:0.9.7` from `https://maven.liquid.ai/repository/maven-public/`
- Model: LFM2-1.2B, ~700MB download, ~5GB RAM at inference
- Structured output via `@Generatable` annotation on `TransactionSchema` data class
- `BankFormatRegistry` provides sender-to-bank hints (40+ banks across 15 countries) to improve classification

## Key Patterns & Gotchas

- **Concatenated Kotlin files**: `LeapAll.kt` and `SmsSupport.kt` each contain multiple classes in a single file. They must have only ONE `package` declaration at the top — do not add duplicate package statements when editing.
- **Kotlin version**: Must match or exceed the version pulled transitively by LEAP SDK. The LEAP SDK BOM pins `kotlin-stdlib` to a specific version; the Kotlin compiler plugin in `android/build.gradle.kts` must be compatible. Currently uses `resolutionStrategy.force` in `app/build.gradle.kts` to align stdlib version.
- **`react-native-quick-sqlite`** uses legacy `apply plugin: 'com.facebook.react'` — requires both `pluginManagement { includeBuild(...) }` AND a root-level `includeBuild(...)` in `settings.gradle.kts`, plus the RN gradle plugin on the buildscript classpath.
- **`rootProject.ext` properties** (`ndkVersion`, `compileSdkVersion`, `minSdkVersion`, `targetSdkVersion`, `kotlinVersion`) in root `build.gradle.kts` are consumed by autolinked library build scripts.
- **SMS ContentProvider** does not support `COUNT(*)` as a projection column — use `cursor.count` instead.
- **Manifest merger**: WorkManager's `InitializationProvider` requires `tools:replace="android:value"` to avoid merge conflicts.
- **compileSdk 36** is required by transitive `androidx.core:core:1.17.0` strict version constraint, which also requires AGP 8.9.1+.

## Android Permissions

READ_SMS, RECEIVE_SMS (inbox access + live detection), INTERNET (model download only), POST_NOTIFICATIONS + FOREGROUND_SERVICE + FOREGROUND_SERVICE_DATA_SYNC (model downloader & live SMS processing), WAKE_LOCK (inference).
