// One-off: rasterise le logo SVG en icônes PNG PWA (192/512 + maskable + apple-touch).
// Usage: npm i --no-save sharp && node scripts/gen-icons.mjs
// Design : anneau de progression aux 3 couleurs des disciplines (natation, vélo, CAP)
// autour du « pic » IronKit (montagne/delta) en dégradé accent. Géométrie pure, pas de
// texte → rendu identique partout. Même identité que public/favicon.svg.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'icons')
mkdirSync(out, { recursive: true })

const DEFS = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a202c"/>
      <stop offset="100%" stop-color="#0b0d13"/>
    </linearGradient>
    <linearGradient id="peak" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff8038"/>
      <stop offset="100%" stop-color="#ff5a36"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.62" r="0.55">
      <stop offset="0%" stop-color="#ff5a36" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#ff5a36" stop-opacity="0"/>
    </radialGradient>
  </defs>`

// Contenu centré (anneau + pic) — partagé entre icône standard et maskable.
// Anneau r=168 : 3 arcs de 92° (caps ronds), couleurs = tokens disciplines de l'app.
const MARK = `
  <circle cx="256" cy="256" r="168" fill="none" stroke="#222937" stroke-width="40"/>
  <path d="M296.6 93 A168 168 0 0 1 417.5 302.3" fill="none" stroke="#2dd4d8"
        stroke-width="40" stroke-linecap="round"/>
  <path d="M376.9 372.7 A168 168 0 0 1 135.2 372.7" fill="none" stroke="#ffb14e"
        stroke-width="40" stroke-linecap="round"/>
  <path d="M94.5 302.3 A168 168 0 0 1 215.4 93" fill="none" stroke="#ff6b8a"
        stroke-width="40" stroke-linecap="round"/>
  <path d="M256 164 L348 336 L164 336 Z" fill="url(#peak)" stroke="url(#peak)"
        stroke-width="26" stroke-linejoin="round"/>`

// Icône standard : coins arrondis (rx en unités du viewBox 512).
const iconSvg = (round) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  ${DEFS}
  <rect width="512" height="512" rx="${round}" fill="url(#bg)"/>
  <rect width="512" height="512" rx="${round}" fill="url(#glow)"/>
  ${MARK}
</svg>`

// Maskable : fond plein bord à bord + contenu réduit dans la safe-zone (~80% central).
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  ${DEFS}
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect width="512" height="512" fill="url(#glow)"/>
  <g transform="translate(256 256) scale(0.72) translate(-256 -256)">${MARK}
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
