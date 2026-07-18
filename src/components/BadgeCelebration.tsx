// Notification animée au déblocage d'un badge. Au 1er lancement (par plan), on "amorce"
// silencieusement l'ensemble déjà acquis pour ne notifier QUE les déblocages futurs.
import { useEffect, useRef, useState } from 'react'
import type { Badge } from '../types'
import { Icon } from './Icon'

export function BadgeCelebration({ badges, planId }: { badges: Badge[]; planId: string }) {
  const key = `ik-badges-seen-${planId}`
  const seenRef = useRef<Set<string>>(new Set())
  const seededRef = useRef(false)
  const [queue, setQueue] = useState<Badge[]>([])
  const [current, setCurrent] = useState<Badge | null>(null)

  const persist = (set: Set<string>) => {
    try {
      localStorage.setItem(key, JSON.stringify([...set]))
    } catch {
      /* ignore */
    }
  }

  // Détecte les nouveaux badges acquis.
  useEffect(() => {
    const earned = badges.filter((b) => b.earned).map((b) => b.id)

    if (!seededRef.current) {
      seededRef.current = true
      let seen: Set<string>
      try {
        const raw = localStorage.getItem(key)
        seen = raw ? new Set(JSON.parse(raw) as string[]) : new Set(earned)
        if (!raw) persist(seen) // 1er lancement : amorçage silencieux
      } catch {
        seen = new Set(earned)
      }
      seenRef.current = seen
    }

    const fresh = earned.filter((id) => !seenRef.current.has(id))
    if (fresh.length) {
      fresh.forEach((id) => seenRef.current.add(id))
      persist(seenRef.current)
      const map = new Map(badges.map((b) => [b.id, b]))
      setQueue((q) => [...q, ...fresh.map((id) => map.get(id)!).filter(Boolean)])
    }
  }, [badges, key])

  // Défile la file d'attente, un badge à la fois.
  useEffect(() => {
    if (!current && queue.length) {
      setCurrent(queue[0]!)
      setQueue((q) => q.slice(1))
    }
  }, [current, queue])

  // Affiche ~4 s + petite vibration.
  useEffect(() => {
    if (!current) return
    try {
      navigator.vibrate?.([40, 40, 80])
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => setCurrent(null), 4000)
    return () => window.clearTimeout(t)
  }, [current])

  if (!current) return null

  return (
    <button
      type="button"
      className={`badge-pop tier-${current.tier}`}
      onClick={() => setCurrent(null)}
      aria-label={`Badge débloqué : ${current.title}`}
    >
      <span className="bp-spark bp-spark-a">✦</span>
      <span className="bp-spark bp-spark-b">✧</span>
      <span className="bp-emoji">{current.emoji}</span>
      <span className="bp-text">
        <span className="bp-kicker">
          <Icon name="trophy" size={13} /> Badge débloqué !
        </span>
        <span className="bp-title">{current.title}</span>
        <span className="bp-desc">{current.desc}</span>
      </span>
    </button>
  )
}
