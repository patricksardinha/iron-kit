import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Session, SessionDisc, SessionInfo, SessionLibrary, Week } from '../types'
import type { AddResult, WeekPatch } from '../hooks/usePlan'
import { DAY_NAMES } from '../lib/constants'
import { PHASES, typesForPhase } from '../lib/constants'
import { discLabel, weekVolume } from '../lib/logic'
import { scaffoldInfo } from '../lib/sessions'
import { dayDropId, followPointer, parseSessId, sessId } from '../lib/dnd'
import { Icon } from './Icon'
import { SessionDetailEditor } from './SessionDetailEditor'

interface Props {
  week: Week
  validated: number
  library: SessionLibrary
  onPatch: (patch: WeekPatch) => AddResult
  onAddSession: (di: number) => void
  onUpdateSession: (di: number, si: number, patch: Partial<Session>) => void
  onRemoveSession: (di: number, si: number) => void
  onMoveSession: (fromDi: number, fromSi: number, toDi: number, toSi: number) => void
  onSetSessionInfo: (di: number, si: number, info: SessionInfo | null) => void
  options: string[]
  onAddOption: (label: string) => void
  onRemoveOption: (label: string) => void
  onToggleDayOption: (di: number, label: string) => void
  onToggleWeekOption: (label: string) => void
  onDelete: () => void
}

const DISCS: SessionDisc[] = ['swim', 'bike', 'run', 'strength', 'other', 'race']

