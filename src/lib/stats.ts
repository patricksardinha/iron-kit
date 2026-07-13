// Calculs de l'onglet Progression (§9)
import type { State, Week } from '../types'
import { isTrainingDay, isDayValidated, dateOfDay, sessionKey, weekVolume } from './logic'

type Sessions = State['sessions']

export interface WeekProgress {
  validated: number
  total: number // jours d'entraînement (non-repos)
}

/** X/Y d'une semaine (Y = nb de jours d'entraînement, X = jours entièrement validés). */
export function weekProgress(week: Week, sessions: Sessions): WeekProgress {
  let total = 0
  let validated = 0
  week.days.forEach((day, di) => {
    if (!isTrainingDay(day)) return
    total++
    if (isDayValidated(week.wk, di, day, sessions)) validated++
  })
  return { validated, total }
}

export interface Overall {
  validated: number
  total: number
  pct: number
}

export function overallProgress(weeks: Week[], sessions: Sessions): Overall {
  let total = 0
  let validated = 0
  for (const w of weeks) {
    const p = weekProgress(w, sessions)
    total += p.total
    validated += p.validated
  }
  const pct = total ? Math.round((validated / total) * 100) : 0
  return { validated, total, pct }
}

/** Heures : réalisées = Σ minutes réellement faites ; prévues = Σ volume. */
export function hoursProgress(weeks: Week[], sessions: Sessions): {
  validated: number
  planned: number
} {
  let done = 0
  let planned = 0
  for (const w of weeks) {
    planned += weekVolume(w)
    w.days.forEach((day, di) => {
      day.forEach((s, si) => {
        const k = sessionKey(w.wk, di, si)
        if (k in sessions) done += sessions[k]! || s.min // 0 loggé (course) → planifié
      })
    })
  }
  return { validated: Math.round((done / 60) * 10) / 10, planned }
}

export interface DisciplineStat {
  key: 'swim' | 'bike' | 'run'
  label: string
  color: string
  validated: number
  planned: number
}

export function disciplineStats(weeks: Week[], sessions: Sessions): DisciplineStat[] {
  const base: Record<'swim' | 'bike' | 'run', DisciplineStat> = {
    swim: { key: 'swim', label: 'Natation', color: 'var(--swim)', validated: 0, planned: 0 },
    bike: { key: 'bike', label: 'Vélo', color: 'var(--bike)', validated: 0, planned: 0 },
    run: { key: 'run', label: 'Course', color: 'var(--run)', validated: 0, planned: 0 },
  }
  for (const w of weeks) {
    w.days.forEach((day, di) => {
      day.forEach((s, si) => {
        if (s.disc !== 'swim' && s.disc !== 'bike' && s.disc !== 'run') return
        base[s.disc].planned++
        if (sessionKey(w.wk, di, si) in sessions) base[s.disc].validated++
      })
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

export function phaseStats(weeks: Week[], sessions: Sessions): PhaseStat[] {
  const order: string[] = []
  const map = new Map<string, PhaseStat>()
  for (const w of weeks) {
    if (!map.has(w.phase)) {
      order.push(w.phase)
      map.set(w.phase, { phase: w.phase, color: '', validated: 0, total: 0, pct: 0 })
    }
    const ps = map.get(w.phase)!
    const p = weekProgress(w, sessions)
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
export function currentStreak(weeks: Week[], sessions: Sessions, today: Date): number {
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const past: { wk: number; di: number; day: Week['days'][number] }[] = []
  for (const w of weeks) {
    w.days.forEach((day, di) => {
      if (!isTrainingDay(day)) return
      if (dateOfDay(w.start, di) < midnight) past.push({ wk: w.wk, di, day })
    })
  }
  let streak = 0
  for (let i = past.length - 1; i >= 0; i--) {
    const p = past[i]!
    if (isDayValidated(p.wk, p.di, p.day, sessions)) streak++
    else break
  }
  return streak
}

/** Nombre d'options validées portant un libellé donné (ex. "Tai Chi"). */
export function countOption(options: State['options'], label: string): number {
  const suffix = `::${label}`
  return Object.keys(options).filter((k) => k.endsWith(suffix)).length
}

/** Total d'options validées (toutes étiquettes). */
export function optionTotal(options: State['options']): number {
  return Object.keys(options).length
}

/** Total d'étapes (séances) validées, toutes disciplines. */
export function validatedSessionCount(sessions: Sessions): number {
  return Object.keys(sessions).length
}

/* ---------- séries pour les graphiques ---------- */

export interface WeekVol {
  wk: number
  phase: string
  planned: number // heures prévues
  done: number // heures réalisées
}

/** Volume par semaine (prévu vs réalisé, en heures) — pour l'histogramme temporel. */
export function weeklyVolumeSeries(weeks: Week[], sessions: Sessions): WeekVol[] {
  return weeks.map((w) => {
    let doneMin = 0
    w.days.forEach((day, di) => {
      day.forEach((s, si) => {
        const k = sessionKey(w.wk, di, si)
        if (k in sessions) doneMin += sessions[k]! || s.min
      })
    })
    return {
      wk: w.wk,
      phase: w.phase,
      planned: weekVolume(w),
      done: Math.round((doneMin / 60) * 10) / 10,
    }
  })
}

/** Heures réalisées par discipline (natation / vélo / course) — pour le donut. */
export function disciplineHours(weeks: Week[], sessions: Sessions): {
  swim: number
  bike: number
  run: number
} {
  const m = { swim: 0, bike: 0, run: 0 }
  for (const w of weeks) {
    w.days.forEach((day, di) => {
      day.forEach((s, si) => {
        if (s.disc !== 'swim' && s.disc !== 'bike' && s.disc !== 'run') return
        const k = sessionKey(w.wk, di, si)
        if (k in sessions) m[s.disc] += sessions[k]! || s.min
      })
    })
  }
  return {
    swim: Math.round((m.swim / 60) * 10) / 10,
    bike: Math.round((m.bike / 60) * 10) / 10,
    run: Math.round((m.run / 60) * 10) / 10,
  }
}
