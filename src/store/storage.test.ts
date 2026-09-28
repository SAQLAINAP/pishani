import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, HISTORY_LIMIT, STORAGE_NAME, createStore, parse } from './storage'

function memory() {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }
}

describe('storage', () => {
  it('falls back to defaults on garbage or a foreign version', () => {
    expect(parse('{not json').settings).toEqual(DEFAULT_SETTINGS)
    expect(parse('{"v":7}').settings).toEqual(DEFAULT_SETTINGS)
    expect(parse('{"v":0,"settings":{"seconds":999,"mode":"x","theme":"neon"}}').settings).toEqual(
      DEFAULT_SETTINGS,
    )
    // A v0.1.0 save has no theme field at all — it should pick up the default.
    expect(parse('{"v":0,"settings":{"mode":"swipe"}}').settings.theme).toBe('system')
    // …and the quiz settings that arrived in v0.3.
    const old = parse('{"v":0,"settings":{"mode":"quiz","quizSeconds":7,"quizStyle":"essay"}}').settings
    expect(old.mode).toBe('quiz')
    expect(old.quizSeconds).toBe(15)
    expect(old.quizStyle).toBe('mcq')
    expect(old.quizCount).toBe(10)
  })

  it('survives a restart', () => {
    const backing = memory()
    const a = createStore(backing)
    a.updateSettings({ mode: 'swipe', seconds: 90 })
    const b = createStore(backing)
    expect(b.get().settings.mode).toBe('swipe')
    expect(b.get().settings.seconds).toBe(90)
    expect(backing.m.has(STORAGE_NAME)).toBe(true)
  })

  it('tracks best score, history and seen words', () => {
    const s = createStore(memory())
    const rec = { deckId: 'cities', mode: 'tilt' as const, seconds: 60, shown: 3, at: 1 }
    const shown = [
      { word: 'Pune', verdict: 'correct' as const },
      { word: 'Oslo', verdict: 'pass' as const },
    ]
    expect(s.recordRound({ ...rec, score: 5 }, shown)).toBe(true)
    expect(s.recordRound({ ...rec, score: 3 }, shown)).toBe(false)
    expect(s.get().best.cities).toBe(5)
    expect(s.get().seen.cities).toEqual(['Pune', 'Oslo'])
    for (let i = 0; i < 30; i++) s.recordRound({ ...rec, score: 0 }, [])
    expect(s.get().history).toHaveLength(HISTORY_LIMIT)
  })

  it('keeps working when storage throws (private mode)', () => {
    const s = createStore({
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('quota')
      },
    })
    s.updateSettings({ sound: false })
    expect(s.get().settings.sound).toBe(false)
  })
})
