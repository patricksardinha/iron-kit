// Réglages utilisateur : profil + apparence (thème/accent), persistés localement.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Settings } from '../types'
import { applyTheme } from '../lib/theme'

const KEY = 'ironkit-settings-v1'

export const defaultSettings = (): Settings => ({
  sex: null,
  weight: null,
  height: null,
  age: null,
  theme: 'dark',
  accent: 'orange',
})

function load(): Settings {
  const d = defaultSettings()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return d
    const o = JSON.parse(raw) as Record<string, unknown>
    return {
      sex: o.sex === 'h' || o.sex === 'f' ? o.sex : null,
      weight: typeof o.weight === 'number' ? o.weight : null,
      height: typeof o.height === 'number' ? o.height : null,
      age: typeof o.age === 'number' ? o.age : null,
      theme: typeof o.theme === 'string' ? o.theme : d.theme,
      accent: typeof o.accent === 'string' ? o.accent : d.accent,
    }
  } catch {
    return d
  }
}

export interface SettingsApi {
  settings: Settings
  update: (patch: Partial<Settings>) => void
}

export function useSettings(): SettingsApi {
  const [settings, setSettings] = useState<Settings>(() => load())

  // Applique le thème avant peinture (évite le flash).
  useLayoutEffect(() => {
    applyTheme(settings.theme, settings.accent)
  }, [settings.theme, settings.accent])

  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(settings))
    } catch {
      /* ignore */
    }
  }, [settings])

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  return { settings, update }
}
