import { describe, expect, it } from 'vitest'
import { ART_IDS } from '../ui/DeckArt'
import { DECKS, MIX, QUIZ_ONLY } from './index'
import { QUIZ_DECK_IDS, quizFor } from './quiz'

describe('decks', () => {
  it('has 16 decks with unique ids', () => {
    expect(DECKS).toHaveLength(16)
    expect(new Set([...DECKS.map((d) => d.id), MIX.id]).size).toBe(17)
  })

  it('every deck (and MIX) has a pictogram', () => {
    for (const d of [...DECKS, MIX, ...QUIZ_ONLY]) expect(ART_IDS).toContain(d.id)
  })

  it.each(QUIZ_DECK_IDS.map((id) => [id]))('quiz "%s" is big and well-formed', (id) => {
    const qs = quizFor(id)
    expect(qs.length).toBeGreaterThanOrEqual(60)
    expect(new Set(qs.map((q) => q.q)).size).toBe(qs.length)
    for (const q of qs) {
      const opts = [q.a, ...q.wrong]
      // One right answer, three distinct wrong ones, none repeating it.
      expect(new Set(opts.map((o) => o.trim().toLowerCase())).size).toBe(4)
      expect(q.q.length).toBeLessThanOrEqual(150)
      for (const o of opts) expect(o.length).toBeLessThanOrEqual(44)
      // Must work in reveal-only style, where no options are shown.
      expect(q.q).not.toMatch(/which of (these|the following)|all of the above|none of the above/i)
    }
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
