// Plan éditable : part de plan.json (migré), puis surcouche persistée localement.
// Invariant : semaines triées par date de début, wk = position chronologique (1..N).
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session, Week } from '../types'
import { migrateWeeks } from '../lib/migrate'
import { addDays, mondayOf, parseISO, toISO } from './../lib/logic'

export const PLAN_KEY = 'objectif-evian-plan-v1'
export const OPTIONS_KEY = 'ironkit-options-v1'

export type WeekPatch = Partial<Pick<Week, 'phase' | 'typ' | 'obj' | 'start'>>

export interface AddResult {
  ok: boolean
  error?: string
}

export interface PlanHooks {
  onDeleteWeek: (pos: number) => void
  onInsertWeek: (pos: number) => void
  onReorderWeek: (from: number, to: number) => void
}

export interface PlanApi {
  weeks: Week[]
  isCustom: boolean
  updateWeek: (pos: number, patch: WeekPatch) => AddResult
  addSession: (pos: number, di: number) => void
  updateSession: (pos: number, di: number, si: number, patch: Partial<Session>) => void
  removeSession: (pos: number, di: number, si: number) => void
  options: string[] // pool global d'options (Tai Chi, mobilité…)
  addOption: (label: string) => void
  removeOption: (label: string) => void
  toggleDayOption: (pos: number, di: number, label: string) => void
  toggleWeekOption: (pos: number, label: string) => void
  addWeek: () => AddResult // ajoute toujours la semaine suivante (contiguë)
  deleteWeek: (pos: number) => void
  reset: () => void
}

/** Pool global d'options : localStorage, sinon union des libellés déjà utilisés. */
function loadOptions(weeks: Week[]): string[] {
  try {
    const raw = localStorage.getItem(OPTIONS_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === 'string')
    }
  } catch {
    /* ignore */
  }
  const set = new Set<string>(['Tai Chi'])
  for (const w of weeks) for (const d of w.dayOptions ?? []) for (const o of d) set.add(o)
  return [...set]
}

/** Trie par date de début puis renumérote wk = position (1..N). */
function normalize(weeks: Week[]): Week[] {
  const sorted = [...weeks].sort((a, b) => a.start.localeCompare(b.start))
  return sorted.map((w, i) => (w.wk === i + 1 ? w : { ...w, wk: i + 1 }))
}

function loadEdited(): Week[] | null {
  try {
    const raw = localStorage.getItem(PLAN_KEY)
    if (!raw) return null
    const migrated = migrateWeeks(JSON.parse(raw))
    if (migrated.length === 0) return null
    return normalize(migrated)
  } catch {
    return null
  }
}

const DEFAULT_OPTIONS = ['Tai Chi']

/** Une semaine neuve : tous les jours en repos. */
function emptyDays(): Session[][] {
  return Array.from({ length: 7 }, () => [])
}
function defaultDayOptions(): string[][] {
  return Array.from({ length: 7 }, () => [...DEFAULT_OPTIONS])
}

