// Generate real social brand icons (PNG) for the login buttons.
// Run: node scripts/make-social-icons.js   (needs devDependency "sharp")
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'assets', 'social');

const GOOGLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
  <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
  <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/>
  <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
</svg>`;

const FACEBOOK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <path fill="#1877F2" d="M48 24C48 10.7 37.3 0 24 0S0 10.7 0 24c0 12 8.78 21.9 20.25 23.7V31H14.1v-7h6.15v-5.33c0-6.07 3.62-9.43 9.15-9.43 2.65 0 5.42.47 5.42.47v5.96h-3.05c-3.01 0-3.95 1.87-3.95 3.78V24h6.72l-1.07 7h-5.65v16.7C39.22 45.9 48 36 48 24z"/>
</svg>`;

const INSTAGRAM = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs><radialGradient id="ig" cx="0.3" cy="1.05" r="1.2">
    <stop offset="0" stop-color="#FED576"/><stop offset="0.26" stop-color="#F47133"/>
    <stop offset="0.61" stop-color="#BC3081"/><stop offset="1" stop-color="#4C63D2"/>
  </radialGradient></defs>
  <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#ig)"/>
  <circle cx="24" cy="24" r="9" fill="none" stroke="#fff" stroke-width="3.2"/>
  <circle cx="35" cy="13" r="2.5" fill="#fff"/>
</svg>`;

const TIKTOK_PATH =
  'M412.19,118.66a109.27,109.27,0,0,1-9.45-5.5,132.87,132.87,0,0,1-24.27-20.62c-18.1-20.71-24.86-41.72-27.35-56.43h.1C349.14,23.9,350,16,350.13,16H267.69V334.78c0,4.28,0,8.51-.18,12.69,0,.52-.05,1-.08,1.56,0,.23,0,.47-.05.71,0,.06,0,.12,0,.18a70,70,0,0,1-35.22,55.56,68.8,68.8,0,0,1-34.11,9c-38.41,0-69.54-31.32-69.54-70s31.13-70,69.54-70a68.9,68.9,0,0,1,21.41,3.39l.1-83.94a153.14,153.14,0,0,0-118,34.52,161.79,161.79,0,0,0-35.3,43.53c-3.48,6-16.61,30.11-18.2,69.24-1,22.21,5.67,45.22,8.85,54.73v.2c2,5.6,9.75,24.71,22.38,40.82A167.53,167.53,0,0,0,115,470.66v-.2l.2.2C155.11,497.78,199.36,496,199.36,496c7.66-.31,33.32,0,62.46-13.81,32.32-15.31,50.72-38.12,50.72-38.12a158.46,158.46,0,0,0,27.64-45.93c7.46-19.61,9.95-43.13,9.95-52.53V176.49c1,.6,14.32,9.41,14.32,9.41s19.19,12.3,49.13,20.31c21.48,5.7,50.42,6.9,50.42,6.9V131.27C453.86,132.37,433.27,129.17,412.19,118.66Z';
const TIKTOK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <path transform="translate(-18,-18)" fill="#25F4EE" d="${TIKTOK_PATH}"/>
  <path transform="translate(18,18)" fill="#FE2C55" d="${TIKTOK_PATH}"/>
  <path fill="#000000" d="${TIKTOK_PATH}"/>
</svg>`;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  // Supabase only supports Google & Facebook for our use-case (no Instagram/TikTok provider).
  const icons = { google: GOOGLE, facebook: FACEBOOK };
  for (const [name, svg] of Object.entries(icons)) {
    await sharp(Buffer.from(svg)).resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(OUT, `${name}.png`));
    process.stdout.write(`  ✓ ${name}.png\n`);
  }
  console.log('Done social icons → assets/social/');
}
main().catch((e) => { console.error(e); process.exit(1); });
