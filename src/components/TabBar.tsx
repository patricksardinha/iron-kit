import type { Tab } from '../types'
import { Icon, type IconName } from './Icon'

interface Props {
  active: Tab
  onChange: (t: Tab) => void
}

const TABS: { id: Tab; label: string; ic: IconName }[] = [
  { id: 'week', label: 'Semaine', ic: 'week' },
  { id: 'progress', label: 'Progrès', ic: 'progress' },
  { id: 'plan', label: 'Plan', ic: 'plan' },
  { id: 'rewards', label: 'Badges', ic: 'trophy' },
  { id: 'nutrition', label: 'Nutrition', ic: 'nutrition' },
  { id: 'settings', label: 'Réglages', ic: 'settings' },
]

export function TabBar({ active, onChange }: Props) {
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      {TABS.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} aria-current={active === t.id}>
          <span className="ic">
            <Icon name={t.ic} size={22} />
          </span>
          {t.label}
        </button>
      ))}
    </nav>
  )
}
