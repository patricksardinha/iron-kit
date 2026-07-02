// Plan éditable : part de plan.json (base), puis surcouche persistée localement.
// Invariant : les semaines restent contiguës, wk = position (1..N).
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Week } from '../types'

export const PLAN_KEY = 'objectif-evian-plan-v1'

export type WeekPatch = Partial<Omit<Week, 'wk' | 'days'>>

export interface PlanApi {
  weeks: Week[]
  isCustom: boolean // true si le plan a été édité (diffère de plan.json)
  updateWeek: (pos: number, patch: WeekPatch) => void
  updateDay: (pos: number, di: number, label: string) => void
  addWeek: () => void
  deleteWeek: (pos: number) => void
  reset: () => void
}

/** Renumérote pour garantir wk = position (1..N). */
function renumber(weeks: Week[]): Week[] {
  return weeks.map((w, i) => (w.wk === i + 1 ? w : { ...w, wk: i + 1 }))
}

function loadEdited(): Week[] | null {
  try {
    const raw = localStorage.getItem(PLAN_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    return renumber(parsed as Week[])
  } catch {
    return null
  }
}

/**
 * @param base plan.json chargé
 * @param onDeleteWeek callback appelé AVANT suppression pour remapper l'état utilisateur
 *                     (décale les clés done/taichi/notes des semaines suivantes)
 */
export function usePlan(base: Week[], onDeleteWeek: (pos: number) => void): PlanApi {
  const edited = useRef<Week[] | null>(loadEdited())
  const [weeks, setWeeks] = useState<Week[]>(() => edited.current ?? base)
  const [isCustom, setIsCustom] = useState<boolean>(() => edited.current != null)

  // Persiste dès qu'on est en mode "plan personnalisé".
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (isCustom) {
      try {
        localStorage.setItem(PLAN_KEY, JSON.stringify(weeks))
      } catch {
        /* quota : on ignore */
      }
    }
  }, [weeks, isCustom])

  const commit = useCallback((next: Week[]) => {
    setIsCustom(true)
    setWeeks(renumber(next))
  }, [])

  const updateWeek = useCallback(
    (pos: number, patch: WeekPatch) => {
      setIsCustom(true)
      setWeeks((ws) => ws.map((w) => (w.wk === pos ? { ...w, ...patch } : w)))
    },
    [],
  )

  const updateDay = useCallback((pos: number, di: number, label: string) => {
    setIsCustom(true)
    setWeeks((ws) =>
      ws.map((w) =>
        w.wk === pos ? { ...w, days: w.days.map((d, i) => (i === di ? label : d)) } : w,
      ),
    )
  }, [])

  const addWeek = useCallback(() => {
    setIsCustom(true)
    setWeeks((ws) => {
      const last = ws[ws.length - 1]
      const fresh: Week = {
        wk: ws.length + 1,
        dates: '',
        phase: last?.phase ?? '0 — Fondation',
        typ: 'Charge',
        obj: '',
        vol: 0,
        days: Array.from({ length: 7 }, () => 'Repos / mobilité'),
      }
      return [...ws, fresh]
    })
  }, [])

  const deleteWeek = useCallback(
    (pos: number) => {
      onDeleteWeek(pos) // remappe l'état utilisateur avant renumérotation
      commit(weeks.filter((w) => w.wk !== pos))
    },
    [weeks, commit, onDeleteWeek],
  )

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(PLAN_KEY)
    } catch {
      /* ignore */
    }
    edited.current = null
    setIsCustom(false)
    setWeeks(base)
  }, [base])

  return { weeks, isCustom, updateWeek, updateDay, addWeek, deleteWeek, reset }
}
