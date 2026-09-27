/**
 * Shuffle bag: every word in a deck comes up once before any word repeats,
 * across rounds (the "seen" list is persisted per deck).
 */
export type Rng = () => number

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Unseen words first (shuffled), then already-seen ones (shuffled) as a
 * fallback so a long round never runs dry. If the whole deck has been seen,
 * the bag resets. Returns the queue and the `seen` list to persist.
 */
export function buildQueue(
  words: readonly string[],
  seen: readonly string[],
  rng: Rng = Math.random,
): { queue: string[]; seen: string[] } {
  const all = new Set(words)
  // Drop stale entries (a word removed from the deck in a later version).
  let seenLive = seen.filter((w) => all.has(w))
  if (seenLive.length >= all.size) seenLive = []
  const seenSet = new Set(seenLive)
  const unseen = [...all].filter((w) => !seenSet.has(w))
  return { queue: [...shuffle(unseen, rng), ...shuffle(seenLive, rng)], seen: seenLive }
}
