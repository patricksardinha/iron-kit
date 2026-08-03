// Jeu d'icônes ligne, cohérent (24×24, currentColor, trait arrondi).
// Remplace les émojis pour un rendu professionnel.
export type IconName =
  | 'week'
  | 'progress'
  | 'plan'
  | 'fridge'
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
  | 'lock'
  | 'unlock'
  // — badges & progression (icônes personnalisées, remplacent les emojis) —
  | 'sprout'
  | 'check-circle'
  | 'flame'
  | 'infinity'
  | 'rosette'
  | 'clock'
  | 'mountain'
  | 'medal'
  | 'swim'
  | 'wave'
  | 'bike'
  | 'shoe'
  | 'trident'
  | 'repeat'
  | 'bolt'
  | 'target'
  | 'diamond'
  | 'crown'
  | 'book'
  | 'plate'
  | 'flag'
  | 'flask'
  | 'grad'
  | 'star'
  | 'help'

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
  // réfrigérateur (frigo)
  fridge: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M6 10h12" />
      <path d="M9 6v2M9 13v3" />
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
  // cadenas fermé
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  // cadenas ouvert
  unlock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 7.7-1.5" />
    </>
  ),
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
  // pousse (premiers pas)
  sprout: (
    <>
      <path d="M12 21v-7" />
      <path d="M12 14c0-4-2.8-6.5-7-6.5 0 4.2 2.8 6.5 7 6.5Z" />
      <path d="M12 12c0-4.5 3-8 7.5-8 0 5-3 8-7.5 8Z" />
    </>
  ),
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.8 2.8L16.5 9" />
    </>
  ),
  // flamme (séries)
  flame: (
    <path d="M12 3c4 3.2 6 6.5 6 10a6 6 0 0 1-12 0c0-2.2.8-4.1 2.3-5.9.3 1.6 1 2.7 2.2 3.4C10 7.6 10.6 5.1 12 3Z" />
  ),
  infinity: (
    <path d="M6.5 8.5c-3.6 0-3.6 7 0 7 3.5 0 7.5-7 11-7 3.6 0 3.6 7 0 7-3.5 0-7.5-7-11-7Z" />
  ),
  // cocarde / ruban de prix
  rosette: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M9.2 13.8 7.5 21l4.5-2.4L16.5 21l-1.7-7.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  mountain: (
    <>
      <path d="M2.5 19 9 8l4 6.5 2.5-3.5 6 8Z" />
      <path d="M7.5 10.5 9 12l1.5-1.5" />
    </>
  ),
  medal: (
    <>
      <path d="M8 3v6l4 2 4-2V3" />
      <circle cx="12" cy="16" r="5" />
    </>
  ),
  // nageur (tête + bras + vague)
  swim: (
    <>
      <circle cx="16.5" cy="7.5" r="2.1" />
      <path d="M3.5 12.5 10 9l4.5 3.5" />
      <path d="M3 17.5c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" />
    </>
  ),
  wave: (
    <>
      <path d="M3 10c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0" />
      <path d="M3 16c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0" />
    </>
  ),
  bike: (
    <>
      <circle cx="6" cy="16.5" r="3.5" />
      <circle cx="18" cy="16.5" r="3.5" />
      <path d="M6 16.5 9.8 9h4.7M18 16.5 14.5 9M9.8 9l3.2 7.5" />
      <path d="M13 6.5h3" />
    </>
  ),
  // chaussure de course
  shoe: (
    <>
      <path d="M2.5 17.5h19V15c-2.8 0-5.2-.9-7.2-2.9l-2.3-2.3-2.2 1.8c-.9.7-2.2.6-3-.2l-.8-.8-3.5 3.9Z" />
      <path d="M8 17.5v-2M12 17.5v-2" />
    </>
  ),
  trident: (
    <>
      <path d="M12 21V4" />
      <path d="M9.8 6.2 12 3.8l2.2 2.4" />
      <path d="M7 5.5v2.7a5 5 0 0 0 10 0V5.5" />
    </>
  ),
  repeat: (
    <>
      <path d="M4 10a6 6 0 0 1 6-6h7" />
      <path d="M14.5 1.5 17 4l-2.5 2.5" />
      <path d="M20 14a6 6 0 0 1-6 6H7" />
      <path d="M9.5 22.5 7 20l2.5-2.5" />
    </>
  ),
  bolt: <path d="M13 2 5 13.5h5L11 22l8-11.5h-5Z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  // gemme taillée
  diamond: (
    <>
      <path d="M7 3.5h10l4 5L12 20.5 3 8.5Z" />
      <path d="M3 8.5h18M12 20.5 8.5 8.5 12 3.5l3.5 5Z" />
    </>
  ),
  crown: (
    <>
      <path d="M4.5 18.5h15" />
      <path d="M4.5 18.5 3 7.5l5.2 3.7L12 5l3.8 6.2L21 7.5l-1.5 11" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.5C10.5 5.2 8.2 4.5 5 4.5v13.5c3.2 0 5.5.7 7 2 1.5-1.3 3.8-2 7-2V4.5c-3.2 0-5.5.7-7 2Z" />
      <path d="M12 6.5V20" />
    </>
  ),
  // couverts (fourchette + couteau)
  plate: (
    <>
      <path d="M7 3v5a2 2 0 0 0 4 0V3" />
      <path d="M9 3v18" />
      <path d="M17 3c-1.6 1.6-2.2 4-2.2 6.5 0 1.4.9 2.5 2.2 2.5v9" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4.5c4-2 7 2 14 0v9c-7 2-10-2-14 0" />
    </>
  ),
  flask: (
    <>
      <path d="M9.5 3v6L4.6 18.4A1.8 1.8 0 0 0 6.3 21h11.4a1.8 1.8 0 0 0 1.7-2.6L14.5 9V3" />
      <path d="M8 3h8M7.3 14.5h9.4" />
    </>
  ),
  // toque de diplômé
  grad: (
    <>
      <path d="M2.5 9.5 12 5l9.5 4.5L12 14Z" />
      <path d="M6.5 11.8V16c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3v-4.2" />
      <path d="M21.5 9.5v5" />
    </>
  ),
  star: (
    <path d="M12 3.5l2.5 5.2 5.8.8-4.2 4 1 5.7L12 16.5l-5.1 2.7 1-5.7-4.2-4 5.8-.8Z" />
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.4 9.4a2.6 2.6 0 1 1 3.7 2.4c-.8.4-1.1 1-1.1 1.7" />
      <circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
}
