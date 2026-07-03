import type { Settings, State } from '../types'
import { THEMES, ACCENTS } from '../lib/theme'
import { ExportImport } from './ExportImport'

interface Props {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  state: State
  onImport: (next: State) => void
}

function numOrNull(v: string): number | null {
  const n = Number(v)
  return v.trim() === '' || Number.isNaN(n) ? null : n
}

export function SettingsScreen({ settings, update, state, onImport }: Props) {
  return (
    <div className="screen">
      <h1 className="screen-title">Réglages</h1>

      <div className="section-h">Profil</div>
      <p className="tool-hint" style={{ marginTop: 0 }}>
        Sert à personnaliser tes repères nutrition (besoins en protéines, glucides, hydratation).
      </p>
      <div className="set-card">
        <div className="set-field">
          <span>Sexe</span>
          <div className="seg">
            <button className={settings.sex === 'h' ? 'on' : ''} onClick={() => update({ sex: 'h' })}>
              Homme
            </button>
            <button className={settings.sex === 'f' ? 'on' : ''} onClick={() => update({ sex: 'f' })}>
              Femme
            </button>
          </div>
        </div>
        <div className="set-grid">
          <label className="set-field">
            <span>Poids (kg)</span>
            <input
              type="number"
              inputMode="decimal"
              min={30}
              max={200}
              value={settings.weight ?? ''}
              placeholder="—"
              onChange={(e) => update({ weight: numOrNull(e.target.value) })}
            />
          </label>
          <label className="set-field">
            <span>Taille (cm)</span>
            <input
              type="number"
              inputMode="numeric"
              min={120}
              max={230}
              value={settings.height ?? ''}
              placeholder="—"
              onChange={(e) => update({ height: numOrNull(e.target.value) })}
            />
          </label>
          <label className="set-field">
            <span>Âge</span>
            <input
              type="number"
              inputMode="numeric"
              min={10}
              max={100}
              value={settings.age ?? ''}
              placeholder="—"
              onChange={(e) => update({ age: numOrNull(e.target.value) })}
            />
          </label>
        </div>
      </div>

      <div className="section-h">Thème</div>
      <div className="theme-grid">
        {THEMES.map((t) => (
          <button
            key={t.id}
            className={`theme-swatch${settings.theme === t.id ? ' on' : ''}`}
            style={{
              ['--sw-bg' as string]: t.vars['--bg'],
              ['--sw-surface' as string]: t.vars['--surface2'],
              ['--sw-text' as string]: t.vars['--text'],
            }}
            onClick={() => update({ theme: t.id })}
            aria-pressed={settings.theme === t.id}
          >
            <span className="sw-preview">
              <i className="sw-dot" />
            </span>
            <span className="sw-name">
              {t.emoji} {t.name}
            </span>
          </button>
        ))}
      </div>

      <div className="section-h">Couleur d'accent</div>
      <div className="accent-row">
        {ACCENTS.map((a) => (
          <button
            key={a.id}
            className={`accent-dot${settings.accent === a.id ? ' on' : ''}`}
            style={{ background: a.accent }}
            onClick={() => update({ accent: a.id })}
            aria-label={a.name}
            aria-pressed={settings.accent === a.id}
            title={a.name}
          />
        ))}
      </div>

      <ExportImport state={state} onImport={onImport} />
    </div>
  )
}
