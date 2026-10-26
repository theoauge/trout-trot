// Builds www/index.html from the web version of the game (../flop-home.html):
// wraps it in a full HTML document for the app's web view and swaps the Google Fonts
// links for the bundled copies in www/fonts. Run after changing the game:
//
//   npm run build      (this script, then `cap sync` into both native projects)
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = path.resolve(root, '..', 'flop-home.html');
const target = path.join(root, 'www', 'index.html');

const game = fs.readFileSync(source, 'utf8');
const split = game.indexOf('</style>') + '</style>'.length;
if (split < '</style>'.length) throw new Error('flop-home.html: no </style> found to split head from body');

const head = game.slice(0, split)
  // Only meaningful inside the claude.ai artifact viewer.
  .replace(/<meta name="claude:viewport-fit-sides"[^>]*>\n?/, '')
  // Google Fonts -> bundled fonts.
  .replace(/<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*>\n?/g, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="fonts/fonts.css">');
if (head.includes('fonts.googleapis.com')) throw new Error('Google Fonts link not replaced; check flop-home.html');

const body = game.slice(split).trimStart();

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="theme-color" content="#7c9c52">
<style>
  /* App shell: matches the page skeleton the game was designed in. */
  :root { padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
  body { margin: 0; font: 14px system-ui, -apple-system, "Segoe UI", sans-serif; overscroll-behavior: none; }
  img { max-width: 100%; }
  [hidden] { display: none !important; }
</style>
${head}
</head>
<body>
${body}
</body>
</html>
`;
fs.writeFileSync(target, html);
console.log(`built ${path.relative(root, target)} from ${path.relative(root, source)}`);
