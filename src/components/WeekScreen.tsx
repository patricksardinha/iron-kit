import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { Session, Week, SessionLibrary } from '../types'
import type { AppState } from '../hooks/useAppState'
import { JALONS, phaseColor, phaseParts } from '../lib/constants'
import {
  dateOfDay,
  dayKey,
  discLabel,
  formatDuration,
  optionKey,
  weekDatesLabel,
  weekVolume,
} from '../lib/logic'
import { followPointer, parseSessId } from '../lib/dnd'
import { weekDoneMinutes, weekProgress } from '../lib/stats'
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
  const [dragging, setDragging] = useState<Session | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const total = weeks.length
  const week = weeks[weekIndex - 1]
  if (!week) return null

  const { state, setSession, toggleOption, setNote, toggleLock, toggleTest, applyWeekMove } = appState

  function onDragStart(e: DragStartEvent) {
    if (!week) return
    const [di, si] = parseSessId(String(e.active.id))
    setDragging(week.days[di]?.[si] ?? null)
  }
  function onDragEnd(e: DragEndEvent) {
    setDragging(null)
    const { active, over } = e
    if (!over || !week) return
    const [fromDi, fromSi] = parseSessId(String(active.id))
    const overId = String(over.id)
    let toDi: number
    let toSi: number
    if (overId.startsWith('day:')) {
      toDi = Number(overId.slice(4))
      toSi = week.days[toDi]?.length ?? 0
    } else {
      ;[toDi, toSi] = parseSessId(overId)
    }
    if (fromDi === toDi && fromSi === toSi) return
    applyWeekMove(week.wk, week.days, fromDi, fromSi, toDi, toSi)
  }
  const prog = weekProgress(week, state.sessions)
  const pct = prog.total ? Math.round((prog.validated / prog.total) * 100) : 0
  // Heures réellement effectuées vs prévues sur la semaine (le surplus reste visible).
  const doneMin = weekDoneMinutes(week, state.sessions)
  const plannedMin = Math.round(weekVolume(week) * 60)
  const overHours = plannedMin > 0 && doneMin > plannedMin
  const pc = phaseColor(week.phase)
  const { num: phaseNum, label: phaseLabel } = phaseParts(week.phase)
  const jalon = JALONS.find((j) => j.wk === week.wk)
  const jalonDone = !!state.tests[String(week.wk)]

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
        <div className={`week-jalon${jalonDone ? ' done' : ''}`}>
          <span className="wj-icon">
            <Icon name="trophy" size={20} />
          </span>
          <div className="wj-body">
            <div className="wj-kicker">{jalonDone ? 'Test validé' : 'Semaine test / jalon'}</div>
            <div className="wj-title">{jalon.t}</div>
            <div className="wj-desc">{jalon.d}</div>
          </div>
          <button
            type="button"
            className={`wj-check${jalonDone ? ' on' : ''}`}
            onClick={() => toggleTest(week.wk)}
            aria-pressed={jalonDone}
            aria-label={jalonDone ? 'Dévalider le test' : 'Valider le test'}
            title={jalonDone ? 'Dévalider le test' : 'Valider le test'}
          >
            <Icon name="check" size={16} />
          </button>
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
          <span className="muted">Jours validés</span>
          <span className="num">
            {prog.validated}/{prog.total}
          </span>
        </div>
        <div className="progress-row">
          <span className="muted">Heures effectuées</span>
          <span className={`num${overHours ? ' over' : ''}`}>
            {doneMin > 0 ? formatDuration(doneMin) : '0h'} / {formatDuration(plannedMin)}
          </span>
        </div>
        <div className="progress">
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={followPointer}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
      >
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
                locked={!!state.locks[k]}
                onSetSession={(si, min) => setSession(week.wk, di, si, min)}
                onToggleOption={(label) => toggleOption(week.wk, di, label)}
                onSetNote={(text) => setNote(week.wk, di, text)}
                onToggleLock={() => toggleLock(week.wk, di)}
              />
            )
          })}
        </div>
        {/* Portail : l'overlay est en position:fixed, il doit vivre sous <body> pour ne pas
            être décalé par un ancêtre transformé (sinon le fantôme ne suit pas le doigt). */}
        {createPortal(
          <DragOverlay modifiers={[snapCenterToCursor]}>
            {dragging ? (
              <div className="sess drag-ghost">
                <span className="sess-grip">
                  <Icon name="grip" size={15} />
                </span>
                <span className="ghost-label">{dragging.detail || discLabel(dragging.disc)}</span>
              </div>
            ) : null}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>

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
