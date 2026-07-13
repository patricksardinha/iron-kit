// Multi-plans : registre (liste + plan actif), cloisonnement du stockage par plan,
// migration one-shot des anciennes clés, import de plans auto-suffisants.
import { useCallback, useEffect, useState } from 'react'
import type { Data } from './useData'
import type { PlanFile, PlanMeta, SessionLibrary, Week } from '../types'
import { migrateWeeks } from '../lib/migrate'
import { STORAGE_KEY } from '../lib/storage'
import { LEGACY_OPTIONS_KEY, LEGACY_PLAN_KEY } from './usePlan'

const REGISTRY_KEY = 'ik-plans-v1'
export const BUILTIN_ID = 'evian'

interface Registry {
  activeId: string
  plans: PlanMeta[]
}

const baseKey = (id: string) => `ik-base-${id}`

function loadRegistry(): Registry | null {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY)
    if (!raw) return null
    const r = JSON.parse(raw) as Registry
    if (!Array.isArray(r.plans) || !r.plans.length) return null
    return r
  } catch {
    return null
  }
}

/** Premier lancement : crée le plan intégré et récupère les données des anciennes clés. */
function migrateLegacy(): Registry {
  const meta: PlanMeta = {
    id: BUILTIN_ID,
    name: 'Objectif Evian',
    createdAt: new Date().toISOString(),
    builtin: true,
  }
  const move = (from: string, to: string) => {
    try {
      const v = localStorage.getItem(from)
      if (v && !localStorage.getItem(to)) localStorage.setItem(to, v)
    } catch {
      /* ignore */
    }
  }
  move(LEGACY_PLAN_KEY, `ik-plan-${BUILTIN_ID}`)
  move(LEGACY_OPTIONS_KEY, `ik-options-${BUILTIN_ID}`)
  move(STORAGE_KEY, `ik-state-${BUILTIN_ID}`)
  const reg: Registry = { activeId: BUILTIN_ID, plans: [meta] }
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(reg))
  } catch {
    /* ignore */
  }
  return reg
}

/** Résout les données (base + catalogue) du plan actif. */
function resolveContent(active: PlanMeta, data: Data): { baseWeeks: Week[]; library: SessionLibrary } {
  if (active.builtin) return { baseWeeks: data.plan, library: data.sessions }
  try {
    const raw = localStorage.getItem(baseKey(active.id))
    if (raw) {
      const b = JSON.parse(raw) as { weeks: unknown; sessions?: SessionLibrary }
      const lib = b.sessions && Object.keys(b.sessions).length ? b.sessions : data.sessions
      return { baseWeeks: migrateWeeks(b.weeks), library: lib }
    }
  } catch {
    /* ignore */
  }
  return { baseWeeks: data.plan, library: data.sessions } // repli sécurisé
}

export interface PlansApi {
  plans: PlanMeta[]
  activeId: string
  active: PlanMeta
  baseWeeks: Week[]
  library: SessionLibrary
  select: (id: string) => void
  importPlan: (file: PlanFile) => { ok: boolean; error?: string }
  renamePlan: (id: string, name: string) => void
  deletePlan: (id: string) => void
}

export function usePlans(data: Data): PlansApi {
  const [registry, setRegistry] = useState<Registry>(() => loadRegistry() ?? migrateLegacy())

  useEffect(() => {
    try {
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
    } catch {
      /* ignore */
    }
  }, [registry])

  const active = registry.plans.find((p) => p.id === registry.activeId) ?? registry.plans[0]!
  const { baseWeeks, library } = resolveContent(active, data)

  const select = useCallback((id: string) => {
    setRegistry((r) => (r.plans.some((p) => p.id === id) ? { ...r, activeId: id } : r))
  }, [])

  const importPlan = useCallback((file: PlanFile): { ok: boolean; error?: string } => {
    if (!file || !Array.isArray(file.weeks) || file.weeks.length === 0) {
      return { ok: false, error: 'Fichier de plan invalide (aucune semaine).' }
    }
    const id = `p-${Date.now().toString(36)}`
    const weeks = migrateWeeks(file.weeks, file.start)
    if (weeks.length === 0) return { ok: false, error: 'Semaines illisibles.' }
    try {
      localStorage.setItem(
        baseKey(id),
        JSON.stringify({ weeks, sessions: file.sessions ?? {} }),
      )
    } catch {
      return { ok: false, error: 'Stockage plein : impossible d’enregistrer le plan.' }
    }
    const meta: PlanMeta = {
      id,
      name: (file.name || 'Plan importé').slice(0, 60),
      createdAt: new Date().toISOString(),
    }
    setRegistry((r) => ({ activeId: id, plans: [...r.plans, meta] }))
    return { ok: true }
  }, [])

  const renamePlan = useCallback((id: string, name: string) => {
    const n = name.trim().slice(0, 60)
    if (!n) return
    setRegistry((r) => ({ ...r, plans: r.plans.map((p) => (p.id === id ? { ...p, name: n } : p)) }))
  }, [])

  const deletePlan = useCallback((id: string) => {
    setRegistry((r) => {
      const target = r.plans.find((p) => p.id === id)
      if (!target || target.builtin) return r // le plan intégré n'est pas supprimable
      const remaining = r.plans.filter((p) => p.id !== id)
      if (remaining.length === 0) return r
      for (const k of [`ik-plan-${id}`, `ik-options-${id}`, `ik-state-${id}`, baseKey(id)]) {
        try {
          localStorage.removeItem(k)
        } catch {
          /* ignore */
        }
      }
      const activeId =
        r.activeId === id ? (remaining.find((p) => p.builtin)?.id ?? remaining[0]!.id) : r.activeId
      return { activeId, plans: remaining }
    })
  }, [])

  return {
    plans: registry.plans,
    activeId: active.id,
    active,
    baseWeeks,
    library,
    select,
    importPlan,
    renamePlan,
    deletePlan,
  }
}
