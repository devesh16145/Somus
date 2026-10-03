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

Justification: SMS content is read on-device, parsed on-device, and financial
messages are stored with the structured result on-device. None of this counts as "collected"
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

**Answer:** Yes. Users can delete transactions in the app. Android's
standard Clear storage or Uninstall controls remove the app-private
SQLite database, model file, cache, and preferences. Files the user
explicitly saved or shared to another destination remain under that
destination's control and must be deleted there separately.

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
| **Messages — SMS or MMS** | No | No | **Read and retained locally for saved transactions under the declared SMS-based-money-management use case. Not transmitted or shared by Somus.** |
| **Messages — Emails** | No | No | — |
| **Messages — Other in-app messages** | No | No | — |
| **Photos and videos** | No | No | — |
| **Audio files** | No | No | — |
| **Files and docs** | No | No | Backup JSON/CSV is created in app cache and handed to Android's system share/save sheet by user action; Somus does not transmit it |
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
- **Users can request data be deleted:** Yes (individual transaction deletion in-app; Android Clear storage or Uninstall removes all app-private data)
- **Data is committed to follow Play Families Policy:** N/A (not a kids app)
- **Independent security review:** No

## 4. Summary statement (free-text, ~200 words)

```
Somus does not collect, transmit, or share any user data. SMS processing,
transaction parsing, source-message retention for saved transactions,
and database storage happen entirely on the user's device. The only network connection the app makes is a
one-time download of the on-device language model from Hugging Face;
this download contains no user data and is one-way (the user receives
the model, the app sends nothing back).

The app has no user accounts, no analytics SDKs, no advertising SDKs,
no third-party crash-reporting services, and no telemetry endpoints of
any kind. Local JSON/CSV backups are created in app cache and handed to
Android's system share/save sheet by user action. Somus never uploads
them.

Android's Clear storage or Uninstall controls remove the SQLite
database, downloaded model, cache, and preferences. Users can also
delete individual transactions in the app. Copies explicitly saved or
shared elsewhere are controlled by the selected destination.
```
