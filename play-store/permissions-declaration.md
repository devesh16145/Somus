# SMS Permissions Declaration

This is the text to paste into the Play Console's **App content → Sensitive
permissions → SMS Permissions Declaration** form. Per the SMS-policy research:

- Select exactly one core use case: **"SMS-based money management"**.
- Do NOT also tick OTP autofill, contact-management, or call-log features.
- Be plain that the app reads all SMS — don't claim filtering Google can't verify.
- Lead the rationale with on-device architecture and zero network egress.

---

## Form: Permissions

**Permissions requested:** `READ_SMS`

(That's the only SMS permission in `AndroidManifest.xml` — `RECEIVE_SMS` was
deliberately removed when live SMS detection was dropped.)

## Form: Core functionality

**Selected use case:** SMS-based money management
> *"For example, apps that track and manage budget."*

## Form: Description (rationale text)

```
Somus is a privacy-first personal finance tracker. It reads SMS messages
from the user's inbox to identify transactional messages from banks and
payment processors, parses each into a structured transaction (amount,
merchant, category, debit/credit), and presents the result in an
on-device transaction history.

How SMS is used:

1. After the user grants READ_SMS, the app queries the standard Android
   SMS ContentResolver to retrieve messages for a user-selected period.
2. Each message body is passed to a locally-running 1.2-billion-parameter
   language model (Liquid AI's LFM2-1.2B, downloaded once via the
   Hugging Face Hub) that extracts a structured transaction record.
3. The structured record is written to a local SQLite database, deduped
   by Android's SMS row ID. The raw SMS body is not persisted.
4. The user views their transactions on the dashboard and can set
   budgets, goals, and subscription tracking from this data.

The app reads the full SMS inbox — not a filtered subset — because bank
sender IDs vary widely across regions and carriers, and only the model
can reliably classify which messages are transactional.

Privacy properties of the implementation (verifiable in the open-source
code at https://github.com/devesh16145/Somus):

• 100% on-device inference. SMS content never leaves the device.
• The only network access is a one-time ~700 MB model download from
  Hugging Face Hub. After download, the app functions entirely offline.
• No third-party analytics SDKs, no advertising SDKs, no crash-reporting
  services that transmit user data.
• No user account, no signup, no telemetry endpoint of any kind.
• Backups (export/import) are written to the user's local Downloads
  folder as JSON; they are never uploaded.

Why a less invasive permission won't work:

• SMS_USER_CONSENT API: only supports one-shot post-activation listening
  windows of ~5 minutes. It cannot read historical inbox messages or
  process messages that arrive when the app isn't actively listening,
  which makes retroactive transaction history (the core feature)
  impossible.
• NotificationListenerService: requires users to manually allow each
  banking app's notifications, depends on each bank actually surfacing
  an Android notification with full content (many do not), and is
  classified as a more sensitive permission group, not less.
• Manual entry: defeats the purpose of an automated transaction tracker.

The READ_SMS permission is therefore the minimum-necessary permission
for this single, declared core function.
```

## Form: Video demonstration

YouTube unlisted URL: `https://www.youtube.com/watch?v=<TODO>`

(Record per `video-script.md`. Upload as **Unlisted** on YouTube — Google's
reviewers can view without login, but it won't appear in search.)

## Form: Restricted-content access instructions

> Are reviewers required to log in to use the app?

**Answer:** No login is required. After installation, the reviewer can
follow the on-screen onboarding to grant SMS permission and tap Run on
the dashboard to process any messages already on their test device.

## Old-APK exception

**Answer:** Not applicable — this is a first submission (versionCode 1).

## Confirmation checkboxes

Before submitting, confirm in the form:

- [ ] App's core functionality requires the requested permission
- [ ] Disclosure of permission use is presented in-app prior to access
- [ ] User data is handled per the Personal and Sensitive User Data policy
- [ ] Permission is used only for the declared core use case
