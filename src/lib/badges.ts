// Système de récompenses : set curé de badges nommés (+ easter eggs).
import type { Badge, BadgeTier, State, Week } from '../types'
import type { IconName } from '../components/Icon'
import { JALONS } from './constants'
import { sessionKey } from './logic'
import { weekProgress, phaseStats, currentStreak, countOption, optionTotal } from './stats'

interface Summary {
  streak: number
  sessions: number
  hours: number
  daysValidated: number
  swim: number
  bike: number
  run: number
  swimH: number
  bikeH: number
  runH: number
  triBalance: number
  perfectWeeks: number
  phasesDone: number
  weeksActive: number
  bricks: number
  taichi: number
  options: number
  notes: number
  raceDone: boolean
  tests: number // tests/jalons validés (bannière de l'onglet Semaine)
  layouts: number // semaines réorganisées (drag & drop dans Semaine)
  maxDaySessions: number // + de séances validées dans une même journée
  maxSessionMin: number // plus longue séance validée (minutes)
  maxWeekHours: number // plus gros volume réalisé sur une semaine (h)
}

function summarize(weeks: Week[], state: State, today: Date): Summary {
  let sessions = 0
  let minutes = 0
  let swim = 0
  let bike = 0
  let run = 0
  let swimMin = 0
  let bikeMin = 0
  let runMin = 0
  let daysValidated = 0
  let perfectWeeks = 0
  let weeksActive = 0
  let bricks = 0
  let raceDone = false
  let maxDaySessions = 0
  let maxSessionMin = 0
  let maxWeekHours = 0

  for (const w of weeks) {
    let touched = false
    let weekMin = 0
    w.days.forEach((day, di) => {
      let dBike = false
      let dRun = false
      let dayCount = 0
      day.forEach((sess, si) => {
        const k = sessionKey(w.wk, di, si)
        if (!(k in state.sessions)) return
        touched = true
        sessions++
        dayCount++
        const m = state.sessions[k]! || sess.min
        minutes += m
        weekMin += m
        if (m > maxSessionMin) maxSessionMin = m
        if (sess.disc === 'swim') (swim++, (swimMin += m))
        else if (sess.disc === 'bike') (bike++, (bikeMin += m), (dBike = true))
        else if (sess.disc === 'run') (run++, (runMin += m), (dRun = true))
        else if (sess.disc === 'race') raceDone = true
      })
      if (dayCount > maxDaySessions) maxDaySessions = dayCount
      if (dBike && dRun) bricks++
    })
    if (touched) weeksActive++
    if (weekMin / 60 > maxWeekHours) maxWeekHours = weekMin / 60
    const p = weekProgress(w, state.sessions)
    daysValidated += p.validated
    if (p.total > 0 && p.validated === p.total) perfectWeeks++
  }

  return {
    streak: currentStreak(weeks, state.sessions, today),
    sessions,
    hours: Math.round(minutes / 60),
    daysValidated,
    swim,
    bike,
    run,
    swimH: Math.round(swimMin / 60),
    bikeH: Math.round(bikeMin / 60),
    runH: Math.round(runMin / 60),
    triBalance: Math.min(swim, bike, run),
    perfectWeeks,
    phasesDone: phaseStats(weeks, state.sessions).filter((p) => p.pct === 100 && p.total > 0).length,
    weeksActive,
    bricks,
    taichi: countOption(state.options, 'Tai Chi'),
    options: optionTotal(state.options),
    notes: Object.keys(state.notes).length,
    raceDone,
    tests: Object.keys(state.tests).length,
    layouts: Object.keys(state.layout).length,
    maxDaySessions,
    maxSessionMin,
    maxWeekHours: Math.round(maxWeekHours * 10) / 10,
  }
}

interface Def {
  id: string
  group: string
  icon: IconName
  title: string
  desc: string
  tier: BadgeTier
  target: number
  value: (s: Summary) => number
  hidden?: boolean
}

