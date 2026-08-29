# Pre-submission checklist

Run through this in order before hitting "Submit for review" in the Play Console.

## 1. Account setup

- [ ] Created dedicated Gmail (e.g. `somus.app@gmail.com`)
- [ ] Created Play Console developer account ($25 one-time)
- [ ] Identity verified (government ID + address) — required since 2023
- [ ] Decided "Personal" vs "Organization" account type
  - Personal is fine for v1; switch later if you incorporate

## 2. Build artifacts

- [x] `targetSdkVersion = 36` (required for new submissions from August 31, 2026)
- [ ] Fresh post-logo/API-36 build: `scripts/release-smoke.sh --no-clean --no-install --bundle` produced:
  - [ ] `android/app/build/outputs/bundle/release/app-release.aab`
  - [ ] `android/app/build/outputs/mapping/release/mapping.txt`
- [ ] Fresh AAB signed with release key (script's signature check passes)
- [ ] `versionCode = 1`, `versionName = "1.0"` (use versionCode 2 if v1 was already uploaded)
- [ ] `applicationId = com.somus.app` and `targetSdkVersion = 36` confirmed

## 3. Visual assets

- [x] **App icon 512×512 PNG** → `play-store/icon-512.png` (approved amber
      extracted-value symbol on Somus near-black/warm-charcoal field; opaque RGB,
      no alpha). Adaptive and legacy launcher icons regenerated.
- [ ] **Feature graphic 1024×500 PNG** (top of listing)
- [ ] **Phone screenshots** — 2 to 8, min 320px shortest side, max 3840px longest
  - Recommended: dashboard, transaction list, transaction detail, sync screen, settings
  - On Windows use `adb shell screencap -p /sdcard/s.png && adb pull /sdcard/s.png`
    (piping `exec-out ... > file` through Git Bash corrupts the binary)
- [ ] **Optional:** 7" + 10" tablet screenshots if you want tablet layout shown

## 4. Listing copy (from `listing.md`)

- [ ] App title (≤30 chars)
- [ ] Short description (≤80 chars)
- [ ] Long description (≤4000 chars)
- [ ] What's new (≤500 chars per release)
- [ ] Category set to **Finance**
- [ ] Tags chosen
- [ ] Contact email
- [ ] Website URL (GitHub repo or landing page)

## 5. Privacy policy hosting

- [ ] Vercel project connected to `devesh16145/Somus`, Root Directory set to `web/` (see `web/README.md`)
- [ ] First deploy succeeded — confirm at `https://<project>.vercel.app/privacy`
- [ ] URL pasted into Play Console → Store listing → Privacy policy
- [ ] Verified URL loads from a clean browser without auth

## 6. Data Safety form (from `data-safety.md`)

- [ ] Walked through every data-type row, marking "No" for collected/shared
- [ ] Selected "Yes" for: encrypted in transit
- [ ] Selected "No" for: encrypted at rest (per honesty rule)
- [ ] Selected "Yes" for: users can request data deletion
- [ ] Summary statement pasted in

## 7. Permissions Declaration (from `permissions-declaration.md`)

- [ ] Selected core use case: **SMS-based money management** (only this one)
- [ ] Pasted rationale text
- [ ] Recorded video per `video-script.md`
- [ ] Uploaded video to YouTube as **Unlisted**
- [ ] YouTube URL pasted into the declaration form
- [ ] Confirmed reviewers don't need a login (mentioned in form)

## 8. Other Play Console gates

- [ ] **Content rating** — completed IARC questionnaire, expected rating: Everyone
- [ ] **Target audience** — set to 18+ (financial app)
- [ ] **Ads declaration** — "No, my app does not contain ads"
- [ ] **News app declaration** — "No"
- [ ] **COVID-19 contact tracing** — "No"
- [ ] **Government app** — "No"
- [ ] **Financial features** — declare honestly (this is **not** a regulated financial service; it's a personal finance utility)
- [ ] **Health features** — "No"

## 9. Release tracks

Recommended progression:

- [ ] **Internal testing** first for release smoke testing
- [ ] **Closed testing:** for Personal accounts created after November 13, 2023,
      keep at least **12 testers opted in continuously for 14 days**
- [ ] Apply for production access after the closed-test requirement is satisfied
- [ ] If approved: **Open testing** or **Production**

## 10. Post-submission

- [ ] Save the upload key (`android/release.keystore`) and `keystore.properties` in two backed-up locations — losing this means losing the ability to push updates
- [ ] Enable **Play App Signing** when prompted (Google holds the signing key, you keep an upload key — strongly recommended)
- [ ] Upload `mapping.txt` to "App bundle explorer" → "Downloads" → "Native debug symbols / mapping" so crash stack traces de-obfuscate
- [ ] Note the review submission date — typical SMS-permission review: 1–3 weeks
- [ ] Watch for "Action required" emails — respond within 7 days or the app gets removed from review

## Things you do NOT need

- D-U-N-S number (only required for Organization-type accounts)
- A company / LLC (Personal accounts are fine)
- Trademark registration (recommended later, not blocking)
- Apple Developer account (Android-only for now)
