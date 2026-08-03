import type { Week, State } from '../types'
import { JALONS, phaseColor } from '../lib/constants'
import { addDays, daysBetween, formatShort, parseISO } from '../lib/logic'
import {
  overallProgress,
  weekProgress,
  hoursProgress,
  disciplineStats,
  phaseStats,
  currentStreak,
  countOption,
  weeklyVolumeSeries,
  disciplineHours,
} from '../lib/stats'
import { ProgressRing } from './ProgressRing'
import { VolumeChart, DisciplineDonut } from './Charts'
import { Icon } from './Icon'

interface Props {
  weeks: Week[]
  state: State
  currentWk: number
  today: Date
  options: string[]
}

// Palier atteint / prochain palier pour une valeur et une échelle.
function milestone(value: number, steps: number[]): { reached: number; next: number | null } {
  let reached = 0
  let next: number | null = steps[0] ?? null
  for (const s of steps) {
    if (value >= s) {
      reached = s
      next = null
    } else {
      next = s
      break
    }
  }
  return { reached, next }
}

export function ProgressScreen({ weeks, state, currentWk, today, options }: Props) {
  const overall = overallProgress(weeks, state.sessions)
  const thisWeek = weeks[currentWk - 1]
  const wp = thisWeek ? weekProgress(thisWeek, state.sessions) : { validated: 0, total: 0 }
  const wpPct = wp.total ? Math.round((wp.validated / wp.total) * 100) : 0
  const hours = hoursProgress(weeks, state.sessions)
  const discs = disciplineStats(weeks, state.sessions)
  const phases = phaseStats(weeks, state.sessions)
  const streak = currentStreak(weeks, state.sessions, today)
  const volSeries = weeklyVolumeSeries(weeks, state.sessions)
  const discHours = disciplineHours(weeks, state.sessions)

  // Niveau de la semaine → couleur + message + animation.
  const level =
    wp.total === 0 ? 'none' : wpPct >= 100 ? 'perfect' : wpPct >= 67 ? 'high' : wpPct >= 34 ? 'mid' : 'low'
  const message: Record<string, string> = {
    none: 'Aucune séance prévue cette semaine.',
    low: 'On lance la machine. Chaque séance compte.',
    mid: 'Bien parti — continue sur ta lancée !',
    high: 'Grosse semaine, presque parfaite.',
    perfect: 'Semaine PARFAITE. Chapeau !',
  }

  const streakM = milestone(streak, [3, 7, 14, 21, 30, 45, 60, 90])
  const hoursM = milestone(Math.round(hours.validated), [10, 25, 50, 100, 150, 250, 400])

  // Prochain jalon (test) NON validé + décompte en JOURS.
  const testsDone = JALONS.filter((j) => state.tests[String(j.wk)]).length
  const nextJalon =
    JALONS.find((j) => !state.tests[String(j.wk)] && j.wk >= currentWk) ??
    JALONS.find((j) => !state.tests[String(j.wk)]) ??
    JALONS[JALONS.length - 1]!
  const nextJalonDone = !!state.tests[String(nextJalon.wk)]
  const jWeek = weeks[nextJalon.wk - 1]
  const jDays = jWeek ? daysBetween(today, parseISO(jWeek.start)) : null
  const jLabel =
    jDays === null ? '' : jDays <= 0 ? 'cette semaine' : jDays <= 6 ? `J−${jDays}` : `J−${jDays}`

  // Compte à rebours générique : jusqu'au dernier jour du plan actif.
  const lastWeek = weeks[weeks.length - 1]
  const goalDate = lastWeek ? addDays(parseISO(lastWeek.start), 6) : today
  const goalDays = Math.max(0, daysBetween(today, goalDate))

  return (
    <div className="screen">
      <h1 className="screen-title">Progression</h1>

      {/* Carte héro : réagit au score de la semaine */}
      <div className={`week-hero lvl-${level}`}>
        <div className="wh-top">
          <span className="wh-label">Cette semaine · S{currentWk}</span>
          <span className="wh-pct">{wpPct}%</span>
        </div>
        <div className="wh-track">
          <i style={{ width: `${wpPct}%` }} />
        </div>
        <div className="wh-row">
          <span className="wh-msg">{message[level]}</span>
          <span className="wh-count">
            {wp.validated}/{wp.total}
          </span>
        </div>
      </div>

      <ProgressRing pct={overall.pct} validated={overall.validated} total={overall.total} />

      <div className="stat-grid">
        <div className={`stat${streak >= 7 ? ' hot' : ''}`}>
          <div className="k">
            Série en cours{' '}
            {streak >= 3 && (
              <span className="fire">
                <Icon name="flame" size={14} />
              </span>
            )}
          </div>
          <div className="v">
            {streak}
            <small> {streak > 1 ? 'jours' : 'jour'}</small>
          </div>
          {streakM.next && (
            <div className="stat-next">
              <span className="sn-track">
                <i style={{ width: `${Math.min(100, (streak / streakM.next) * 100)}%` }} />
              </span>
              <em>prochain palier : {streakM.next} j</em>
            </div>
          )}
        </div>
        <div className={`stat${hoursM.reached >= 50 ? ' hot' : ''}`}>
          <div className="k">Heures faites</div>
          <div className="v">
            ≈{Math.round(hours.validated)}
            <small> / {Math.round(hours.planned)} h</small>
          </div>
          {hoursM.next && (
            <div className="stat-next">
              <span className="sn-track">
                <i style={{ width: `${Math.min(100, (hours.validated / hoursM.next) * 100)}%` }} />
              </span>
              <em>prochain palier : {hoursM.next} h</em>
            </div>
          )}
        </div>
        <div className="stat">
          <div className="k">Jours validés</div>
          <div className="v">
            {overall.validated}
            <small> / {overall.total}</small>
          </div>
        </div>
        <div className="stat">
          <div className="k">Avancement</div>
          <div className="v">
            {overall.pct}
            <small> %</small>
          </div>
        </div>
      </div>

      <div className="section-h">Graphiques</div>
      <VolumeChart data={volSeries} currentWk={currentWk} />
      <DisciplineDonut swim={discHours.swim} bike={discHours.bike} run={discHours.run} />

      {/* Prochain test non validé — mis en avant (validation : bannière de l'onglet Semaine) */}
      <div className="test-card">
        <div className="tc-icon">
          <Icon name="trophy" size={22} />
        </div>
        <div className="tc-body">
          <div className="tc-kicker">
            {nextJalonDone ? 'Tests terminés' : 'Prochain test'} · {testsDone}/{JALONS.length} validés
          </div>
          <div className="tc-title">{nextJalon.t}</div>
          <div className="tc-desc">{nextJalon.d}</div>
        </div>
        <div className="tc-count">{nextJalonDone ? '✓' : jLabel}</div>
      </div>

      {options.length > 0 && (
        <>
          <div className="section-h">Options</div>
          <div className="opt-grid">
            {options.map((label) => (
              <div className="opt-tile" key={label}>
                <div className="ot-v">{countOption(state.options, label)}</div>
                <div className="ot-k">{label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-h">Par discipline</div>
      {discs.map((d) => {
        const pct = d.planned ? (d.validated / d.planned) * 100 : 0
        return (
          <div className="bar-row" key={d.key} style={{ ['--barc' as string]: d.color }}>
            <div className="bar-top">
              <span className="lbl">{d.label}</span>
              <span className="val">
                {d.validated}/{d.planned}
              </span>
            </div>
            <span className="track">
              <i style={{ width: `${pct}%` }} />
            </span>
          </div>
        )
      })}

      <div className="section-h">Par phase</div>
      {phases.map((p) => (
        <div className="bar-row" key={p.phase} style={{ ['--barc' as string]: phaseColor(p.phase) }}>
          <div className="bar-top">
            <span className="lbl">{p.phase}</span>
            <span className="val">{p.pct}%</span>
          </div>
          <span className="track">
            <i style={{ width: `${p.pct}%` }} />
          </span>
        </div>
      ))}

      <div className="countdown">
        <div className="big">J−{goalDays}</div>
        <div className="lbl">
          jusqu'à l'objectif · {formatShort(goalDate)} {goalDate.getFullYear()}
        </div>
      </div>
    </div>
  )
}
