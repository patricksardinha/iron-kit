import { useRef, useState } from 'react'
import type { State } from '../types'
import { parseImported } from '../lib/storage'
import { Icon } from './Icon'

interface Props {
  state: State
  onImport: (next: State) => void
}

// Export / import JSON de l'état (backup, changement d'appareil) — §6.
export function ExportImport({ state, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [toast, setToast] = useState<string | null>(null)

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2200)
  }

  function doExport() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'objectif-evian-backup.json'
    a.click()
    URL.revokeObjectURL(url)
    flash('Sauvegarde exportée')
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permet de réimporter le même fichier
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const next = parseImported(String(reader.result))
        onImport(next)
        flash('Sauvegarde importée')
      } catch {
        flash('Fichier invalide')
      }
    }
    reader.onerror = () => flash('Lecture impossible')
    reader.readAsText(file)
  }

  return (
    <>
      <div className="section-h">Sauvegarde</div>
      <div className="tool-btns">
        <button className="tool-btn" onClick={doExport}>
          <Icon name="download" size={17} /> Exporter
        </button>
        <button className="tool-btn" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={17} /> Importer
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          hidden
        />
      </div>
      <p className="tool-hint">
        Données stockées uniquement sur cet appareil. Exporte un fichier pour sauvegarder ou
        changer de téléphone.
      </p>
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
