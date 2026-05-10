# Pre-submission checklist

Run through this in order before hitting "Submit for review" in the Play Console.

## 1. Account setup

- [ ] Created dedicated Gmail (e.g. `somus.app@gmail.com`)
- [ ] Created Play Console developer account ($25 one-time)
- [ ] Identity verified (government ID + address) — required since 2023
- [ ] Decided "Personal" vs "Organization" account type
  - Personal is fine for v1; switch later if you incorporate

## 2. Build artifacts

- [ ] `scripts/release-smoke.sh --no-clean --no-install --bundle` produced:
  - [ ] `android/app/build/outputs/bundle/release/app-release.aab`
  - [ ] `android/app/build/outputs/mapping/release/mapping.txt`
- [ ] AAB signed with release key (script's signature check passes)
- [ ] `versionCode = 1`, `versionName = "1.0"` (confirm in `aapt dump badging`)
- [ ] `applicationId = com.somus.app` (confirm)

## 3. Visual assets

- [ ] **App icon 512×512 PNG** (NOT the 192×192 currently in mipmap-xxxhdpi — needs regeneration)
- [ ] **Feature graphic 1024×500 PNG** (top of listing)
- [ ] **Phone screenshots** — 2 to 8, min 320px shortest side, max 3840px longest
  - Recommended: dashboard, transaction list, transaction detail, sync screen, settings
  - Take with `adb exec-out screencap -p > screen.png` for clean captures
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

- [ ] Rendered `privacy-policy.md` to HTML/markdown
- [ ] Hosted on a stable HTTPS URL (recommend GitHub Pages on the existing repo)
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

- [ ] **Internal testing** track first — 2-day soak, 5 testers (just you + close contacts)
- [ ] If clean: promote to **Closed testing** (alpha) — 20-50 testers
- [ ] If clean: **Open testing** OR direct to Production
- [ ] **Production** — submit for review

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
