import type { NutritionSection } from '../types'

interface Props {
  sections: NutritionSection[]
}

// Le token accent (swim|bike|run|p3…) → variable CSS.
function accentVar(accent: string): string {
  return `var(--${accent})`
}

export function NutritionScreen({ sections }: Props) {
  return (
    <div className="screen">
      <h1 className="screen-title">Nutrition</h1>
      {sections.map((s) => (
        <div className="nutri-section" key={s.title} style={{ ['--accent' as string]: accentVar(s.accent) }}>
          <div className="nutri-head">{s.title}</div>
          {s.items.map((it, i) => (
            <div className="nutri-item" key={i}>
              <div className="h">{it.h}</div>
              <div className="t">{it.t}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
