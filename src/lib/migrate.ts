// Migration : ancien plan (jours en texte libre) → modèle structuré (Session[]).
// Idempotent : un plan déjà au nouveau shape est renvoyé tel quel.
import type { Session, SessionDisc, Week } from '../types'
import { START } from './constants'
import { addDays, toISO } from './logic'

interface LegacyWeek {
  wk: number
  dates?: string
  phase: string
  typ: string
  obj: string
  vol?: number
  days: string[]
}

/** Normalise les tirets longs et espaces d'un libellé de phase (« 0 — X » → « 0 - X »). */
function normPhase(phase: string): string {
  return (phase ?? '').replace(/\s*[—–]\s*/g, ' - ').trim()
}

const DEFAULT_OPTIONS = ['Tai Chi']
function defaultDayOptions(): string[][] {
  return Array.from({ length: 7 }, () => [...DEFAULT_OPTIONS])
}

/** Détecte la discipline d'un segment de séance (null si aucun mot-clé). */
function detectDisc(seg: string): SessionDisc | null {
  if (/>>>|ironman|course\s*70\.3/i.test(seg)) return 'race'
  if (/\bnat/i.test(seg)) return 'swim'
  if (/\bvélo/i.test(seg)) return 'bike'
  if (/\bcap\b/i.test(seg)) return 'run'
  if (/gainage|renfo|mobilité/i.test(seg)) return 'strength'
  if (/activation/i.test(seg)) return 'other'
  return null
}

interface Dur {
  min: number
  // portion de texte à retirer du détail (chaîne exacte trouvée), ou null
  match: string | null
}

/** Extrait une durée (minutes) d'un segment + le texte source à nettoyer. */
function parseDur(seg: string): Dur {
  let m: RegExpMatchArray | null

  // 2.5 h / 1,25 h  → heures décimales
  m = seg.match(/(\d+)[.,](\d+)\s*h\b/i)
  if (m) return { min: Math.round((Number(m[1]) + Number(`0.${m[2]}`)) * 60), match: m[0] }

  // 1h15 / 2h30 / 1h05  → heures + minutes
  m = seg.match(/(\d+)\s*h\s*(\d{2})\b/i)
  if (m) return { min: Number(m[1]) * 60 + Number(m[2]), match: m[0] }

  // 1h / 3 h  → heures pleines
  m = seg.match(/(\d+)\s*h(?![a-zà-ÿ0-9])/i)
  if (m) return { min: Number(m[1]) * 60, match: m[0] }

  // 45' / 10'  → minutes
  m = seg.match(/(\d+)\s*['′]/)
  if (m) return { min: Number(m[1]), match: m[0] }

  // Natation en distance seule (2000 m / 3,8 km) → estimation ~1,8 min/100 m
  m = seg.match(/(\d+(?:[.,]\d+)?)\s*(km|m)\b/i)
  if (m) {
    const val = Number(m[1]!.replace(',', '.'))
    const meters = /km/i.test(m[2]!) ? val * 1000 : val
    return { min: Math.round((meters / 100) * 1.8), match: null } // distance gardée dans le détail
  }

  // Entier nu plausible en minutes (« Vélo Z2 45 »)
  m = seg.match(/\b(\d{2,3})\b/)
  if (m) {
    const n = Number(m[1])
    if (n >= 10 && n <= 240) return { min: n, match: m[0] }
  }

  return { min: 0, match: null }
}

/** Nettoie un détail : retire la durée matchée, compacte espaces et séparateurs orphelins. */
function cleanDetail(seg: string, match: string | null): string {
  let s = seg
  if (match) s = s.replace(match, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  s = s.replace(/^[\s—\-·+]+|[\s—\-·+(]+$/g, '').trim()
  s = s.replace(/\(\s*\)/g, '').trim()
  return s
}

/** Convertit un libellé de jour en liste de séances (jour de repos → []). */
export function parseDay(label: string): Session[] {
  const raw = label.trim()
  if (!raw || /^repos/i.test(raw)) return []

  // Épreuve : une seule « séance » course, sans durée.
  if (/>>>|ironman|course\s*70\.3/i.test(raw)) {
    const detail = raw.replace(/>>>|<<</g, '').replace(/\s+/g, ' ').trim()
    return [{ disc: 'race', detail, min: 0 }]
  }

  const sessions: Session[] = []
  for (const seg of raw.split(/\s\+\s/)) {
    const disc = detectDisc(seg)
    const dur = parseDur(seg)
    const detail = cleanDetail(seg, dur.match)

    if (disc === null) {
      // Pas de nouvelle discipline : complément de la séance précédente.
      const last = sessions[sessions.length - 1]
      if (last) {
        last.detail = detail ? `${last.detail} + ${detail}`.replace(/^\s\+\s/, '') : last.detail
        if (last.min === 0 && dur.min > 0) last.min = dur.min
      } else {
        sessions.push({ disc: 'other', detail, min: dur.min })
      }
    } else {
      sessions.push({ disc, detail, min: dur.min })
    }
  }
  return sessions
}

/** true si l'entrée est déjà au nouveau shape (Week[]). */
function isNewShape(input: unknown[]): input is Week[] {
  const w = input[0] as Record<string, unknown> | undefined
  return !!w && typeof w['start'] === 'string' && Array.isArray(w['days']) && Array.isArray((w['days'] as unknown[])[0])
}

/** Complète une semaine déjà au nouveau shape (backfill dayOptions, normalise phase). */
function ensureWeekFields(w: Week): Week {
  const dayOptions =
    Array.isArray(w.dayOptions) && w.dayOptions.length === 7
      ? w.dayOptions.map((d) => (Array.isArray(d) ? d : []))
      : defaultDayOptions()
  return { ...w, phase: normPhase(w.phase), dayOptions }
}

/** Migre un plan inconnu vers Week[] structuré. Idempotent. */
export function migrateWeeks(input: unknown): Week[] {
  if (!Array.isArray(input) || input.length === 0) return []
  if (isNewShape(input)) return (input as Week[]).map(ensureWeekFields)

  return (input as LegacyWeek[]).map((w, i) => ({
    wk: i + 1,
    start: toISO(addDays(START, i * 7)),
    phase: normPhase(w.phase ?? '0 - Fondation'),
    typ: w.typ ?? 'Charge',
    obj: w.obj ?? '',
    days: Array.isArray(w.days) ? w.days.map(parseDay) : [],
    dayOptions: defaultDayOptions(),
  }))
}
