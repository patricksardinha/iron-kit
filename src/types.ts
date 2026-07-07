// Données du plan (source de vérité : plan.json, migré au chargement)

// Discipline d'une séance (voir lib/logic:disciplineOf).
export type SessionDisc = 'swim' | 'bike' | 'run' | 'strength' | 'race' | 'other'

// Une séance atomique dans un jour. La durée pilote le volume de la semaine.
export interface Session {
  disc: SessionDisc
  detail: string // libre : « Z2 vallonné », « 5×4' bosses », « 2000 m EL »…
  min: number // durée en minutes (0 possible)
}

export interface Week {
  wk: number // position 1..N (dérivée du tri chronologique par `start`)
  start: string // ISO du lundi, ex. "2026-07-06" - source de vérité du placement
  phase: string
  typ: string
  obj: string
  days: Session[][] // 7 jours (0=Lundi … 6=Dimanche) ; jour vide [] = repos
  dayOptions: string[][] // 7 jours → options actives ce jour-là (issues du pool global)
}

// Bibliothèque de séances détaillées (source : sessions.json), indexée par code.
export interface SessionBlock {
  h: string // titre du bloc (« Échauffement (~10') »…)
  items: string[] // consignes de ce bloc
}
export interface SessionInfo {
  name: string
  disc: 'swim' | 'bike' | 'run' | 'rest' | 'race'
  goal: string
  blocks: SessionBlock[]
  cues?: string[] // points clés (optionnel)
  prog?: string // logique de progression (optionnel)
}
export type SessionLibrary = Record<string, SessionInfo>

// Contenu de l'onglet Nutrition (source : nutrition.json)
export interface NutritionItem {
  h: string
  t: string
  list?: string[] // aliments concrets + quantités (homme 67-70 kg) — dépliable
}
export interface NutritionSection {
  title: string
  accent: string // token couleur : swim | bike | run | p3 …
  items: NutritionItem[]
}

// État utilisateur persistant (§6)
export interface State {
  // `${wk}-${di}-${si}` → minutes réellement faites (clé présente = étape validée,
  // même à 0 pour une épreuve sans durée). Un jour est validé si toutes ses étapes le sont.
  sessions: Record<string, number>
  options: Record<string, true> // `${wk}-${di}::${label}` → option validée (ex. Tai Chi)
  notes: Record<string, string> // `${wk}-${dayIndex}` → note / ressenti libre
}

// Récompense (onglet Progression).
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'special'
export interface Badge {
  id: string
  group: string // catégorie (pour l'affichage groupé)
  title: string
  desc: string
  emoji: string
  tier: BadgeTier
  earned: boolean
  current: number
  target: number
}

export type Tab = 'week' | 'progress' | 'plan' | 'rewards' | 'nutrition' | 'settings'

// Réglages utilisateur (profil + apparence) — persistés séparément de l'état.
export interface Settings {
  sex: 'h' | 'f' | null
  weight: number | null // kg
  height: number | null // cm
  age: number | null // ans
  theme: string // id de thème
  accent: string // id de couleur d'accent
}

export type DisciplineKey = 'swim' | 'bike' | 'run' | 'repos' | 'race' | 'other'
export interface Discipline {
  key: DisciplineKey
  color: string // valeur CSS (var(--…) ou dégradé)
}
