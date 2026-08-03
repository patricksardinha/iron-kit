// Logique métier (§7)
import { DAY_MS, TOTAL_WEEKS } from './constants'
import type { Discipline, Session, SessionDisc, State, Week } from '../types'

export { TOTAL_WEEKS }

const MONTHS_SHORT = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
]

/* ---------- dates ISO ---------- */

/** "2026-07-06" → Date locale à minuit (parse manuel, sans surprise de fuseau). */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y || 1970, (m || 1) - 1, d || 1)
}

/** Date → "AAAA-MM-JJ". */
export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

/** Lundi de la semaine contenant `d` (getDay: 0=dimanche). */
export function mondayOf(d: Date): Date {
  const js = d.getDay()
  const back = js === 0 ? 6 : js - 1
  return addDays(d, -back)
}

/** Libellé d'une semaine : "6 juil. → 12 juil. 2026" à partir du lundi ISO. */
export function weekDatesLabel(startISO: string): string {
  const a = parseISO(startISO)
  const b = addDays(a, 6)
  return `${a.getDate()} ${MONTHS_SHORT[a.getMonth()]} → ${b.getDate()} ${MONTHS_SHORT[b.getMonth()]} ${b.getFullYear()}`
}

/** Date d'un jour donné : start (lundi ISO) + dayIndex jours. */
export function dateOfDay(startISO: string, di: number): Date {
  return addDays(parseISO(startISO), di)
}

/** Nombre entier de jours entre deux dates (b - a), normalisé à minuit. */
export function daysBetween(a: Date, b: Date): number {
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
  return Math.round((b0 - a0) / DAY_MS)
}

/** Semaine courante 1..N d'après `today` : celle dont [start, start+7) contient today. */
export function currentWeekIndex(today: Date, weeks: Week[]): number {
  if (weeks.length === 0) return 1
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  for (const w of weeks) {
    const s = parseISO(w.start).getTime()
    const e = addDays(parseISO(w.start), 7).getTime()
    if (t >= s && t < e) return w.wk
  }
  // Hors plage : avant la 1re → 1, après la dernière → dernière.
  const first = parseISO(weeks[0]!.start).getTime()
  return t < first ? 1 : weeks.length
}

/* ---------- séances ---------- */

/** Un jour est un jour d'entraînement s'il contient au moins une séance. */
export function isTrainingDay(day: Session[]): boolean {
  return day.length > 0
}

/** Applique l'agencement réel (state.layout) par-dessus le plan : la réalité prime. */
export function applyLayout(weeks: Week[], layout: State['layout']): Week[] {
  return weeks.map((w) => {
    const l = layout[String(w.wk)]
    return l ? { ...w, days: mergeLayout(w.days, l) } : w
  })
}

/** Identité d'une séance pour la fusion plan/agencement (contenu, pas la position). */
function sessSig(s: Session): string {
  return JSON.stringify([s.disc, s.detail, s.min, s.info ?? null])
}

/**
 * Fusionne l'agencement utilisateur (drag & drop de l'onglet Semaine) avec le plan
 * courant. Le layout est un instantané : si le plan a changé depuis (séance ajoutée,
 * modifiée ou supprimée dans l'onglet Plan), il doit rester la source de vérité du
 * CONTENU, le layout ne gardant que le PLACEMENT des séances qui existent encore.
 * - séance présente dans les deux → position du layout ;
 * - séance du plan absente du layout (ajoutée / modifiée depuis) → son jour du plan,
 *   en fin de journée pour ne pas décaler les validations positionnelles existantes ;
 * - séance du layout absente du plan (supprimée / modifiée depuis) → retirée.
 */