export function WeekEditor({
  week,
  validated,
  library,
  onPatch,
  onAddSession,
  onUpdateSession,
  onRemoveSession,
  onMoveSession,
  onSetSessionInfo,
  options,
  onAddOption,
  onRemoveOption,
  onToggleDayOption,
  onToggleWeekOption,
  onDelete,
}: Props) {
  const [dateError, setDateError] = useState<string | null>(null)
  const [newOption, setNewOption] = useState('')
  const [dragging, setDragging] = useState<Session | null>(null)
  const allowedTypes = typesForPhase(week.phase)
  const vol = weekVolume(week)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function addOption() {
    const l = newOption.trim()
    if (!l) return
    onAddOption(l)
    setNewOption('')
  }

  function changePhase(phase: string) {
    const allowed = typesForPhase(phase)
    const typ = allowed.includes(week.typ) ? week.typ : allowed[0]!
    onPatch({ phase, typ })
  }

  function changeDate(value: string) {
    if (!value) return
    const res = onPatch({ start: value })
    setDateError(res.ok ? null : (res.error ?? 'Date invalide.'))
  }

  function onDragStart(e: DragStartEvent) {
    const [di, si] = parseSessId(String(e.active.id))
    setDragging(week.days[di]?.[si] ?? null)
  }

  function onDragEnd(e: DragEndEvent) {
    setDragging(null)
    const { active, over } = e
    if (!over) return
    const [fromDi, fromSi] = parseSessId(String(active.id))
    const overId = String(over.id)
    let toDi: number
    let toSi: number
    if (overId.startsWith('day:')) {
      toDi = Number(overId.slice(4))
      toSi = week.days[toDi]?.length ?? 0 // dépôt sur le jour → en fin de liste
    } else {
      ;[toDi, toSi] = parseSessId(overId)
    }
    if (fromDi === toDi && fromSi === toSi) return
    onMoveSession(fromDi, fromSi, toDi, toSi)
  }

  return (
    <div className="week-editor">
      <div className="edit-grid">
        <label className="edit-field">
          <span>Début (lundi)</span>
          <input type="date" value={week.start} onChange={(e) => changeDate(e.target.value)} />
        </label>
        <div className="edit-field">
          <span>Volume calculé</span>
          <div className="vol-readout">{vol} h</div>
        </div>
        <label className="edit-field">
          <span>Phase</span>
          <select value={week.phase} onChange={(e) => changePhase(e.target.value)}>
            {PHASES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
            {!PHASES.includes(week.phase as (typeof PHASES)[number]) && (
              <option value={week.phase}>{week.phase}</option>
            )}
          </select>
        </label>
        <label className="edit-field">
          <span>Type</span>
          <select value={week.typ} onChange={(e) => onPatch({ typ: e.target.value })}>
            {allowedTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            {!allowedTypes.includes(week.typ) && <option value={week.typ}>{week.typ}</option>}
          </select>
        </label>
      </div>
      {dateError && <p className="edit-error">{dateError}</p>}

      <label className="edit-field">
        <span>Objectif de la semaine</span>
        <textarea
          rows={2}
          value={week.obj}
          placeholder="Objectif, focus, consignes…"
          onChange={(e) => onPatch({ obj: e.target.value })}
        />
      </label>

      <div className="edit-days">
        <span className="edit-days-title">Séances par jour (Lun → Dim)</span>
        <p className="tool-hint" style={{ marginTop: 0 }}>
          Glisse une séance par sa poignée <Icon name="grip" size={13} /> pour la déplacer vers un
          autre jour.
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={followPointer}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setDragging(null)}
        >
          {week.days.map((day, di) => (
            <DayColumn
              key={di}
              di={di}
              day={day}
              library={library}
              options={options}
              dayOptions={week.dayOptions[di] ?? []}
              onAddSession={() => onAddSession(di)}
              onUpdateSession={(si, patch) => onUpdateSession(di, si, patch)}
              onRemoveSession={(si) => onRemoveSession(di, si)}
              onSetSessionInfo={(si, info) => onSetSessionInfo(di, si, info)}
              onToggleDayOption={(label) => onToggleDayOption(di, label)}
            />
          ))}
          {/* Portail sous <body> : évite le décalage de l'overlay (position:fixed) quand
              un ancêtre porte un transform (animation d'entrée de .screen, etc.). */}
          {createPortal(
            <DragOverlay modifiers={[snapCenterToCursor]}>
              {dragging ? (
                <div className="session-row drag-ghost">
                  <span className="drag-handle">
                    <Icon name="grip" size={16} />
                  </span>
                  <span className="ghost-label">
                    {dragging.detail || discLabel(dragging.disc)}
                  </span>
                </div>
              ) : null}
            </DragOverlay>,
            document.body,
          )}
        </DndContext>
      </div>

      <div className="edit-options">
        <span className="edit-days-title">Options (globales)</span>
        <p className="tool-hint" style={{ marginTop: 0 }}>
          Activités optionnelles partagées par tout le plan (Tai Chi, mobilité, gainage…).
          Active-les par jour ci-dessus, ou « toute la semaine » ici. Supprimer une option la retire
          partout.
        </p>
        <div className="option-pool">
          {options.map((label) => {
            const allWeek = week.dayOptions.every((d) => d.includes(label))
            return (
              <span className="option-tag" key={label}>
                <button
                  type="button"
                  className={`opt-week${allWeek ? ' on' : ''}`}
                  onClick={() => onToggleWeekOption(label)}
                  aria-pressed={allWeek}
                  title="Activer / désactiver sur toute la semaine"
                >
                  {allWeek ? '✓' : '+'} {label}
                </button>
                <button
                  type="button"
                  className="opt-del"
                  onClick={() => onRemoveOption(label)}
                  aria-label={`Supprimer l'option ${label} (partout)`}
                >
                  <Icon name="close" size={12} />
                </button>
              </span>
            )
          })}
        </div>
        <div className="option-add">
          <input
            type="text"
            value={newOption}
            placeholder="Nouvelle option…"
            onChange={(e) => setNewOption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addOption()
              }
            }}
          />
          <button type="button" className="tool-btn" onClick={addOption}>
            <Icon name="plus" size={16} /> Ajouter
          </button>
        </div>
      </div>

      <button className="tool-btn danger" onClick={onDelete}>
        <Icon name="trash" size={16} /> Supprimer la semaine
        {validated > 0 ? ` (${validated} validée${validated > 1 ? 's' : ''})` : ''}
      </button>
    </div>
  )
}

