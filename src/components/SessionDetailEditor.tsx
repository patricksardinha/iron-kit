// Éditeur du détail d'une séance (override par plan) : nom, objectif, blocs,
// points clés, progression. Contrôlé : chaque modification remonte via onChange.
import type { SessionInfo, SessionBlock } from '../types'
import { Icon } from './Icon'

interface Props {
  info: SessionInfo
  overridden: boolean // true si un override existe déjà (permet "réinitialiser")
  onChange: (info: SessionInfo) => void
  onReset: () => void
}

export function SessionDetailEditor({ info, overridden, onChange, onReset }: Props) {
  const set = (patch: Partial<SessionInfo>) => onChange({ ...info, ...patch })

  const setBlocks = (blocks: SessionBlock[]) => set({ blocks })
  const setBlock = (bi: number, patch: Partial<SessionBlock>) =>
    setBlocks(info.blocks.map((b, i) => (i === bi ? { ...b, ...patch } : b)))
  const setItem = (bi: number, ii: number, val: string) =>
    setBlock(bi, { items: info.blocks[bi]!.items.map((it, i) => (i === ii ? val : it)) })

  const cues = info.cues ?? []
  const setCues = (next: string[]) => set({ cues: next })

  return (
    <div className="sd-editor">
      <label className="sde-field">
        <span>Nom</span>
        <input value={info.name} onChange={(e) => set({ name: e.target.value })} placeholder="Nom de la séance" />
      </label>

      <label className="sde-field">
        <span>Objectif</span>
        <textarea rows={2} value={info.goal} onChange={(e) => set({ goal: e.target.value })} placeholder="But de la séance…" />
      </label>

      <div className="sde-section">
        <span className="sde-lbl">Blocs</span>
        {info.blocks.map((b, bi) => (
          <div className="sde-block" key={bi}>
            <div className="sde-block-head">
              <input
                className="sde-block-title"
                value={b.h}
                onChange={(e) => setBlock(bi, { h: e.target.value })}
                placeholder="Titre du bloc (ex. Échauffement)"
              />
              <button
                type="button"
                className="sde-del"
                onClick={() => setBlocks(info.blocks.filter((_, i) => i !== bi))}
                aria-label="Supprimer le bloc"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
            {b.items.map((it, ii) => (
              <div className="sde-item" key={ii}>
                <input value={it} onChange={(e) => setItem(bi, ii, e.target.value)} placeholder="Consigne…" />
                <button
                  type="button"
                  className="sde-del"
                  onClick={() => setBlock(bi, { items: b.items.filter((_, i) => i !== ii) })}
                  aria-label="Supprimer la consigne"
                >
                  <Icon name="close" size={13} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="sde-add"
              onClick={() => setBlock(bi, { items: [...b.items, ''] })}
            >
              <Icon name="plus" size={13} /> Consigne
            </button>
          </div>
        ))}
        <button
          type="button"
          className="sde-add block"
          onClick={() => setBlocks([...info.blocks, { h: '', items: [''] }])}
        >
          <Icon name="plus" size={14} /> Ajouter un bloc
        </button>
      </div>

      <div className="sde-section">
        <span className="sde-lbl">Points clés</span>
        {cues.map((c, ci) => (
          <div className="sde-item" key={ci}>
            <input
              value={c}
              onChange={(e) => setCues(cues.map((x, i) => (i === ci ? e.target.value : x)))}
              placeholder="Point clé…"
            />
            <button
              type="button"
              className="sde-del"
              onClick={() => setCues(cues.filter((_, i) => i !== ci))}
              aria-label="Supprimer le point clé"
            >
              <Icon name="close" size={13} />
            </button>
          </div>
        ))}
        <button type="button" className="sde-add" onClick={() => setCues([...cues, ''])}>
          <Icon name="plus" size={13} /> Point clé
        </button>
      </div>

      <label className="sde-field">
        <span>Progression</span>
        <textarea
          rows={2}
          value={info.prog ?? ''}
          onChange={(e) => set({ prog: e.target.value })}
          placeholder="Logique de progression (optionnel)…"
        />
      </label>

      {overridden && (
        <button type="button" className="tool-btn danger sde-reset" onClick={onReset}>
          <Icon name="reset" size={15} /> Réinitialiser au détail d'origine
        </button>
      )}
    </div>
  )
}
