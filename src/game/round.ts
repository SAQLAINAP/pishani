import type { Verdict } from './tilt'

export interface Answer {
  word: string
  verdict: Verdict
}

export interface RoundState {
  queue: string[]
  index: number
  answers: Answer[]
}

export function startRound(queue: string[]): RoundState {
  return { queue, index: 0, answers: [] }
}

export function currentWord(s: RoundState): string | undefined {
  return s.queue[s.index]
}

export function answer(s: RoundState, verdict: Verdict): RoundState {
  const word = currentWord(s)
  if (word === undefined) return s
  return { ...s, index: s.index + 1, answers: [...s.answers, { word, verdict }] }
}

export function score(answers: readonly Answer[]): number {
  return answers.filter((a) => a.verdict === 'correct').length
}