function DayColumn({
  di,
  day,
  library,
  options,
  dayOptions,
  onAddSession,
  onUpdateSession,
  onRemoveSession,
  onSetSessionInfo,
  onToggleDayOption,
}: {
  di: number
  day: Session[]
  library: SessionLibrary
  options: string[]
  dayOptions: string[]
  onAddSession: () => void
  onUpdateSession: (si: number, patch: Partial<Session>) => void
  onRemoveSession: (si: number) => void
  onSetSessionInfo: (si: number, info: SessionInfo | null) => void
  onToggleDayOption: (label: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayDropId(di) })
  const ids = day.map((_, si) => sessId(di, si))

  return (
    <div className={`edit-day${isOver ? ' drop-over' : ''}`} ref={setNodeRef}>
      <div className="edit-day-head">
        <span className="dn">{DAY_NAMES[di]}</span>
        {day.length === 0 && <span className="rest-tag">Repos</span>}
        <button
          type="button"
          className="add-session"
          onClick={onAddSession}
          aria-label={`Ajouter une séance ${DAY_NAMES[di]}`}
        >
          <Icon name="plus" size={15} /> Séance
        </button>
      </div>

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {day.map((s, si) => (
          <SortableSession
            key={sessId(di, si)}
            id={sessId(di, si)}
            session={s}
            library={library}
            onChange={(patch) => onUpdateSession(si, patch)}
            onRemove={() => onRemoveSession(si)}
            onSetInfo={(info) => onSetSessionInfo(si, info)}
          />
        ))}
      </SortableContext>

      {options.length > 0 && (
        <div className="day-opts">
          {options.map((label) => {
            const on = dayOptions.includes(label)
            return (
              <button
                key={label}
                type="button"
                className={`opt-toggle${on ? ' on' : ''}`}
                onClick={() => onToggleDayOption(label)}
                aria-pressed={on}
              >
                {on ? '✓' : '+'} {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SortableSession({
  id,
  session,
  library,
  onChange,
  onRemove,
  onSetInfo,
}: {
  id: string
  session: Session
  library: SessionLibrary
  onChange: (patch: Partial<Session>) => void
  onRemove: () => void
  onSetInfo: (info: SessionInfo | null) => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="session-item">
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="drag-handle"
        aria-label="Déplacer la séance (glisser)"
        {...attributes}
        {...listeners}
      >
        <Icon name="grip" size={16} />
      </button>
      <SessionRow
        session={session}
        library={library}
        onChange={onChange}
        onRemove={onRemove}
        onSetInfo={onSetInfo}
      />
    </div>
  )
}

function SessionRow({
  session,
  library,
  onChange,
  onRemove,
  onSetInfo,
}: {
  session: Session
  library: SessionLibrary
  onChange: (patch: Partial<Session>) => void
  onRemove: () => void
  onSetInfo: (info: SessionInfo | null) => void
}) {
  const [showDetail, setShowDetail] = useState(false)
  const h = Math.floor(session.min / 60)
  const m = session.min % 60

  function setDuration(nh: number, nm: number) {
    const hh = Math.max(0, Math.min(12, nh || 0))
    const mm = Math.max(0, Math.min(59, nm || 0))
    onChange({ min: hh * 60 + mm })
  }

  return (
    <div className="session-cell">
      <div className="session-row">
        <select
          className="session-disc"
          value={session.disc}
          onChange={(e) => onChange({ disc: e.target.value as SessionDisc })}
          aria-label="Discipline"
        >
          {DISCS.map((d) => (
            <option key={d} value={d}>
              {discLabel(d)}
            </option>
          ))}
        </select>
        <input
          className="session-detail"
          type="text"
          value={session.detail}
          placeholder="détail (ex. Z2 vallonné, 5×4' bosses…)"
          onChange={(e) => onChange({ detail: e.target.value })}
        />
        <div className="session-dur">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={12}
            value={h}
            onChange={(e) => setDuration(Number(e.target.value), m)}
            aria-label="Heures"
          />
          <span>h</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={59}
            step={5}
            value={m}
            onChange={(e) => setDuration(h, Number(e.target.value))}
            aria-label="Minutes"
          />
          <span>min</span>
        </div>
        <button
          type="button"
          className={`session-detail-btn${showDetail ? ' active' : ''}`}
          onClick={() => setShowDetail((d) => !d)}
          aria-expanded={showDetail}
          aria-label="Aperçu du détail de la séance"
        >
          <Icon name={showDetail ? 'close' : 'chevron-down'} size={15} />
        </button>
        <button
          type="button"
          className="session-del"
          onClick={onRemove}
          aria-label="Supprimer la séance"
        >
          <Icon name="trash" size={15} />
        </button>
      </div>
      {showDetail && (
        <SessionDetailEditor
          info={scaffoldInfo(session, library)}
          overridden={!!session.info}
          onChange={(info) => onSetInfo(info)}
          onReset={() => onSetInfo(null)}
        />
      )}
    </div>
  )
}
