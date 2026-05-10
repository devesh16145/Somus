# Privacy Policy for Somus

_Last updated: 2026-05-11_

This Privacy Policy describes how the Somus mobile application ("Somus,"
"the app," "we") handles information when you install and use it on
your Android device.

The short version: **Somus does not collect, transmit, store on a
server, or share any of your personal data.** Everything happens on
your phone.

---

## 1. Who is responsible for this app

Somus is developed and maintained by **Devesh Yadav** (the "Developer"),
an independent developer based in India. Contact:
[devesh.iiitd@gmail.com](mailto:devesh.iiitd@gmail.com).

There is no company, no team, and no server infrastructure behind the app.

## 2. What data the app accesses on your device

To function as a transaction tracker, Somus must access certain data on
your device. None of this data is transmitted off the device.

### 2.1 SMS messages (`READ_SMS`)

When you grant SMS read permission, the app reads messages from your
device's SMS inbox so it can identify transactional messages from banks
and payment processors. The contents of each message are passed through
an on-device language model that extracts a structured transaction
record (amount, merchant, category, debit or credit). The model runs
inside the app process, on your device's CPU. Message content does not
leave the device at any point in this process.

The original SMS body is not retained after the structured transaction
is extracted. Only the transaction record (and an Android-internal SMS
row ID, used for deduplication) is saved to the app's local database.

### 2.2 Notifications (`POST_NOTIFICATIONS`)

The app posts a foreground-service notification while the on-device
language model is downloading, so Android does not kill the download
when you switch apps. No information is sent anywhere — the
notification is a system-level UI element only.

### 2.3 Wake lock and foreground service

The app uses `WAKE_LOCK` and `FOREGROUND_SERVICE` to keep the model
download alive in the background. These permissions affect device
behavior, not data collection.

### 2.4 Internet (`INTERNET`)

The app uses the network only to download the language model from
[Hugging Face Hub](https://huggingface.co/) the first time you run it.
This is a one-way fetch of public model weights. Your data is not
transmitted as part of this download. After the download completes,
the app functions entirely offline; you can keep the device in airplane
mode and the app will continue to work.

The app does not connect to any other server. There is no telemetry
endpoint, no analytics service, no advertising network, no
authentication backend, and no developer-controlled API.

## 3. What data is stored on your device

The following information is stored locally on your device, in the
app's private storage area:

- **Transaction records** parsed from your SMS messages: amount,
  date, merchant, category, debit/credit flag, an internal SMS row ID
  for deduplication. Stored in a SQLite database.
- **Sync state**: the timestamp of the last sync run, so the app knows
  what's already been processed.
- **Budgets, goals, subscriptions, settings** that you create in the app.
- **The downloaded language model file** (~700 MB).
- **Local backup files** that you choose to export, written to your
  device's Downloads folder.

This data never leaves your device unless you explicitly export and
share a backup file yourself.

## 4. What data is shared with third parties

**None.** The app does not share any user data with any third party.

The only third party the app interacts with is Hugging Face Hub, and
only to download the language model. Hugging Face does not receive any
user-identifying information from the app — only the standard HTTP
metadata (your IP address, user-agent string) that any HTTPS download
involves. We do not have an account or a reporting integration with
Hugging Face.

## 5. Children's privacy

Somus is not directed at children under 13 and does not knowingly
collect data from anyone, including children. Because the app does not
collect data, this section is largely moot — but the app's content is
intended for adult financial-management use.

## 6. Your rights and how to delete your data

Because all your data is stored on your device, you control it
completely:

- **Delete individual transactions** from the in-app list.
- **Wipe all data** from the in-app Settings screen.
- **Uninstall the app** from Android's app settings — this removes the
  database, the model file, and all preferences. There is no remaining
  copy on any server because no server has ever received your data.

You do not need to email us, file a request, or wait for a response to
exercise any of these rights — your data is on your device, under your
control.

## 7. Security

The app uses standard Android app-sandbox isolation to keep your data
private from other apps on your device. Network connections (only the
one-time model download) use HTTPS. The app does not enable cleartext
network traffic.

The app does **not** apply additional encryption to its local database
or backup files. Anyone with physical access to your unlocked device
could open these files. Use your device's built-in screen lock and
storage encryption.

## 8. Changes to this policy

If the app's behavior changes in a way that affects what data is
accessed or where it goes, this policy will be updated and the "Last
updated" date at the top will reflect the change. Material changes
will also be reflected in the app's release notes on the Play Store.

## 9. Contact

For any questions about this policy or how the app works, email
[devesh.iiitd@gmail.com](mailto:devesh.iiitd@gmail.com).

The full source code for Somus is available at
[github.com/devesh16145/Somus](https://github.com/devesh16145/Somus) so
you can verify any claim made in this policy by reading the code.
