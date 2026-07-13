// Modale de confirmation stylisée (remplace window.confirm).
import { useEffect } from 'react'
import { Icon } from './Icon'

interface Props {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  // Fermeture au clavier (Échap) + verrou du scroll de fond.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onCancel} role="presentation">
      <div
        className="modal-card"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`modal-icon${danger ? ' danger' : ''}`}>
          <Icon name={danger ? 'trash' : 'check'} size={22} />
        </div>
        <div className="modal-title">{title}</div>
        {message && <div className="modal-message">{message}</div>}
        <div className="modal-actions">
          <button type="button" className="tool-btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`tool-btn${danger ? ' danger' : ' accent'}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
