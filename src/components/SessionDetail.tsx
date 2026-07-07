// Rendu de la séquence détaillée d'une séance (résolue via sessions.json) :
// objectif → blocs (échauffement/corps/…) → points clés → progression.
import type { SessionInfo } from '../types'

export function SessionDetail({ info }: { info: SessionInfo }) {
  return (
    <div className="sess-detail">
      <div className="sd-name">{info.name}</div>
      {info.goal && <p className="sd-goal">{info.goal}</p>}

      {info.blocks.map((b, i) => (
        <div className="sd-block" key={i}>
          <div className="sd-h">{b.h}</div>
          <ul className="sd-items">
            {b.items.map((it, j) => (
              <li key={j}>{it}</li>
            ))}
          </ul>
        </div>
      ))}

      {info.cues && info.cues.length > 0 && (
        <div className="sd-block sd-cues">
          <div className="sd-h">Points clés</div>
          <ul className="sd-items">
            {info.cues.map((c, j) => (
              <li key={j}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {info.prog && (
        <div className="sd-prog">
          <span className="sd-prog-label">Progression</span> {info.prog}
        </div>
      )}
    </div>
  )
}
