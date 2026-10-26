// Draws the Trout Trot icon and splash screen as SVG, then exports every size
// the Android and iOS projects need, plus a 512px icon for the Play Store listing.
//
//   npm run icons
//
// Edit the SVG below to change the artwork, then rerun.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const res = path.join(root, 'android/app/src/main/res');
const xcassets = path.join(root, 'ios/App/App/Assets.xcassets');
const out = path.join(root, 'assets');
fs.mkdirSync(out, { recursive: true });

const RIVER_TOP = '#3a8a86', RIVER_BOTTOM = '#1d555b', GRASS = '#7c9c52';

// Rainbow trout in side view, facing right, centered on (0, 0), about 690 units nose to tail.
const trout = `
  <defs>
    <linearGradient id="troutBody" x1="0" y1="-115" x2="0" y2="105" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#5e6f33"/>
      <stop offset="0.38" stop-color="#9aa25a"/>
      <stop offset="0.55" stop-color="#e9e6dc"/>
      <stop offset="1" stop-color="#f7f5ee"/>
    </linearGradient>
  </defs>
  <g stroke="#1f2b22" stroke-width="7" stroke-linejoin="round">
    <path d="M -285 -16 Q -330 -70 -388 -118 Q -352 -30 -362 0 Q -352 30 -388 118 Q -330 70 -285 16 Z" fill="#7d8a45"/>
    <path d="M -20 -108 Q 22 -172 95 -152 Q 72 -126 74 -100 Z" fill="#7d8a45"/>
    <path d="M -178 -86 Q -158 -112 -134 -92 Z" fill="#7d8a45"/>
    <path d="M -150 86 L -190 132 L -110 96 Z" fill="#e9b2a0"/>
    <path d="M -30 100 L -60 146 L 10 104 Z" fill="#e9b2a0"/>
    <path d="M 300 0 C 280 -70 160 -112 20 -113 C -120 -114 -220 -80 -270 -30 L -300 -20 L -300 20 L -270 30 C -220 80 -120 104 20 101 C 160 98 270 60 300 0 Z" fill="url(#troutBody)"/>
  </g>
  <path d="M 262 6 C 150 -14 -80 -18 -282 -2 L -282 22 C -80 28 150 44 256 30 Z" fill="#e3798c" opacity="0.92"/>
  <ellipse cx="190" cy="14" rx="58" ry="48" fill="#e3798c" opacity="0.75"/>
  <g fill="#1f2b22">
    ${[[-240, -40], [-205, -62], [-170, -30], [-140, -66], [-110, -44], [-80, -78], [-50, -50], [-20, -86], [10, -60], [40, -90], [70, -64], [100, -84], [130, -58], [160, -76], [-230, -10], [-190, -2], [-120, -14], [-60, -20], [0, -28], [60, -34], [-330, -50], [-345, 40], [-320, 70], [-335, -85], [30, -132], [55, -138]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${7 + ((x * 7 + y * 3) & 3)}"/>`).join('')}
  </g>
  <g stroke="#1f2b22" stroke-width="7" fill="none" stroke-linecap="round">
    <path d="M 300 0 C 280 -70 160 -112 20 -113 C -120 -114 -220 -80 -270 -30 L -300 -20 L -300 20 L -270 30 C -220 80 -120 104 20 101 C 160 98 270 60 300 0 Z"/>
    <path d="M 300 0 L 258 14"/>
    <path d="M 168 -48 Q 150 10 172 62"/>
  </g>
  <ellipse cx="160" cy="58" rx="48" ry="17" transform="rotate(24 160 58)" fill="#e9b2a0" stroke="#1f2b22" stroke-width="6"/>
  <circle cx="236" cy="-26" r="21" fill="#f2d460" stroke="#1f2b22" stroke-width="6"/>
  <circle cx="240" cy="-26" r="12" fill="#1f2b22"/>
  <circle cx="244" cy="-31" r="4.5" fill="#ffffff"/>`;

// The trout leaping clear of the water, with a splash ring at the tail and an arc showing the flop.
const leap = (scale) => `
  <g transform="translate(512 512) scale(${scale}) translate(-512 -512)">
    <path d="M 250 300 Q 512 40 800 250" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="16" stroke-linecap="round" stroke-dasharray="2 42"/>
    <ellipse cx="300" cy="752" rx="190" ry="44" fill="none" stroke="#ffffff" stroke-opacity="0.8" stroke-width="14"/>
    <ellipse cx="300" cy="752" rx="110" ry="24" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="10"/>
    <g fill="#ffffff" fill-opacity="0.9">
      <circle cx="190" cy="690" r="14"/><circle cx="235" cy="640" r="10"/><circle cx="410" cy="676" r="12"/>
      <circle cx="380" cy="625" r="8"/><circle cx="150" cy="740" r="9"/><circle cx="455" cy="728" r="9"/>
    </g>
    <g transform="translate(540 470) rotate(-30) scale(0.95)">${trout}</g>
  </g>`;

const riverBackground = `
  <defs>
    <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${RIVER_TOP}"/><stop offset="1" stop-color="${RIVER_BOTTOM}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#river)"/>
  <g fill="none" stroke="#e1f2ee" stroke-opacity="0.16" stroke-width="10" stroke-linecap="round">
    <path d="M 120 -20 C 160 200 80 400 130 620 S 110 900 150 1050"/>
    <path d="M 900 -20 C 860 220 940 420 880 640 S 920 900 870 1050"/>
    <path d="M 520 860 C 540 920 500 980 530 1050"/>
  </g>`;

const svg = (body, size = 1024) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${body}</svg>`);

