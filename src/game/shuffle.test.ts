import { describe, expect, it } from 'vitest'
import { buildQueue, shuffle } from './shuffle'

const words = Array.from({ length: 20 }, (_, i) => `w${i}`)

describe('shuffle bag', () => {
  it('shuffle is a permutation', () => {
    expect(shuffle(words).sort()).toEqual([...words].sort())
  })

  it('puts unseen words before seen ones', () => {
    const seen = words.slice(0, 15)
    const { queue } = buildQueue(words, seen)
    expect(new Set(queue.slice(0, 5))).toEqual(new Set(words.slice(15)))
    expect(queue).toHaveLength(20)
  })

  it('never repeats until the whole deck has come up', () => {
    let seen: string[] = []
    const shown: string[] = []
    for (let round = 0; round < 4; round++) {
      const q = buildQueue(words, seen)
      const played = q.queue.slice(0, 5)
      shown.push(...played)
      seen = [...q.seen, ...played]
    }
    expect(new Set(shown).size).toBe(20)
  })

  it('resets once everything is seen, and drops stale words', () => {
    expect(buildQueue(words, words).seen).toEqual([])
    expect(buildQueue(words, ['gone', 'w1']).seen).toEqual(['w1'])
  })
})
