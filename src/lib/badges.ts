// Système de récompenses : set curé de badges nommés (+ easter eggs).
import type { Badge, BadgeTier, State, Week } from '../types'
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
    maxDaySessions,
    maxSessionMin,
    maxWeekHours: Math.round(maxWeekHours * 10) / 10,
  }
}

interface Def {
  id: string
  group: string
  emoji: string
  title: string
  desc: string
  tier: BadgeTier
  target: number
  value: (s: Summary) => number
  hidden?: boolean
}

// Set curé : chaque badge a un nom + une icône propres. Ordre = ordre d'affichage.
const DEFS: Def[] = [
  // — Premiers pas —
  { id: 'first-sess', group: 'Premiers pas', emoji: '🐣', title: 'Premier contact', desc: 'Valider ta toute première séance', tier: 'bronze', target: 1, value: (s) => s.sessions },
  { id: 'first-day', group: 'Premiers pas', emoji: '☑️', title: 'Jour 1', desc: 'Boucler une première journée complète', tier: 'bronze', target: 1, value: (s) => s.daysValidated },
  { id: 'first-week', group: 'Premiers pas', emoji: '📅', title: 'Sur les rails', desc: "S'entraîner sur une première semaine", tier: 'bronze', target: 1, value: (s) => s.weeksActive },
  { id: 'first-note', group: 'Premiers pas', emoji: '✍️', title: 'Cher journal', desc: 'Écrire une première note de ressenti', tier: 'bronze', target: 1, value: (s) => s.notes },

  // — Régularité —
  { id: 'streak-3', group: 'Régularité', emoji: '🔥', title: 'Ça chauffe', desc: '3 jours d’entraînement d’affilée', tier: 'bronze', target: 3, value: (s) => s.streak },
  { id: 'streak-7', group: 'Régularité', emoji: '🔥', title: 'Semaine pleine', desc: '7 jours d’affilée sans rien lâcher', tier: 'silver', target: 7, value: (s) => s.streak },
  { id: 'streak-14', group: 'Régularité', emoji: '🚂', title: 'Rouleau compresseur', desc: '14 jours consécutifs validés', tier: 'silver', target: 14, value: (s) => s.streak },
  { id: 'streak-30', group: 'Régularité', emoji: '🌋', title: 'Feu sacré', desc: '30 jours d’affilée. Rien ne t’arrête', tier: 'gold', target: 30, value: (s) => s.streak },
  { id: 'streak-60', group: 'Régularité', emoji: '♾️', title: 'Increvable', desc: '60 jours consécutifs. Surhumain', tier: 'special', target: 60, value: (s) => s.streak },

  // — Assiduité —
  { id: 'active-4', group: 'Assiduité', emoji: '🗓️', title: 'Un mois dans les jambes', desc: '4 semaines actives', tier: 'bronze', target: 4, value: (s) => s.weeksActive },
  { id: 'active-12', group: 'Assiduité', emoji: '🗓️', title: 'Trimestre tenu', desc: '12 semaines actives', tier: 'silver', target: 12, value: (s) => s.weeksActive },
  { id: 'active-26', group: 'Assiduité', emoji: '🗓️', title: 'Demi-saison', desc: '26 semaines actives', tier: 'gold', target: 26, value: (s) => s.weeksActive },
  { id: 'active-52', group: 'Assiduité', emoji: '🏵️', title: 'Une année de sueur', desc: '52 semaines actives', tier: 'special', target: 52, value: (s) => s.weeksActive },

  // — Volume horaire —
  { id: 'hours-10', group: 'Volume', emoji: '⏱️', title: 'Échauffement', desc: '10 heures d’entraînement cumulées', tier: 'bronze', target: 10, value: (s) => s.hours },
  { id: 'hours-50', group: 'Volume', emoji: '⏱️', title: 'Dans le dur', desc: '50 heures au compteur', tier: 'silver', target: 50, value: (s) => s.hours },
  { id: 'hours-100', group: 'Volume', emoji: '💯', title: 'Centurion', desc: '100 heures d’entraînement', tier: 'gold', target: 100, value: (s) => s.hours },
  { id: 'hours-250', group: 'Volume', emoji: '🏔️', title: 'Machine de guerre', desc: '250 heures accumulées', tier: 'special', target: 250, value: (s) => s.hours },

  // — Séances —
  { id: 'sess-10', group: 'Séances', emoji: '✅', title: 'Rodé', desc: '10 séances validées', tier: 'bronze', target: 10, value: (s) => s.sessions },
  { id: 'sess-50', group: 'Séances', emoji: '✅', title: 'Habitué', desc: '50 séances validées', tier: 'silver', target: 50, value: (s) => s.sessions },
  { id: 'sess-150', group: 'Séances', emoji: '🎖️', title: 'Vétéran', desc: '150 séances validées', tier: 'gold', target: 150, value: (s) => s.sessions },
  { id: 'sess-300', group: 'Séances', emoji: '🏅', title: 'Légende du planning', desc: '300 séances validées', tier: 'special', target: 300, value: (s) => s.sessions },

  // — Natation —
  { id: 'swim-10', group: 'Natation', emoji: '🏊', title: 'Poisson pilote', desc: '10 séances de natation', tier: 'bronze', target: 10, value: (s) => s.swim },
  { id: 'swim-40', group: 'Natation', emoji: '🐬', title: 'Dauphin', desc: '40 séances de natation', tier: 'silver', target: 40, value: (s) => s.swim },
  { id: 'swim-80', group: 'Natation', emoji: '🦈', title: 'Requin', desc: '80 séances de natation', tier: 'gold', target: 80, value: (s) => s.swim },
  { id: 'swimh-50', group: 'Natation', emoji: '🌊', title: 'Homme-grenouille', desc: '50 heures dans l’eau', tier: 'special', target: 50, value: (s) => s.swimH },

  // — Vélo —
  { id: 'bike-10', group: 'Vélo', emoji: '🚴', title: 'Mollets en rodage', desc: '10 sorties vélo', tier: 'bronze', target: 10, value: (s) => s.bike },
  { id: 'bike-40', group: 'Vélo', emoji: '🚵', title: 'Grimpeur', desc: '40 sorties vélo', tier: 'silver', target: 40, value: (s) => s.bike },
  { id: 'bike-80', group: 'Vélo', emoji: '🚴‍♂️', title: 'Forçat de la route', desc: '80 sorties vélo', tier: 'gold', target: 80, value: (s) => s.bike },
  { id: 'bikeh-100', group: 'Vélo', emoji: '⛰️', title: 'Avaleur de cols', desc: '100 heures sur le vélo', tier: 'special', target: 100, value: (s) => s.bikeH },

  // — Course —
  { id: 'run-10', group: 'Course à pied', emoji: '🏃', title: 'Trotteur', desc: '10 séances de course', tier: 'bronze', target: 10, value: (s) => s.run },
  { id: 'run-40', group: 'Course à pied', emoji: '👟', title: 'Foulée légère', desc: '40 séances de course', tier: 'silver', target: 40, value: (s) => s.run },
  { id: 'run-80', group: 'Course à pied', emoji: '🏅', title: 'Fondeur', desc: '80 séances de course', tier: 'gold', target: 80, value: (s) => s.run },
  { id: 'runh-50', group: 'Course à pied', emoji: '🦵', title: 'Jambes d’acier', desc: '50 heures de course', tier: 'special', target: 50, value: (s) => s.runH },

  // — Triathlète —
  { id: 'tri-1', group: 'Triathlète', emoji: '🔱', title: 'Touche-à-tout', desc: 'Au moins 1 séance de chaque discipline', tier: 'bronze', target: 1, value: (s) => s.triBalance },
  { id: 'tri-10', group: 'Triathlète', emoji: '🔱', title: 'Triple discipline', desc: '10 de chaque discipline', tier: 'silver', target: 10, value: (s) => s.triBalance },
  { id: 'tri-25', group: 'Triathlète', emoji: '🔱', title: 'Vrai triathlète', desc: '25 de chaque discipline', tier: 'gold', target: 25, value: (s) => s.triBalance },
  { id: 'brick-1', group: 'Triathlète', emoji: '🔁', title: 'Premier enchaînement', desc: 'Un brick vélo → course', tier: 'bronze', target: 1, value: (s) => s.bricks },
  { id: 'brick-10', group: 'Triathlète', emoji: '🔁', title: 'Roi du brick', desc: '10 enchaînements vélo+course', tier: 'silver', target: 10, value: (s) => s.bricks },
  { id: 'brick-30', group: 'Triathlète', emoji: '⚡', title: 'Transition express', desc: '30 bricks encaissés', tier: 'gold', target: 30, value: (s) => s.bricks },

  // — Perfection —
  { id: 'perfect-1', group: 'Perfection', emoji: '🎯', title: 'Sans faute', desc: 'Une semaine validée à 100 %', tier: 'silver', target: 1, value: (s) => s.perfectWeeks },
  { id: 'perfect-5', group: 'Perfection', emoji: '🎯', title: 'Métronome', desc: '5 semaines parfaites', tier: 'gold', target: 5, value: (s) => s.perfectWeeks },
  { id: 'perfect-12', group: 'Perfection', emoji: '💎', title: 'Intouchable', desc: '12 semaines parfaites', tier: 'special', target: 12, value: (s) => s.perfectWeeks },
  { id: 'phase-1', group: 'Perfection', emoji: '🏆', title: 'Cap franchi', desc: 'Boucler une phase à 100 %', tier: 'silver', target: 1, value: (s) => s.phasesDone },
  { id: 'phase-4', group: 'Perfection', emoji: '👑', title: 'Plan bouclé', desc: 'Les 4 phases à 100 %', tier: 'special', target: 4, value: (s) => s.phasesDone },

  // — Bien-être —
  { id: 'taichi-10', group: 'Bien-être', emoji: '🧘', title: 'Souffle', desc: '10 séances de Tai Chi', tier: 'bronze', target: 10, value: (s) => s.taichi },
  { id: 'taichi-50', group: 'Bien-être', emoji: '☯️', title: 'Maître Tai Chi', desc: '50 séances de Tai Chi', tier: 'gold', target: 50, value: (s) => s.taichi },
  { id: 'notes-25', group: 'Bien-être', emoji: '📖', title: 'Mémorialiste', desc: '25 notes de ressenti', tier: 'silver', target: 25, value: (s) => s.notes },

  // — Défis (avec easter eggs cachés) —
  { id: 'big-day-2', group: 'Défis', emoji: '🍽️', title: 'Double ration', desc: '2 séances validées dans la même journée', tier: 'silver', target: 2, value: (s) => s.maxDaySessions },
  { id: 'big-day-3', group: 'Défis', emoji: '🌶️', title: 'Triple menace', desc: '3 séances dans la même journée', tier: 'gold', target: 3, value: (s) => s.maxDaySessions, hidden: true },
  { id: 'long-3h', group: 'Défis', emoji: '🥵', title: 'Sortie fleuve', desc: 'Une séance de 3 h ou plus', tier: 'gold', target: 180, value: (s) => s.maxSessionMin },
  { id: 'long-5h', group: 'Défis', emoji: '🌀', title: 'Ultra-distance', desc: 'Une séance de 5 h ou plus', tier: 'special', target: 300, value: (s) => s.maxSessionMin, hidden: true },
  { id: 'big-week', group: 'Défis', emoji: '📈', title: 'Grosse semaine', desc: '10 h réalisées sur une seule semaine', tier: 'gold', target: 10, value: (s) => Math.floor(s.maxWeekHours) },

  // — Easter eggs —
  { id: 'answer-42', group: 'Secrets', emoji: '🔢', title: 'La Réponse', desc: '42 heures pile poil. La grande question de la vie…', tier: 'special', target: 42, value: (s) => s.hours, hidden: true },
  { id: 'zen-master', group: 'Secrets', emoji: '🕉️', title: 'Illumination', desc: '100 séances de Tai Chi. Ton ancre est devenue un art', tier: 'special', target: 100, value: (s) => s.taichi, hidden: true },

  // — Épreuve —
  { id: 'test-1', group: 'Épreuve', emoji: '🧪', title: 'Première étape', desc: 'Valider un test / jalon du plan', tier: 'bronze', target: 1, value: (s) => s.tests },
  { id: 'test-all', group: 'Épreuve', emoji: '🎓', title: 'Sans-faute aux tests', desc: `Valider les ${JALONS.length} tests du plan`, tier: 'special', target: JALONS.length, value: (s) => s.tests },
  { id: 'finisher', group: 'Épreuve', emoji: '🏁', title: 'Finisher', desc: 'Valider une épreuve du plan', tier: 'special', target: 1, value: (s) => (s.raceDone ? 1 : 0) },
]

export function computeBadges(weeks: Week[], state: State, today: Date): Badge[] {
  const s = summarize(weeks, state, today)
  return DEFS.map((d) => {
    const value = d.value(s)
    return {
      id: d.id,
      group: d.group,
      emoji: d.emoji,
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
