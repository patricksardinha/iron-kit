import { useState } from 'react'
import type { Week, State } from '../types'
import type { PlanApi } from '../hooks/usePlan'
import { phaseColor, phaseParts } from '../lib/constants'
import { weekDatesLabel, weekVolume } from '../lib/logic'
import { weekProgress } from '../lib/stats'
import { Icon } from './Icon'
import { WeekEditor } from './WeekEditor'

interface Props {
  plan: PlanApi
  state: State
  currentWk: number
}

export function PlanScreen({ plan, state, currentWk }: Props) {
  const {
    weeks,
    isCustom,
    updateWeek,
    addSession,
    updateSession,
    removeSession,
    options,
    addOption,
    removeOption,
    toggleDayOption,
    toggleWeekOption,
    addWeek,
    deleteWeek,
    reset,
  } = plan
  const [expanded, setExpanded] = useState<number | null>(null)

  // Regroupement par phase (conserve l'ordre chronologique).
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
    <div className="screen">
      <h1 className="screen-title">Plan · {weeks.length} sem.</h1>
      <p className="tool-hint" style={{ marginTop: -6, marginBottom: 14 }}>
        Touche une semaine pour l'éditer. Tout est enregistré automatiquement.
      </p>

      {groups.map((g) => {
        const pc = phaseColor(g.phase)
        const { num, label } = phaseParts(g.phase)
        return (
          <div className="phase-group" key={g.phase + g.weeks[0]!.wk}>
            <div className="phase-head" style={{ ['--phasec' as string]: pc }}>
              {num !== '' && <span className="phase-num">{num}</span>}
              <span className="phase-label">{label}</span>
            </div>
            {g.weeks.map((w) => {
              const open = expanded === w.wk
              const p = weekProgress(w, state.sessions)
              const pct = p.total ? (p.validated / p.total) * 100 : 0
              return (
                <div className={`edit-week${open ? ' open' : ''}`} key={w.wk}>
                  <button
                    className={`plan-row${open ? ' open' : ''}${w.wk === currentWk ? ' current' : ''}`}
                    style={{ ['--phasec' as string]: pc }}
                    onClick={() => setExpanded((c) => (c === w.wk ? null : w.wk))}
                    aria-expanded={open}
                  >
                    <span className="wkno">{w.wk}</span>
                    <span className="info">
                      <span className="dates">{weekDatesLabel(w.start)}</span>
                      <span className="sub">
                        {w.typ} · {weekVolume(w)} h
                      </span>
                      <span className="mini">
                        <i style={{ width: `${pct}%` }} />
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
                      onAddSession={(di) => addSession(w.wk, di)}
                      onUpdateSession={(di, si, patch) => updateSession(w.wk, di, si, patch)}
                      onRemoveSession={(di, si) => removeSession(w.wk, di, si)}
                      options={options}
                      onAddOption={(label) => addOption(label)}
                      onRemoveOption={(label) => removeOption(label)}
                      onToggleDayOption={(di, label) => toggleDayOption(w.wk, di, label)}
                      onToggleWeekOption={(label) => toggleWeekOption(w.wk, label)}
                      onDelete={() => {
                        if (
                          window.confirm(
                            `Supprimer la semaine ${w.wk} ? Les validations/notes des semaines suivantes seront décalées.`,
                          )
                        ) {
                          setExpanded(null)
                          deleteWeek(w.wk)
                        }
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      <div className="edit-actions">
        <button className="tool-btn accent" onClick={() => addWeek()}>
          <Icon name="plus" size={17} /> Ajouter la semaine suivante
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
    </div>
  )
}