function mergeLayout(planDays: Session[][], layoutDays: Session[][]): Session[][] {
  // Multiset des séances du plan (les doublons « Vélo 1h » comptent double).
  const remaining = new Map<string, number>()
  for (const day of planDays)
    for (const s of day) {
      const k = sessSig(s)
      remaining.set(k, (remaining.get(k) ?? 0) + 1)
    }
  // Garde les séances du layout encore présentes dans le plan, à leur place.
  const days = planDays.map((_, di) =>
    (layoutDays[di] ?? []).filter((s) => {
      const k = sessSig(s)
      const n = remaining.get(k) ?? 0
      if (n <= 0) return false
      remaining.set(k, n - 1)
      return true
    }),
  )
  // Les séances du plan non consommées (nouvelles) rejoignent leur jour d'origine.
  planDays.forEach((day, di) => {
    for (const s of day) {
      const k = sessSig(s)
      const n = remaining.get(k) ?? 0
      if (n <= 0) continue
      remaining.set(k, n - 1)
      days[di]!.push(s)
    }
  })
  return days
}

/** Minutes prévues d'une semaine = Σ des durées de toutes les séances (valeur exacte). */
export function weekPlannedMinutes(week: Week): number {
  let min = 0
  for (const day of week.days) for (const s of day) min += s.min || 0
  return min
}

/** Volume d'une semaine (heures, arrondi au dixième) — pour l'affichage « X h ». */
export function weekVolume(week: Week): number {
  return Math.round((weekPlannedMinutes(week) / 60) * 10) / 10
}

/** Discipline + couleur d'une séance (ou d'un jour via sa 1re séance). */
export function disciplineOf(disc: SessionDisc): Discipline {
  switch (disc) {
    case 'race':
      return { key: 'race', color: 'var(--grad-tri)' }
    case 'swim':
      return { key: 'swim', color: 'var(--swim)' }
    case 'bike':
      return { key: 'bike', color: 'var(--bike)' }
    case 'run':
      return { key: 'run', color: 'var(--run)' }
    default:
      return { key: 'other', color: 'var(--faint)' }
  }
}

/** Un jour est un « test/épreuve » s'il contient une course ou une séance « test ». */
export function isTestDay(day: Session[]): boolean {
  return day.some((s) => s.disc === 'race' || /\btest\b|épreuve/i.test(s.detail))
}

/** Discipline dominante d'un jour (1re séance) → couleur de liseré. */
export function dayDiscipline(day: Session[]): Discipline {
  const first = day[0]
  return first ? disciplineOf(first.disc) : { key: 'repos', color: 'var(--faint)' }
}

/** Libellé court d'une discipline (pour l'affichage). */
export function discLabel(disc: SessionDisc): string {
  switch (disc) {
    case 'swim':
      return 'Natation'
    case 'bike':
      return 'Vélo'
    case 'run':
      return 'CAP (course à pied)'
    case 'strength':
      return 'Renfo'
    case 'race':
      return 'Épreuve'
    default:
      return 'Autre'
  }
}

/** Durée en minutes → "1h15" / "45'" / "—". */
export function formatDuration(min: number): string {
  if (!min || min <= 0) return '—'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m}'`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

/** Clé d'état pour un jour (Tai Chi, note). */
export function dayKey(wk: number, di: number): string {
  return `${wk}-${di}`
}

/** Clé d'état pour une étape (séance) d'un jour. */
export function sessionKey(wk: number, di: number, si: number): string {
  return `${wk}-${di}-${si}`
}

/** Clé d'état pour une option d'un jour (Tai Chi, etc.). */
export function optionKey(wk: number, di: number, label: string): string {
  return `${wk}-${di}::${label}`
}

/** Un jour d'entraînement est validé si toutes ses étapes sont validées. */
export function isDayValidated(
  wk: number,
  di: number,
  day: Session[],
  sessions: Record<string, number>,
): boolean {
  if (day.length === 0) return false
  return day.every((_, si) => sessionKey(wk, di, si) in sessions)
}

/** Formatage court d'une date : "6 juil." */
export function formatShort(d: Date): string {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

/** Un jour d'entraînement passé (avant aujourd'hui) et non validé = "manqué". */
export function isOverdue(date: Date, day: Session[], today: Date): boolean {
  if (!isTrainingDay(day)) return false
  return date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
}
