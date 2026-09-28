import { useEffect } from 'react'
import type { RoundSpec } from '../App'
import type { PlayableDeck } from '../data'
import { hasQuiz } from '../data/quiz'
import { useBack } from '../lib/back'
import { canTilt, requestMotion } from '../lib/platform'
import { DURATIONS, QUIZ_COUNTS, QUIZ_SECONDS, store, type Mode } from '../store/storage'
import { useSave } from '../store/useStore'
import { CloseIcon } from '../ui/Icons'

export function SetupSheet({
  deck,
  label,
  onClose,
  onStart,
}: {
  deck: PlayableDeck
  label: string
  onClose: () => void
  onStart: (s: RoundSpec) => void
}) {
  const { settings, best } = useSave()
  useBack(onClose)

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [onClose])

  const wordsOK = !deck.quizOnly
  const quizOK = hasQuiz(deck.id)
  // GK is quiz-only; Actions has no quiz. Fall back without overwriting the
  // saved preference, so the next deck opens in the mode you last chose.
  const fallback: Mode = canTilt ? 'tilt' : 'swipe'
  let mode: Mode = !wordsOK ? 'quiz' : !quizOK && settings.mode === 'quiz' ? fallback : settings.mode
  if (mode === 'tilt' && !canTilt) mode = 'swipe'
  const isQuiz = mode === 'quiz'

  function setMode(m: Mode) {
    store.updateSettings({ mode: m })
  }

  function start() {
    // iOS only shows the motion prompt from inside a tap; ask here, but never
    // block the round on it — Round falls back to swipe if no sensor data.
    if (mode === 'tilt') void requestMotion()
    onStart(
      isQuiz
        ? {
            deckId: deck.id,
            mode,
            seconds: settings.quizSeconds,
            quizStyle: settings.quizStyle,
            count: settings.quizCount,
          }
        : { deckId: deck.id, mode, seconds: settings.seconds },
    )
  }

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <section className="sheet tone-paper" role="dialog" aria-modal="true" aria-label={`${deck.title} setup`}>
        <div className="sheet-head">
          <span className="mono" style={{ fontSize: 11, lineHeight: 1.6 }}>
            Deck {label} · {deck.tag}
            <br />
            {isQuiz ? 'Quizmaster mode' : `Best ${best[deck.id] ?? '—'}`}
          </span>
          <button className="slab icon-btn tone-paper" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <h2 className="sheet-title">{deck.title}</h2>
        <p>{deck.blurb}</p>

        {(wordsOK || quizOK) && (
          <div className="field">
            <span className="mono">02 — Mode</span>
            <div className="seg" role="group" aria-label="Mode">
              {wordsOK && canTilt && (
                <button aria-pressed={mode === 'tilt'} onClick={() => setMode('tilt')}>
                  Tilt
                  <small>On forehead</small>
                </button>
              )}
              {wordsOK && (
                <button aria-pressed={mode === 'swipe'} onClick={() => setMode('swipe')}>
                  {canTilt ? 'Swipe' : 'Classic'}
                  <small>{canTilt ? '↓ yes · ↑ pass' : 'Buttons or ↓ ↑ keys'}</small>
                </button>
              )}
              {quizOK && (
                <button aria-pressed={isQuiz} onClick={() => setMode('quiz')}>
                  Quiz
                  <small>Group GK</small>
                </button>
              )}
            </div>
          </div>
        )}

        {isQuiz ? (
          <>
            <div className="field">
              <span className="mono">03 — Answers</span>
              <div className="seg" role="group" aria-label="Answer style">
                <button
                  aria-pressed={settings.quizStyle === 'mcq'}
                  onClick={() => store.updateSettings({ quizStyle: 'mcq' })}
                >
                  A B C D
                  <small>4 options</small>
                </button>
                <button
                  aria-pressed={settings.quizStyle === 'reveal'}
                  onClick={() => store.updateSettings({ quizStyle: 'reveal' })}
                >
                  Reveal
                  <small>Answer at zero</small>
                </button>
              </div>
            </div>
            <div className="field">
              <span className="mono">04 — Per question</span>
              <div className="seg" role="group" aria-label="Seconds per question">
                {QUIZ_SECONDS.map((sec) => (
                  <button
                    key={sec}
                    aria-pressed={settings.quizSeconds === sec}
                    onClick={() => store.updateSettings({ quizSeconds: sec })}
                  >
                    {sec}
                    <small>sec</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="mono">05 — Questions</span>
              <div className="seg" role="group" aria-label="Questions per quiz">
                {QUIZ_COUNTS.map((n) => (
                  <button
                    key={n}
                    aria-pressed={settings.quizCount === n}
                    onClick={() => store.updateSettings({ quizCount: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="field">
            <span className="mono">03 — Time</span>
            <div className="seg" role="group" aria-label="Round length">
              {DURATIONS.map((sec) => (
                <button
                  key={sec}
                  aria-pressed={settings.seconds === sec}
                  onClick={() => store.updateSettings({ seconds: sec })}
                >
                  {sec}
                  <small>sec</small>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="cta-row" style={{ marginTop: 22 }}>
          <button className="slab cta tone-red" onClick={start}>
            {isQuiz ? 'Start quiz' : 'Start'} <span className="arrow">→</span>
          </button>
        </div>
      </section>
    </>
  )
}
