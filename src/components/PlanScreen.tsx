import { useMemo, useState } from 'react'
import type { Week, State, SessionLibrary } from '../types'
import type { PlanApi } from '../hooks/usePlan'
import { phaseColor, phaseParts } from '../lib/constants'
import { applyLayout, formatDuration, weekDatesLabel, weekVolume } from '../lib/logic'
import { weekDoneMinutes, weekProgress } from '../lib/stats'
import { Icon } from './Icon'
import { WeekEditor } from './WeekEditor'
import { ConfirmDialog } from './ConfirmDialog'

interface Props {
  plan: PlanApi
  state: State
  currentWk: number
  library: SessionLibrary
}

export function PlanScreen({ plan, state, currentWk, library }: Props) {
  const {
    weeks,
    isCustom,
    updateWeek,
    addSession,
    updateSession,
    removeSession,
    moveSession,
    setSessionInfo,
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
  const [confirm, setConfirm] = useState<{ kind: 'delete'; wk: number } | { kind: 'reset' } | null>(
    null,
  )

  // Les validations sont enregistrées sur l'agencement RÉEL (séances déplacées dans
  // Semaine) : la progression doit se calculer dessus, pas sur les positions du plan.
  const effByWk = useMemo(() => {
    const eff = applyLayout(weeks, state.layout)
    return new Map(eff.map((w) => [w.wk, w]))
  }, [weeks, state.layout])

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
              const eff = effByWk.get(w.wk) ?? w
              const p = weekProgress(eff, state.sessions)
              const pct = p.total ? Math.min(100, (p.validated / p.total) * 100) : 0
              const doneMin = weekDoneMinutes(eff, state.sessions)
              const plannedMin = Math.round(weekVolume(w) * 60)
              const over = plannedMin > 0 && doneMin > plannedMin
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
                        {w.typ} · {doneMin > 0 ? formatDuration(doneMin) : '0h'}
                        {' / '}
                        {formatDuration(plannedMin)}
                        {over && <b className="sub-over"> +{formatDuration(doneMin - plannedMin)}</b>}
                      </span>
                      <span className="mini">
                        <i className={pct >= 100 ? 'full' : ''} style={{ width: `${pct}%` }} />
                      </span>
                    </span>
                    <span className="cnt" aria-hidden="true">
                      {open && <span className="edit-flag">Édition</span>}
                      <Icon name={open ? 'close' : 'edit'} size={16} />
                    </span>
                  </button>
                  {open && (
                    <WeekEditor
                      week={w}
                      validated={p.validated}
                      library={library}
                      onPatch={(patch) => updateWeek(w.wk, patch)}
                      onAddSession={(di) => addSession(w.wk, di)}
                      onUpdateSession={(di, si, patch) => updateSession(w.wk, di, si, patch)}
                      onRemoveSession={(di, si) => removeSession(w.wk, di, si)}
                      onMoveSession={(fromDi, fromSi, toDi, toSi) =>
                        moveSession(w.wk, fromDi, fromSi, toDi, toSi)
                      }
                      onSetSessionInfo={(di, si, info) => setSessionInfo(w.wk, di, si, info)}
                      options={options}
                      onAddOption={(label) => addOption(label)}
                      onRemoveOption={(label) => removeOption(label)}
                      onToggleDayOption={(di, label) => toggleDayOption(w.wk, di, label)}
                      onToggleWeekOption={(label) => toggleWeekOption(w.wk, label)}
                      onDelete={() => setConfirm({ kind: 'delete', wk: w.wk })}
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
          <button className="tool-btn danger" onClick={() => setConfirm({ kind: 'reset' })}>
            <Icon name="reset" size={17} /> Réinitialiser
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirm?.kind === 'delete'}
        danger
        title={confirm?.kind === 'delete' ? `Supprimer la semaine ${confirm.wk} ?` : ''}
        message="Les validations et notes des semaines suivantes seront décalées d'un cran. Action irréversible."
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (confirm?.kind === 'delete') {
            setExpanded(null)
            deleteWeek(confirm.wk)
          }
          setConfirm(null)
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm?.kind === 'reset'}
        danger
        title="Réinitialiser le plan ?"
        message="Le plan repart de sa version d'origine. Tes modifications du plan seront perdues (les validations sont conservées)."
        confirmLabel="Réinitialiser"
        onConfirm={() => {
          reset()
          setConfirm(null)
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
