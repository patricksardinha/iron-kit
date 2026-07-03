// Système de récompenses (~200 badges) calculés depuis le plan + l'état.
import type { Badge, BadgeTier, State, Week } from '../types'
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

  for (const w of weeks) {
    let touched = false
    w.days.forEach((day, di) => {
      let dBike = false
      let dRun = false
      day.forEach((sess, si) => {
        const k = sessionKey(w.wk, di, si)
        if (!(k in state.sessions)) return
        touched = true
        sessions++
        const m = state.sessions[k]! || sess.min
        minutes += m
        if (sess.disc === 'swim') (swim++, (swimMin += m))
        else if (sess.disc === 'bike') (bike++, (bikeMin += m), (dBike = true))
        else if (sess.disc === 'run') (run++, (runMin += m), (dRun = true))
        else if (sess.disc === 'race') raceDone = true
      })
      if (dBike && dRun) bricks++
    })
    if (touched) weeksActive++
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
  }
}

function tierFor(i: number, n: number): BadgeTier {
  const r = n <= 1 ? 1 : i / (n - 1)
  if (r < 0.34) return 'bronze'
  if (r < 0.67) return 'silver'
  if (r < 0.9) return 'gold'
  return 'special'
}

interface Family {
  base: string
  group: string
  emoji: string
  name: string
  unit: string
  key: keyof Summary
  steps: number[]
}

const FAMILIES: Family[] = [
  { base: 'streak', group: 'Régularité', emoji: '🔥', name: 'Série', unit: 'jours de suite', key: 'streak',
    steps: [2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90, 120, 365] },
  { base: 'sess', group: 'Séances', emoji: '✅', name: 'Étapes', unit: 'étapes validées', key: 'sessions',
    steps: [1, 5, 10, 20, 35, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000] },
  { base: 'hrs', group: 'Volume horaire', emoji: '⏱️', name: 'Heures', unit: 'h au total', key: 'hours',
    steps: [2, 5, 10, 20, 35, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000] },
  { base: 'days', group: 'Jours', emoji: '📅', name: 'Jours', unit: 'jours validés', key: 'daysValidated',
    steps: [1, 3, 5, 10, 25, 50, 75, 100, 150, 200, 300, 400, 500] },
  { base: 'swim', group: 'Natation', emoji: '🏊', name: 'Nageur', unit: 'natations', key: 'swim',
    steps: [1, 5, 10, 20, 30, 45, 60, 80, 100, 150, 200, 300] },
  { base: 'bike', group: 'Vélo', emoji: '🚴', name: 'Rouleur', unit: 'sorties vélo', key: 'bike',
    steps: [1, 5, 10, 20, 30, 45, 60, 80, 100, 150, 200, 300] },
  { base: 'run', group: 'Course à pied', emoji: '🏃', name: 'Coureur', unit: 'sorties CAP', key: 'run',
    steps: [1, 5, 10, 20, 30, 45, 60, 80, 100, 150, 200, 300] },
  { base: 'swimh', group: 'Natation', emoji: '🌊', name: 'Nat.', unit: 'h de natation', key: 'swimH',
    steps: [1, 3, 5, 10, 20, 35, 50, 75, 100, 150] },
  { base: 'bikeh', group: 'Vélo', emoji: '🚵', name: 'Vélo', unit: 'h de vélo', key: 'bikeH',
    steps: [2, 5, 10, 25, 50, 75, 100, 150, 200, 300] },
  { base: 'runh', group: 'Course à pied', emoji: '👟', name: 'CAP', unit: 'h de course', key: 'runH',
    steps: [1, 3, 5, 10, 20, 35, 50, 75, 100, 150] },
  { base: 'tri', group: 'Triathlète', emoji: '🔱', name: 'Équilibre', unit: 'de chaque discipline', key: 'triBalance',
    steps: [1, 5, 10, 15, 20, 30, 40, 50, 75, 100] },
  { base: 'brick', group: 'Enchaînements', emoji: '🔁', name: 'Brick', unit: 'bricks vélo+CAP', key: 'bricks',
    steps: [1, 3, 5, 10, 20, 35, 50, 75, 100] },
  { base: 'perf', group: 'Perfection', emoji: '🎯', name: 'Sans faute', unit: 'semaines à 100 %', key: 'perfectWeeks',
    steps: [1, 2, 3, 5, 8, 12, 16, 24, 32, 40] },
  { base: 'phase', group: 'Perfection', emoji: '🏆', name: 'Phase', unit: 'phase(s) bouclée(s)', key: 'phasesDone',
    steps: [1, 2, 3, 4] },
  { base: 'active', group: 'Assiduité', emoji: '🗓️', name: 'Présent', unit: 'semaines actives', key: 'weeksActive',
    steps: [1, 2, 4, 8, 12, 16, 20, 26, 40, 52, 62] },
  { base: 'taichi', group: 'Bien-être', emoji: '🧘', name: 'Zen', unit: 'séances de Tai Chi', key: 'taichi',
    steps: [1, 3, 5, 10, 15, 25, 40, 60, 80, 100] },
  { base: 'opt', group: 'Bien-être', emoji: '➕', name: 'Bonus', unit: 'options validées', key: 'options',
    steps: [5, 10, 25, 50, 100, 150, 200] },
  { base: 'note', group: 'Carnet', emoji: '✍️', name: 'Carnet', unit: 'notes écrites', key: 'notes',
    steps: [1, 3, 5, 10, 15, 25, 40, 60, 80] },
]

export function computeBadges(weeks: Week[], state: State, today: Date): Badge[] {
  const s = summarize(weeks, state, today)
  const out: Badge[] = []
  for (const f of FAMILIES) {
    const value = s[f.key] as number
    f.steps.forEach((target, i) => {
      out.push({
        id: `${f.base}${i}`,
        group: f.group,
        emoji: f.emoji,
        title: `${f.name} ${target}`,
        desc: `${target} ${f.unit}`,
        tier: tierFor(i, f.steps.length),
        current: Math.min(value, target),
        target,
        earned: value >= target,
      })
    })
  }
  out.push({
    id: 'race',
    group: 'Épreuve',
    emoji: '🏁',
    title: 'Finisher',
    desc: 'Valider une épreuve du plan',
    tier: 'special',
    current: s.raceDone ? 1 : 0,
    target: 1,
    earned: s.raceDone,
  })
  return out
}
