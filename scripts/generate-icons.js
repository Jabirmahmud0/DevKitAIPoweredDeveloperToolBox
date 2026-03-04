// Simple script to generate PWA icons using canvas (Node.js with canvas package)
// Or use an online generator. For now, we'll create a simple SVG icon.

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon that can be used as a base
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c6af5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#38bdf8;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="url(#bgGrad)"/>
  
  <!-- DK Letters -->
  <text x="50%" y="55%" text-anchor="middle" fill="white" font-size="200" font-weight="bold" font-family="Arial, sans-serif" filter="url(#glow)">DK</text>
  
  <!-- Decorative code brackets -->
  <text x="28%" y="75%" text-anchor="middle" fill="white" font-size="80" font-weight="bold" opacity="0.3">&lt;</text>
  <text x="72%" y="75%" text-anchor="middle" fill="white" font-size="80" font-weight="bold" opacity="0.3">/&gt;</text>
</svg>`;

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon);

console.log('SVG icon created at public/icons/icon.svg');
console.log('For production PWA, convert this SVG to PNG at 192x192 and 512x512 using a tool like:');
console.log('  - https://cloudconvert.com/svg-to-png');
console.log('  - Or use ImageMagick: convert -density 1024 icon.svg -resize 512x512 icon-512x512.png');
