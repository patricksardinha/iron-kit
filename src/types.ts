// Données du plan (source de vérité : plan.json, migré au chargement)
import type { IconName } from './components/Icon'

// Discipline d'une séance (voir lib/logic:disciplineOf).
export type SessionDisc = 'swim' | 'bike' | 'run' | 'strength' | 'race' | 'other'

// Une séance atomique dans un jour. La durée pilote le volume de la semaine.
export interface Session {
  disc: SessionDisc
  detail: string // libre : « Z2 vallonné », « 5×4' bosses », « 2000 m EL »…
  min: number // durée en minutes (0 possible)
  info?: SessionInfo // détail éditable (override du catalogue sessions.json), propre au plan
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

// Catalogue d'ingrédients de l'onglet Frigo (source : ingredients.json).
// Seuls les ingrédients utilisés par au moins une recette sont proposés à la sélection.
export interface IngredientCategory {
  cat: string
  items: string[]
}

// Recette de l'onglet Frigo (source : recipes.json)
export interface Recipe {
  name: string
  cat: string // catégorie d'affichage : Petit-déj | Plat | Post-entraînement | Collation…
  time?: number // préparation+cuisson (minutes)
  desc?: string
  ingredients: string[] // ingrédients nécessaires (noms simples en minuscules)
  steps?: string[]
}

// État utilisateur persistant (§6)
export interface State {
  // `${wk}-${di}-${si}` → minutes réellement faites (clé présente = étape validée,
  // même à 0 pour une épreuve sans durée). Un jour est validé si toutes ses étapes le sont.
  sessions: Record<string, number>
  options: Record<string, true> // `${wk}-${di}::${label}` → option validée (ex. Tai Chi)
  notes: Record<string, string> // `${wk}-${dayIndex}` → note / ressenti libre
  locks: Record<string, true> // `${wk}-${dayIndex}` → carte verrouillée (anti mauvaise manip)
  // `${wk}` → agencement RÉEL des séances de la semaine (7 jours). Présent = l'utilisateur a
  // réarrangé ses séances dans l'onglet Semaine (n'altère pas le plan). Sinon on suit le plan.
  layout: Record<string, Session[][]>
  // `${wk}` → test/jalon (constants:JALONS) validé. Les jalons sont fixes : pas de remap.
  tests: Record<string, true>
}

// Récompense (onglet Progression).
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'special'
export interface Badge {
  id: string
  group: string // catégorie (pour l'affichage groupé)
  title: string
  desc: string
  icon: IconName // icône personnalisée (jeu de lignes de Icon.tsx)
  tier: BadgeTier
  earned: boolean
  current: number
  target: number
  hidden?: boolean // easter egg : masqué tant que non débloqué
}

export type Tab = 'week' | 'progress' | 'plan' | 'rewards' | 'fridge' | 'settings'

// Multi-plans : métadonnées d'un plan dans le registre.
export interface PlanMeta {
  id: string
  name: string
  createdAt: string // ISO
  builtin?: boolean // plan intégré (Objectif Evian) — non supprimable, base = fichiers publics
}

// Format de fichier d'un plan importable (auto-suffisant).
export interface PlanFile {
  name: string
  start?: string // lundi de départ (ISO) — sinon aujourd'hui
  weeks: unknown[] // semaines (format libellés) — migrées à l'import
  sessions?: SessionLibrary // catalogue de séances détaillées (optionnel)
}

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
