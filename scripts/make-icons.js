// ============================================================
// Generate real launcher assets from a brutalist SVG mark.
// Run:  node scripts/make-icons.js   (needs devDependency "sharp")
// Outputs: assets/icon.png, adaptive-icon.png, splash.png, favicon.png
// ============================================================
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');
const INK = '#0a0a0a';
const YELLOW = '#ffd400';
const PINK = '#ff5da2';
const BLUE = '#3b5bff';

// Brain mark authored for a 1024 canvas (centred ~512,500).
const BRAIN = `
  <g fill="${INK}">
    <circle cx="400" cy="360" r="120"/>
    <circle cx="520" cy="330" r="135"/>
    <circle cx="645" cy="360" r="120"/>
    <circle cx="340" cy="475" r="135"/>
    <circle cx="512" cy="460" r="155"/>
    <circle cx="690" cy="475" r="135"/>
    <circle cx="410" cy="585" r="135"/>
    <circle cx="615" cy="585" r="135"/>
    <circle cx="512" cy="620" r="150"/>
  </g>
  <g stroke="${YELLOW}" stroke-width="18" fill="none" stroke-linecap="round">
    <line x1="512" y1="295" x2="512" y2="715"/>
    <path d="M430 395 q-55 42 0 95"/>
    <path d="M398 522 q-55 42 0 95"/>
    <path d="M594 395 q55 42 0 95"/>
    <path d="M626 522 q55 42 0 95"/>
  </g>`;

function iconSvg() {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="${YELLOW}"/>
    <rect x="34" y="34" width="956" height="956" fill="none" stroke="${INK}" stroke-width="40"/>
    <rect x="72" y="72" width="150" height="150" fill="${PINK}" stroke="${INK}" stroke-width="14"/>
    <rect x="802" y="802" width="150" height="150" fill="${BLUE}" stroke="${INK}" stroke-width="14"/>
    ${BRAIN}
    <g transform="translate(512,872)">
      <rect x="-150" y="-34" width="300" height="68" fill="${INK}"/>
      <text x="0" y="18" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="46" fill="${YELLOW}" text-anchor="middle" letter-spacing="2">BRAIN</text>
    </g>
  </svg>`;
}

// transparent-bg mark, scaled into the adaptive safe zone (~0.62) / splash (~0.5)
function markSvg(scale) {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(512,512) scale(${scale}) translate(-512,-512)">${BRAIN}</g>
  </svg>`;
}

async function main() {
  fs.mkdirSync(ASSETS, { recursive: true });
  const out = (name) => path.join(ASSETS, name);

  await sharp(Buffer.from(iconSvg())).png().toFile(out('icon.png'));
  await sharp(Buffer.from(markSvg(0.62))).resize(1024, 1024).png().toFile(out('adaptive-icon.png'));
  await sharp(Buffer.from(markSvg(0.5))).resize(1200, 1200).png().toFile(out('splash.png'));
  await sharp(Buffer.from(iconSvg())).resize(48, 48).png().toFile(out('favicon.png'));

  console.log('✓ Generated: icon.png (1024), adaptive-icon.png (1024), splash.png (1200), favicon.png (48)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
