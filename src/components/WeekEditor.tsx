import type { Week } from '../types'
import type { WeekPatch } from '../hooks/usePlan'
import { DAY_NAMES } from '../lib/constants'
import { Icon } from './Icon'

interface Props {
  week: Week
  validated: number
  onPatch: (patch: WeekPatch) => void
  onDay: (di: number, label: string) => void
  onDelete: () => void
}

const KNOWN_PHASES = [
  '0 — Fondation',
  '1 — Construction',
  '2 — Spécifique',
  '3 — Pic & Affûtage',
]
const KNOWN_TYPES = ['Charge', 'Récup', 'Affût.', 'PIC', 'TEST 70.3', 'COURSE']

export function WeekEditor({ week, validated, onPatch, onDay, onDelete }: Props) {
  return (
    <div className="week-editor">
      <div className="edit-grid">
        <label className="edit-field">
          <span>Dates</span>
          <input
            type="text"
            value={week.dates}
            placeholder="6 juil → 12 juil 2026"
            onChange={(e) => onPatch({ dates: e.target.value })}
          />
        </label>
        <label className="edit-field">
          <span>Volume (h)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            value={week.vol}
            onChange={(e) => onPatch({ vol: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="edit-field">
          <span>Phase</span>
          <input
            type="text"
            list="phases-list"
            value={week.phase}
            onChange={(e) => onPatch({ phase: e.target.value })}
          />
        </label>
        <label className="edit-field">
          <span>Type</span>
          <input
            type="text"
            list="types-list"
            value={week.typ}
            onChange={(e) => onPatch({ typ: e.target.value })}
          />
        </label>
      </div>

      <datalist id="phases-list">
        {KNOWN_PHASES.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <datalist id="types-list">
        {KNOWN_TYPES.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

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
        <span className="edit-days-title">Séances (Lun → Dim)</span>
        {week.days.map((label, di) => (
          <label className="edit-day-row" key={di}>
            <span className="dn">{DAY_NAMES[di]}</span>
            <input
              type="text"
              value={label}
              placeholder="Repos / mobilité, Nat…, Vélo…, CAP…"
              onChange={(e) => onDay(di, e.target.value)}
            />
          </label>
        ))}
      </div>

      <button className="tool-btn danger" onClick={onDelete}>
        <Icon name="trash" size={16} /> Supprimer la semaine
        {validated > 0 ? ` (${validated} validée${validated > 1 ? 's' : ''})` : ''}
      </button>
    </div>
  )
}
