# Privacy Policy for Somus

_Last updated: 2026-08-31_

This Privacy Policy describes how the Somus mobile application ("Somus,"
"the app," "we") handles information when you install and use it on
your Android device.

The short version: **Somus processes SMS content and transaction records
locally and does not transmit that content to a developer-controlled
server.** A network connection is used to download the on-device model;
the model host receives ordinary connection metadata as described below.

---

## 1. Who is responsible for this app

Somus is developed and maintained by **Devesh Yadav** (the "Developer"),
an independent developer. Privacy contact:
[devesh.iiitd@gmail.com](mailto:devesh.iiitd@gmail.com).

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

For messages classified as financial transactions, the source SMS body
is retained with the structured transaction in Somus's local database.
This supports transaction details, verification, editing, and backup.
It remains in the app-private storage on your device and is not uploaded
by Somus. Messages not saved as transactions are not retained by Somus.

### 2.2 Internet (`INTERNET`)

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

- **Transaction records** parsed from your SMS messages: amount, date,
  merchant, category, debit/credit flag, sender, source SMS body, and an
  internal SMS row ID for deduplication. Stored in a SQLite database.
- **Sync state**: the timestamp of the last sync run, so the app knows
  what's already been processed.
- **Budgets, goals, subscriptions, settings** that you create in the app.
- **The downloaded language model file** (~700 MB).
- **Local backup files** that you choose to export. Somus creates the
  file in its temporary app cache and opens Android's system share/save
  sheet so you control where a copy is saved or shared.

This data never leaves your device through Somus unless you explicitly
export it and choose a destination in Android's system share/save sheet.
Exported JSON/CSV files can contain transaction details and source SMS
text; the destination you select then controls that copy.

## 4. What data is shared with third parties

**None.** The app does not share any user data with any third party.

The only third party the app interacts with is Hugging Face Hub, and
only to download the language model. Like any HTTPS file host, Hugging
Face and its delivery infrastructure receive standard connection
metadata such as your IP address and user-agent string. Somus does not
send SMS content, transaction records, or other app data with this
request, and the Developer has no analytics or reporting integration
with Hugging Face.

## 5. Children's privacy

Somus is not directed at children under 13. Its content is intended for
adult personal-finance management.

## 6. Your rights and how to delete your data

Because all your data is stored on your device, you control it
completely:

- **Delete individual transactions** from the in-app list.
- **Clear app storage or uninstall Somus** from Android's app settings —
  this removes the database, model file, cache, and preferences. There
  is no remaining copy on a Somus server because Somus operates no
  server and never uploads this data.

Files you deliberately saved or shared outside Somus through Android's
system share/save sheet are controlled by the destination you selected;
delete those copies from that destination separately.

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

## 8. Accuracy and financial decisions

Somus uses automated extraction and categorisation. Results may be
incomplete, delayed, duplicated, or incorrect. Review records against
your bank's official information before relying on them. Somus is an
organisational tool, not a bank, payment service, accountant, financial
adviser, or substitute for professional advice. Use of the app is also
subject to the [Somus Terms of Use](/terms/).

## 9. Changes to this policy

If the app's behavior changes in a way that affects what data is
accessed or where it goes, this policy will be updated and the "Last
updated" date at the top will reflect the change. Material changes
will also be reflected in the app's release notes on the Play Store.

## 10. Contact

For any questions about this policy or how the app works, email
[devesh.iiitd@gmail.com](mailto:devesh.iiitd@gmail.com).

The Somus source code is available at
[github.com/devesh16145/Somus](https://github.com/devesh16145/Somus).
