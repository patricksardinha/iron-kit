// Résolution libellé de séance → code de sessions.json (brief §4).
// Le plan porte des libellés courts (« Nat technique 40'… », « Vélo côtes : 5×4'… ») ;
// la bibliothèque `sessions.json` fournit la *méthode* (échauffement → corps → cues → prog).
import type { Session, SessionDisc, SessionInfo, SessionLibrary } from '../types'

export const REST_CODE = 'repos'

/**
 * Classe une séance (discipline + détail) vers un code de `sessions.json`.
 * Règles par mot-clé dans l'ordre du brief ; cas spéciaux (course, activation,
 * brick, gainage) testés avant le routage par discipline.
 */
export function classifySession(disc: SessionDisc, detail: string): string {
  const t = detail.toLowerCase()

  if (disc === 'race' || />>>|ironman|70[.,]3/.test(t)) return 'race'
  if (/activation/.test(t)) return 'activation_race'
  if (/brick/.test(t)) return 'brick'
  if (/gainage|renfo/.test(t)) return 'gainage'

  switch (disc) {
    case 'swim':
      if (/eau libre|\bel\b/.test(t)) return 'nat_el'
      if (/seuil/.test(t)) return 'nat_seuil'
      if (/continu/.test(t)) return 'nat_cont'
      if (/technique|éducatif|educatif/.test(t)) return 'nat_tech'
      if (/facile|déliage|deliage|récup|recup/.test(t)) return 'nat_recup'
      return 'nat_endur'
    case 'bike':
      if (/côtes|cotes|bosse|\bcols?\b/.test(t)) return 'velo_cotes'
      if (/sweet spot|\bss\b/.test(t)) return 'velo_ss'
      if (/long|montagne|vallonné|vallonne|dénivelé|denivele/.test(t)) return 'velo_long'
      if (/facile|récup|recup/.test(t)) return 'velo_recup'
      return 'velo_z2'
    case 'run':
      if (/allure im/.test(t)) return 'cap_im'
      if (/qualité|qualite|seuil|\d+\s*[×x]\s*\d+/.test(t)) return 'cap_qual'
      if (/longue/.test(t)) return 'cap_long'
      if (/ligne|accél|accel|\bvifs?\b|sprint/.test(t)) return 'cap_activation'
      return 'cap_recup'
    case 'strength':
      return 'gainage'
    default:
      return REST_CODE
  }
}

/** SessionInfo résolue : override édité du plan en priorité, sinon catalogue. */
export function resolveSession(session: Session, lib: SessionLibrary): SessionInfo | undefined {
  return session.info ?? lib[classifySession(session.disc, session.detail)]
}

/** SessionInfo de départ pour l'édition (override existant, catalogue, ou canevas vierge). */
export function scaffoldInfo(session: Session, lib: SessionLibrary): SessionInfo {
  const resolved = resolveSession(session, lib)
  if (resolved) return resolved
  const disc =
    session.disc === 'swim' || session.disc === 'bike' || session.disc === 'run' || session.disc === 'race'
      ? session.disc
      : 'rest'
  return { name: session.detail || 'Séance', disc, goal: '', blocks: [], cues: [], prog: '' }
}

/** SessionInfo « repos / mobilité » (jours vides). */
export function restInfo(lib: SessionLibrary): SessionInfo | undefined {
  return lib[REST_CODE]
}
