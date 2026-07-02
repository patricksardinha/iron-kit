// Persistance locale sous une clé unique + export/import JSON (§6)
import type { State } from '../types'

export const STORAGE_KEY = 'objectif-evian-state-v1'

export const emptyState = (): State => ({ done: {}, taichi: {}, notes: {} })

/** Sanitise un objet inconnu en State valide (robuste au JSON importé). */
function coerce(raw: unknown): State {
  const s = emptyState()
  if (!raw || typeof raw !== 'object') return s
  const o = raw as Record<string, unknown>
  if (o['done'] && typeof o['done'] === 'object') {
    for (const [k, v] of Object.entries(o['done'] as Record<string, unknown>)) {
      if (v === true) s.done[k] = true
    }
  }
  if (o['taichi'] && typeof o['taichi'] === 'object') {
    for (const [k, v] of Object.entries(o['taichi'] as Record<string, unknown>)) {
      if (v === true) s.taichi[k] = true
    }
  }
  if (o['notes'] && typeof o['notes'] === 'object') {
    for (const [k, v] of Object.entries(o['notes'] as Record<string, unknown>)) {
      if (typeof v === 'string' && v.length) s.notes[k] = v
    }
  }
  return s
}

export function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    return coerce(JSON.parse(raw))
  } catch {
    return emptyState()
  }
}

export function saveState(state: State): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota / mode privé : on ignore silencieusement */
  }
}

/** Parse un JSON importé en State (throw si invalide/vide). */
export function parseImported(text: string): State {
  const parsed: unknown = JSON.parse(text)
  const s = coerce(parsed)
  return s
}
