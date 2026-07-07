// Jeu d'icônes ligne, cohérent (24×24, currentColor, trait arrondi).
// Remplace les émojis pour un rendu professionnel.
export type IconName =
  | 'week'
  | 'progress'
  | 'plan'
  | 'nutrition'
  | 'taichi'
  | 'note'
  | 'today'
  | 'download'
  | 'upload'
  | 'chevron-left'
  | 'chevron-right'
  | 'check'
  | 'edit'
  | 'plus'
  | 'trash'
  | 'close'
  | 'reset'
  | 'trophy'
  | 'settings'
  | 'chevron-down'
  | 'grip'

interface Props {
  name: IconName
  size?: number
  className?: string
}

export function Icon({ name, size = 20, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}

const PATHS: Record<IconName, React.ReactNode> = {
  // calendrier
  week: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </>
  ),
  // courbe de progression
  progress: (
    <>
      <path d="M4 15l4.5-5 3.5 3.5L20 6" />
      <path d="M20 10V6h-4" />
    </>
  ),
  // pile / liste des semaines
  plan: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="4" cy="6" r="0.4" fill="currentColor" />
    </>
  ),
  // feuille (nutrition)
  nutrition: (
    <>
      <path d="M5 19c0-7 5-12 14-12 0 7-4 12-11 12-1.5 0-3-.4-3-.4Z" />
      <path d="M9 17c2-4 5-6 8-7" />
    </>
  ),
  // taiji (Tai Chi) en trait
  taichi: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a4.5 4.5 0 0 0 0 9 4.5 4.5 0 0 1 0 9" />
      <circle cx="12" cy="7.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16.5" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  // crayon (note)
  note: (
    <>
      <path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3Z" />
      <path d="M14.5 7.5l3 3" />
    </>
  ),
  // calendrier avec point du jour
  today: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
      <circle cx="12" cy="14.5" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M7 11l5 5 5-5" />
      <path d="M4 20h16" />
    </>
  ),
  upload: (
    <>
      <path d="M12 21V9M7 13l5-5 5 5" />
      <path d="M4 4h16" />
    </>
  ),
  'chevron-left': <path d="M15 5l-7 7 7 7" />,
  'chevron-right': <path d="M9 5l7 7-7 7" />,
  'chevron-down': <path d="M5 9l7 7 7-7" />,
  // poignée de glisse (6 points)
  grip: (
    <>
      <circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  edit: (
    <>
      <path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3Z" />
      <path d="M14.5 7.5l3 3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  trash: (
    <>
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  reset: (
    <>
      <path d="M4 12a8 8 0 1 0 2.3-5.6" />
      <path d="M4 4v4h4" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4.5v1A3 3 0 0 0 7 10M17 6h2.5v1A3 3 0 0 1 17 10" />
      <path d="M12 14v3M8.5 21h7M10 21c0-1.6 4-1.6 4 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12h2.5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
    </>
  ),
}
