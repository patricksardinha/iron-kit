import { useState } from 'react'
import type { Session, SessionDisc, Week } from '../types'
import type { AddResult, WeekPatch } from '../hooks/usePlan'
import { DAY_NAMES } from '../lib/constants'
import { PHASES, typesForPhase } from '../lib/constants'
import { discLabel, weekVolume } from '../lib/logic'
import { Icon } from './Icon'

interface Props {
  week: Week
  validated: number
  onPatch: (patch: WeekPatch) => AddResult
  onAddSession: (di: number) => void
  onUpdateSession: (di: number, si: number, patch: Partial<Session>) => void
  onRemoveSession: (di: number, si: number) => void
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
  onPatch,
  onAddSession,
  onUpdateSession,
  onRemoveSession,
  options,
  onAddOption,
  onRemoveOption,
  onToggleDayOption,
  onToggleWeekOption,
  onDelete,
}: Props) {
  const [dateError, setDateError] = useState<string | null>(null)
  const [newOption, setNewOption] = useState('')
  const allowedTypes = typesForPhase(week.phase)
  const vol = weekVolume(week)

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
        {week.days.map((day, di) => (
          <div className="edit-day" key={di}>
            <div className="edit-day-head">
              <span className="dn">{DAY_NAMES[di]}</span>
              {day.length === 0 && <span className="rest-tag">Repos</span>}
              <button
                type="button"
                className="add-session"
                onClick={() => onAddSession(di)}
                aria-label={`Ajouter une séance ${DAY_NAMES[di]}`}
              >
                <Icon name="plus" size={15} /> Séance
              </button>
            </div>
            {day.map((s, si) => (
              <SessionRow
                key={si}
                session={s}
                onChange={(patch) => onUpdateSession(di, si, patch)}
                onRemove={() => onRemoveSession(di, si)}
              />
            ))}
            {options.length > 0 && (
              <div className="day-opts">
                {options.map((label) => {
                  const on = week.dayOptions[di]?.includes(label)
                  return (
                    <button
                      key={label}
                      type="button"
                      className={`opt-toggle${on ? ' on' : ''}`}
                      onClick={() => onToggleDayOption(di, label)}
                      aria-pressed={on}
                    >
                      {on ? '✓' : '+'} {label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
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

function SessionRow({
  session,
  onChange,
  onRemove,
}: {
  session: Session
  onChange: (patch: Partial<Session>) => void
  onRemove: () => void
}) {
  const h = Math.floor(session.min / 60)
  const m = session.min % 60

  function setDuration(nh: number, nm: number) {
    const hh = Math.max(0, Math.min(12, nh || 0))
    const mm = Math.max(0, Math.min(59, nm || 0))
    onChange({ min: hh * 60 + mm })
  }

  return (
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
      <button type="button" className="session-del" onClick={onRemove} aria-label="Supprimer la séance">
        <Icon name="trash" size={15} />
      </button>
    </div>
  )
}
