const fs = require('fs');
const path = require('path');

// Simple script ensuring icon files exist
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="110" fill="#09090b"/>
  <rect x="16" y="16" width="480" height="480" rx="94" fill="none" stroke="#27272a" stroke-width="12"/>
  <circle cx="256" cy="256" r="180" fill="none" stroke="#10b981" stroke-width="16" stroke-dasharray="8 8"/>
  <path d="M160 320 L220 220 L290 280 L352 170" fill="none" stroke="#10b981" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="352" cy="170" r="16" fill="#06b6d4"/>
  <path d="M180 370 C 220 350, 290 350, 332 370" fill="none" stroke="#f97316" stroke-width="14" stroke-linecap="round"/>
  <circle cx="256" cy="130" r="28" fill="#10b981"/>
</svg>`;

const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
console.log('Icons prepared in public/');
