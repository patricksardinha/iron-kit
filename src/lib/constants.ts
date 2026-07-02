// Constantes & jalons (§7)

export const START = new Date(2026, 6, 6) // lundi 6 juil. 2026 (mois 0-indexé)
export const RACE = new Date(2027, 8, 12) // 12 sept. 2027
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
  { wk: 62, t: 'LÉ-MAN Evian', d: 'Le jour J. ~14-16 h visées.' },
]

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
