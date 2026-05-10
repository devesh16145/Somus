# Store listing copy

## App title (max 30 chars)

```
Somus — Private Money Tracker
```
Char count: 29.

Alternates if you want to A/B:
- `Somus: On-Device Finance` (24)
- `Somus — SMS Expense Tracker` (27)

## Short description (max 80 chars)

```
On-device AI reads your bank SMS to track spending. No cloud. No accounts.
```
Char count: 73.

Alternates:
- `Track expenses from bank SMS — privately, fully offline, no accounts.` (69)
- `Your bank SMS, parsed by AI on your phone. Never sent to a server.` (66)

## Full description (max 4000 chars)

```
Somus is a privacy-first expense tracker that reads your bank SMS messages
and turns them into a clean transaction history — without sending a single
message off your phone.

Most expense apps either ask you to enter every transaction by hand or send
your SMS to a remote server for parsing. Somus does neither. A 1.2-billion-
parameter language model runs entirely on your device, parses each SMS
locally, and stores the results in a private database that lives on your
phone.

█ Why Somus

• 100% on-device. No server. No cloud. No analytics.
• No accounts. No signup, no email, no password.
• No telemetry. The app never phones home.
• Works offline. After a one-time model download, airplane mode is fine.
• No ads. No upsells. No "premium" tier locking basic features.

█ How it works

1. Grant SMS read permission once.
2. Tap Run — the app processes any new bank SMS through the on-device model.
3. Transactions appear instantly with amount, merchant, and category.
4. Browse by month, set budgets and goals, track subscriptions.

The model recognizes 40+ banks across 15 countries via an internal sender-
format hint table, so it generalizes well across messy real-world SMS
formats — far better than the regex-based trackers it replaces.

█ Features

• Editorial dashboard with monthly spend, budget progress, days remaining
• Transaction list with merchant, amount, and category
• Numbered category ledger showing top spending categories
• Budgets and goals with progress tracking
• Subscriptions view to spot recurring charges
• Local backup and restore (export/import as JSON)
• Light and dark themes
• Per-period sync — pick any date range to process

█ Privacy in detail

• SMS content is read by Android's standard ContentResolver, processed by
  the on-device LLM, and discarded after a structured transaction is
  extracted. The original SMS body is not stored.
• Internet is used only for a one-time ~700 MB model download from
  Hugging Face. After that, the app does not require a network connection.
• Backups stay on-device. They are written to the system download folder
  and never uploaded.
• No third-party SDKs, no advertising libraries, no crash-reporting service
  that exfiltrates data.

█ What you need

• Android 12+ (API 31 or higher)
• ~5 GB RAM and ~1 GB free storage during model download
• A device that receives transactional SMS from your bank

█ What it isn't

• Not a banking app. Somus does not connect to your bank.
• Not a budgeting service. There is no server, no team, no support staff
  reviewing your data — because there is no data leaving your phone.
• Not encrypted-at-rest with biometrics. Storage uses the OS-level app
  sandbox; do not store passwords or sensitive notes in transaction notes.

█ Open source friendly

The app's source is available at https://github.com/devesh16145/Somus —
inspect the code, build it yourself, or contribute.

Made by an indie developer who got tired of expense apps that turn out to
be data-harvesting in disguise.
```
Char count: ~3,150 / 4,000.

## What's new (max 500 chars, for v1.0)

```
First release.

• On-device AI parsing of bank SMS — never leaves your phone
• Editorial dashboard with monthly spend and budget progress
• Transaction list, budgets, goals, subscriptions
• Local backup and restore
• Light and dark themes
• Period-picker sync — process any date range
• Supports 40+ banks across 15 countries
```
Char count: ~330.

## Categorization

- **App category:** Finance
- **Tags (suggested):** Personal Finance, Expense Tracker, Budget, Money Manager
- **Content rating questionnaire:** answer "No" to all sensitive content categories — this is a clean utility app.

## Contact details

- **Email:** devesh.iiitd@gmail.com (or a dedicated `somus.app@gmail.com`)
- **Website:** https://github.com/devesh16145/Somus (or a landing page once you have one)
- **Phone:** optional, leave blank
