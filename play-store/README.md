# Play Store launch kit

Drafts of every text/asset Google Play needs for Somus's first submission. Edit
freely — I drafted from CLAUDE.md, the manifest, and the SMS-policy research.

## What's in here

| File | Purpose | Where it goes in Play Console |
|---|---|---|
| `listing.md` | Store listing copy: title, short/long description, what's-new | Main store listing |
| `permissions-declaration.md` | Justification text for the SMS Permissions Declaration | App content → Sensitive permissions |
| `data-safety.md` | Field-by-field answers for the Data Safety form | App content → Data safety |
| `privacy-policy.md` | Public privacy policy (rendered by `web/` and deployed to Vercel) | Store listing → Privacy policy URL |
| `video-script.md` | 60–90 sec demo recording script (required by SMS declaration) | Upload to YouTube unlisted, link in declaration |
| `submission-checklist.md` | End-to-end pre-submission checklist | Operational |

## Outstanding assets (not text — handle separately)

- **Hi-res icon 512×512 PNG** — current largest is 192×192 in `mipmap-xxxhdpi/`. Needs regeneration from a higher-res source or vector. Flagged separately.
- **Feature graphic 1024×500 PNG** — required hero image at the top of the listing.
- **Phone screenshots** (2–8, min 320px shortest side) — capture on the Pixel after fresh install + sample sync.
- **Signed AAB** — `scripts/release-smoke.sh --bundle` produces it.
- **R8 mapping.txt** — same script. Upload alongside the AAB.

## Submission order (recommended)

1. Create Google Play Console account ($25, dedicated Gmail).
2. Build signed AAB + mapping (`scripts/release-smoke.sh --no-clean --no-install --bundle`).
3. Host `privacy-policy.md` (rendered) at a stable HTTPS URL.
4. Create app in Console → fill store listing from `listing.md`.
5. Upload screenshots + feature graphic + 512px icon.
6. Fill Data Safety form from `data-safety.md`.
7. Record video, upload to YouTube unlisted, paste URL into Permissions Declaration along with text from `permissions-declaration.md`.
8. Internal testing track first → Closed → Production.