export function usePlan(base: Week[], hooks: PlanHooks): PlanApi {
  const edited = useRef<Week[] | null>(loadEdited())
  const [weeks, setWeeks] = useState<Week[]>(() => edited.current ?? normalize(base))
  const [isCustom, setIsCustom] = useState<boolean>(() => edited.current != null)
  const [options, setOptions] = useState<string[]>(() => loadOptions(edited.current ?? base))

  // Persiste le pool global d'options.
  const firstOpt = useRef(true)
  useEffect(() => {
    if (firstOpt.current) {
      firstOpt.current = false
      return
    }
    try {
      localStorage.setItem(OPTIONS_KEY, JSON.stringify(options))
    } catch {
      /* ignore */
    }
  }, [options])

  // Miroir de `weeks` pour lire l'état courant hors updater (évite les effets de
  // bord dans setWeeks, doublés par StrictMode).
  const weeksRef = useRef(weeks)
  useEffect(() => {
    weeksRef.current = weeks
  }, [weeks])

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

  const setDays = useCallback(
    (pos: number, fn: (days: Session[][]) => Session[][]) => {
      setIsCustom(true)
      setWeeks((ws) => ws.map((w) => (w.wk === pos ? { ...w, days: fn(w.days) } : w)))
    },
    [],
  )

  const updateWeek = useCallback(
    (pos: number, patch: WeekPatch): AddResult => {
      // Changement de date : normaliser au lundi, refuser un doublon, re-trier.
      if (patch.start !== undefined) {
        const monday = toISO(mondayOf(parseISO(patch.start)))
        const ws = weeksRef.current
        if (ws.some((w) => w.wk !== pos && w.start === monday)) {
          return { ok: false, error: 'Une semaine existe déjà à cette date.' }
        }
        const moved = ws.map((w) => (w.wk === pos ? { ...w, ...patch, start: monday } : w))
        const normalized = normalize(moved)
        const newPos = normalized.find((w) => w.start === monday)?.wk ?? pos
        if (newPos !== pos) hooks.onReorderWeek(pos, newPos)
        setIsCustom(true)
        setWeeks(normalized)
        return { ok: true }
      }
      setIsCustom(true)
      setWeeks((ws) => ws.map((w) => (w.wk === pos ? { ...w, ...patch } : w)))
      return { ok: true }
    },
    [hooks],
  )

  const addSession = useCallback(
    (pos: number, di: number) => {
      setDays(pos, (days) =>
        days.map((day, i) =>
          i === di ? [...day, { disc: 'bike', detail: '', min: 60 } as Session] : day,
        ),
      )
    },
    [setDays],
  )

  const updateSession = useCallback(
    (pos: number, di: number, si: number, patch: Partial<Session>) => {
      setDays(pos, (days) =>
        days.map((day, i) =>
          i === di ? day.map((s, j) => (j === si ? { ...s, ...patch } : s)) : day,
        ),
      )
    },
    [setDays],
  )

  const removeSession = useCallback(
    (pos: number, di: number, si: number) => {
      setDays(pos, (days) => days.map((day, i) => (i === di ? day.filter((_, j) => j !== si) : day)))
    },
    [setDays],
  )

  const patchWeek = useCallback((pos: number, fn: (w: Week) => Week) => {
    setIsCustom(true)
    setWeeks((ws) => ws.map((w) => (w.wk === pos ? fn(w) : w)))
  }, [])

  const addOption = useCallback((label: string) => {
    const l = label.trim()
    if (!l) return
    setOptions((prev) => (prev.includes(l) ? prev : [...prev, l]))
  }, [])

  const removeOption = useCallback((label: string) => {
    setOptions((prev) => prev.filter((o) => o !== label))
    // Retire aussi l'option de tous les jours de toutes les semaines.
    setIsCustom(true)
    setWeeks((ws) =>
      ws.map((w) => ({ ...w, dayOptions: w.dayOptions.map((d) => d.filter((o) => o !== label)) })),
    )
  }, [])

  const toggleDayOption = useCallback(
    (pos: number, di: number, label: string) => {
      patchWeek(pos, (w) => ({
        ...w,
        dayOptions: w.dayOptions.map((d, i) =>
          i === di ? (d.includes(label) ? d.filter((o) => o !== label) : [...d, label]) : d,
        ),
      }))
    },
    [patchWeek],
  )

  // Active/désactive une option sur les 7 jours de la semaine (bascule globale).
  const toggleWeekOption = useCallback(
    (pos: number, label: string) => {
      patchWeek(pos, (w) => {
        const all = w.dayOptions.every((d) => d.includes(label))
        return {
          ...w,
          dayOptions: w.dayOptions.map((d) =>
            all ? d.filter((o) => o !== label) : d.includes(label) ? d : [...d, label],
          ),
        }
      })
    },
    [patchWeek],
  )

  const addWeek = useCallback((): AddResult => {
    const ws = weeksRef.current
    // Toujours la semaine suivant la dernière (contiguë). Jours en repos par défaut.
    const prev = [...ws].sort((a, b) => a.start.localeCompare(b.start)).pop()
    const monday = prev
      ? toISO(addDays(parseISO(prev.start), 7))
      : toISO(mondayOf(new Date()))
    const fresh: Week = {
      wk: 0,
      start: monday,
      phase: prev?.phase ?? '0 - Fondation',
      typ: prev?.typ ?? 'Charge',
      obj: '',
      days: emptyDays(),
      dayOptions: defaultDayOptions(),
    }
    // Ajoutée en fin de plan → aucune renumérotation des semaines existantes.
    setIsCustom(true)
    setWeeks(normalize([...ws, fresh]))
    return { ok: true }
  }, [])

  const deleteWeek = useCallback(
    (pos: number) => {
      hooks.onDeleteWeek(pos) // remappe l'état utilisateur avant renumérotation
      setIsCustom(true)
      setWeeks((ws) => normalize(ws.filter((w) => w.wk !== pos)))
    },
    [hooks],
  )

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(PLAN_KEY)
    } catch {
      /* ignore */
    }
    edited.current = null
    setIsCustom(false)
    setWeeks(normalize(base))
  }, [base])

  return {
    weeks,
    isCustom,
    updateWeek,
    addSession,
    updateSession,
    removeSession,
    options,
    addOption,
    removeOption,
    toggleDayOption,
    toggleWeekOption,
    addWeek,
    deleteWeek,
    reset,
  }
}
