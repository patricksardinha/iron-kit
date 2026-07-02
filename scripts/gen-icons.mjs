// One-off: rasterise le logo SVG en icônes PNG PWA (192/512 + maskable + apple-touch).
// Usage: node scripts/gen-icons.mjs   (nécessite `sharp` en devDep temporaire)
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'icons')
mkdirSync(out, { recursive: true })

const tri = `
  <defs>
    <linearGradient id="tri" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#33C0D0"/>
      <stop offset="50%" stop-color="#F5A65B"/>
      <stop offset="100%" stop-color="#EC6A80"/>
    </linearGradient>
  </defs>`

// Icône standard : coins arrondis, anneau + E qui remplissent le cadre.
const iconSvg = (round) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  ${tri}
  <rect width="512" height="512" rx="${round}" fill="#0F1216"/>
  <circle cx="256" cy="256" r="150" fill="none" stroke="#1E2430" stroke-width="40"/>
  <circle cx="256" cy="256" r="150" fill="none" stroke="url(#tri)" stroke-width="40"
          stroke-linecap="round" stroke-dasharray="710 942" transform="rotate(-90 256 256)"/>
  <text x="256" y="300" text-anchor="middle" font-family="sans-serif"
        font-size="168" font-weight="700" fill="#ECEEF2">E</text>
</svg>`

// Maskable : fond plein + contenu réduit dans la safe-zone (~80% central).
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  ${tri}
  <rect width="512" height="512" fill="#0F1216"/>
  <g transform="translate(256 256) scale(0.72) translate(-256 -256)">
    <circle cx="256" cy="256" r="150" fill="none" stroke="#1E2430" stroke-width="40"/>
    <circle cx="256" cy="256" r="150" fill="none" stroke="url(#tri)" stroke-width="40"
            stroke-linecap="round" stroke-dasharray="710 942" transform="rotate(-90 256 256)"/>
    <text x="256" y="300" text-anchor="middle" font-family="sans-serif"
          font-size="168" font-weight="700" fill="#ECEEF2">E</text>
  </g>
</svg>`

async function png(svg, size, name) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(out, name))
  console.log('  ✓', name)
}

await png(iconSvg(96), 192, 'pwa-192.png')
await png(iconSvg(112), 512, 'pwa-512.png')
await png(maskableSvg, 512, 'pwa-maskable-512.png')
await png(iconSvg(0), 180, 'apple-touch-icon.png')
console.log('Icons generated in public/icons/')
