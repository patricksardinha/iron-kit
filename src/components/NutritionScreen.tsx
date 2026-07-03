import { useState } from 'react'
import type { NutritionItem, NutritionSection, Settings } from '../types'
import { Icon } from './Icon'

interface Props {
  sections: NutritionSection[]
  settings: Settings
}

// Le token accent (swim|bike|run|p3…) → variable CSS.
function accentVar(accent: string): string {
  return `var(--${accent})`
}

export function NutritionScreen({ sections, settings }: Props) {
  const w = settings.weight
  return (
    <div className="screen">
      <h1 className="screen-title">Nutrition</h1>

      {w ? (
        <div className="nutri-targets">
          <div className="nt-head">Tes repères quotidiens · {w} kg</div>
          <div className="nt-grid">
            <div className="nt">
              <span className="nt-v">{Math.round(w * 1.8)} g</span>
              <span className="nt-k">Protéines</span>
            </div>
            <div className="nt">
              <span className="nt-v">
                {Math.round(w * 5)}–{Math.round(w * 7)} g
              </span>
              <span className="nt-k">Glucides (selon charge)</span>
            </div>
            <div className="nt">
              <span className="nt-v">{(Math.round(w * 35) / 1000).toFixed(1)} L</span>
              <span className="nt-k">Hydratation de base</span>
            </div>
          </div>
          <p className="nt-note">
            Repères indicatifs (protéines ≈ 1,8 g/kg, glucides 5–7 g/kg les jours chargés, eau ≈ 35
            ml/kg). Ajuste ton poids dans Réglages.
          </p>
        </div>
      ) : (
        <p className="tool-hint" style={{ marginTop: 0, marginBottom: 14 }}>
          Renseigne ton poids dans <b>Réglages</b> pour des repères personnalisés. Touche un conseil
          pour voir quoi manger concrètement.
        </p>
      )}
      {sections.map((s) => (
        <div className="nutri-section" key={s.title} style={{ ['--accent' as string]: accentVar(s.accent) }}>
          <div className="nutri-head">{s.title}</div>
          {s.items.map((it, i) => (
            <NutriCard item={it} key={i} />
          ))}
        </div>
      ))}
    </div>
  )
}

function NutriCard({ item }: { item: NutritionItem }) {
  const [open, setOpen] = useState(false)
  const hasList = !!item.list && item.list.length > 0

  return (
    <div className={`nutri-item${hasList ? ' expandable' : ''}${open ? ' open' : ''}`}>
      {hasList ? (
        <button
          type="button"
          className="nutri-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <span className="nutri-copy">
            <span className="h">{item.h}</span>
            <span className="t">{item.t}</span>
          </span>
          <span className="nutri-chevron" aria-hidden="true">
            <Icon name="chevron-right" size={18} />
          </span>
        </button>
      ) : (
        <div className="nutri-copy">
          <span className="h">{item.h}</span>
          <span className="t">{item.t}</span>
        </div>
      )}

      {hasList && open && (
        <ul className="nutri-list">
          {item.list!.map((li, j) => (
            <li key={j}>{li}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
