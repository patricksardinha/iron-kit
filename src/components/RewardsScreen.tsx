import type { Badge, State, Week } from '../types'
import { computeBadges } from '../lib/badges'

interface Props {
  weeks: Week[]
  state: State
  today: Date
}

export function RewardsScreen({ weeks, state, today }: Props) {
  const badges = computeBadges(weeks, state, today)
  const earned = badges.filter((b) => b.earned).length
  const pct = badges.length ? Math.round((earned / badges.length) * 100) : 0

  // Regroupe par catégorie (ordre de première apparition).
  const groups: { name: string; items: Badge[] }[] = []
  for (const b of badges) {
    let g = groups.find((x) => x.name === b.group)
    if (!g) {
      g = { name: b.group, items: [] }
      groups.push(g)
    }
    g.items.push(b)
  }

  return (
    <div className="screen">
      <h1 className="screen-title">Badges</h1>

      <div className="rewards-summary">
        <div className="rw-top">
          <span className="rw-count">
            {earned}
            <small> / {badges.length}</small>
          </span>
          <span className="rw-pct">{pct}%</span>
        </div>
        <div className="rw-track">
          <i style={{ width: `${pct}%` }} />
        </div>
        <div className="rw-lbl">récompenses débloquées</div>
      </div>

      {groups.map((g) => {
        const e = g.items.filter((b) => b.earned).length
        return (
          <div className="reward-group" key={g.name}>
            <div className="section-h">
              {g.name} <span className="section-count">{e}/{g.items.length}</span>
            </div>
            <div className="badge-grid">
              {g.items.map((b) => (
                <BadgeCard key={b.id} badge={b} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BadgeCard({ badge }: { badge: Badge }) {
  const pct = badge.target ? Math.min(100, Math.round((badge.current / badge.target) * 100)) : 0
  return (
    <div
      className={`badge-card tier-${badge.tier}${badge.earned ? ' earned' : ' locked'}`}
      title={`${badge.title} - ${badge.desc}`}
    >
      <span className="badge-emoji">{badge.emoji}</span>
      <span className="badge-title">{badge.title}</span>
      <span className="badge-desc">{badge.desc}</span>
      {badge.earned ? (
        <span className="badge-check">Débloqué</span>
      ) : (
        <span className="badge-prog">
          <span className="badge-prog-track">
            <i style={{ width: `${pct}%` }} />
          </span>
          <span className="badge-prog-num">
            {badge.current}/{badge.target}
          </span>
        </span>
      )}
    </div>
  )
}
