# Objectif Evian

PWA mobile-first (Android) de suivi d'entraînement pour la préparation d'un triathlon Full
Distance à Evian (LÉ-MAN, 12-13 sept. 2027). Plan de 62 semaines, **offline-first**, **sans backend
ni compte** — toutes les données restent en local sur l'appareil.

## Stack
- Vite + React 19 + TypeScript (strict)
- PWA via `vite-plugin-pwa` (manifest + service worker Workbox : precache app shell + `plan.json` +
  `recipes.json` + polices)
- Persistance `localStorage` sous une clé unique `objectif-evian-state-v1`
- Polices auto-hébergées (`@fontsource`, woff2) — aucun CDN, offline réel

## Sources de vérité (ne rien hardcoder)
- `public/plan.json` — les 62 semaines (une séance par jour). Lu au runtime, précaché.
- `public/recipes.json` — recettes de l'onglet Frigo (ingrédients en minuscules, noms simples).
Pour modifier le plan : régénérer ces fichiers (pas d'édition dans l'app).

## Commandes
```bash
npm install       # dépendances
npm run dev       # serveur de dev (http://localhost:5173) — SW actif (devOptions)
npm run build     # typecheck strict (tsc -b) + build de prod → dist/
npm run preview   # sert dist/ localement (utile pour tester la PWA installée)
```

## Tester l'installation PWA sur Android
La bannière « Ajouter à l'écran d'accueil » exige **HTTPS** (ou `localhost`). Deux options :

**A. Depuis un téléphone Android, sur le même réseau que le PC**
1. `npm run build && npm run preview -- --host` (Vite affiche une URL réseau `http://192.168.x.x:4173`).
2. HTTP hors localhost ne déclenche pas l'installation → passer par un tunnel HTTPS :
   `npx localtunnel --port 4173` (ou `ngrok http 4173`), ouvrir l'URL **https** dans Chrome Android.
3. Chrome propose « Installer l'application » (menu ⋮ → *Installer l'application* / bannière).
   L'icône apparaît sur l'écran d'accueil, l'app s'ouvre en plein écran (`standalone`).
4. **Test offline** : ouvrir l'app une fois (le SW precache tout), activer le mode avion, rouvrir →
   l'app et les données fonctionnent sans réseau.

**B. Émulateur / DevTools**
- Chrome desktop → DevTools → onglet *Application* → *Manifest* (vérifier icônes 192/512 + maskable)
  et *Service Workers*. *Lighthouse* → catégorie PWA pour l'audit « installable ».

## Icônes
Générées à partir de `public/favicon.svg` par `scripts/gen-icons.mjs` (nécessite `sharp` en install
temporaire : `npm i --no-save sharp && node scripts/gen-icons.mjs`). Les PNG produits sont versionnés
dans `public/icons/`.
