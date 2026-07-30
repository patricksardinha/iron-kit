# IronKit

**IronKit** est une PWA mobile-first de suivi d'entraînement triathlon : elle affiche un plan
d'entraînement semaine par semaine, permet de **valider chaque séance** (entièrement, partiellement
ou pas du tout), et transforme cette assiduité en **progression visible** — statistiques,
graphiques, badges.

Née pour préparer un **Full Distance à Evian (LÉ-MAN, 12-13 sept. 2027)** — 3,8 km de natation,
180 km de vélo (~3900 m D+), marathon — l'app embarque le plan de 62 semaines correspondant, mais
gère aussi **plusieurs plans** créés ou importés au format JSON.

📖 **[Guide utilisateur](docs/GUIDE_UTILISATEUR.md)** · 🛠️ **[Créer son propre plan](docs/PLAN_TEMPLATE.md)**

## Le principe

Trois idées structurent l'app :

1. **Le plan est une donnée, pas du code.** Les semaines, séances et recettes vivent dans des JSON
   (`public/plan.json`, `public/sessions.json`, `public/recipes.json`). L'app les lit au runtime ;
   rien n'est hardcodé.
2. **Le plan et la réalité sont séparés.** L'onglet *Plan* édite la théorie (les semaines prévues).
   L'onglet *Semaine* enregistre la réalité : validations séance par séance (avec les minutes
   réellement faites), notes de ressenti, séances déplacées d'un jour à l'autre par drag & drop.
   La réalité prime à l'affichage, sans jamais altérer le plan.
3. **Aucun backend, aucun compte.** Tout est stocké en `localStorage` sur l'appareil.
   L'app est **offline-first** : après la première visite, elle fonctionne intégralement sans
   réseau (service worker + precache). Une sauvegarde JSON export/import permet de changer
   d'appareil.

## Les onglets

| Onglet | Rôle |
|---|---|
| **Semaine** | La semaine courante : valider les séances, ajuster les minutes, déplacer une séance (drag & drop), noter son ressenti, valider les tests/jalons |
| **Progrès** | Anneau de progression global, série en cours, heures cumulées, graphiques de volume et par discipline, prochain test |
| **Plan** | Éditer le plan : semaines (dates, phase, type, objectif), séances par jour, détail des séances, options globales (Tai Chi…) |
| **Badges** | Récompenses par paliers (régularité, volume, disciplines…) + badges secrets |
| **Frigo** | Saisir les ingrédients disponibles → recettes réalisables (ou presque, avec la liste de ce qui manque) |
| **Réglages** | Profil, thèmes et accents, gestion multi-plans (import/modèle), sauvegarde export/import |

## Stack

- **Vite + React 19 + TypeScript (strict)** — aucun state manager, hooks maison
- **PWA** via `vite-plugin-pwa` (Workbox) : manifest + precache de l'app shell, des JSON de données
  et des polices → offline total après la première visite
- **@dnd-kit** pour le drag & drop des séances (vue Semaine + éditeur de plan)
- **Polices auto-hébergées** (`@fontsource`, woff2) — aucun CDN
- **CSS vanilla** avec design tokens (`src/styles/tokens.css`) : thèmes et accents = jeux de
  variables CSS

## Structure du projet

```
public/
  plan.json            # les 62 semaines du plan intégré (source de vérité)
  sessions.json        # catalogue des séances détaillées (échauffement, blocs, consignes)
  recipes.json         # recettes de l'onglet Frigo
  plan-template.json   # modèle téléchargeable pour créer son propre plan
  icons/               # icônes PWA générées (voir scripts/gen-icons.mjs)
src/
  App.tsx              # racine : chargement des données, onglets, composition des hooks
  types.ts             # tous les types partagés (Week, Session, State, Recipe…)
  hooks/
    useData.ts         # fetch des JSON publics (plan, sessions, recettes)
    usePlans.ts        # registre multi-plans (plan actif, import, stockage cloisonné par plan)
    usePlan.ts         # plan éditable : surcouche persistée par-dessus le plan de base
    useAppState.ts     # état utilisateur : validations, notes, verrous, layout, tests
    useSettings.ts     # profil + thème/accent
  lib/
    logic.ts           # logique métier pure (dates, clés d'état, fusion plan/layout)
    stats.ts           # agrégats de progression (streak, heures, séries hebdo)
    badges.ts          # définitions et calcul des badges
    storage.ts         # (dé)sérialisation localStorage + sanitisation des imports
    migrate.ts         # migration des formats de plan (rétro-compatibilité)
    dnd.ts             # utilitaires drag & drop partagés
    constants.ts       # jalons/tests, phases, couleurs de phase
  components/          # un fichier par écran ou composant (WeekScreen, PlanScreen…)
  styles/              # tokens.css (variables), global.css (tout le style), fonts.css
scripts/
  gen-icons.mjs        # régénère les PNG PWA depuis le design SVG
docs/
  GUIDE_UTILISATEUR.md # guide complet côté utilisateur
  PLAN_TEMPLATE.md     # format JSON d'un plan importable
```

### Modèle de données (résumé)

- Une **semaine** = 7 jours (Lun → Dim), chaque jour = liste de **séances**
  (`disc` : swim/bike/run/strength/race/other, `detail`, `min`).
- L'**état utilisateur** (par plan) : `sessions` (clé `wk-jour-séance` → minutes faites),
  `notes`, `locks` (cartes verrouillées), `layout` (agencement réel après drag & drop),
  `tests` (jalons validés), `options` (Tai Chi…).
- Chaque plan a son stockage cloisonné (`ik-state-<id>`, `ik-plan-<id>`…) ; en changer ne mélange
  jamais les données.

## Commandes

```bash
npm install       # dépendances
npm run dev       # serveur de dev (http://localhost:5173) — service worker actif
npm run build     # typecheck strict (tsc -b) + build de prod → dist/
npm run preview   # sert dist/ localement (test PWA réelle)
npm run typecheck # typecheck seul
```

## Déploiement

Le déploiement est assuré par **l'intégration GitHub de Vercel** — c'est pourquoi il n'y a **aucun
workflow YAML** dans le repo : ce n'est pas GitHub Actions qui build, c'est Vercel qui observe le
dépôt via son app GitHub. À chaque push sur `main`, Vercel clone, exécute `npm run build` et publie
`dist/` en **Production** (les autres branches donnent des *Preview deployments*). La configuration
côté repo tient dans [`vercel.json`](vercel.json) : framework, commande de build, et surtout les
en-têtes `Cache-Control: must-revalidate` sur `sw.js` / `manifest.webmanifest`, indispensables pour
que les mises à jour de la PWA soient détectées par les appareils déjà installés.

Les releases sont des **tags git annotés** (`v2.3.0`, …) poussés avec le commit de version.

## Icônes

Le design (anneau tri-discipline + pic accent) vit dans `public/favicon.svg` et dans
`scripts/gen-icons.mjs` (source des PNG). Pour régénérer après modification :

```bash
npm i --no-save sharp && node scripts/gen-icons.mjs
```

Les PNG produits (192/512, maskable, apple-touch) sont versionnés dans `public/icons/`.
