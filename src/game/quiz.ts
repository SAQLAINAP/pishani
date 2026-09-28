import type { QuizQuestion } from '../data/quiz/types'
import { buildQueue, shuffle, type Rng } from './shuffle'

/** A question ready to show: options shuffled, correct slot recorded. */
export interface QuizCard {
  q: string
  a: string
  art?: string
  options: string[]
  answerIndex: number
}

export function toCard(question: QuizQuestion, rng: Rng = Math.random): QuizCard {
  const options = shuffle([question.a, ...question.wrong], rng)
  return { q: question.q, a: question.a, art: question.art, options, answerIndex: options.indexOf(question.a) }
}

/**
 * Picks `count` questions with the same no-repeat shuffle bag the word decks
 * use (keyed by question text), and shuffles each question's options — so
 * the right answer lands in a different slot every time.
 */
export function buildQuiz(
  questions: readonly QuizQuestion[],
  seen: readonly string[],
  count: number,
  rng: Rng = Math.random,
): { cards: QuizCard[]; seen: string[] } {
  const byText = new Map(questions.map((q) => [q.q, q]))
  const bag = buildQueue([...byText.keys()], seen, rng)
  const picked = bag.queue.slice(0, Math.min(count, bag.queue.length))
  return {
    cards: picked.map((t) => toCard(byText.get(t)!, rng)),
    seen: [...bag.seen, ...picked],
  }
}

/** Letter label for an option slot. */
export const LETTERS = ['A', 'B', 'C', 'D'] as const
