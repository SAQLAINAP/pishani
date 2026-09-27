import type { Verdict } from './tilt'

/**
 * Classify a finished drag. Swipe DOWN = correct (the same direction as the
 * tilt-mode nod), swipe UP = pass. Mostly-horizontal drags are ignored so a
 * sloppy thumb doesn't burn a card.
 */
export const MIN_TRAVEL = 60 // px
export const FLICK_SPEED = 0.5 // px/ms — a short fast flick counts too
const MIN_FLICK_TRAVEL = 24

export function classifySwipe(dx: number, dy: number, ms: number): Verdict | null {
  const ady = Math.abs(dy)
  if (ady < Math.abs(dx) * 1.2) return null
  const speed = ady / Math.max(ms, 1)
  const counts = ady >= MIN_TRAVEL || (ady >= MIN_FLICK_TRAVEL && speed >= FLICK_SPEED)
  if (!counts) return null
  return dy > 0 ? 'correct' : 'pass'
}
