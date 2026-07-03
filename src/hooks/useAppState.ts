// État utilisateur : validation par étape / taichi / notes — persistant.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { State } from '../types'
import { loadState, saveState } from '../lib/storage'
import { dayKey, optionKey, sessionKey } from '../lib/logic'

export interface AppState {
  state: State
  setSession: (wk: number, di: number, si: number, min: number | null) => void
  toggleOption: (wk: number, di: number, label: string) => void
  setNote: (wk: number, di: number, text: string) => void
  replaceState: (next: State) => void
  remapAfterDeleteWeek: (pos: number) => void
  remapAfterInsertWeek: (pos: number) => void
  remapReorderWeek: (from: number, to: number) => void
}

function withoutKey<T>(rec: Record<string, T>, key: string): Record<string, T> {
  const next = { ...rec }
  delete next[key]
  return next
}

/** Applique un remap de numéro de semaine aux clés `${wk}-…` d'un enregistrement. */
function remapKeys<T>(rec: Record<string, T>, mapWk: (wk: number) => number | null): Record<string, T> {
  const next: Record<string, T> = {}
  for (const [k, v] of Object.entries(rec)) {
    const dash = k.indexOf('-')
    const wk = Number(k.slice(0, dash))
    const rest = k.slice(dash + 1)
    const nw = mapWk(wk)
    if (nw === null) continue
    next[`${nw}-${rest}`] = v
  }
  return next
}

export function useAppState(): AppState {
  const [state, setState] = useState<State>(() => loadState())

  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    saveState(state)
  }, [state])

  // Valide/ajuste une étape : min = minutes faites (clé présente), null = dévalider.
  const setSession = useCallback((wk: number, di: number, si: number, min: number | null) => {
    const k = sessionKey(wk, di, si)
    setState((s) => {
      if (min === null) return { ...s, sessions: withoutKey(s.sessions, k) }
      const v = Math.max(0, Math.round(min))
      return { ...s, sessions: { ...s.sessions, [k]: v } }
    })
  }, [])

  const toggleOption = useCallback((wk: number, di: number, label: string) => {
    const k = optionKey(wk, di, label)
    setState((s) =>
      s.options[k]
        ? { ...s, options: withoutKey(s.options, k) }
        : { ...s, options: { ...s.options, [k]: true } },
    )
  }, [])

  const setNote = useCallback((wk: number, di: number, text: string) => {
    const k = dayKey(wk, di)
    setState((s) => {
      if (!text.trim()) return { ...s, notes: withoutKey(s.notes, k) }
      return { ...s, notes: { ...s.notes, [k]: text } }
    })
  }, [])

  const replaceState = useCallback((next: State) => setState(next), [])

  const applyRemap = useCallback((map: (wk: number) => number | null) => {
    setState((s) => ({
      sessions: remapKeys(s.sessions, map),
      options: remapKeys(s.options, map),
      notes: remapKeys(s.notes, map),
    }))
  }, [])

  const remapAfterDeleteWeek = useCallback(
    (pos: number) => applyRemap((wk) => (wk === pos ? null : wk > pos ? wk - 1 : wk)),
    [applyRemap],
  )
  const remapAfterInsertWeek = useCallback(
    (pos: number) => applyRemap((wk) => (wk >= pos ? wk + 1 : wk)),
    [applyRemap],
  )
  const remapReorderWeek = useCallback(
    (from: number, to: number) =>
      applyRemap((wk) => {
        if (wk === from) return to
        if (from < to && wk > from && wk <= to) return wk - 1
        if (to < from && wk >= to && wk < from) return wk + 1
        return wk
      }),
    [applyRemap],
  )

  return {
    state,
    setSession,
    toggleOption,
    setNote,
    replaceState,
    remapAfterDeleteWeek,
    remapAfterInsertWeek,
    remapReorderWeek,
  }
}
