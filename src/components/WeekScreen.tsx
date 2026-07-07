import type { Week, SessionLibrary } from '../types'
import type { AppState } from '../hooks/useAppState'
import { JALONS, phaseColor, phaseParts } from '../lib/constants'
import { dateOfDay, dayKey, optionKey, weekDatesLabel, weekVolume } from '../lib/logic'
import { weekProgress } from '../lib/stats'
import { DayCard } from './DayCard'
import { Icon } from './Icon'

interface Props {
  weeks: Week[]
  weekIndex: number
  currentWk: number
  today: Date
  appState: AppState
  library: SessionLibrary
  onNav: (wk: number) => void
}

export function WeekScreen({ weeks, weekIndex, currentWk, today, appState, library, onNav }: Props) {
  const total = weeks.length
  const week = weeks[weekIndex - 1]
  if (!week) return null

  const { state, setSession, toggleOption, setNote } = appState
  const prog = weekProgress(week, state.sessions)
  const pct = prog.total ? Math.round((prog.validated / prog.total) * 100) : 0
  const pc = phaseColor(week.phase)
  const { num: phaseNum, label: phaseLabel } = phaseParts(week.phase)
  const jalon = JALONS.find((j) => j.wk === week.wk)

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
          <div className="d">{weekDatesLabel(week.start)}</div>
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

      {jalon && (
        <div className="week-jalon">
          <span className="wj-icon">
            <Icon name="trophy" size={20} />
          </span>
          <div className="wj-body">
            <div className="wj-kicker">Semaine test / jalon</div>
            <div className="wj-title">{jalon.t}</div>
            <div className="wj-desc">{jalon.d}</div>
          </div>
        </div>
      )}

      <div className="wk-card">
        <div className="wk-meta">
          <span className="phase-tag" style={{ ['--phasec' as string]: pc }}>
            {phaseNum !== '' && <span className="phase-num">{phaseNum}</span>}
            {phaseLabel}
          </span>
          <span className="badge">{week.typ}</span>
          <span className="badge">{weekVolume(week)} h</span>
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
        {week.days.map((day, di) => {
          const k = dayKey(week.wk, di)
          const isToday = week.wk === currentWk && todayIndex(today) === di
          return (
            <DayCard
              key={k}
              wk={week.wk}
              di={di}
              day={day}
              date={dateOfDay(week.start, di)}
              today={today}
              isToday={isToday}
              sessions={state.sessions}
              library={library}
              options={week.dayOptions[di] ?? []}
              isOptionDone={(label) => !!state.options[optionKey(week.wk, di, label)]}
              note={state.notes[k]}
              onSetSession={(si, min) => setSession(week.wk, di, si, min)}
              onToggleOption={(label) => toggleOption(week.wk, di, label)}
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
