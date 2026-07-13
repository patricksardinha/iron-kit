// Gestion multi-plans (Réglages) : liste, activation, renommage, import, suppression.
import { useRef, useState } from 'react'
import type { PlanFile, PlanMeta } from '../types'
import type { PlansApi } from '../hooks/usePlans'
import { Icon } from './Icon'
import { ConfirmDialog } from './ConfirmDialog'

const TEMPLATE_URL = `${import.meta.env.BASE_URL}plan-template.json`

export function PlansManager({ plans }: { plans: PlansApi }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<PlanMeta | null>(null)

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2400)
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as PlanFile
        const res = plans.importPlan(parsed)
        flash(res.ok ? `Plan « ${parsed.name || 'importé'} » ajouté` : (res.error ?? 'Import impossible'))
      } catch {
        flash('Fichier JSON invalide')
      }
    }
    reader.onerror = () => flash('Lecture impossible')
    reader.readAsText(file)
  }

  return (
    <>
      <div className="section-h">Plans</div>
      <p className="tool-hint" style={{ marginTop: 0 }}>
        Chaque plan garde ses propres validations, notes et modifications. Importe-en plusieurs et
        bascule quand tu veux.
      </p>

      <div className="plan-list">
        {plans.plans.map((p) => {
          const isActive = p.id === plans.activeId
          return (
            <div className={`plan-item${isActive ? ' active' : ''}`} key={p.id}>
              <button
                type="button"
                className="plan-pick"
                onClick={() => plans.select(p.id)}
                aria-pressed={isActive}
                aria-label={`Activer le plan ${p.name}`}
              >
                <span className={`radio${isActive ? ' on' : ''}`}>
                  {isActive && <Icon name="check" size={12} />}
                </span>
              </button>

              {p.builtin ? (
                <span className="plan-name-static">{p.name}</span>
              ) : (
                <input
                  className="plan-name-input"
                  value={p.name}
                  onChange={(e) => plans.renamePlan(p.id, e.target.value)}
                  aria-label="Nom du plan"
                />
              )}

              {isActive && <span className="plan-active-tag">Actif</span>}

              {!p.builtin && (
                <button
                  type="button"
                  className="plan-del"
                  onClick={() => setToDelete(p)}
                  aria-label={`Supprimer le plan ${p.name}`}
                >
                  <Icon name="trash" size={15} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="tool-btns" style={{ marginTop: 12 }}>
        <button className="tool-btn accent" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={17} /> Importer un plan
        </button>
        <a className="tool-btn" href={TEMPLATE_URL} download="plan-template.json">
          <Icon name="download" size={17} /> Modèle de plan
        </a>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} hidden />
      </div>
      <p className="tool-hint">
        Le modèle est un fichier JSON à remplir (semaines + séances détaillées). Partage-le pour que
        d'autres créent puis importent leur propre plan.
      </p>

      <ConfirmDialog
        open={toDelete !== null}
        danger
        title={toDelete ? `Supprimer « ${toDelete.name} » ?` : ''}
        message="Le plan et toutes ses validations/notes seront définitivement supprimés. Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (toDelete) plans.deletePlan(toDelete.id)
          setToDelete(null)
          flash('Plan supprimé')
        }}
        onCancel={() => setToDelete(null)}
      />

      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