// Set curé : chaque badge a un nom + une icône propres. Ordre = ordre d'affichage.
// Invariant d'affichage : chaque groupe compte un MULTIPLE DE 3 badges (grille 3 col.).
const DEFS: Def[] = [
  // — Premiers pas —
  { id: 'first-sess', group: 'Premiers pas', icon: 'sprout', title: 'Premier contact', desc: 'Valider ta toute première séance', tier: 'bronze', target: 1, value: (s) => s.sessions },
  { id: 'first-day', group: 'Premiers pas', icon: 'check-circle', title: 'Jour 1', desc: 'Boucler une première journée complète', tier: 'bronze', target: 1, value: (s) => s.daysValidated },
  { id: 'first-week', group: 'Premiers pas', icon: 'week', title: 'Sur les rails', desc: "S'entraîner sur une première semaine", tier: 'bronze', target: 1, value: (s) => s.weeksActive },
  { id: 'first-hour', group: 'Premiers pas', icon: 'clock', title: 'Mise en jambes', desc: '1 heure d’entraînement cumulée', tier: 'bronze', target: 1, value: (s) => s.hours },
  { id: 'first-note', group: 'Premiers pas', icon: 'note', title: 'Cher journal', desc: 'Écrire une première note de ressenti', tier: 'bronze', target: 1, value: (s) => s.notes },
  { id: 'first-move', group: 'Premiers pas', icon: 'grip', title: 'Tacticien', desc: 'Réorganiser une semaine (glisser une séance)', tier: 'bronze', target: 1, value: (s) => s.layouts },

  // — Régularité —
  { id: 'streak-3', group: 'Régularité', icon: 'flame', title: 'Ça chauffe', desc: '3 jours d’entraînement d’affilée', tier: 'bronze', target: 3, value: (s) => s.streak },
  { id: 'streak-7', group: 'Régularité', icon: 'flame', title: 'Semaine pleine', desc: '7 jours d’affilée sans rien lâcher', tier: 'silver', target: 7, value: (s) => s.streak },
  { id: 'streak-14', group: 'Régularité', icon: 'flame', title: 'Rouleau compresseur', desc: '14 jours consécutifs validés', tier: 'silver', target: 14, value: (s) => s.streak },
  { id: 'streak-21', group: 'Régularité', icon: 'flame', title: 'Trois semaines de feu', desc: '21 jours consécutifs validés', tier: 'gold', target: 21, value: (s) => s.streak },
  { id: 'streak-30', group: 'Régularité', icon: 'flame', title: 'Feu sacré', desc: '30 jours d’affilée. Rien ne t’arrête', tier: 'gold', target: 30, value: (s) => s.streak },
  { id: 'streak-60', group: 'Régularité', icon: 'infinity', title: 'Increvable', desc: '60 jours consécutifs. Surhumain', tier: 'special', target: 60, value: (s) => s.streak },

  // — Assiduité —
  { id: 'active-4', group: 'Assiduité', icon: 'week', title: 'Un mois dans les jambes', desc: '4 semaines actives', tier: 'bronze', target: 4, value: (s) => s.weeksActive },
  { id: 'active-8', group: 'Assiduité', icon: 'week', title: 'Bimestre solide', desc: '8 semaines actives', tier: 'silver', target: 8, value: (s) => s.weeksActive },
  { id: 'active-12', group: 'Assiduité', icon: 'week', title: 'Trimestre tenu', desc: '12 semaines actives', tier: 'silver', target: 12, value: (s) => s.weeksActive },
  { id: 'active-26', group: 'Assiduité', icon: 'week', title: 'Demi-saison', desc: '26 semaines actives', tier: 'gold', target: 26, value: (s) => s.weeksActive },
  { id: 'active-40', group: 'Assiduité', icon: 'week', title: 'Fond de train', desc: '40 semaines actives', tier: 'gold', target: 40, value: (s) => s.weeksActive },
  { id: 'active-52', group: 'Assiduité', icon: 'rosette', title: 'Une année de sueur', desc: '52 semaines actives', tier: 'special', target: 52, value: (s) => s.weeksActive },

  // — Volume horaire —
  { id: 'hours-10', group: 'Volume', icon: 'clock', title: 'Échauffement', desc: '10 heures d’entraînement cumulées', tier: 'bronze', target: 10, value: (s) => s.hours },
  { id: 'hours-25', group: 'Volume', icon: 'clock', title: 'Rythme trouvé', desc: '25 heures au compteur', tier: 'bronze', target: 25, value: (s) => s.hours },
  { id: 'hours-50', group: 'Volume', icon: 'clock', title: 'Dans le dur', desc: '50 heures au compteur', tier: 'silver', target: 50, value: (s) => s.hours },
  { id: 'hours-100', group: 'Volume', icon: 'medal', title: 'Centurion', desc: '100 heures d’entraînement', tier: 'gold', target: 100, value: (s) => s.hours },
  { id: 'hours-150', group: 'Volume', icon: 'mountain', title: 'Forgé dans l’effort', desc: '150 heures d’entraînement', tier: 'gold', target: 150, value: (s) => s.hours },
  { id: 'hours-250', group: 'Volume', icon: 'mountain', title: 'Machine de guerre', desc: '250 heures accumulées', tier: 'special', target: 250, value: (s) => s.hours },

  // — Séances —
  { id: 'sess-10', group: 'Séances', icon: 'check-circle', title: 'Rodé', desc: '10 séances validées', tier: 'bronze', target: 10, value: (s) => s.sessions },
  { id: 'sess-25', group: 'Séances', icon: 'check-circle', title: 'Enclenché', desc: '25 séances validées', tier: 'bronze', target: 25, value: (s) => s.sessions },
  { id: 'sess-50', group: 'Séances', icon: 'check-circle', title: 'Habitué', desc: '50 séances validées', tier: 'silver', target: 50, value: (s) => s.sessions },
  { id: 'sess-100', group: 'Séances', icon: 'medal', title: 'Discipliné', desc: '100 séances validées', tier: 'gold', target: 100, value: (s) => s.sessions },
  { id: 'sess-150', group: 'Séances', icon: 'medal', title: 'Vétéran', desc: '150 séances validées', tier: 'gold', target: 150, value: (s) => s.sessions },
  { id: 'sess-300', group: 'Séances', icon: 'rosette', title: 'Légende du planning', desc: '300 séances validées', tier: 'special', target: 300, value: (s) => s.sessions },

  // — Natation —
  { id: 'swim-10', group: 'Natation', icon: 'swim', title: 'Poisson pilote', desc: '10 séances de natation', tier: 'bronze', target: 10, value: (s) => s.swim },
  { id: 'swim-20', group: 'Natation', icon: 'swim', title: 'Nageur régulier', desc: '20 séances de natation', tier: 'bronze', target: 20, value: (s) => s.swim },
  { id: 'swim-40', group: 'Natation', icon: 'swim', title: 'Dauphin', desc: '40 séances de natation', tier: 'silver', target: 40, value: (s) => s.swim },
  { id: 'swim-80', group: 'Natation', icon: 'swim', title: 'Requin', desc: '80 séances de natation', tier: 'gold', target: 80, value: (s) => s.swim },
  { id: 'swimh-20', group: 'Natation', icon: 'wave', title: 'À l’aise dans l’eau', desc: '20 heures de natation', tier: 'silver', target: 20, value: (s) => s.swimH },
  { id: 'swimh-50', group: 'Natation', icon: 'wave', title: 'Homme-grenouille', desc: '50 heures dans l’eau', tier: 'special', target: 50, value: (s) => s.swimH },

  // — Vélo —
  { id: 'bike-10', group: 'Vélo', icon: 'bike', title: 'Mollets en rodage', desc: '10 sorties vélo', tier: 'bronze', target: 10, value: (s) => s.bike },
  { id: 'bike-20', group: 'Vélo', icon: 'bike', title: 'Cadence', desc: '20 sorties vélo', tier: 'bronze', target: 20, value: (s) => s.bike },
  { id: 'bike-40', group: 'Vélo', icon: 'bike', title: 'Grimpeur', desc: '40 sorties vélo', tier: 'silver', target: 40, value: (s) => s.bike },
  { id: 'bike-80', group: 'Vélo', icon: 'bike', title: 'Forçat de la route', desc: '80 sorties vélo', tier: 'gold', target: 80, value: (s) => s.bike },
  { id: 'bikeh-50', group: 'Vélo', icon: 'mountain', title: 'Rouleur', desc: '50 heures sur le vélo', tier: 'silver', target: 50, value: (s) => s.bikeH },
  { id: 'bikeh-100', group: 'Vélo', icon: 'mountain', title: 'Avaleur de cols', desc: '100 heures sur le vélo', tier: 'special', target: 100, value: (s) => s.bikeH },

  // — Course —
  { id: 'run-10', group: 'Course à pied', icon: 'shoe', title: 'Trotteur', desc: '10 séances de course', tier: 'bronze', target: 10, value: (s) => s.run },
  { id: 'run-20', group: 'Course à pied', icon: 'shoe', title: 'Allure posée', desc: '20 séances de course', tier: 'bronze', target: 20, value: (s) => s.run },
  { id: 'run-40', group: 'Course à pied', icon: 'shoe', title: 'Foulée légère', desc: '40 séances de course', tier: 'silver', target: 40, value: (s) => s.run },
  { id: 'run-80', group: 'Course à pied', icon: 'shoe', title: 'Fondeur', desc: '80 séances de course', tier: 'gold', target: 80, value: (s) => s.run },
  { id: 'runh-25', group: 'Course à pied', icon: 'bolt', title: 'Semelles usées', desc: '25 heures de course', tier: 'silver', target: 25, value: (s) => s.runH },
  { id: 'runh-50', group: 'Course à pied', icon: 'bolt', title: 'Jambes d’acier', desc: '50 heures de course', tier: 'special', target: 50, value: (s) => s.runH },

  // — Triathlète —
  { id: 'tri-1', group: 'Triathlète', icon: 'trident', title: 'Touche-à-tout', desc: 'Au moins 1 séance de chaque discipline', tier: 'bronze', target: 1, value: (s) => s.triBalance },
  { id: 'tri-10', group: 'Triathlète', icon: 'trident', title: 'Triple discipline', desc: '10 de chaque discipline', tier: 'silver', target: 10, value: (s) => s.triBalance },
  { id: 'tri-25', group: 'Triathlète', icon: 'trident', title: 'Vrai triathlète', desc: '25 de chaque discipline', tier: 'gold', target: 25, value: (s) => s.triBalance },
  { id: 'brick-1', group: 'Triathlète', icon: 'repeat', title: 'Premier enchaînement', desc: 'Un brick vélo → course', tier: 'bronze', target: 1, value: (s) => s.bricks },
  { id: 'brick-10', group: 'Triathlète', icon: 'repeat', title: 'Roi du brick', desc: '10 enchaînements vélo+course', tier: 'silver', target: 10, value: (s) => s.bricks },
  { id: 'brick-30', group: 'Triathlète', icon: 'bolt', title: 'Transition express', desc: '30 bricks encaissés', tier: 'gold', target: 30, value: (s) => s.bricks },

  // — Perfection —
  { id: 'perfect-1', group: 'Perfection', icon: 'target', title: 'Sans faute', desc: 'Une semaine validée à 100 %', tier: 'silver', target: 1, value: (s) => s.perfectWeeks },
  { id: 'perfect-5', group: 'Perfection', icon: 'target', title: 'Métronome', desc: '5 semaines parfaites', tier: 'gold', target: 5, value: (s) => s.perfectWeeks },
  { id: 'perfect-12', group: 'Perfection', icon: 'diamond', title: 'Intouchable', desc: '12 semaines parfaites', tier: 'special', target: 12, value: (s) => s.perfectWeeks },
  { id: 'phase-1', group: 'Perfection', icon: 'trophy', title: 'Cap franchi', desc: 'Boucler une phase à 100 %', tier: 'silver', target: 1, value: (s) => s.phasesDone },
  { id: 'phase-2', group: 'Perfection', icon: 'trophy', title: 'Mi-chemin', desc: '2 phases bouclées à 100 %', tier: 'gold', target: 2, value: (s) => s.phasesDone },
  { id: 'phase-4', group: 'Perfection', icon: 'crown', title: 'Plan bouclé', desc: 'Les 4 phases à 100 %', tier: 'special', target: 4, value: (s) => s.phasesDone },

  // — Bien-être —
  { id: 'taichi-10', group: 'Bien-être', icon: 'taichi', title: 'Souffle', desc: '10 séances de Tai Chi', tier: 'bronze', target: 10, value: (s) => s.taichi },
  { id: 'taichi-50', group: 'Bien-être', icon: 'taichi', title: 'Maître Tai Chi', desc: '50 séances de Tai Chi', tier: 'gold', target: 50, value: (s) => s.taichi },
  { id: 'notes-25', group: 'Bien-être', icon: 'book', title: 'Mémorialiste', desc: '25 notes de ressenti', tier: 'silver', target: 25, value: (s) => s.notes },

  // — Défis (avec easter eggs cachés) —
  { id: 'big-day-2', group: 'Défis', icon: 'plate', title: 'Double ration', desc: '2 séances validées dans la même journée', tier: 'silver', target: 2, value: (s) => s.maxDaySessions },
  { id: 'big-day-3', group: 'Défis', icon: 'flame', title: 'Triple menace', desc: '3 séances dans la même journée', tier: 'gold', target: 3, value: (s) => s.maxDaySessions, hidden: true },
  { id: 'long-3h', group: 'Défis', icon: 'clock', title: 'Sortie fleuve', desc: 'Une séance de 3 h ou plus', tier: 'gold', target: 180, value: (s) => s.maxSessionMin },
  { id: 'long-5h', group: 'Défis', icon: 'mountain', title: 'Ultra-distance', desc: 'Une séance de 5 h ou plus', tier: 'special', target: 300, value: (s) => s.maxSessionMin, hidden: true },
  { id: 'big-week', group: 'Défis', icon: 'progress', title: 'Grosse semaine', desc: '10 h réalisées sur une seule semaine', tier: 'gold', target: 10, value: (s) => Math.floor(s.maxWeekHours) },
  { id: 'big-week-15', group: 'Défis', icon: 'progress', title: 'Semaine de titan', desc: '15 h réalisées sur une seule semaine', tier: 'special', target: 15, value: (s) => Math.floor(s.maxWeekHours) },

  // — Easter eggs —
  { id: 'answer-42', group: 'Secrets', icon: 'star', title: 'La Réponse', desc: '42 heures pile poil. La grande question de la vie…', tier: 'special', target: 42, value: (s) => s.hours, hidden: true },
  { id: 'zen-master', group: 'Secrets', icon: 'taichi', title: 'Illumination', desc: '100 séances de Tai Chi. Ton ancre est devenue un art', tier: 'special', target: 100, value: (s) => s.taichi, hidden: true },
  { id: 'streak-100', group: 'Secrets', icon: 'infinity', title: 'Immortel', desc: '100 jours d’affilée. Plus rien ne peut t’arrêter', tier: 'special', target: 100, value: (s) => s.streak, hidden: true },

  // — Épreuve —
  { id: 'test-1', group: 'Épreuve', icon: 'flask', title: 'Première étape', desc: 'Valider un test / jalon du plan', tier: 'bronze', target: 1, value: (s) => s.tests },
  { id: 'test-all', group: 'Épreuve', icon: 'grad', title: 'Sans-faute aux tests', desc: `Valider les ${JALONS.length} tests du plan`, tier: 'special', target: JALONS.length, value: (s) => s.tests },
  { id: 'finisher', group: 'Épreuve', icon: 'flag', title: 'Finisher', desc: 'Valider une épreuve du plan', tier: 'special', target: 1, value: (s) => (s.raceDone ? 1 : 0) },
]

