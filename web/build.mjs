// Build static HTML for Vercel.
// Reads play-store/privacy-policy.md (single source of truth), renders to public/.
// Vercel runs `npm run build` on every push; output dir is `public/`.

import { marked } from 'marked';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const publicDir = path.join(here, 'public');

const template = fs.readFileSync(path.join(here, 'template.html'), 'utf8');

function renderPage(title, content) {
  return template.replace('{{title}}', title).replace('{{content}}', content);
}

function writeFile(rel, contents) {
  const out = path.join(publicDir, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, contents);
  console.log(`  wrote ${rel}  (${(contents.length / 1024).toFixed(1)} KB)`);
}

// Landing page
const landingHtml = `
<h1>Somus</h1>
<p>Privacy-first, on-device finance tracker for Android. Reads your bank SMS,
parses it with a local 1.2B-parameter language model, and never sends a single
message off your phone.</p>

<ul>
  <li><a href="/privacy/">Privacy policy</a></li>
  <li><a href="https://github.com/devesh16145/Somus">Source on GitHub</a></li>
  <li>Contact: <a href="mailto:devesh.iiitd@gmail.com">devesh.iiitd@gmail.com</a></li>
</ul>
`.trim();

// Privacy policy (rendered from markdown)
const policyMd = fs.readFileSync(
  path.join(repoRoot, 'play-store', 'privacy-policy.md'),
  'utf8',
);
const policyHtml = marked.parse(policyMd);

console.log('building public/');
writeFile('index.html', renderPage('Somus', landingHtml));
writeFile('privacy/index.html', renderPage('Privacy Policy — Somus', policyHtml));
console.log('done.');
