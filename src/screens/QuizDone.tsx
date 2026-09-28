import type { QuizCard } from '../game/quiz'
import { useBack } from '../lib/back'
import { LogoArt } from '../ui/LogoArt'

/**
 * End of a quiz. The app doesn't keep score — the group does — so this is
 * the answer sheet: every question with its answer, for settling arguments.
 */
export function QuizDone({
  title,
  asked,
  picks,
  onAgain,
  onHome,
}: {
  title: string
  asked: QuizCard[]
  /** Solo only: chosen option per question (null = ran out of time). */
  picks?: (number | null)[]
  onAgain: () => void
  onHome: () => void
}) {
  useBack(onHome)
  const solo = picks !== undefined
  const score = solo ? asked.filter((c, i) => picks[i] === c.answerIndex).length : 0
  const verdict =
    score === asked.length && asked.length > 0
      ? 'Crorepati.'
      : score >= asked.length * 0.7
        ? 'Sharp.'
        : score >= asked.length * 0.4
          ? 'Not bad.'
          : 'Tough one.'
  return (
    <div className="screen">
      <main className="results">
        <div className="section-label mono">Quiz over — {title}</div>
        {solo ? (
          <header className="results-hero">
            <div className="big-score" aria-label={`${score} of ${asked.length} correct`}>
              {score}
            </div>
            <div className="mono">
              of {asked.length} correct
              <br />
              {verdict}
            </div>
            {score === asked.length && asked.length > 0 && <span className="stamp">Full marks</span>}
          </header>
        ) : (
          <header className="results-hero quiz-hero">
            <h1 className="quiz-done-title">
              That's the
              <br />
              quiz<span style={{ color: 'var(--red)' }}>.</span>
            </h1>
          </header>
        )}

        {asked.length === 0 ? (
          <p className="empty mono">No questions answered.</p>
        ) : (
          <ol className="answer-sheet">
            {asked.map((c, i) => (
              <li key={c.q} className={solo ? (picks[i] === c.answerIndex ? 'got' : 'missed') : undefined}>
                <span className="n mono">
                  {solo ? (picks[i] === c.answerIndex ? '✓ ' : '✕ ') : ''}Q{String(i + 1).padStart(2, '0')}
                </span>
                <span className="sheet-q">
                  {c.art && (
                    <span className="sheet-logo">
                      <LogoArt id={c.art} />
                    </span>
                  )}
                  {c.q}
                </span>
                <span className="sheet-a">
                  {c.a}
                  {solo && picks[i] !== c.answerIndex && (
                    <span className="sheet-you mono">
                      {picks[i] == null ? ' · no answer' : ` · you: ${c.options[picks[i]!]}`}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        )}

        <div className="cta-row two">
          <button className="slab cta tone-red" onClick={onAgain}>
            Next quiz <span className="arrow">↻</span>
          </button>
          <button className="slab cta tone-paper" onClick={onHome}>
            Decks <span className="arrow">←</span>
          </button>
        </div>
      </main>
    </div>
  )
}
