import { useState } from 'react'
import { DAY_NAMES } from '../lib/constants'
import { dateOfDay, disciplineOf, formatShort, isTraining, isOverdue } from '../lib/logic'
import { Icon } from './Icon'

interface Props {
  wk: number
  di: number
  label: string
  today: Date
  isToday: boolean
  done: boolean
  taichi: boolean
  note: string | undefined
  onToggleDone: () => void
  onToggleTaichi: () => void
  onSetNote: (text: string) => void
}

export function DayCard({
  wk,
  di,
  label,
  today,
  isToday,
  done,
  taichi,
  note,
  onToggleDone,
  onToggleTaichi,
  onSetNote,
}: Props) {
  const [editing, setEditing] = useState(false)
  const disc = disciplineOf(label)
  const training = isTraining(label)
  const overdue = !done && isOverdue(wk, di, label, today)
  const date = dateOfDay(wk, di)

  // Une seule couleur de liseré via variable CSS. Pour l'épreuve (dégradé),
  // on garde une teinte pleine (run) pour les bordures/checks.
  const discColor = disc.key === 'race' ? 'var(--run)' : disc.color

  const cls = [
    'day',
    training ? '' : 'rest',
    done ? 'done' : '',
    isToday ? 'today' : '',
    overdue ? 'overdue' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls} style={{ ['--disc' as string]: discColor }}>
      {/* Zone principale : valide/dévalide la séance. Bouton uniquement si entraînement,
          sinon simple div non interactive (repos non validable, §5). Le Tai Chi et la note
          sont des contrôles SÉPARÉS hors de cette zone → jamais interceptés. */}
      {training ? (
        <button
          type="button"
          className="day-main"
          onClick={onToggleDone}
          aria-pressed={done}
          aria-label={`${done ? 'Dévalider' : 'Valider'} : ${label}`}
        >
          <DayInner
            di={di}
            date={date}
            label={label}
            training
            overdue={overdue}
            note={note}
            editing={editing}
          />
        </button>
      ) : (
        <div className="day-main" aria-label={`${DAY_NAMES[di]} — repos`}>
          <DayInner
            di={di}
            date={date}
            label={label}
            training={false}
            overdue={false}
            note={note}
            editing={editing}
          />
        </div>
      )}

      <div className="day-actions">
        <button
          type="button"
          className={`taichi-chip${taichi ? ' on' : ''}`}
          onClick={onToggleTaichi}
          aria-pressed={taichi}
          aria-label={`Tai Chi ${taichi ? 'fait' : 'à faire'}`}
        >
          <Icon name="taichi" size={16} /> Tai Chi
          {taichi && <Icon name="check" size={14} />}
        </button>

        <button
          type="button"
          className={`note-btn${note ? ' has' : ''}`}
          onClick={() => setEditing((e) => !e)}
          aria-expanded={editing}
          aria-label={note ? 'Modifier la note' : 'Ajouter une note'}
        >
          <Icon name="note" size={16} />
        </button>
      </div>

      {editing && (
        <div className="note-editor">
          <textarea
            autoFocus
            value={note ?? ''}
            placeholder="Ressenti, allure, sensations, météo, douleurs…"
            onChange={(e) => onSetNote(e.target.value)}
            onBlur={() => setEditing(false)}
          />
        </div>
      )}
    </div>
  )
}

interface InnerProps {
  di: number
  date: Date
  label: string
  training: boolean
  overdue: boolean
  note: string | undefined
  editing: boolean
}

function DayInner({ di, date, label, training, overdue, note, editing }: InnerProps) {
  return (
    <>
      {/* pastille de validation (masquée mais présente pour l'alignement sur les repos) */}
      <span
        className="day-check"
        aria-hidden="true"
        style={training ? undefined : { visibility: 'hidden' }}
      >
        <Icon name="check" size={16} />
      </span>
      <div className="day-body">
        <div className="day-head">
          <span className="day-name">
            {DAY_NAMES[di]} <span className="day-date">{formatShort(date)}</span>
          </span>
          {overdue && <span className="day-overdue-tag">manqué</span>}
        </div>
        <div className="day-label">{label}</div>
        {note && !editing && <div className="day-note-preview">{note}</div>}
      </div>
    </>
  )
}
