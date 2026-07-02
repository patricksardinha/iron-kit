import type { Week } from '../types'
import type { AppState } from '../hooks/useAppState'
import { phaseColor } from '../lib/constants'
import { dayKey } from '../lib/logic'
import { weekProgress } from '../lib/stats'
import { DayCard } from './DayCard'
import { Icon } from './Icon'

interface Props {
  weeks: Week[]
  weekIndex: number
  currentWk: number
  today: Date
  appState: AppState
  onNav: (wk: number) => void
}

export function WeekScreen({ weeks, weekIndex, currentWk, today, appState, onNav }: Props) {
  const total = weeks.length
  const week = weeks[weekIndex - 1]
  if (!week) return null

  const { state, toggleDone, toggleTaichi, setNote } = appState
  const prog = weekProgress(week, state.done)
  const pct = prog.total ? Math.round((prog.validated / prog.total) * 100) : 0
  const pc = phaseColor(week.phase)

  const showFab = weekIndex !== currentWk

  return (
    <div className={`screen${showFab ? ' has-fab' : ''}`}>
      <div className="wk-nav">
        <button
          className="arrow"
          onClick={() => onNav(weekIndex - 1)}
          disabled={weekIndex <= 1}
          aria-label="Semaine précédente"
        >
          <Icon name="chevron-left" size={22} />
        </button>
        <div className="wk-title">
          <div className="n">Sem. {week.wk} / {total}</div>
          <div className="d">{week.dates}</div>
        </div>
        <button
          className="arrow"
          onClick={() => onNav(weekIndex + 1)}
          disabled={weekIndex >= total}
          aria-label="Semaine suivante"
        >
          <Icon name="chevron-right" size={22} />
        </button>
      </div>

      <div className="wk-card">
        <div className="wk-meta">
          <span className="chip" style={{ background: `color-mix(in srgb, ${pc} 22%, var(--surface2))`, color: pc }}>
            {week.phase}
          </span>
          <span className="badge">{week.typ}</span>
          <span className="badge">{week.vol} h</span>
        </div>
        <div className="wk-obj">{week.obj}</div>
        <div className="progress-row">
          <span className="muted">Séances validées</span>
          <span className="num">
            {prog.validated}/{prog.total}
          </span>
        </div>
        <div className="progress">
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="days">
        {week.days.map((label, di) => {
          const k = dayKey(week.wk, di)
          const isToday = week.wk === currentWk && todayIndex(today) === di
          return (
            <DayCard
              key={k}
              wk={week.wk}
              di={di}
              label={label}
              today={today}
              isToday={isToday}
              done={!!state.done[k]}
              taichi={!!state.taichi[k]}
              note={state.notes[k]}
              onToggleDone={() => toggleDone(week.wk, di)}
              onToggleTaichi={() => toggleTaichi(week.wk, di)}
              onSetNote={(text) => setNote(week.wk, di, text)}
            />
          )
        })}
      </div>

      {showFab && (
        <button className="fab" onClick={() => onNav(currentWk)}>
          <Icon name="today" /> Semaine du jour
        </button>
      )}
    </div>
  )
}

// Index du jour (0=Lundi … 6=Dimanche) à partir d'une Date (getDay: 0=dimanche).
function todayIndex(today: Date): number {
  const jsDay = today.getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}
