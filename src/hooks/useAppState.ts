// État utilisateur : done / taichi / notes — persistant sous une clé unique.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { State } from '../types'
import { loadState, saveState } from '../lib/storage'
import { dayKey } from '../lib/logic'

export interface AppState {
  state: State
  toggleDone: (wk: number, di: number) => void
  toggleTaichi: (wk: number, di: number) => void
  setNote: (wk: number, di: number, text: string) => void
  replaceState: (next: State) => void
  remapAfterDeleteWeek: (pos: number) => void
}

function withoutKey<T>(rec: Record<string, T>, key: string): Record<string, T> {
  const next = { ...rec }
  delete next[key]
  return next
}

export function useAppState(): AppState {
  const [state, setState] = useState<State>(() => loadState())

  // Sauvegarde à chaque changement (toggle / frappe).
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    saveState(state)
  }, [state])

  const toggleDone = useCallback((wk: number, di: number) => {
    const k = dayKey(wk, di)
    setState((s) =>
      s.done[k]
        ? { ...s, done: withoutKey(s.done, k) }
        : { ...s, done: { ...s.done, [k]: true } },
    )
  }, [])

  const toggleTaichi = useCallback((wk: number, di: number) => {
    const k = dayKey(wk, di)
    setState((s) =>
      s.taichi[k]
        ? { ...s, taichi: withoutKey(s.taichi, k) }
        : { ...s, taichi: { ...s.taichi, [k]: true } },
    )
  }, [])

  const setNote = useCallback((wk: number, di: number, text: string) => {
    const k = dayKey(wk, di)
    setState((s) => {
      const trimmed = text
      if (!trimmed.trim()) return { ...s, notes: withoutKey(s.notes, k) }
      return { ...s, notes: { ...s.notes, [k]: trimmed } }
    })
  }, [])

  const replaceState = useCallback((next: State) => setState(next), [])

  // Suppression de la semaine `pos` : on retire ses clés et on décale
  // (wk-1) toutes les clés des semaines suivantes, pour rester aligné sur la
  // renumérotation du plan (wk = position).
  const remapAfterDeleteWeek = useCallback((pos: number) => {
    const shift = <T>(rec: Record<string, T>): Record<string, T> => {
      const next: Record<string, T> = {}
      for (const [k, v] of Object.entries(rec)) {
        const dash = k.indexOf('-')
        const wk = Number(k.slice(0, dash))
        const di = k.slice(dash + 1)
        if (wk === pos) continue
        const nk = wk > pos ? `${wk - 1}-${di}` : k
        next[nk] = v
      }
      return next
    }
    setState((s) => ({
      done: shift(s.done),
      taichi: shift(s.taichi),
      notes: shift(s.notes),
    }))
  }, [])

  return { state, toggleDone, toggleTaichi, setNote, replaceState, remapAfterDeleteWeek }
}
