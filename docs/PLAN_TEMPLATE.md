# Créer et importer un plan dans IronKit

IronKit peut gérer **plusieurs plans** en parallèle (chacun garde ses propres validations, notes
et modifications). Tu peux créer ton propre plan dans un simple fichier JSON, puis l'importer via
**Réglages → Plans → Importer un plan**.

Un modèle prêt à remplir est téléchargeable dans l'app (**Réglages → Plans → Modèle de plan**) ou
ici : [`public/plan-template.json`](../public/plan-template.json).

---

## Structure du fichier

```jsonc
{
  "name": "Mon plan",            // nom affiché (obligatoire)
  "start": "2026-01-05",         // lundi de la 1re semaine (ISO, optionnel → aujourd'hui)
  "weeks": [ … ],                // liste des semaines (obligatoire)
  "sessions": { … }              // catalogue de séances détaillées (optionnel)
}
```

### Une semaine

```jsonc
{
  "phase": "0 - Fondation",   // libellé de phase : "0 - …", "1 - …", "2 - …", "3 - …"
  "typ": "Charge",            // Charge | Récup | Affût. | PIC | TEST 70.3 | COURSE
  "obj": "Objectif de la semaine.",
  "days": [                    // EXACTEMENT 7 entrées : Lundi → Dimanche
    "Repos / mobilité",
    "Nat technique 40'",
    "Vélo Z2 1h",
    "CAP facile 45' + gainage 10'",
    "Repos / mobilité",
    "Vélo long vallonné 2 h",
    "CAP longue 1h"
  ]
}
```

- Chaque jour est **une chaîne de texte**. `Repos…` = jour de repos (non validable).
- Plusieurs séances dans un jour : sépare-les par ` + ` (ex. `CAP 45' + gainage 10'`).
- Les **durées** se lisent dans le texte : `1h`, `1h15`, `45'`, `2.5 h`, ou une distance de nage
  `2000 m` / `3,8 km` (convertie en minutes estimées).

---

## Détail des séances : deux options

Quand on déplie **« Détail »** sur une séance, l'app affiche un déroulé (échauffement, corps,
points clés, progression). Ce déroulé est **résolu automatiquement** à partir du libellé du jour.

### Option A — ne rien fournir (le plus simple)

Omets `sessions`. L'app utilise alors son **catalogue intégré** (natation, vélo, course, brick,
gainage…). Écris juste des libellés contenant les bons mots-clés :

| Discipline | Mots-clés (dans l'ordre de priorité) |
|-----------|--------------------------------------|
| Natation (`Nat …`) | `eau libre`/`EL` · `seuil` · `continu` · `technique` · `facile`/`déliage` · sinon endurance |
| Vélo (`Vélo …`) | `côtes`/`bosse`/`col` · `sweet spot`/`SS` · `long`/`montagne`/`vallonné`/`dénivelé` · `facile` · sinon Z2 |
| Course (`CAP …`) | `allure IM` · `qualité`/`seuil`/`N×N'` · `longue` · `ligne`/`accél`/`vifs` · sinon footing |
| Spéciaux | `brick` → enchaînement · `gainage`/`renfo` → renfo · `activation` · `>>>` → épreuve |

### Option B — fournir ton propre catalogue

Renseigne `sessions` : un objet indexé par **code**, chaque code décrivant une séance.

```jsonc
"sessions": {
  "nat_tech": {
    "name": "Natation — Technique",
    "disc": "swim",                 // swim | bike | run | rest | race
    "goal": "But de la séance.",
    "blocks": [
      { "h": "Échauffement (~10')", "items": ["200 m souple", "4×25 m éducatifs"] },
      { "h": "Corps (~20')", "items": ["Séries courtes propres, récup 15\""] }
    ],
    "cues": ["Point clé 1", "Point clé 2"],   // optionnel
    "prog": "Logique de progression."          // optionnel
  }
}
```

Les **codes** attendus correspondent aux mots-clés ci-dessus :
`nat_tech`, `nat_cont`, `nat_endur`, `nat_seuil`, `nat_el`, `nat_recup`,
`velo_z2`, `velo_ss`, `velo_cotes`, `velo_long`, `velo_recup`,
`cap_qual`, `cap_im`, `cap_long`, `cap_activation`, `cap_recup`,
`brick`, `gainage`, `repos`, `activation_race`, `race`.

> Tu n'es pas obligé de tous les définir : un code manquant retombe sur le catalogue intégré.

---

## Après l'import

- Le plan importé devient **actif** immédiatement.
- Tu peux **éditer** n'importe quelle séance dans l'onglet **Plan** (durées, détails, blocs…) :
  les modifications restent **propres à ce plan**.
- Bascule entre tes plans depuis **Réglages → Plans**.