export function computeBadges(weeks: Week[], state: State, today: Date): Badge[] {
  const s = summarize(weeks, state, today)
  return DEFS.map((d) => {
    const value = d.value(s)
    return {
      id: d.id,
      group: d.group,
      icon: d.icon,
      title: d.title,
      desc: d.desc,
      tier: d.tier,
      current: Math.min(value, d.target),
      target: d.target,
      earned: value >= d.target,
      ...(d.hidden ? { hidden: true as const } : {}),
    }
  })
}

/* ---------- niveaux (gamification) ---------- */

// Chaque badge débloqué rapporte des points selon son palier.
export const TIER_POINTS: Record<BadgeTier, number> = { bronze: 1, silver: 2, gold: 3, special: 5 }

export interface BadgeLevel {
  id: string
  name: string
  color: string // couleur CSS du niveau
  min: number // points requis
}

// Échelle de niveaux (maximum atteignable : ~195 pts avec tous les badges).
export const LEVELS: BadgeLevel[] = [
  { id: 'wood', name: 'Bois', color: '#a1785c', min: 0 },
  { id: 'stone', name: 'Pierre', color: '#9aa5b1', min: 8 },
  { id: 'bronze', name: 'Bronze', color: '#d08a54', min: 20 },
  { id: 'silver', name: 'Argent', color: '#c3ccdb', min: 40 },
  { id: 'gold', name: 'Or', color: '#f4c04a', min: 70 },
  { id: 'platinum', name: 'Platine', color: '#8fd3c8', min: 105 },
  { id: 'diamond', name: 'Diamant', color: '#7cd4f2', min: 145 },
  { id: 'legend', name: 'Légende', color: '#b3a4ff', min: 180 },
]

export function badgePoints(badges: Badge[]): number {
  return badges.filter((b) => b.earned).reduce((n, b) => n + TIER_POINTS[b.tier], 0)
}

/** Niveau courant + suivant pour un total de points donné. */
export function levelFor(points: number): { level: BadgeLevel; next: BadgeLevel | null } {
  let level = LEVELS[0]!
  for (const l of LEVELS) if (points >= l.min) level = l
  const idx = LEVELS.indexOf(level)
  return { level, next: LEVELS[idx + 1] ?? null }
}
