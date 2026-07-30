// Persistance locale sous une clé unique + export/import JSON (§6)
import type { State } from '../types'

export const STORAGE_KEY = 'objectif-evian-state-v1'

export const emptyState = (): State => ({
  sessions: {},
  options: {},
  notes: {},
  locks: {},
  layout: {},
  tests: {},
})

/** Sanitise un objet inconnu en State valide (robuste au JSON importé). */
function coerce(raw: unknown): State {
  const s = emptyState()
  if (!raw || typeof raw !== 'object') return s
  const o = raw as Record<string, unknown>
  // Nouveau format : sessions (minutes par étape).
  if (o['sessions'] && typeof o['sessions'] === 'object') {
    for (const [k, v] of Object.entries(o['sessions'] as Record<string, unknown>)) {
      if (typeof v === 'number' && v >= 0 && Number.isFinite(v)) s.sessions[k] = v
    }
  }
  // Rétro-compat : ancien format `done` (jour validé) → étape 0 du jour.
  if (o['done'] && typeof o['done'] === 'object') {
    for (const [k, v] of Object.entries(o['done'] as Record<string, unknown>)) {
      if (v === true) s.sessions[`${k}-0`] = 0
    }
  }
  // Options (Tai Chi et autres).
  if (o['options'] && typeof o['options'] === 'object') {
    for (const [k, v] of Object.entries(o['options'] as Record<string, unknown>)) {
      if (v === true) s.options[k] = true
    }
  }
  // Rétro-compat : ancien format `taichi` (clé `${wk}-${di}`) → option "Tai Chi".
  if (o['taichi'] && typeof o['taichi'] === 'object') {
    for (const [k, v] of Object.entries(o['taichi'] as Record<string, unknown>)) {
      if (v === true) s.options[`${k}::Tai Chi`] = true
    }
  }
  if (o['notes'] && typeof o['notes'] === 'object') {
    for (const [k, v] of Object.entries(o['notes'] as Record<string, unknown>)) {
      if (typeof v === 'string' && v.length) s.notes[k] = v
    }
  }
  if (o['locks'] && typeof o['locks'] === 'object') {
    for (const [k, v] of Object.entries(o['locks'] as Record<string, unknown>)) {
      if (v === true) s.locks[k] = true
    }
  }
  if (o['tests'] && typeof o['tests'] === 'object') {
    for (const [k, v] of Object.entries(o['tests'] as Record<string, unknown>)) {
      if (v === true) s.tests[k] = true
    }
  }
  if (o['layout'] && typeof o['layout'] === 'object') {
    for (const [k, v] of Object.entries(o['layout'] as Record<string, unknown>)) {
      // 7 jours, chacun une liste de séances : on fait confiance au round-trip JSON.
      if (Array.isArray(v) && v.every((d) => Array.isArray(d))) {
        s.layout[k] = v as State['layout'][string]
      }
    }
  }
  return s
}

export function loadState(key: string = STORAGE_KEY): State {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return emptyState()
    return coerce(JSON.parse(raw))
  } catch {
    return emptyState()
  }
}

export function saveState(state: State, key: string = STORAGE_KEY): void {
  try {
    localStorage.setItem(key, JSON.stringify(state))
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
