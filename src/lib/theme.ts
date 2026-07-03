// Thèmes (neutres) + couleurs d'accent, appliqués via variables CSS sur :root.

export interface ThemeDef {
  id: string
  name: string
  emoji: string
  vars: Record<string, string> // surcouche des tokens neutres
}

// Chaque thème redéfinit l'INTÉGRALITÉ des neutres → bascule propre.
export const THEMES: ThemeDef[] = [
  {
    id: 'dark', name: 'Sombre', emoji: '🌙',
    vars: { '--bg': '#0b0d13', '--surface': '#14181f', '--surface2': '#1c212c', '--surface3': '#232a38', '--line': '#2a3242', '--text': '#f0f2f7', '--muted': '#8b93a4', '--faint': '#59617a' },
  },
  {
    id: 'light', name: 'Clair', emoji: '☀️',
    vars: { '--bg': '#f5f7fb', '--surface': '#ffffff', '--surface2': '#eef1f7', '--surface3': '#e3e8f1', '--line': '#d8dee9', '--text': '#161b24', '--muted': '#5c6577', '--faint': '#98a1b3' },
  },
  {
    id: 'ocean', name: 'Océan', emoji: '🌊',
    vars: { '--bg': '#08131f', '--surface': '#0f2130', '--surface2': '#163043', '--surface3': '#1e3d54', '--line': '#264a63', '--text': '#e8f3fb', '--muted': '#8aa6bd', '--faint': '#5b7d97' },
  },
  {
    id: 'sunset', name: 'Coucher', emoji: '🌇',
    vars: { '--bg': '#150a13', '--surface': '#221019', '--surface2': '#2f1622', '--surface3': '#3d1d2c', '--line': '#4a2636', '--text': '#fbeef2', '--muted': '#c19aa8', '--faint': '#8f6b78' },
  },
  {
    id: 'forest', name: 'Forêt', emoji: '🌲',
    vars: { '--bg': '#081410', '--surface': '#0f221b', '--surface2': '#163026', '--surface3': '#1e3d31', '--line': '#274b3c', '--text': '#e9f6ee', '--muted': '#8db3a0', '--faint': '#5e8571' },
  },
  {
    id: 'grape', name: 'Raisin', emoji: '🍇',
    vars: { '--bg': '#0f0b1a', '--surface': '#1a1330', '--surface2': '#241a40', '--surface3': '#2f2352', '--line': '#3a2d63', '--text': '#efeafb', '--muted': '#a99cc7', '--faint': '#786a9b' },
  },
  {
    id: 'slate', name: 'Ardoise', emoji: '🪨',
    vars: { '--bg': '#101214', '--surface': '#191c1f', '--surface2': '#22262a', '--surface3': '#2c3136', '--line': '#363c42', '--text': '#eef1f3', '--muted': '#909aa2', '--faint': '#616b73' },
  },
]

export interface AccentDef {
  id: string
  name: string
  accent: string
  accent2: string
  ink: string
}

export const ACCENTS: AccentDef[] = [
  { id: 'orange', name: 'Orange', accent: '#ff5a36', accent2: '#ff8038', ink: '#1a0d08' },
  { id: 'blue', name: 'Bleu', accent: '#3b82f6', accent2: '#60a5fa', ink: '#07101f' },
  { id: 'violet', name: 'Violet', accent: '#7c6cff', accent2: '#a78bfa', ink: '#0f0a1f' },
  { id: 'green', name: 'Vert', accent: '#22c55e', accent2: '#4ade80', ink: '#04120a' },
  { id: 'pink', name: 'Rose', accent: '#ff4d8d', accent2: '#ff7aa8', ink: '#200812' },
  { id: 'cyan', name: 'Cyan', accent: '#22d3ee', accent2: '#67e8f9', ink: '#05161a' },
  { id: 'red', name: 'Rouge', accent: '#ff3b30', accent2: '#ff6b52', ink: '#1f0705' },
  { id: 'amber', name: 'Ambre', accent: '#f59e0b', accent2: '#fbbf24', ink: '#1c1200' },
]

export function applyTheme(themeId: string, accentId: string): void {
  const t = THEMES.find((x) => x.id === themeId) ?? THEMES[0]!
  const a = ACCENTS.find((x) => x.id === accentId) ?? ACCENTS[0]!
  const root = document.documentElement
  for (const [k, v] of Object.entries(t.vars)) root.style.setProperty(k, v)
  root.style.setProperty('--accent', a.accent)
  root.style.setProperty('--accent-2', a.accent2)
  root.style.setProperty('--accent-ink', a.ink)
  root.dataset.theme = t.id
}
