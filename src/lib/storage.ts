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

/* ---------- sauvegarde COMPLÈTE (tous les plans, réglages, frigo, badges vus) ---------- */

// Tout ce qui appartient à IronKit dans le localStorage : clés `ik-*` (plans, états,
// options, frigo, badges vus) + réglages. Les anciennes clés legacy sont migrées vers
// `ik-*` au premier lancement, inutile de les couvrir.
const BACKUP_PREFIX = 'ik-'
const BACKUP_EXTRA_KEYS = ['ironkit-settings-v1']

export interface FullBackup {
  format: 'ironkit-backup'
  version: 1
  exportedAt: string
  data: Record<string, string> // clé localStorage → valeur brute (JSON sérialisé)
}

function ownedKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && (k.startsWith(BACKUP_PREFIX) || BACKUP_EXTRA_KEYS.includes(k))) keys.push(k)
  }
  return keys
}

/** Instantané complet de toutes les données IronKit de l'appareil. */
export function fullBackup(): FullBackup {
  const data: Record<string, string> = {}
  try {
    for (const k of ownedKeys()) {
      const v = localStorage.getItem(k)
      if (v !== null) data[k] = v
    }
  } catch {
    /* ignore */
  }
  return { format: 'ironkit-backup', version: 1, exportedAt: new Date().toISOString(), data }
}

export function isFullBackup(parsed: unknown): parsed is FullBackup {
  if (!parsed || typeof parsed !== 'object') return false
  const o = parsed as Record<string, unknown>
  return o['format'] === 'ironkit-backup' && !!o['data'] && typeof o['data'] === 'object'
}

/** Restaure une sauvegarde complète : purge les clés IronKit puis réécrit tout.
 * L'appelant doit recharger l'app ensuite (les hooks lisent le storage au montage). */
export function restoreFullBackup(b: FullBackup): void {
  for (const k of ownedKeys()) {
    try {
      localStorage.removeItem(k)
    } catch {
      /* ignore */
    }
  }
  for (const [k, v] of Object.entries(b.data)) {
    if (typeof v !== 'string') continue
    if (!k.startsWith(BACKUP_PREFIX) && !BACKUP_EXTRA_KEYS.includes(k)) continue
    try {
      localStorage.setItem(k, v)
    } catch {
      /* quota : on ignore */
    }
  }
}
