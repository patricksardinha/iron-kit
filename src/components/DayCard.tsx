import { useState } from 'react'
import type { Session, SessionLibrary } from '../types'
import { DAY_NAMES } from '../lib/constants'
import { resolveSession, restInfo } from '../lib/sessions'
import { SessionDetail } from './SessionDetail'
import {
  dayDiscipline,
  discLabel,
  formatDuration,
  formatShort,
  isDayValidated,
  isTestDay,
  isTrainingDay,
  isOverdue,
  sessionKey,
} from '../lib/logic'
import { Icon } from './Icon'

interface Props {
  wk: number
  di: number
  day: Session[]
  date: Date
  today: Date
  isToday: boolean
  sessions: Record<string, number>
  library: SessionLibrary
  options: string[]
  isOptionDone: (label: string) => boolean
  note: string | undefined
  onSetSession: (si: number, min: number | null) => void
  onToggleOption: (label: string) => void
  onSetNote: (text: string) => void
}

export function DayCard({
  wk,
  di,
  day,
  date,
  today,
  isToday,
  sessions,
  library,
  options,
  isOptionDone,
  note,
  onSetSession,
  onToggleOption,
  onSetNote,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const training = isTrainingDay(day)
  const dayDone = isDayValidated(wk, di, day, sessions)
  const overdue = !dayDone && isOverdue(date, day, today)

  const disc = dayDiscipline(day)
  const discColor = disc.key === 'race' ? 'var(--run)' : disc.color
  const doneCount = day.filter((_, si) => sessionKey(wk, di, si) in sessions).length

  // État global du jour : « x » (manqué) prime sur « ! » (partiel) sur « ✓ » (plein).
  let anyZero = false
  let anyPartial = false
  day.forEach((s, si) => {
    const k = sessionKey(wk, di, si)
    if (!(k in sessions)) return
    const a = sessions[k]!
    if (s.min > 0) {
      if (a === 0) anyZero = true
      else if (a < s.min) anyPartial = true
    }
  })
  const dayState = anyZero ? 'zero' : anyPartial ? 'partial' : 'full'
  const test = isTestDay(day)

  const cls = [
    'day',
    training ? '' : 'rest',
    dayDone ? 'done' : '',
    isToday ? 'today' : '',
    overdue ? 'overdue' : '',
    test ? 'test' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls} style={{ ['--disc' as string]: discColor }}>
      <div className="day-head">
        <span className="day-name">
          {DAY_NAMES[di]} <span className="day-date">{formatShort(date)}</span>
        </span>
        {test && (
          <span className="day-test-tag">
            <Icon name="trophy" size={13} /> Test
          </span>
        )}
        {training &&
          (dayDone ? (
            <span className={`day-status ${dayState}`}>
              {dayState === 'full' && <Icon name="check" size={13} />}
              {dayState === 'partial' && <b className="g">!</b>}
              {dayState === 'zero' && <b className="g">✕</b>}
              Enregistré
            </span>
          ) : (
            <span className="day-steps">
              {doneCount}/{day.length}
            </span>
          ))}
        {overdue && <span className="day-overdue-tag">manqué</span>}
      </div>

      {!training ? (
        <div className="day-rest-label">Repos / mobilité</div>
      ) : (
        <ul className="sess-list">
          {day.map((s, si) => {
            const key = sessionKey(wk, di, si)
            const logged = key in sessions
            const actual = logged ? sessions[key]! : 0
            // full : atteint (ou épreuve sans durée) · zero : validé mais rien fait · partial : entre les deux
            const status = !logged
              ? 'todo'
              : s.min === 0 || actual >= s.min
                ? 'full'
                : actual === 0
                  ? 'zero'
                  : 'partial'
            return (
              <li className={`sess ${status}`} key={si}>
                <button
                  type="button"
                  className="sess-dot"
                  onClick={() => onSetSession(si, logged ? null : s.min)}
                  aria-pressed={logged}
                  aria-label={`${logged ? 'Dévalider' : 'Valider'} ${s.detail || discLabel(s.disc)}`}
                >
                  {status === 'full' && <Icon name="check" size={12} />}
                  {status === 'partial' && <b className="g">!</b>}
                  {status === 'zero' && <b className="g">✕</b>}
                </button>
                <span className="sess-body">
                  <span className="sess-label">{s.detail || discLabel(s.disc)}</span>
                  {s.min > 0 && (
                    <span className="sess-dur">
                      {logged ? (
                        <span className="stepper">
                          <button
                            type="button"
                            onClick={() => onSetSession(si, Math.max(0, actual - 5))}
                            aria-label="Moins 5 min"
                          >
                            −
                          </button>
                          <span className="stepper-val">{formatDuration(actual)}</span>
                          <button
                            type="button"
                            onClick={() => onSetSession(si, Math.min(300, actual + 5))}
                            aria-label="Plus 5 min"
                          >
                            +
                          </button>
                        </span>
                      ) : (
                        <span className="sess-planned">{formatDuration(s.min)}</span>
                      )}
                    </span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <div className="day-actions">
        {options.map((label) => {
          const on = isOptionDone(label)
          return (
            <button
              key={label}
              type="button"
              className={`opt-chip${on ? ' on' : ''}`}
              onClick={() => onToggleOption(label)}
              aria-pressed={on}
              aria-label={`${label} ${on ? 'fait' : 'à faire'}`}
            >
              {label === 'Tai Chi' && <Icon name="taichi" size={15} />} {label}
              {on && <Icon name="check" size={13} />}
            </button>
          )
        })}

        <button
          type="button"
          className={`detail-btn${showDetail ? ' active' : ''}`}
          onClick={() => setShowDetail((d) => !d)}
          aria-expanded={showDetail}
        >
          Détail
          <Icon name={showDetail ? 'close' : 'chevron-down'} size={15} />
        </button>

        <button
          type="button"
          className={`note-btn${note ? ' has' : ''}${editing ? ' active' : ''}`}
          onClick={() => setEditing((e) => !e)}
          aria-expanded={editing}
          aria-label={editing ? 'Fermer la note' : note ? 'Modifier la note' : 'Ajouter une note'}
        >
          <Icon name={editing ? 'close' : 'note'} size={16} />
        </button>
      </div>

      {showDetail && (
        <div className="day-detail">
          {training ? (
            day.map((s, si) => {
              const info = resolveSession(s, library)
              return info ? (
                <SessionDetail key={si} info={info} />
              ) : (
                <div key={si} className="sd-missing">
                  Détail indisponible pour « {s.detail || discLabel(s.disc)} ».
                </div>
              )
            })
          ) : (
            (() => {
              const info = restInfo(library)
              return info ? (
                <SessionDetail info={info} />
              ) : (
                <div className="sd-missing">Journée de repos / mobilité.</div>
              )
            })()
          )}
        </div>
      )}

      {note && !editing && <div className="day-note-preview">{note}</div>}

      {editing && (
        <div className="note-editor">
          <textarea
            autoFocus
            value={note ?? ''}
            placeholder="Ressenti, allure, sensations, météo, douleurs…"
            onChange={(e) => onSetNote(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
