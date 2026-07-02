// Données du plan (source de vérité : plan.json)
export interface Week {
  wk: number
  dates: string
  phase: string
  typ: string
  obj: string
  vol: number
  days: string[] // 7 libellés, 0=Lundi … 6=Dimanche
}

// Contenu de l'onglet Nutrition (source : nutrition.json)
export interface NutritionItem {
  h: string
  t: string
}
export interface NutritionSection {
  title: string
  accent: string // token couleur : swim | bike | run | p3 …
  items: NutritionItem[]
}

// État utilisateur persistant (§6)
export interface State {
  done: Record<string, true> // `${wk}-${dayIndex}` → séance validée
  taichi: Record<string, true> // `${wk}-${dayIndex}` → Tai Chi fait (indépendant)
  notes: Record<string, string> // `${wk}-${dayIndex}` → note / ressenti libre
}

export type Tab = 'week' | 'progress' | 'plan' | 'nutrition'

export type DisciplineKey = 'swim' | 'bike' | 'run' | 'repos' | 'race' | 'other'
export interface Discipline {
  key: DisciplineKey
  color: string // valeur CSS (var(--…) ou dégradé)
}
