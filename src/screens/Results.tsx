import type { RoundSpec } from '../App'
import { deckById } from '../data'
import { score, type Answer } from '../game/round'

export function Results({
  spec,
  answers,
  isBest,
  onAgain,
  onHome,
}: {
  spec: RoundSpec
  answers: Answer[]
  isBest: boolean
  onAgain: () => void
  onHome: () => void
}) {
  const deck = deckById(spec.deckId)!
  const got = score(answers)

  return (
    <div className="screen">
      <main className="results">
        <div className="section-label mono">
          Round over — {deck.title} · {deck.tag}
        </div>
        <header className="results-hero">
          <div className="big-score" aria-label={`${got} correct`}>
            {got}
          </div>
          <div className="mono">
            Correct
            <br />
            {answers.length - got} passed
            <br />
            {spec.seconds} sec · {spec.mode}
          </div>
          {isBest && got > 0 && <span className="stamp">New best</span>}
        </header>

        {answers.length === 0 ? (
          <p className="empty mono">No cards played. Nod, swipe or tap next time.</p>
        ) : (
          <ol className="word-list">
            {answers.map((a, i) => (
              <li key={`${i}-${a.word}`} className={a.verdict}>
                <span className="n">{a.verdict === 'correct' ? '✓' : '✕'} {String(i + 1).padStart(2, '0')}</span>
                <span>{a.word}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="cta-row two">
          <button className="slab cta tone-red" onClick={onAgain}>
            Play again <span className="arrow">↻</span>
          </button>
          <button className="slab cta tone-paper" onClick={onHome}>
            Decks <span className="arrow">←</span>
          </button>
        </div>
      </main>
    </div>
  )
}
