import { describe, expect, it } from 'vitest'
import { ART_IDS } from '../ui/DeckArt'
import { DECKS, MIX } from './index'

describe('decks', () => {
  it('has 16 decks with unique ids', () => {
    expect(DECKS).toHaveLength(16)
    expect(new Set([...DECKS.map((d) => d.id), MIX.id]).size).toBe(17)
  })

  it('every deck (and MIX) has a pictogram', () => {
    for (const d of [...DECKS, MIX]) expect(ART_IDS).toContain(d.id)
  })

  it.each(DECKS.map((d) => [d.id, d] as const))('%s is big, clean and duplicate-free', (_, d) => {
    expect(d.words.length).toBeGreaterThanOrEqual(60)
    const lower = d.words.map((w) => w.trim().toLowerCase())
    expect(new Set(lower).size).toBe(lower.length)
    for (const w of d.words) {
      expect(w).toBe(w.trim())
      expect(w.length).toBeGreaterThan(0)
      expect(w.length).toBeLessThanOrEqual(36)
    }
  })
})
