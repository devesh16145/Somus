# Somus site

Static landing page + privacy policy. Hosted on Vercel; deploys from a private
GitHub repo at no cost. The privacy policy source is in
`../play-store/privacy-policy.md` — this site renders it to HTML at build time
so there's a single source of truth.

## What gets published

- `/` — landing page (`build.mjs` inline content)
- `/privacy` — privacy policy (rendered from `play-store/privacy-policy.md`)

The Vercel `cleanUrls` option removes `.html` extensions, so the policy lives
at `/privacy` (not `/privacy/index.html`).

## Local preview

```bash
cd web
npm install
npm run build
npx serve public  # any static server works
```

## Vercel setup (one-time)

1. Sign in at https://vercel.com with GitHub.
2. **Add New → Project → Import** the private `devesh16145/Somus` repo.
3. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `web`
   - **Build Command:** `npm run build` *(auto-detected from package.json)*
   - **Output Directory:** `public` *(auto-detected from vercel.json)*
4. Deploy. The URL will look like `https://somus-<hash>.vercel.app`.
5. The privacy policy lives at `https://somus-<hash>.vercel.app/privacy`.
6. Paste that URL into Play Console → Store listing → Privacy policy.

Every push to `main` triggers an automatic redeploy.

## When to edit what

| File | When you edit it |
|---|---|
| `../play-store/privacy-policy.md` | Always — this is the canonical policy. The rendered HTML rebuilds automatically. |
| `web/build.mjs` | Only to change the landing page copy. |
| `web/template.html` | Only to change visual styling. |

Do **not** edit `web/public/` — that's a build artifact (also git-ignored).
