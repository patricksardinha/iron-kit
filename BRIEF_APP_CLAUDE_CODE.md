# Objectif Evian — App de suivi d'entraînement · Brief de développement

> Brief destiné à Claude Code. Il décrit **quoi** construire et les **critères d'acceptation**.
> Un prototype mono-fichier (`objectif-ironman.html`) et les données (`plan.json`) sont fournis en référence.

---

## 1. Contexte

Préparation d'un triathlon **Full Distance à Evian (LÉ-MAN)**, le **12-13 septembre 2027** :
3,8 km natation (lac Léman) · 180 km vélo (**~3900 m D+**, cols) · 42,195 km course.

Le plan couvre **62 semaines** (lun. 6 juil. 2026 → semaine de course). L'utilisateur veut une app
mobile **simple** : voir le plan, **valider ou non** chaque séance, et **suivre sa progression**.

Un prototype HTML mono-fichier existe déjà et sert de **référence UX/design**. Objectif ici :
le **reconstruire proprement** en projet structuré (Vite/TS), corriger le bug connu, et le rendre
installable/offline.

---

## 2. Objectif du produit

Une **PWA mobile-first (priorité Android)**, installable sur l'écran d'accueil, **offline-first**,
**sans backend ni compte**. Toutes les données restent **en local** sur l'appareil.

---

## 3. Stack recommandée

