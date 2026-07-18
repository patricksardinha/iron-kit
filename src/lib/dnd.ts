// Utilitaires drag & drop partagés (éditeur de plan + vue Semaine).
import { closestCorners, pointerWithin } from '@dnd-kit/core'
import type { CollisionDetection } from '@dnd-kit/core'

/**
 * Détection de collision qui suit le POINTEUR (le doigt) et non le rectangle de
 * l'élément traîné. Corrige le décalage au dépôt quand l'overlay est recentré sous
 * le doigt (snapCenterToCursor). Repli sur closestCorners hors de tout conteneur.
 */
export const followPointer: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  return hits.length > 0 ? hits : closestCorners(args)
}

// Identifiants d'items / conteneurs pour le drag & drop d'une séance dans une grille de jours.
export const sessId = (di: number, si: number) => `s:${di}:${si}`
export const dayDropId = (di: number) => `day:${di}`

export function parseSessId(id: string): [number, number] {
  const p = id.split(':')
  return [Number(p[1]), Number(p[2])]
}
