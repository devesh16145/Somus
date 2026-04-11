# Somus

**Privacy-first, on-device financial transaction tracker for Android.**

Somus reads your bank SMS messages and automatically extracts structured transaction data — amount, merchant, category, debit/credit — using a finetuned 1.2B-parameter language model that runs **entirely on your phone**. No data ever leaves your device except a one-time model download.

Built with React Native 0.76 (New Architecture) and the [LEAP SDK](https://leap.liquid.ai/) from Liquid AI.

---

## Why

Every existing expense tracker wants you to hand over read access to your SMS inbox — or worse, your bank credentials — so they can parse transactions on their servers. Somus does the parsing locally, on-device, with a model small enough to run on a phone but capable enough to handle messy real-world SMS formats from dozens of banks.

- **No cloud.** SMS never leaves the device.
- **No accounts.** No signup, no login, no telemetry.
- **No regex brittleness.** Finetuned LLM generalizes across bank formats.
- **Offline-first.** Works with airplane mode after the model is downloaded.

## Features

- Reads SMS inbox and processes messages through the on-device model
- Live transaction detection — new bank SMS arrives → foreground service runs inference → transaction appears in UI within ~1 minute
- SQLite storage with deduplication by SMS ID
- Dashboard, transaction list, and per-transaction detail screens
- Supports 40+ banks across 15 countries via sender-format hints

## Architecture

### Tech stack
- **React Native 0.76.5** with Fabric / New Architecture enabled
- **Kotlin** native modules for SMS inbox access and LEAP model control
- **SQLite** via `react-native-quick-sqlite`
- **Zustand** for state, **React Navigation** for routing
- **LEAP SDK 0.9.7** for on-device LLM inference

### On-device model
- **Base:** LFM2.5-1.2B-Instruct
- **Finetune:** [`9eve5h/somus-lfm-1.2b-sms`](https://huggingface.co/9eve5h/somus-lfm-1.2b-sms) on Hugging Face
- **Quantization:** Q4_K_M GGUF (~700 MB download, ~5 GB RAM at inference)
- **Output:** structured JSON via `@Generatable` schema constraint
- **Inference:** ~60–90s per SMS on a Pixel 9 (single-threaded CPU)

### Data flow
```
Bank SMS
   │
   ├── historical: SmsModule.fetchPeriod ──┐
   │                                        ▼
   └── live:      SmsReceiver ──▶ ForegroundService
                                           │
                                           ▼
                                   LeapModule.processSms
                                           │
                                           ▼
                                   Structured transaction
                                           │
                                           ▼
                                  SQLite (dedup on sms_id)
                                           │
                                           ▼
                                    Zustand store → UI
```

### Native bridges
- **`SmsModule`** (`android/.../sms/SmsModule.kt` ↔ `src/modules/SmsModule.ts`) — ContentResolver-based SMS inbox reader. Emits `SmsProgress` and `SmsBatch` events.
- **`LeapModule`** (`android/.../leap/LeapAll.kt` ↔ `src/modules/LeapModule.ts`) — Downloads and loads the model, runs inference, emits `LeapModelProgress` / `LeapLiveTransaction` events.

## Build & run

### Requirements
- Android SDK 36, NDK 27.x
- Java 17
- Node 18+
- A physical Android device on API 31+ (Android 12+). An emulator works but inference will be too slow to be useful.

### First-time setup
```bash
npm install
cp android/local.properties.template android/local.properties
# edit local.properties to point to your Android SDK
```

### Development
```bash
# Terminal 1: Metro bundler
npx react-native start

# Terminal 2: build + install debug APK on connected device
npx react-native run-android
```

### Release build
```bash
cd android
./gradlew assembleRelease
```

## Android permissions

| Permission | Purpose |
|---|---|
| `READ_SMS` | Read historical messages from the inbox |
| `RECEIVE_SMS` | Detect newly arriving bank SMS |
| `INTERNET` | One-time model download from Hugging Face |
| `POST_NOTIFICATIONS` | Model download and live processing notifications |
| `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_DATA_SYNC` | Run model download and live inference in a foreground service |
| `WAKE_LOCK` | Prevent sleep during inference |

## Repository layout

```
src/
  App.tsx                # Root navigator
  modules/               # Native module TS bindings (LeapModule, SmsModule)
  services/              # SmsOrchestrator — batching + pipeline glue
  screens/               # Onboarding, Dashboard, Transactions, Settings, Detail
  store/                 # Zustand store
  database/              # SQLite schema + TransactionRepository
  types/                 # Shared TS types

android/app/src/main/java/com/somus/app/
  MainActivity.kt
  MainApplication.kt
  sms/                   # SmsModule + SmsReceiver + SmsForegroundService
  leap/                  # LeapModule, LeapService, BankFormatRegistry

# Finetune pipeline (not part of the app build)
auto_labeler.py             # Heuristic pre-labeling of raw SMS
labeling_tool.html          # Manual review UI
filter_and_anonymize.py     # PII scrubbing
generate_synthetic_sms.py   # Synthetic training data
generate_more_edge_cases.py
rebuild_notebook.py         # Unsloth LoRA finetune notebook builder
```

## Finetune pipeline

The Python scripts at the repo root document how the `somus-lfm-1.2b-sms` model was trained. The raw SMS datasets themselves are **not committed** (they contain real personal data). You can regenerate synthetic data with `generate_synthetic_sms.py`.

Training used [Unsloth](https://github.com/unslothai/unsloth) + LoRA on top of LFM2.5-1.2B-Instruct. See `rebuild_notebook.py` for the notebook scaffold.

## License

No license specified yet — all rights reserved until one is added.

## Acknowledgements

- [Liquid AI](https://liquid.ai/) for the LFM2.5 base model and LEAP SDK
- [Unsloth](https://github.com/unslothai/unsloth) for fast LoRA finetuning
