// Downloads the game's two fonts (Fredoka and Nunito, both SIL Open Font License) from
// Google Fonts into www/fonts, so the app looks the same with no internet connection.
// Only the Latin and Latin Extended subsets are kept. Run once, or again to refresh:
//
//   npm run fonts
import fs from 'node:fs';
import path from 'node:path';

const FAMILIES = 'family=Fredoka:wght@500;600;700&family=Nunito:wght@600;700;800';
const KEEP = new Set(['latin', 'latin-ext']);
const dir = path.resolve(import.meta.dirname, '..', 'www', 'fonts');
fs.mkdirSync(dir, { recursive: true });

// A current browser user agent makes Google serve woff2 files.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const css = await (await fetch(`https://fonts.googleapis.com/css2?${FAMILIES}&display=swap`, { headers: { 'User-Agent': UA } })).text();

// The stylesheet is a list of "/* subset */ @font-face { ... }" blocks.
const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*{[^}]*})/g)];
const saved = new Map();
let out = '/* Fredoka and Nunito, from Google Fonts. SIL Open Font License 1.1: https://openfontlicense.org */\n';
for (const [, subset, block] of blocks) {
  if (!KEEP.has(subset)) continue;
  const url = block.match(/url\((https:[^)]+)\)/)[1];
  const family = block.match(/font-family:\s*'([^']+)'/)[1];
  const weight = block.match(/font-weight:\s*(\d+)/)[1];
  if (!saved.has(url)) {
    const name = `${family.toLowerCase()}-${subset}-${saved.size}.woff2`;
    fs.writeFileSync(path.join(dir, name), Buffer.from(await (await fetch(url)).arrayBuffer()));
    saved.set(url, name);
    console.log('saved', name);
  }
  out += `/* ${family} ${weight}, ${subset} */\n${block.replace(url, saved.get(url))}\n`;
}
fs.writeFileSync(path.join(dir, 'fonts.css'), out);
console.log(`wrote fonts.css with ${saved.size} font files`);
