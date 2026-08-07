import type { Badge, State, Week } from '../types'
import { LEVELS, badgePoints, computeBadges, levelFor } from '../lib/badges'
import { Icon } from './Icon'

interface Props {
  weeks: Week[]
  state: State
  today: Date
}

export function RewardsScreen({ weeks, state, today }: Props) {
  const badges = computeBadges(weeks, state, today)
  const earned = badges.filter((b) => b.earned).length

  // Niveau global : chaque badge rapporte des points selon son palier.
  const points = badgePoints(badges)
  const { level, next } = levelFor(points)
  const lvlPct = next
    ? Math.round(((points - level.min) / (next.min - level.min)) * 100)
    : 100

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

      {/* Carte de niveau : bois → légende, alimentée par les points des badges. */}
      <div className="level-card" style={{ ['--lc' as string]: level.color }}>
        <div className="lv-medal">
          <Icon name="medal" size={32} />
        </div>
        <div className="lv-body">
          <div className="lv-kicker">Niveau</div>
          <div className="lv-name">{level.name}</div>
          <div className="lv-sub">
            {points} pts · {earned}/{badges.length} badges
          </div>
          <div className="lv-bar">
            <i style={{ width: `${lvlPct}%` }} />
          </div>
          <div className="lv-goal">
            {next ? (
              <>
                Prochain niveau : <b>{next.name}</b> à {next.min} pts
              </>
            ) : (
              'Niveau maximum atteint. Légende vivante.'
            )}
          </div>
        </div>
      </div>

      <div className="level-track" aria-label="Échelle des niveaux">
        {LEVELS.map((l) => (
          <span
            key={l.id}
            className={`lv-step${points >= l.min ? ' on' : ''}${l.id === level.id ? ' cur' : ''}`}
            style={{ ['--lc' as string]: l.color }}
          >
            {l.name}
          </span>
        ))}
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
  const secret = badge.hidden && !badge.earned

  if (secret) {
    return (
      <div className="badge-card tier-special locked secret" title="Badge secret — à découvrir">
        <span className="badge-emoji">
          <Icon name="help" size={28} />
        </span>
        <span className="badge-title">Badge secret</span>
        <span className="badge-desc">À débloquer…</span>
      </div>
    )
  }

  return (
    <div
      className={`badge-card tier-${badge.tier}${badge.earned ? ' earned' : ' locked'}`}
      title={`${badge.title} - ${badge.desc}`}
    >
      <span className="badge-emoji">
        <Icon name={badge.icon} size={28} />
      </span>
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
