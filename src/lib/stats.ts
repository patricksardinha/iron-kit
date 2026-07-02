// Calculs de l'onglet Progression (§9)
import type { State, Week, DisciplineKey } from '../types'
import { disciplineOf, isTraining, dayKey, dateOfDay } from './logic'

export interface WeekProgress {
  validated: number
  total: number // séances non-repos
}

/** X/Y d'une semaine (Y = nb de séances non-repos). */
export function weekProgress(week: Week, done: State['done']): WeekProgress {
  let total = 0
  let validated = 0
  week.days.forEach((label, di) => {
    if (!isTraining(label)) return
    total++
    if (done[dayKey(week.wk, di)]) validated++
  })
  return { validated, total }
}

export interface Overall {
  validated: number
  total: number
  pct: number
}

export function overallProgress(weeks: Week[], done: State['done']): Overall {
  let total = 0
  let validated = 0
  for (const w of weeks) {
    const p = weekProgress(w, done)
    total += p.total
    validated += p.validated
  }
  const pct = total ? Math.round((validated / total) * 100) : 0
  return { validated, total, pct }
}

/** Heures validées ≈ Σ(fraction validée d'une semaine × vol). Dénominateur = Σ vol. */
export function hoursProgress(weeks: Week[], done: State['done']): {
  validated: number
  planned: number
} {
  let validated = 0
  let planned = 0
  for (const w of weeks) {
    planned += w.vol
    const p = weekProgress(w, done)
    if (p.total > 0) validated += (p.validated / p.total) * w.vol
  }
  return { validated, planned }
}

export interface DisciplineStat {
  key: 'swim' | 'bike' | 'run'
  label: string
  color: string
  validated: number
  planned: number
}

export function disciplineStats(weeks: Week[], done: State['done']): DisciplineStat[] {
  const base: Record<'swim' | 'bike' | 'run', DisciplineStat> = {
    swim: { key: 'swim', label: 'Natation', color: 'var(--swim)', validated: 0, planned: 0 },
    bike: { key: 'bike', label: 'Vélo', color: 'var(--bike)', validated: 0, planned: 0 },
    run: { key: 'run', label: 'Course', color: 'var(--run)', validated: 0, planned: 0 },
  }
  for (const w of weeks) {
    w.days.forEach((label, di) => {
      const k: DisciplineKey = disciplineOf(label).key
      if (k !== 'swim' && k !== 'bike' && k !== 'run') return
      base[k].planned++
      if (done[dayKey(w.wk, di)]) base[k].validated++
    })
  }
  return [base.swim, base.bike, base.run]
}

export interface PhaseStat {
  phase: string
  color: string
  validated: number
  total: number
  pct: number
}

export function phaseStats(weeks: Week[], done: State['done']): PhaseStat[] {
  const order: string[] = []
  const map = new Map<string, PhaseStat>()
  for (const w of weeks) {
    if (!map.has(w.phase)) {
      order.push(w.phase)
      map.set(w.phase, { phase: w.phase, color: '', validated: 0, total: 0, pct: 0 })
    }
    const ps = map.get(w.phase)!
    const p = weekProgress(w, done)
    ps.total += p.total
    ps.validated += p.validated
  }
  return order.map((phase) => {
    const ps = map.get(phase)!
    ps.pct = ps.total ? Math.round((ps.validated / ps.total) * 100) : 0
    return ps
  })
}

/** Série en cours : jours d'entraînement passés consécutifs validés. */
export function currentStreak(weeks: Week[], done: State['done'], today: Date): number {
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  // Liste chronologique des jours d'entraînement strictement passés.
  const past: string[] = []
  for (const w of weeks) {
    w.days.forEach((label, di) => {
      if (!isTraining(label)) return
      if (dateOfDay(w.wk, di) < midnight) past.push(dayKey(w.wk, di))
    })
  }
  let streak = 0
  for (let i = past.length - 1; i >= 0; i--) {
    if (done[past[i]!]) streak++
    else break
  }
  return streak
}

export function taichiCount(taichi: State['taichi']): number {
  return Object.keys(taichi).length
}
