import { useCallback, useEffect, useRef, useState } from 'react'
import { LETTERS, type QuizCard } from '../game/quiz'
import { useBack } from '../lib/back'
import { buzz } from '../lib/haptics'
import { unlockOrientation } from '../lib/platform'
import { sfx } from '../lib/sound'
import { holdScreenOn, releaseScreen } from '../lib/wakelock'
import { store, type QuizStyle } from '../store/storage'
import { FitText } from '../ui/FitText'
import { CloseIcon } from '../ui/Icons'
import { LogoArt } from '../ui/LogoArt'

type Phase = 'intro' | 'ask' | 'reveal'

/** How long the answer stays up before the next question starts by itself. */
const REVEAL_MS = 5000
const INTRO_MS = 3000
/** The buzzer gets a beat of silence before the answer chime. */
const CHIME_DELAY_MS = 380

/**
 * Autonomous quizmaster. The phone sits in the middle of the group; each
 * question runs its own clock, the buzzer goes at zero, the answer is
 * revealed, and the next question starts on its own. Nobody has to touch it
 * — Pause (or Android back) is there for arguments.
 *
 * One clock drives every phase: `endAt` is an absolute time, and pausing just
 * banks the remaining milliseconds. The draining bar is written straight to
 * the DOM each frame so React only re-renders once a second.
 */
