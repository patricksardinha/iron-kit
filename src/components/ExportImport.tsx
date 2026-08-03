import { useRef, useState } from 'react'
import type { State } from '../types'
import { fullBackup, isFullBackup, parseImported, restoreFullBackup } from '../lib/storage'
import { Icon } from './Icon'

interface Props {
  state: State
  onImport: (next: State) => void
}

// Export / import JSON (backup, changement d'appareil).
// L'export couvre TOUT : tous les plans (avec leurs validations, notes, agencements),
// les réglages, le frigo et les badges déjà vus. L'import d'une sauvegarde complète
// remplace les données de l'appareil puis recharge l'app ; les anciens fichiers
// (état seul) restent importés dans le plan actif, comme avant.
export function ExportImport({ onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [toast, setToast] = useState<string | null>(null)

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2200)
  }

  function doExport() {
    const blob = new Blob([JSON.stringify(fullBackup(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ironkit-backup.json'
    a.click()
    URL.revokeObjectURL(url)
    flash('Sauvegarde complète exportée')
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permet de réimporter le même fichier
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result))
        if (isFullBackup(parsed)) {
          restoreFullBackup(parsed)
          flash('Sauvegarde restaurée — rechargement…')
          window.setTimeout(() => window.location.reload(), 900)
          return
        }
        // Ancien format : état seul → importé dans le plan actif.
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
        Données stockées uniquement sur cet appareil. L'export contient <b>tout</b> : plans,
        validations, notes, tests, réglages, thème et frigo — c'est le fichier à garder avant de
        réinstaller ou pour changer de téléphone.
      </p>
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
