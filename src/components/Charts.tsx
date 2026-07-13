// Graphiques de l'onglet Progression — SVG maison, sans dépendance.
import type { WeekVol } from '../lib/stats'
import { phaseColor } from '../lib/constants'

/** Histogramme du volume par semaine : prévu (fond) + réalisé (couleur de phase). */
export function VolumeChart({ data, currentWk }: { data: WeekVol[]; currentWk: number }) {
  const W = 320
  const H = 120
  const padT = 10
  const padB = 4
  const max = Math.max(1, ...data.map((d) => d.planned))
  const n = Math.max(1, data.length)
  const bw = W / n
  const yOf = (v: number) => padT + (1 - v / max) * (H - padT - padB)
  const base = H - padB

  return (
    <div className="chart-card">
      <div className="chart-head">
        <span className="chart-title">Volume par semaine</span>
        <span className="chart-sub">prévu vs réalisé · max {Math.round(max)} h</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg vol" role="img" aria-label="Volume hebdomadaire">
        {data.map((d, i) => {
          const x = i * bw
          const isCur = d.wk === currentWk
          return (
            <g key={d.wk}>
              <rect x={x + 0.4} y={yOf(d.planned)} width={Math.max(0.8, bw - 0.8)} height={base - yOf(d.planned)} rx={0.6} fill="var(--surface3)" />
              {d.done > 0 && (
                <rect
                  x={x + 0.4}
                  y={yOf(d.done)}
                  width={Math.max(0.8, bw - 0.8)}
                  height={base - yOf(d.done)}
                  rx={0.6}
                  fill={phaseColor(d.phase)}
                  opacity={isCur ? 1 : 0.9}
                />
              )}
              {isCur && <line x1={x + bw / 2} y1={padT - 6} x2={x + bw / 2} y2={base} stroke="var(--accent)" strokeWidth={0.8} opacity={0.7} />}
            </g>
          )
        })}
      </svg>
      <div className="chart-legend">
        <span><i className="lg-dot" style={{ background: 'var(--surface3)' }} /> Prévu</span>
        <span><i className="lg-dot" style={{ background: 'var(--accent)' }} /> Réalisé</span>
        <span><i className="lg-bar" /> Semaine en cours</span>
      </div>
    </div>
  )
}

interface DonutSeg {
  label: string
  value: number
  color: string
}

/** Donut des heures réalisées par discipline. */
export function DisciplineDonut({ swim, bike, run }: { swim: number; bike: number; run: number }) {
  const segs: DonutSeg[] = [
    { label: 'Natation', value: swim, color: 'var(--swim)' },
    { label: 'Vélo', value: bike, color: 'var(--bike)' },
    { label: 'Course', value: run, color: 'var(--run)' },
  ]
  const total = swim + bike + run
  const R = 42
  const CIRC = 2 * Math.PI * R
  let acc = 0

  return (
    <div className="chart-card">
      <div className="chart-head">
        <span className="chart-title">Heures par discipline</span>
        <span className="chart-sub">réalisées</span>
      </div>
      <div className="donut-row">
        <svg viewBox="0 0 120 120" className="donut" role="img" aria-label="Répartition par discipline">
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--surface3)" strokeWidth="15" />
          {total > 0 &&
            segs.map((s) => {
              if (s.value <= 0) return null
              const frac = s.value / total
              const dash = frac * CIRC
              const el = (
                <circle
                  key={s.label}
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="15"
                  strokeDasharray={`${dash} ${CIRC - dash}`}
                  strokeDashoffset={-acc * CIRC}
                  transform="rotate(-90 60 60)"
                  strokeLinecap="butt"
                />
              )
              acc += frac
              return el
            })}
          <text x="60" y="56" textAnchor="middle" className="donut-c-v">{Math.round(total)}</text>
          <text x="60" y="72" textAnchor="middle" className="donut-c-k">heures</text>
        </svg>
        <div className="donut-legend">
          {segs.map((s) => (
            <div className="dl-row" key={s.label}>
              <i className="lg-dot" style={{ background: s.color }} />
              <span className="dl-label">{s.label}</span>
              <span className="dl-val">{s.value} h</span>
            </div>
          ))}
          {total === 0 && <div className="dl-empty">Aucune séance validée pour l'instant.</div>}
        </div>
      </div>
    </div>
  )
}
