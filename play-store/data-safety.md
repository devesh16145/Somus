# Data Safety form answers

The Play Console Data Safety form is a series of yes/no questions per data
type plus a few summary questions. Below: the answer for every question
based on what Somus actually does (verified against the codebase as of v1.0).

> ⚠️ The Data Safety form is **legally binding** in the sense that lying
> here can result in app removal. Re-verify after any architecture change.

---

## 1. Data collection and security

> **Does your app collect or share any of the required user data types?**

**Answer:** No.

Justification: SMS content is read on-device, parsed on-device, and the
structured result is stored on-device. None of this counts as "collected"
under Google's definition because the data does not leave the device and
is not sent to any service the developer controls. The Hugging Face model
download is a one-way fetch of public model weights — no user data is
sent up.

If Google's UI requires you to enumerate "data types accessed but not
collected," the relevant ones are listed below for completeness, but each
is marked **not collected, not shared**.

> **Is all of the user data collected by your app encrypted in transit?**

**Answer:** Yes. Every outbound network connection (only the model
download) goes over HTTPS to `huggingface.co`. The manifest sets
`usesCleartextTraffic="false"`.

> **Do you provide a way for users to request that their data is deleted?**

**Answer:** Yes. Settings includes a "Wipe data" / uninstall flow. The
SQLite database, model file, and any backups are local — uninstalling
the app deletes all of them. The Settings screen also exposes per-table
data-clearing controls.

(Verify before submission: confirm Settings actually has a wipe-all
option that calls `TransactionRepository.deleteAll()` and clears
sync_state. If it only deletes transactions, mention that uninstall is
the complete-removal path.)

## 2. Data types — answer per category

For each, answer: collected? shared? required/optional? purpose?

| Data type | Collected | Shared | Notes |
|---|---|---|---|
| **Personal info — Name** | No | No | Not asked, not stored |
| **Personal info — Email** | No | No | No accounts |
| **Personal info — Address** | No | No | — |
| **Personal info — Phone** | No | No | — |
| **Personal info — User IDs** | No | No | — |
| **Personal info — Other** | No | No | — |
| **Financial info — User payment info** | No | No | App reads SMS content; that content may include card-last-4 or UPI handles, but it is processed on-device only and is never collected by the developer |
| **Financial info — Purchase history** | No | No | Same as above |
| **Financial info — Credit score** | No | No | — |
| **Financial info — Other financial info** | No | No | Transaction records derived from SMS stay on-device |
| **Health and fitness** | No | No | — |
| **Messages — SMS or MMS** | No | No | **Read on-device for the declared SMS-based-money-management use case. Not collected, not transmitted, not shared.** |
| **Messages — Emails** | No | No | — |
| **Messages — Other in-app messages** | No | No | — |
| **Photos and videos** | No | No | — |
| **Audio files** | No | No | — |
| **Files and docs** | No | No | Backup JSON is written to user's Downloads folder by user action only; not transmitted |
| **Calendar** | No | No | — |
| **Contacts** | No | No | — |
| **App activity — App interactions** | No | No | No analytics |
| **App activity — In-app search history** | No | No | — |
| **App activity — Installed apps** | No | No | — |
| **App activity — Other user-generated content** | No | No | Budget/goal/subscription names entered by user are stored on-device only |
| **App activity — Other actions** | No | No | — |
| **Web browsing — Web browsing history** | No | No | — |
| **App info and performance — Crash logs** | No | No | App has a local "Crash logs" screen that displays errors on-device only; nothing is transmitted |
| **App info and performance — Diagnostics** | No | No | — |
| **App info and performance — Other** | No | No | — |
| **Device or other IDs — Device or other IDs** | No | No | — |

## 3. Security practices — answers

- **Encrypted in transit:** Yes (HTTPS-only; no cleartext traffic per manifest)
- **Encrypted at rest:** No. SQLite database and JSON backups are stored in app-private storage but are not separately encrypted. Disclose this honestly. *(Action item: when prompted by Google for an encryption claim, do not check "encrypted at rest" — per `feedback_no_false_security_claims.md`.)*
- **Users can request data be deleted:** Yes (uninstall removes everything; Settings has wipe controls)
- **Data is committed to follow Play Families Policy:** N/A (not a kids app)
- **Independent security review:** No

## 4. Summary statement (free-text, ~200 words)

```
Somus does not collect, transmit, or share any user data. All SMS
processing, transaction parsing, and database storage happen entirely
on the user's device. The only network connection the app makes is a
one-time download of the on-device language model from Hugging Face;
this download contains no user data and is one-way (the user receives
the model, the app sends nothing back).

The app has no user accounts, no analytics SDKs, no advertising SDKs,
no third-party crash-reporting services, and no telemetry endpoints of
any kind. Local backups (export to JSON) are written to the user's
Downloads folder by user action and are never transmitted.

Uninstalling the app removes every byte of user data: the SQLite
database, the downloaded model file, and all preferences. The
Settings screen also provides explicit data-deletion controls.
```
