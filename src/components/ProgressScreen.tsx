import type { Week, State } from '../types'
import { JALONS, RACE, phaseColor } from '../lib/constants'
import { daysBetween } from '../lib/logic'
import {
  overallProgress,
  weekProgress,
  hoursProgress,
  disciplineStats,
  phaseStats,
  currentStreak,
  taichiCount,
} from '../lib/stats'
import { ProgressRing } from './ProgressRing'
import { ExportImport } from './ExportImport'

interface Props {
  weeks: Week[]
  state: State
  currentWk: number
  today: Date
  onImport: (next: State) => void
}

export function ProgressScreen({ weeks, state, currentWk, today, onImport }: Props) {
  const overall = overallProgress(weeks, state.done)
  const thisWeek = weeks[currentWk - 1]
  const wp = thisWeek ? weekProgress(thisWeek, state.done) : { validated: 0, total: 0 }
  const hours = hoursProgress(weeks, state.done)
  const discs = disciplineStats(weeks, state.done)
  const phases = phaseStats(weeks, state.done)
  const streak = currentStreak(weeks, state.done, today)
  const taichi = taichiCount(state.taichi)

  const nextJalon = JALONS.find((j) => j.wk >= currentWk) ?? JALONS[JALONS.length - 1]!
  const jalonEta = nextJalon.wk - currentWk
  const jDay = Math.max(0, daysBetween(today, RACE))

  return (
    <div className="screen">
      <h1 className="screen-title">Progression</h1>

      <ProgressRing pct={overall.pct} validated={overall.validated} total={overall.total} />

      <div className="stat-grid">
        <div className="stat">
          <div className="k">Cette semaine</div>
          <div className="v">
            {wp.validated}
            <small> / {wp.total}</small>
          </div>
        </div>
        <div className="stat">
          <div className="k">Série en cours</div>
          <div className="v">
            {streak}
            <small> {streak > 1 ? 'jours' : 'jour'}</small>
          </div>
        </div>
        <div className="stat">
          <div className="k">Heures validées</div>
          <div className="v">
            ≈{Math.round(hours.validated)}
            <small> / {Math.round(hours.planned)} h</small>
          </div>
        </div>
        <div className="stat">
          <div className="k">Tai Chi</div>
          <div className="v">
            {taichi}
            <small> {taichi > 1 ? 'jours' : 'jour'}</small>
          </div>
        </div>
      </div>

      <div className="section-h">Par discipline</div>
      {discs.map((d) => {
        const pct = d.planned ? (d.validated / d.planned) * 100 : 0
        return (
          <div className="bar-row" key={d.key} style={{ ['--barc' as string]: d.color }}>
            <span className="lbl">{d.label}</span>
            <span className="track">
              <i style={{ width: `${pct}%` }} />
            </span>
            <span className="val">
              {d.validated}/{d.planned}
            </span>
          </div>
        )
      })}

      <div className="section-h">Par phase</div>
      {phases.map((p) => (
        <div className="bar-row" key={p.phase} style={{ ['--barc' as string]: phaseColor(p.phase) }}>
          <span className="lbl" style={{ fontSize: 12 }}>
            {p.phase}
          </span>
          <span className="track">
            <i style={{ width: `${p.pct}%` }} />
          </span>
          <span className="val">{p.pct}%</span>
        </div>
      ))}

      <div className="section-h">Prochain jalon</div>
      <div className="jalon">
        <div className="t">
          <span>{nextJalon.t}</span>
          <span className="eta">
            {jalonEta <= 0 ? 'cette semaine' : `dans ${jalonEta} sem.`}
          </span>
        </div>
        <div className="d">{nextJalon.d}</div>
      </div>

      <div className="countdown">
        <div className="big">J−{jDay}</div>
        <div className="lbl">jusqu'à LÉ-MAN Evian · 12 sept. 2027</div>
      </div>

      <ExportImport state={state} onImport={onImport} />
    </div>
  )
}
