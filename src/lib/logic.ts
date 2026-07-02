// Logique métier (§7)
import { START, DAY_MS, TOTAL_WEEKS } from './constants'
import type { Discipline } from '../types'

export { TOTAL_WEEKS }

const MONTHS_SHORT = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
]

/** Date d'un jour donné : START + ((wk-1)*7 + dayIndex) jours. */
export function dateOfDay(wk: number, di: number): Date {
  return new Date(START.getTime() + ((wk - 1) * 7 + di) * DAY_MS)
}

/** Nombre entier de jours entre deux dates (b - a), normalisé à minuit. */
export function daysBetween(a: Date, b: Date): number {
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
  return Math.round((b0 - a0) / DAY_MS)
}

function clamp(min: number, max: number, v: number): number {
  return Math.max(min, Math.min(max, v))
}

/** Semaine courante 1..total en fonction de `today` (total = nb de semaines du plan). */
export function currentWeekIndex(today: Date, total: number = TOTAL_WEEKS): number {
  if (today < START) return 1
  return clamp(1, total, Math.floor(daysBetween(START, today) / 7) + 1)
}

/** Les repos ne sont ni validables ni comptés. */
export function isTraining(label: string): boolean {
  return !label.startsWith('Repos')
}

/** Discipline + couleur d'un libellé de séance. */
export function disciplineOf(label: string): Discipline {
  if (label.includes('>>>')) return { key: 'race', color: 'var(--grad-tri)' }
  if (label.startsWith('Nat')) return { key: 'swim', color: 'var(--swim)' }
  if (label.startsWith('Vélo')) return { key: 'bike', color: 'var(--bike)' }
  if (label.startsWith('CAP')) return { key: 'run', color: 'var(--run)' }
  if (label.startsWith('Repos') || label.startsWith('Activation'))
    return { key: 'repos', color: 'var(--faint)' }
  return { key: 'other', color: 'var(--faint)' }
}

/** Clé d'état pour un jour. */
export function dayKey(wk: number, di: number): string {
  return `${wk}-${di}`
}

/** Formatage court d'une date : "6 juil." */
export function formatShort(d: Date): string {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

/** Un jour d'entraînement passé (avant aujourd'hui) et non validé = "manqué". */
export function isOverdue(wk: number, di: number, label: string, today: Date): boolean {
  if (!isTraining(label)) return false
  return dateOfDay(wk, di) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
}