- **Vite + React 19 + TypeScript (strict)**.
- **PWA** via `vite-plugin-pwa` (manifest + service worker, precache de l'app shell **et** de `plan.json` + `nutrition.json` + `sessions.json`).
- **Persistance locale uniquement** : `localStorage` (simple) ou IndexedDB via `idb-keyval`. Pas de réseau au runtime.
- **Styles** : CSS + variables (tokens §8). Tailwind accepté si préféré, mais garder les tokens.
- **Polices auto-hébergées** (woff2) pour un offline réel — ne pas dépendre du CDN Google Fonts.

---

## 4. Données source (`plan.json`)

`plan.json` est **la seule source de vérité** du contenu du plan. Ne pas dupliquer/hardcoder les séances ailleurs.

Tableau de 62 objets, un par semaine :

```jsonc
{
  "wk": 1,                      // numéro de semaine 1..62
  "dates": "6 juil → 12 juil 2026",
  "phase": "0 — Fondation",    // une des 4 phases (voir §7)
  "typ": "Charge",             // Charge | Récup | Affût. | TEST 70.3 | COURSE
  "obj": "…",                  // objectif de la semaine (texte)
  "vol": 7,                     // volume cible en heures
  "days": ["Nat …","CAP …","Vélo …","Nat …","Repos / mobilité","Vélo …","CAP …"]
                                // 7 libellés, index 0=Lundi … 6=Dimanche
}
```

### `nutrition.json` (contenu de l'onglet Nutrition)

Tableau de sections, chacune avec une couleur d'accent (token, cf. §8) et une liste d'items :

```jsonc
[
  {
    "title": "Petit-déjeuner",
    "accent": "swim",          // token couleur : swim | bike | run | p3 …
    "items": [
      { "h": "Avant une longue séance (matin)", "t": "Glucides hauts, peu de fibres…" }
    ]
  }
]
```

Contenu **statique** (fourni, de confiance) : à rendre tel quel, pas d'échappement nécessaire.

### `sessions.json` (bibliothèque de séances détaillées)

Objet indexé par **code de séance**. Chaque entrée décrit la séquence complète d'un type de séance
(échauffement → corps → retour au calme, points clés, progression) :

```jsonc
{
  "nat_tech": {
    "name": "Natation — Technique crawl",
    "disc": "swim",                       // swim | bike | run | rest | race
    "goal": "…",
    "blocks": [ { "h": "Échauffement (~10')", "items": ["…","…"] } ],
    "cues": ["…"],                        // optionnel : points clés
    "prog": "…"                            // optionnel : logique de progression
  },
  "brick": { … }, "gainage": { … }, …
}
```

**Résolution libellé → code** : le plan (`plan.json`) contient des libellés courts (« Nat technique 40'… »,
« Vélo côtes : 5×4'… »). L'app doit **classer** chaque libellé vers un code de `sessions.json` via une
fonction `classifySession(label)` (règles par mot-clé, dans l'ordre) :

```
>>> → race · commence par "Activation" → activation_race · "Repos" → repos
Nat : "eau libre"/"EL"→nat_el · "seuil"→nat_seuil · "continu"→nat_cont · "technique"→nat_tech ·
      "facile"/"déliage"→nat_recup · sinon nat_endur
Vélo: "côtes"/"bosse"→velo_cotes · "sweet spot"/"SS"→velo_ss ·
      "long"/"montagne"/"vallonné"/"dénivelé"→velo_long · "facile"/intervalles courts→velo_recup · sinon velo_z2
CAP : "allure IM"→cap_im · "qualité"/"N×N'"/"seuil"→cap_qual · "longue"→cap_long ·
      "ligne"/"accél"/"vifs"→cap_activation · sinon cap_recup
```

De plus : si le libellé contient « brick » → **ajouter** le bloc `sessions.brick` ; s'il contient « gainage »
→ ajouter `sessions.gainage`. (Les distances/répétitions/durées propres à la semaine restent lues dans le
libellé ; `sessions.json` fournit la *méthode*.)

---

## 5. Correctif OBLIGATOIRE (vs prototype)

1. **Tai Chi indépendant de la validation du jour.**
   Dans le prototype, une fois la séance du jour cochée, l'overlay de la carte interceptait le clic
   sur le bouton Tai Chi (impossible à cocher). Le Tai Chi se fait **le soir, après la séance** :
   il DOIT rester cochable/décochable **même quand la séance du jour est validée**, et inversement.
   Ce sont **deux états séparés** par jour.
   → *Critère* : dans les deux ordres (séance puis Tai Chi / Tai Chi puis séance), les deux se cochent sans se bloquer.

---

## 6. Modèle d'état utilisateur

```ts
type State = {
  done:   Record<string, true>;   // clé `${wk}-${dayIndex}` → séance validée
  taichi: Record<string, true>;   // clé `${wk}-${dayIndex}` → Tai Chi fait (indépendant)
  notes:  Record<string, string>; // clé `${wk}-${dayIndex}` → note / ressenti libre
};
```

- `dayIndex` : 0=Lundi … 6=Dimanche.
- Persister sous **une seule clé** `objectif-evian-state-v1` (JSON). Charger au boot, sauver à chaque toggle.
- Prévoir un **export/import JSON** de l'état (bouton discret) pour backup/changement d'appareil.

---

## 7. Constantes & logique

```ts
const START = new Date(2026, 6, 6);   // lundi 6 juil. 2026 (mois 0-indexé)
const RACE  = new Date(2027, 8, 12);  // 12 sept. 2027

dateOfDay(wk, di) = START + ((wk-1)*7 + di) jours
currentWeekIndex(today):
  si today < START → 1
  sinon clamp(1, 62, floor((today-START)/7j) + 1)

isTraining(label) = !label.startsWith("Repos")   // les repos ne sont pas validables ni comptés

disciplineOf(label):
  startsWith "Nat"        → { key:"swim", color: swim }
  startsWith "Vélo"       → { key:"bike", color: bike }
  startsWith "CAP"        → { key:"run",  color: run  }
  startsWith "Repos"|"Activation" → repos
  contient ">>>"          → épreuve (course)
  sinon                   → autre
```

Jalons (pour l'onglet Progression) :

```ts
const JALONS = [
  { wk:4,  t:"Test natation",           d:"200 m crawl continu (départ ~50 m). Respiration bilatérale." },
  { wk:8,  t:"Bike fit réalisé",        d:"Position validée par un pro." },
  { wk:16, t:"Fin de fondation",        d:"400 m crawl continu · vélo 3 h vallonné · course saine." },
  { wk:24, t:"Home trainer rentabilisé",d:"Force/FTP en hausse · 1000 m continu · 1er brick." },
  { wk:32, t:"Fin de construction",     d:"1500 m continu · vélo 4 h · enchaînement fluide." },
  { wk:40, t:"Eau libre lancée",        d:"Combinaison (lac), sighting, rolling start." },
  { wk:42, t:"Test montagne vélo",      d:"2 cols sur une sortie longue · 2000+ m D+." },
  { wk:47, t:"Course test (Half)",      d:"Finir un half vallonné. Tester nutrition/transitions." },
  { wk:55, t:"Pic de charge",           d:"Vélo 5-6 h montagne (2500-3000 D+) · brick long · 3,8 km eau libre." },
  { wk:62, t:"LÉ-MAN Evian",            d:"Le jour J. ~14-16 h visées." },
];
```

---

## 8. Design tokens (repris du prototype — à conserver)

Thème **sombre**, mobile-first (viewport ~380px), zones tactiles généreuses, `env(safe-area-inset-*)`.

```css
--bg:#0F1216; --surface:#171B22; --surface2:#1E2430; --line:#2A3242;
--text:#ECEEF2; --muted:#868FA0; --faint:#5A6274;
/* disciplines */
--swim:#33C0D0; --bike:#F5A65B; --run:#EC6A80; --taichi:#A99BEA;
/* phases */
--p0:#4C86C6; --p1:#6BA644; --p2:#D4A72C; --p3:#D65563;
--good:#4FBF8B;
```

- **Typo** : `Space Grotesk` (titres + chiffres, `font-feature-settings:"tnum"`) + `Inter` (corps).
- **Signature** : l'anneau de progression avec dégradé `swim → bike → run` (les 3 disciplines).
- Phases : `0 — Fondation`→`--p0`, `1 — Construction`→`--p1`, `2 — Spécifique`→`--p2`, `3 — Pic & Affûtage`→`--p3`.

---

## 9. Écrans (navigation par onglets en bas)

### Onglet 1 — « Semaine » (par défaut)
- S'ouvre sur la **semaine du jour** (`currentWeekIndex`).
- En-tête : `Sem. N / 62`, dates, **chip phase** (couleur), **badge type**, **objectif** de la semaine,
  **barre de progression** `X/Y validées` (Y = nb de séances non-repos).
- **7 cartes jour** (Lun→Dim) : nom + date, libellé séance, **liseré couleur discipline**, **bouton check**.
  - Repos → carte grisée, non validable.
  - Tap carte (hors repos) → **toggle validée** (remplissage couleur discipline + coche).
  - **Chip Tai Chi** sur **chaque** jour (repos inclus) → toggle **indépendant** (cf. §5).
  - **Note / ressenti par jour** : bouton 📝 sur chaque carte → ouvre une zone de saisie (`textarea`, placeholder « Ressenti, allure, sensations, météo, douleurs… »). **Sauvegarde auto** à la frappe. Aperçu (2 lignes, tronqué) sous le libellé quand une note existe. **Indépendant** de la validation et du Tai Chi.
  - **Détail de la séance** (dépliable) : bouton « Détail de la séance » sur chaque carte → affiche la séquence complète résolue via `classifySession(label)` + `sessions.json` (objectif, blocs échauffement/corps/retour au calme, points clés, progression), + bloc **brick**/**gainage** si le libellé les mentionne. Rendu **paresseux** (au 1er dépliage). Disponible aussi sur les jours de repos et de course.
  - Jour courant mis en évidence ; jour **passé non validé** (hors repos) signalé (accent rouge/barré).
- **Navigation** : semaine précédente / suivante (bornes 1 et 62) + bouton flottant **« Semaine du jour »** quand on n'y est pas.

### Onglet 2 — « Progression »
- **Anneau** : `% séances validées / total` (dégradé swim→bike→run), centre = `%` + `X / Y séances`.
- **4 stats** : Cette semaine `X/Y` · Série en cours (jours d'entraînement **passés** consécutifs validés) ·
  Heures validées `≈ Σ(fraction validée d'une semaine × vol) / ~522 h` · Tai Chi (nb de jours cochés).
- **Barres par discipline** : natation / vélo / course = validées / planifiées.
- **Barres par phase** : les 4 phases, % validé.
- **Prochain jalon** : premier `JALONS` avec `wk ≥ semaine courante` (titre, échéance en semaines, description).
- **Compte à rebours** `J−x` jusqu'à `RACE`.

### Onglet 3 — « Plan »
- Liste des **62 semaines**, **groupées par phase** (en-tête coloré).
- Ligne : n° (couleur phase), dates, `type · vol h`, mini-barre de progression, `X/Y`. Semaine courante mise en évidence.
- Tap une ligne → ouvre l'onglet **Semaine** sur cette semaine.

### Onglet 4 — « Nutrition »
- Rend le contenu de `nutrition.json` : pour chaque **section** (Petit-déjeuner, Déjeuner, Dîner, Carburant course), un en-tête coloré (couleur = token `accent`) puis une **carte par item** (`h` en titre gras, `t` en corps), avec un liseré gauche à la couleur de la section.
- Contenu **lecture seule**, statique. Défilement vertical simple.

---

## 10. PWA / installation

- `manifest.webmanifest` : `name:"Objectif Evian"`, `short_name:"Evian"`, `theme_color:"#0F1216"`,
  `background_color:"#0F1216"`, `display:"standalone"`, `start_url:"."`, icônes **192** et **512** (maskable incluse).
- **Service worker** : precache app shell + `plan.json` + `nutrition.json` + `sessions.json` → **offline complet** après 1re visite.
- Doit être **installable sur Android** (« Ajouter à l'écran d'accueil » / bannière d'installation) et s'ouvrir en plein écran.

---

## 11. Non-objectifs (v1)

- Pas de backend, pas de compte, pas de synchro multi-appareils.
- Pas d'édition du plan **dans** l'app : le contenu vient de `plan.json` (l'édition = régénérer les fichiers en amont).
- Pas de GPS / capteurs / import Strava-Garmin.

---

## 12. Critères d'acceptation (checklist)

- [ ] L'app s'ouvre sur la **semaine du jour** ; navigation prev/next bornée à 1..62 ; bouton retour semaine du jour.
- [ ] Toutes les séances proviennent de `plan.json` (aucune séance hardcodée).
- [ ] Tap sur une carte non-repos la valide/dévalide ; état persistant après rechargement.
- [ ] **Tai Chi cochable indépendamment**, y compris quand la séance du jour est validée (les deux ordres). *(bug corrigé)*
- [ ] Les cartes **Repos** ne sont pas validables et ne comptent pas dans `X/Y`.
- [ ] **Note par jour** : bouton 📝 ouvre une saisie, sauvegarde auto, aperçu affiché quand une note existe, persistante ; indépendante de la validation et du Tai Chi.
- [ ] **Onglet Nutrition** présent, alimenté par `nutrition.json` (4 sections, cartes par item).
- [ ] **Détail de séance** dépliable sur chaque carte, résolu via `classifySession` + `sessions.json` (blocs, points clés, progression ; + brick/gainage) ; chaque libellé du plan mappe vers un code existant.
- [ ] Onglet Progression : anneau, 4 stats, barres discipline & phase, prochain jalon, `J−x` cohérents avec l'état.
- [ ] Onglet Plan : 62 semaines groupées par phase, tap → ouvre la semaine.
- [ ] Persistance locale sous une clé unique ; **export/import JSON** de l'état fonctionnel.
- [ ] **PWA installable** sur Android + **fonctionne hors-ligne** (app + données) après 1re visite.
- [ ] Design fidèle aux tokens §8 ; mobile-first, zones tactiles ≥ 44px, safe-area gérée.
- [ ] TypeScript strict, build propre (`vite build`) sans erreurs.

---

## 13. Évolutions possibles (hors scope initial)

Saisie du **volume réel** par séance · notifications de rappel · thème clair ·
statistiques hebdo (graphe volume) · marquage explicite « manquée » vs simplement non validée.
