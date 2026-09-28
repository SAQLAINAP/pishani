import { describe, expect, it } from 'vitest'
import type { QuizQuestion } from '../data/quiz/types'
import { buildQuiz, toCard } from './quiz'

const qs: QuizQuestion[] = Array.from({ length: 30 }, (_, i) => ({
  q: `Question ${i}?`,
  a: `Right ${i}`,
  wrong: [`Wrong ${i}a`, `Wrong ${i}b`, `Wrong ${i}c`],
}))

describe('quiz', () => {
  it('a card keeps all four options and points at the right one', () => {
    const c = toCard(qs[0])
    expect(c.options).toHaveLength(4)
    expect(new Set(c.options)).toEqual(new Set(['Right 0', 'Wrong 0a', 'Wrong 0b', 'Wrong 0c']))
    expect(c.options[c.answerIndex]).toBe('Right 0')
  })

  it('the correct answer is not stuck in one slot', () => {
    const slots = new Set(Array.from({ length: 200 }, () => toCard(qs[0]).answerIndex))
    expect(slots.size).toBe(4)
  })

  it('takes `count` questions and never repeats until the bag is empty', () => {
    let seen: string[] = []
    const asked: string[] = []
    for (let game = 0; game < 3; game++) {
      const g = buildQuiz(qs, seen, 10)
      expect(g.cards).toHaveLength(10)
      asked.push(...g.cards.map((c) => c.q))
      seen = g.seen
    }
    expect(new Set(asked).size).toBe(30)
  })

  it('a short category yields what it has', () => {
    expect(buildQuiz(qs.slice(0, 4), [], 10).cards).toHaveLength(4)
  })
})
