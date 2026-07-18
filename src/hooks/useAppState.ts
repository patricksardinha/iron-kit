// État utilisateur : validation par étape / taichi / notes — persistant.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session, State } from '../types'
import { loadState, saveState } from '../lib/storage'
import { dayKey, optionKey, sessionKey } from '../lib/logic'

export interface AppState {
  state: State
  setSession: (wk: number, di: number, si: number, min: number | null) => void
  toggleOption: (wk: number, di: number, label: string) => void
  setNote: (wk: number, di: number, text: string) => void
  toggleLock: (wk: number, di: number) => void
  // Déplace une séance entre jours DANS la réalité de la semaine (n'altère pas le plan).
  // `days` = agencement courant effectif de la semaine (validations déplacées avec la séance).
  applyWeekMove: (
    wk: number,
    days: Session[][],
    fromDi: number,
    fromSi: number,
    toDi: number,
    toSi: number,
  ) => void
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

/** Remap d'un enregistrement dont la clé EST le numéro de semaine (ex. layout). */
function remapNumKeys<T>(rec: Record<string, T>, mapWk: (wk: number) => number | null): Record<string, T> {
  const next: Record<string, T> = {}
  for (const [k, v] of Object.entries(rec)) {
    const nw = mapWk(Number(k))
    if (nw === null) continue
    next[String(nw)] = v
  }
  return next
}

export function useAppState(planId: string): AppState {
  const key = `ik-state-${planId}`
  const [state, setState] = useState<State>(() => loadState(key))

  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    saveState(state, key)
  }, [state, key])

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

  const toggleLock = useCallback((wk: number, di: number) => {
    const k = dayKey(wk, di)
    setState((s) =>
      s.locks[k] ? { ...s, locks: withoutKey(s.locks, k) } : { ...s, locks: { ...s.locks, [k]: true } },
    )
  }, [])

  // Déplace une séance entre jours dans la réalité de la semaine + suit ses validations.
  const applyWeekMove = useCallback(
    (wk: number, days: Session[][], fromDi: number, fromSi: number, toDi: number, toSi: number) => {
      setState((s) => {
        if (!days[fromDi] || fromSi < 0 || fromSi >= days[fromDi]!.length) return s
        // Validations alignées sur l'agencement courant.
        const val = days.map((day, di) =>
          day.map((_, si) => {
            const k = sessionKey(wk, di, si)
            return k in s.sessions ? s.sessions[k]! : undefined
          }),
        )
        const nd = days.map((d) => [...d])
        const nv = val.map((a) => [...a])
        const [ms] = nd[fromDi]!.splice(fromSi, 1)
        const [mv] = nv[fromDi]!.splice(fromSi, 1)
        if (ms === undefined) return s
        let idx = fromDi === toDi && fromSi < toSi ? toSi - 1 : toSi
        idx = Math.max(0, Math.min(idx, nd[toDi]!.length))
        nd[toDi]!.splice(idx, 0, ms)
        nv[toDi]!.splice(idx, 0, mv)
        // Reconstruit les validations de la semaine wk depuis le nouvel agencement.
        const prefix = `${wk}-`
        const sessions: Record<string, number> = {}
        for (const [k, v] of Object.entries(s.sessions)) {
          if (!k.startsWith(prefix)) sessions[k] = v
        }
        nv.forEach((day, di) =>
          day.forEach((v, si) => {
            if (v !== undefined) sessions[sessionKey(wk, di, si)] = v
          }),
        )
        return { ...s, sessions, layout: { ...s.layout, [String(wk)]: nd } }
      })
    },
    [],
  )

  const replaceState = useCallback((next: State) => setState(next), [])

  const applyRemap = useCallback((map: (wk: number) => number | null) => {
    setState((s) => ({
      sessions: remapKeys(s.sessions, map),
      options: remapKeys(s.options, map),
      notes: remapKeys(s.notes, map),
      locks: remapKeys(s.locks, map),
      layout: remapNumKeys(s.layout, map),
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
    toggleLock,
    applyWeekMove,
    replaceState,
    remapAfterDeleteWeek,
    remapAfterInsertWeek,
    remapReorderWeek,
  }
}