const iconFull = svg(riverBackground + leap(0.92));
// Android adaptive icons crop to a circle or squircle of about 61% of the canvas, so the
// foreground layer shrinks the artwork to keep the trout and splash inside that safe zone.
const iconForeground = svg(leap(0.6));
const iconBackground = svg(riverBackground);
const circleMask = svg('<circle cx="512" cy="512" r="512" fill="#fff"/>');
const splash = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
  <rect width="2732" height="2732" fill="${GRASS}"/>
  <g transform="translate(1366 1366) scale(1.25) translate(-512 -512)">${leap(1)}</g>
</svg>`);

const png = (buf, size) => sharp(buf, { density: 72 * size / 1024 }).resize(size, size).png();
const write = async (pipeline, file) => { await pipeline.toFile(file); console.log('wrote', path.relative(root, file)); };

// Master copies and the Play Store listing icon (512 x 512, no transparency).
await write(png(iconFull, 1024).flatten({ background: RIVER_BOTTOM }), path.join(out, 'icon-1024.png'));
await write(png(iconFull, 512).flatten({ background: RIVER_BOTTOM }), path.join(out, 'play-store-icon-512.png'));
await write(sharp(splash).png(), path.join(out, 'splash-2732.png'));

// Android launcher icons.
const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(densities)) {
  const dir = path.join(res, `mipmap-${d}`);
  const legacy = Math.round(48 * k), layer = Math.round(108 * k);
  await write(png(iconFull, legacy), path.join(dir, 'ic_launcher.png'));
  const full = await png(iconFull, legacy).toBuffer();
  const mask = await png(circleMask, legacy).toBuffer();
  await write(sharp(full).composite([{ input: mask, blend: 'dest-in' }]).png(), path.join(dir, 'ic_launcher_round.png'));
  await write(png(iconForeground, layer), path.join(dir, 'ic_launcher_foreground.png'));
  await write(png(iconBackground, layer), path.join(dir, 'ic_launcher_background.png'));
}
fs.writeFileSync(path.join(res, 'mipmap-anydpi-v26/ic_launcher.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`);
fs.writeFileSync(path.join(res, 'mipmap-anydpi-v26/ic_launcher_round.xml'),
  fs.readFileSync(path.join(res, 'mipmap-anydpi-v26/ic_launcher.xml')));
console.log('wrote android adaptive icon XML');

// Android splash screens: every existing splash.png, re-rendered at its own size.
const splashFiles = fs.readdirSync(res).filter(d => d.startsWith('drawable'))
  .map(d => path.join(res, d, 'splash.png')).filter(f => fs.existsSync(f));
for (const f of splashFiles) {
  const { width, height } = await sharp(f).metadata();
  await write(sharp(splash).resize(width, height, { fit: 'cover' }).png(), f);
}

// iOS: App Store icons must not have an alpha channel.
await write(png(iconFull, 1024).flatten({ background: RIVER_BOTTOM }).removeAlpha(),
  path.join(xcassets, 'AppIcon.appiconset/AppIcon-512@2x.png'));
for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  await write(sharp(splash).png(), path.join(xcassets, 'Splash.imageset', name));
}
