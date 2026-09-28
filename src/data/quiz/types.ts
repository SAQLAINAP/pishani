/**
 * A quiz question. The right answer and the three wrong options are stored
 * separately and shuffled at play time, so the correct option never sits in
 * a predictable slot. Every question must also work with no options shown
 * ("reveal only" style), so no "Which of these…" phrasing.
 */
export interface QuizQuestion {
  q: string
  a: string
  wrong: [string, string, string]
  /** Optional picture clue — an id from ui/LogoArt (simplified, drawn in-app). */
  art?: string
}
