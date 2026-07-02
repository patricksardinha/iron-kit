// Chargement des données (plan.json + nutrition.json) — précachées par le SW.
import { useEffect, useState } from 'react'
import type { Week, NutritionSection } from '../types'

export interface Data {
  plan: Week[]
  nutrition: NutritionSection[]
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
      fetch(`${base}plan.json`).then((r) => {
        if (!r.ok) throw new Error('plan.json')
        return r.json() as Promise<Week[]>
      }),
      fetch(`${base}nutrition.json`).then((r) => {
        if (!r.ok) throw new Error('nutrition.json')
        return r.json() as Promise<NutritionSection[]>
      }),
    ])
      .then(([plan, nutrition]) => {
        if (!alive) return
        setStatus({ state: 'ready', data: { plan, nutrition } })
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
