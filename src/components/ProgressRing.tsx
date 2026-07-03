interface Props {
  pct: number
  validated: number
  total: number
}

// Anneau signature : dégradé swim → bike → run (§8).
export function ProgressRing({ pct, validated, total }: Props) {
  const size = 210
  const stroke = 18
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * c

  return (
    <div className="ring-wrap">
      <div className="ring">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--accent-2)" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--surface2)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div className="ring-center">
          <div>
            <div className="pct">{pct}%</div>
            <div className="sub">
              {validated} / {total} jours
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