export function Quiz({
  title,
  cards,
  style,
  seconds,
  onQuit,
  onDone,
}: {
  title: string
  cards: QuizCard[]
  style: QuizStyle
  seconds: number
  onQuit: () => void
  onDone: (asked: QuizCard[]) => void
}) {
  const settings = store.get().settings
  const [phase, setPhase] = useState<Phase>('intro')
  const [index, setIndex] = useState(0)
  const [secs, setSecs] = useState(3)
  const [paused, setPaused] = useState(false)
  const [quitArmed, setQuitArmed] = useState(false)

  const endAt = useRef(performance.now() + INTRO_MS)
  const banked = useRef(0) // ms left, while paused
  const bar = useRef<HTMLDivElement>(null)
  const advanceBar = useRef<HTMLDivElement>(null)
  const live = useRef({ phase, index, paused })
  live.current = { phase, index, paused }
  const timers = useRef<number[]>([])
  const finished = useRef(false)

  const card = cards[index]

  const startPhase = useCallback((p: Phase, i: number, ms: number) => {
    live.current = { ...live.current, phase: p, index: i }
    setPhase(p)
    setIndex(i)
    endAt.current = performance.now() + ms
    setSecs(Math.ceil(ms / 1000))
  }, [])

  // Called when the current phase's clock hits zero.
  const onZero = useCallback(() => {
    const { phase: p, index: i } = live.current
    if (p === 'intro') {
      if (settings.sound) sfx.go()
      startPhase('ask', 0, seconds * 1000)
    } else if (p === 'ask') {
      if (settings.sound) {
        sfx.buzzer()
        timers.current.push(window.setTimeout(sfx.reveal, CHIME_DELAY_MS))
      }
      if (settings.vibration) buzz([60, 40, 120])
      startPhase('reveal', i, REVEAL_MS)
    } else if (i + 1 >= cards.length) {
      // The rAF loop keeps seeing left <= 0 until unmount — finish once.
      if (!finished.current) {
        finished.current = true
        onDone(cards)
      }
    } else {
      if (settings.sound) sfx.next()
      startPhase('ask', i + 1, seconds * 1000)
    }
  }, [cards, seconds, settings, startPhase, onDone])

  // The clock.
  useEffect(() => {
    let raf = 0
    let lastSec = -1
    const frame = () => {
      raf = requestAnimationFrame(frame)
      if (live.current.paused) return
      const left = Math.max(0, endAt.current - performance.now())
      const { phase: p } = live.current
      const span = p === 'intro' ? INTRO_MS : p === 'ask' ? seconds * 1000 : REVEAL_MS
      const frac = left / span
      if (p === 'reveal') advanceBar.current?.style.setProperty('--left', String(frac))
      else bar.current?.style.setProperty('--left', String(frac))
      const sec = Math.ceil(left / 1000)
      if (sec !== lastSec) {
        lastSec = sec
        setSecs(sec)
        if (settings.sound && sec > 0) {
          if (p === 'intro') sfx.count()
          else if (p === 'ask') (sec <= 3 ? sfx.qTickHot : sfx.qTick)()
        }
      }
      if (left <= 0) {
        lastSec = -1
        onZero()
      }
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [seconds, settings.sound, onZero])

  // Screen stays on; the quiz works in any orientation, so make sure nothing
  // is still locked from a tilt round.
  useEffect(() => {
    void holdScreenOn()
    void unlockOrientation()
    const onVis = () => document.visibilityState === 'visible' && void holdScreenOn()
    document.addEventListener('visibilitychange', onVis)
    const pending = timers.current
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      pending.forEach(clearTimeout)
      releaseScreen()
    }
  }, [])

  function pause() {
    if (live.current.paused) return
    banked.current = Math.max(0, endAt.current - performance.now())
    live.current.paused = true
    setPaused(true)
  }
  function resume() {
    endAt.current = performance.now() + banked.current
    live.current.paused = false
    setPaused(false)
  }
  /** Skip the rest of the clock: reveal now, or go to the next question now. */
  function skip() {
    if (live.current.paused || live.current.phase === 'intro') return
    endAt.current = performance.now()
  }
  function quit() {
    if (quitArmed) return onQuit()
    setQuitArmed(true)
    timers.current.push(window.setTimeout(() => setQuitArmed(false), 2200))
  }

  // Android back / browser back: pause, and back again resumes.
  useBack(() => (live.current.paused ? resume() : pause()))

  // Space / Enter skip, P pauses — for a laptop on the coffee table.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') skip()
      else if (e.key === 'p' || e.key === 'Escape') (live.current.paused ? resume : pause)()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const hot = phase === 'ask' && secs <= 3
  const revealed = phase === 'reveal'

  return (
    <div className={`stage quiz tone-paper ${paused ? 'is-paused' : ''}`}>
      <div className="stage-bar mono">
        <button className={`slab back ${quitArmed ? 'tone-red' : 'tone-paper'} mono`} onClick={quit}>
          <CloseIcon />
          {quitArmed ? 'Again to quit' : 'Quit'}
        </button>
        <span className="quiz-meta">
          {phase === 'intro' ? 'Quiz time' : `Q ${String(index + 1).padStart(2, '0')}/${String(cards.length).padStart(2, '0')}`}{' '}
          · {title}
        </span>
        <button className="slab back tone-paper mono" onClick={pause} aria-label="Pause">
          ❚❚ <span className="hide-narrow">Pause</span>
        </button>
      </div>

      {phase === 'intro' ? (
        <div className="stage-body">
          <p className="mono ready-hint" style={{ textAlign: 'center' }}>
            {style === 'mcq' ? 'Lock a letter before the buzzer' : 'Lock your answer before the buzzer'}
          </p>
          <div className="countdown" key={secs}>
            {Math.max(1, secs)}
          </div>
        </div>
      ) : (
        <div className="quiz-body">
          <div className="quiz-main">
            <div className={`slab q-slab ${card.art ? 'has-art' : ''}`} key={`q${index}`}>
              <span className="word-index mono">Q{String(index + 1).padStart(2, '0')}</span>
              {card.art && (
                <div className="logo-wrap">
                  <LogoArt id={card.art} />
                </div>
              )}
              <FitText text={card.q} className="q-text" max={card.art ? 30 : 58} />
            </div>

            {style === 'mcq' ? (
              <ol className={`options ${revealed ? 'revealed' : ''}`} key={`o${index}`}>
                {card.options.map((o, i) => (
                  <li
                    key={o}
                    className={`slab opt ${revealed ? (i === card.answerIndex ? 'right' : 'wrong') : ''}`}
                  >
                    <span className="letter mono">{LETTERS[i]}</span>
                    <span className="opt-text">{o}</span>
                    {revealed && i === card.answerIndex && <span className="tick">✓</span>}
                  </li>
                ))}
              </ol>
            ) : revealed ? (
              <div className="slab answer-slab" key={`a${index}`}>
                <span className="mono">Answer</span>
                <span className="answer-text">{card.a}</span>
              </div>
            ) : (
              <div className="answer-wait mono" key={`w${index}`}>
                Answer at zero<span className="dots" />
              </div>
            )}
          </div>

          <aside className={`slab timer-col ${hot ? 'hot' : ''} ${revealed ? 'done' : ''}`} aria-live="off">
            <span className="timer-num">{revealed ? '0' : secs}</span>
            <div className="timer-track">
              <div className="timer-fill" ref={bar} />
            </div>
            <button className="mono skip" onClick={skip}>
              {revealed ? 'Next' : 'Show'}
            </button>
          </aside>
        </div>
      )}

      {revealed && (
        <div className="advance" aria-hidden="true">
          <div className="advance-fill" ref={advanceBar} />
        </div>
      )}

      {paused && (
        <div className="pause-veil" role="dialog" aria-modal="true" aria-label="Paused">
          <div className="dialog slab tone-paper" style={{ position: 'relative', left: 0, top: 0, transform: 'none' }}>
            <span className="mono">
              {Math.ceil(banked.current / 1000)} sec left on the clock
            </span>
            <h2 className="dialog-title">Paused.</h2>
            <div className="dialog-actions">
              <button className="slab cta tone-red" onClick={resume}>
                Resume
              </button>
              <button className="slab cta tone-paper" onClick={() => onDone(cards.slice(0, index + (revealed ? 1 : 0)))}>
                End
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
