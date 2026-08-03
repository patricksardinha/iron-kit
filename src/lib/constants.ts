// Constantes & jalons (§7)

// Début par défaut du plan intégré (utilisé par la migration des plans legacy).
export const START = new Date(2026, 6, 6) // lundi 6 juil. 2026 (mois 0-indexé)
export const TOTAL_WEEKS = 62
export const DAY_MS = 24 * 60 * 60 * 1000

export const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const

export interface Jalon {
  wk: number
  t: string
  d: string
}

export const JALONS: Jalon[] = [
  { wk: 4, t: 'Test natation', d: '200 m crawl continu (départ ~50 m). Respiration bilatérale.' },
  { wk: 8, t: 'Bike fit réalisé', d: 'Position validée par un pro.' },
  { wk: 16, t: 'Fin de fondation', d: '400 m crawl continu · vélo 3 h vallonné · course saine.' },
  { wk: 24, t: 'Home trainer rentabilisé', d: 'Force/FTP en hausse · 1000 m continu · 1er brick.' },
  { wk: 32, t: 'Fin de construction', d: '1500 m continu · vélo 4 h · enchaînement fluide.' },
  { wk: 40, t: 'Eau libre lancée', d: 'Combinaison (lac), sighting, rolling start.' },
  { wk: 42, t: 'Test montagne vélo', d: '2 cols sur une sortie longue · 2000+ m D+.' },
  { wk: 47, t: 'Course test (Half)', d: 'Finir un half vallonné. Tester nutrition/transitions.' },
  { wk: 55, t: 'Pic de charge', d: 'Vélo 5-6 h montagne (2500-3000 D+) · brick long · 3,8 km eau libre.' },
  { wk: 62, t: 'Course objectif', d: 'Le jour J. Tout le travail paie ici.' },
]

// Phases connues (ordre chronologique) et types autorisés par phase (§ menus).
export const PHASES = [
  '0 - Fondation',
  '1 - Construction',
  '2 - Spécifique',
  '3 - Pic & Affûtage',
] as const

// Type d'une semaine autorisé selon la phase. Clé = préfixe numérique de la phase.
export const PHASE_TYPES: Record<string, string[]> = {
  '0': ['Charge', 'Récup'],
  '1': ['Charge', 'Récup'],
  '2': ['Charge', 'Récup', 'Affût.', 'TEST 70.3'],
  '3': ['Charge', 'Récup', 'PIC', 'Affût.', 'COURSE'],
}

/** Types autorisés pour une phase donnée (repli : liste complète). */
export function typesForPhase(phase: string): string[] {
  const n = phase.trim().charAt(0)
  return PHASE_TYPES[n] ?? ['Charge', 'Récup', 'Affût.', 'PIC', 'TEST 70.3', 'COURSE']
}

// Association phase → token couleur (§8). La clé est le préfixe numérique de `phase`.
export const PHASE_COLOR: Record<string, string> = {
  '0': 'var(--p0)',
  '1': 'var(--p1)',
  '2': 'var(--p2)',
  '3': 'var(--p3)',
}

export function phaseColor(phase: string): string {
  const n = phase.trim().charAt(0)
  return PHASE_COLOR[n] ?? 'var(--faint)'
}

/** Sépare une phase « 0 - Fondation » en numéro + libellé. */
export function phaseParts(phase: string): { num: string; label: string } {
  const m = phase.trim().match(/^(\d+)\s*[-–—]?\s*(.*)$/)
  if (m) return { num: m[1]!, label: (m[2] || '').trim() || phase }
  return { num: '', label: phase }
}
