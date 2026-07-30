// Chargement des données (plan.json + recipes.json + sessions.json) — précachées par le SW.
import { useEffect, useState } from 'react'
import type { Week, Recipe, SessionLibrary } from '../types'
import { migrateWeeks } from '../lib/migrate'

export interface Data {
  plan: Week[]
  recipes: Recipe[]
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
      fetch(`${base}sessions.json`).then((r) => {
        if (!r.ok) throw new Error('sessions.json')
        return r.json() as Promise<SessionLibrary>
      }),
    ])
      .then(([plan, recipes, sessions]) => {
        if (!alive) return
        setStatus({ state: 'ready', data: { plan, recipes, sessions } })
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
