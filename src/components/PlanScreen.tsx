import { useState } from 'react'
import type { Week, State } from '../types'
import type { PlanApi } from '../hooks/usePlan'
import { phaseColor } from '../lib/constants'
import { weekProgress } from '../lib/stats'
import { Icon } from './Icon'
import { WeekEditor } from './WeekEditor'

interface Props {
  plan: PlanApi
  state: State
  currentWk: number
  onOpenWeek: (wk: number) => void
}

export function PlanScreen({ plan, state, currentWk, onOpenWeek }: Props) {
  const { weeks } = plan
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="screen">
      <div className="plan-topbar">
        <h1 className="screen-title" style={{ marginBottom: 0 }}>
          Plan · {weeks.length} sem.
        </h1>
        <button
          className={`edit-toggle${editing ? ' on' : ''}`}
          onClick={() => {
            setEditing((e) => !e)
            setExpanded(null)
          }}
        >
          <Icon name={editing ? 'check' : 'edit'} size={16} />
          {editing ? 'Terminer' : 'Éditer'}
        </button>
      </div>

      {editing ? (
        <EditList
          plan={plan}
          state={state}
          expanded={expanded}
          onExpand={(wk) => setExpanded((c) => (c === wk ? null : wk))}
        />
      ) : (
        <ReadList weeks={weeks} state={state} currentWk={currentWk} onOpenWeek={onOpenWeek} />
      )}
    </div>
  )
}

/* ---------- Lecture : semaines groupées par phase ---------- */
function ReadList({
  weeks,
  state,
  currentWk,
  onOpenWeek,
}: {
  weeks: Week[]
  state: State
  currentWk: number
  onOpenWeek: (wk: number) => void
}) {
  const groups: { phase: string; weeks: Week[] }[] = []
  for (const w of weeks) {
    let g = groups[groups.length - 1]
    if (!g || g.phase !== w.phase) {
      g = { phase: w.phase, weeks: [] }
      groups.push(g)
    }
    g.weeks.push(w)
  }

  return (
    <>
      {groups.map((g) => {
        const pc = phaseColor(g.phase)
        return (
          <div className="phase-group" key={g.phase}>
            <div className="phase-head" style={{ ['--phasec' as string]: pc }}>
              {g.phase}
            </div>
            {g.weeks.map((w) => {
              const p = weekProgress(w, state.done)
              const pct = p.total ? (p.validated / p.total) * 100 : 0
              return (
                <button
                  key={w.wk}
                  className={`plan-row${w.wk === currentWk ? ' current' : ''}`}
                  style={{ ['--phasec' as string]: pc }}
                  onClick={() => onOpenWeek(w.wk)}
                >
                  <span className="wkno">{w.wk}</span>
                  <span className="info">
                    <span className="dates">{w.dates || '—'}</span>
                    <span className="sub">
                      {w.typ} · {w.vol} h
                    </span>
                    <span className="mini">
                      <i style={{ width: `${pct}%` }} />
                    </span>
                  </span>
                  <span className="cnt">
                    {p.validated}/{p.total}
                  </span>
                </button>
              )
            })}
          </div>
        )
      })}
    </>
  )
}

/* ---------- Édition : liste plate + éditeur dépliable ---------- */
function EditList({
  plan,
  state,
  expanded,
  onExpand,
}: {
  plan: PlanApi
  state: State
  expanded: number | null
  onExpand: (wk: number) => void
}) {
  const { weeks, isCustom, updateWeek, updateDay, addWeek, deleteWeek, reset } = plan

  return (
    <>
      <p className="tool-hint" style={{ marginTop: 0, marginBottom: 12 }}>
        Modifie librement les semaines. Les changements sont enregistrés automatiquement sur cet
        appareil. « Réinitialiser » restaure le plan d'origine.
      </p>

      {weeks.map((w) => {
        const pc = phaseColor(w.phase)
        const open = expanded === w.wk
        const p = weekProgress(w, state.done)
        return (
          <div className="edit-week" key={w.wk}>
            <button
              className={`plan-row${open ? ' current' : ''}`}
              style={{ ['--phasec' as string]: pc }}
              onClick={() => onExpand(w.wk)}
              aria-expanded={open}
            >
              <span className="wkno">{w.wk}</span>
              <span className="info">
                <span className="dates">{w.dates || `Semaine ${w.wk}`}</span>
                <span className="sub">
                  {w.phase} · {w.typ} · {w.vol} h
                </span>
              </span>
              <span className="cnt" aria-hidden="true">
                <Icon name={open ? 'close' : 'edit'} size={16} />
              </span>
            </button>
            {open && (
              <WeekEditor
                week={w}
                validated={p.validated}
                onPatch={(patch) => updateWeek(w.wk, patch)}
                onDay={(di, label) => updateDay(w.wk, di, label)}
                onDelete={() => {
                  if (
                    window.confirm(
                      `Supprimer la semaine ${w.wk} ? Les validations/notes des semaines suivantes seront décalées.`,
                    )
                  ) {
                    onExpand(w.wk) // referme
                    deleteWeek(w.wk)
                  }
                }}
              />
            )}
          </div>
        )
      })}

      <div className="edit-actions">
        <button className="tool-btn" onClick={addWeek}>
          <Icon name="plus" size={17} /> Ajouter une semaine
        </button>
        {isCustom && (
          <button
            className="tool-btn danger"
            onClick={() => {
              if (window.confirm('Réinitialiser au plan d’origine ? Tes modifications du plan seront perdues.')) {
                reset()
              }
            }}
          >
            <Icon name="reset" size={17} /> Réinitialiser
          </button>
        )}
      </div>
    </>
  )
}
