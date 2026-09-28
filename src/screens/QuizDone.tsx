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
  onAgain,
  onHome,
}: {
  title: string
  asked: QuizCard[]
  onAgain: () => void
  onHome: () => void
}) {
  useBack(onHome)
  return (
    <div className="screen">
      <main className="results">
        <div className="section-label mono">Quiz over — {title}</div>
        <header className="results-hero quiz-hero">
          <h1 className="quiz-done-title">
            That's the
            <br />
            quiz<span style={{ color: 'var(--red)' }}>.</span>
          </h1>
        </header>

        {asked.length === 0 ? (
          <p className="empty mono">No questions answered.</p>
        ) : (
          <ol className="answer-sheet">
            {asked.map((c, i) => (
              <li key={c.q}>
                <span className="n mono">Q{String(i + 1).padStart(2, '0')}</span>
                <span className="sheet-q">
                  {c.art && (
                    <span className="sheet-logo">
                      <LogoArt id={c.art} />
                    </span>
                  )}
                  {c.q}
                </span>
                <span className="sheet-a">{c.a}</span>
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
