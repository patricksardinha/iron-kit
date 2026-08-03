// Chargement des données (plan.json + recipes.json + ingredients.json + sessions.json)
// — précachées par le SW.
import { useEffect, useState } from 'react'
import type { Week, Recipe, IngredientCategory, SessionLibrary } from '../types'
import { migrateWeeks } from '../lib/migrate'

export interface Data {
  plan: Week[]
  recipes: Recipe[]
  ingredients: IngredientCategory[]
  sessions: SessionLibrary
}

type Status =
  | { state: 'loading' }
  | { state: 'ready'; data: Data }
  | { state: 'error'; message: string }

// Base relative (cf. vite base './') pour fonctionner en sous-chemin.
const base = import.meta.env.BASE_URL

export function useData(): Status {
  const [status, setStatus] = useState<Status>({ state: 'loading' })

  useEffect(() => {
    let alive = true
    Promise.all([
      fetch(`${base}plan.json`).then(async (r) => {
        if (!r.ok) throw new Error('plan.json')
        return migrateWeeks(await r.json()) as Week[]
      }),
      fetch(`${base}recipes.json`).then((r) => {
        if (!r.ok) throw new Error('recipes.json')
        return r.json() as Promise<Recipe[]>
      }),
      fetch(`${base}ingredients.json`).then((r) => {
        if (!r.ok) throw new Error('ingredients.json')
        return r.json() as Promise<IngredientCategory[]>
      }),
      fetch(`${base}sessions.json`).then((r) => {
        if (!r.ok) throw new Error('sessions.json')
        return r.json() as Promise<SessionLibrary>
      }),
    ])
      .then(([plan, recipes, ingredients, sessions]) => {
        if (!alive) return
        setStatus({ state: 'ready', data: { plan, recipes, ingredients, sessions } })
      })
      .catch((e: unknown) => {
        if (!alive) return
        const message = e instanceof Error ? e.message : 'inconnu'
        setStatus({ state: 'error', message })
      })
    return () => {
      alive = false
    }
  }, [])

  return status
}
