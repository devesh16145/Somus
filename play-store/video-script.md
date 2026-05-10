# Demo video script (60–90 seconds)

For the SMS Permissions Declaration. Upload as **YouTube Unlisted** so
Google reviewers can watch without authentication.

## Goal

Prove three things to a reviewer in under 90 seconds:

1. The user is shown a clear in-app disclosure before SMS access.
2. SMS data is used for the declared use case (money management).
3. SMS data does not leave the device — even when network is off.

## Pre-recording setup

- Use the Pixel 9 with the release build installed.
- Pre-seed the SMS inbox with 8–12 representative transactional messages
  (HDFC, ICICI, SBI, plus one Visa Direct or Razorpay are good).
- Make sure the app has not been launched yet (so onboarding shows).
- Connect device to ADB for screen recording (`adb shell screenrecord` is
  cleaner than the on-device screen recorder for review uploads).
- Quiet background; no notifications popping up.

## Recording command

```bash
# Records up to 180s at native resolution, no audio (Play reviewers
# don't need narration; on-screen text and visible flow are enough).
adb shell screenrecord --bit-rate 6000000 /sdcard/somus-permission-demo.mp4

# Stop with Ctrl-C, then pull
adb pull /sdcard/somus-permission-demo.mp4 ./play-store/
```

If you want narration, record voice separately and overlay in any video
editor — keeps the device recording clean.

## Scene-by-scene script

### 0:00–0:08 — Cold launch
- Tap the Somus icon on the launcher.
- Onboarding screen appears.

> **On-screen caption** (overlay in editor):
> "Somus — privacy-first on-device finance tracker"

### 0:08–0:20 — In-app disclosure of SMS use
- On the onboarding / SMS-permissions screen, hold for 4–5 seconds so
  the reviewer can read the disclosure text explaining: "Somus reads
  SMS to identify bank transactions. SMS content stays on your device."
- Tap "Continue" / "Grant permission."

> **On-screen caption:**
> "User sees what SMS access is for, before granting it."

### 0:20–0:28 — System SMS permission grant
- Android system dialog appears.
- Tap "Allow."

### 0:28–0:40 — Show pending sync banner
- App lands on the dashboard.
- Pending banner shows count of unprocessed SMS.
- Hold for 3 seconds.

> **On-screen caption:**
> "App detects bank SMS already in inbox — does not auto-sync."

### 0:40–0:55 — User-triggered processing
- Tap "Run."
- Per-message progress bar advances; on-device LEAP model classifies
  each SMS.
- Transactions begin appearing in the list.

> **On-screen caption:**
> "Inference runs on-device. Each SMS is parsed by the local LLM."

### 0:55–1:10 — Open a transaction
- Tap a transaction in the list.
- Detail screen shows merchant, amount, category — confirms parse worked.

### 1:10–1:25 — Airplane mode test (the proof)
- Swipe down from notifications, enable airplane mode.
- Visible airplane icon in status bar.
- Return to app.
- Tap Run again on a fresh batch of SMS (or re-sync a date range from
  the period picker).
- Transactions still appear.

> **On-screen caption:**
> "Airplane mode on. SMS processing still works."
> "Confirms: SMS data does not require — and does not use — the network."

### 1:25–1:30 — Close
- Show the Settings screen briefly: "No account. No telemetry. No data
  shared." (Or whatever your Settings screen actually says.)

> **On-screen caption:**
> "Source: github.com/devesh16145/Somus"

## After recording

1. Trim head/tail in any editor.
2. Add the on-screen captions listed above (helpful but not required).
3. Export at 1080p, ≤100 MB.
4. Upload to YouTube → Visibility: **Unlisted**.
5. Paste the URL into the Permissions Declaration form.
6. Keep the source `.mp4` archived locally — Google may request it again
   if they need a re-review.

## What NOT to show

- Don't show real personal SMS or actual bank balances. Use synthetic
  test messages.
- Don't include any other apps or notifications.
- Don't include narration that mentions encryption or biometrics
  (per `feedback_no_false_security_claims.md` — those claims aren't true).
- Don't claim "we don't see your data" in a way that implies user-trust
  in a server. The framing is: there is no server.
