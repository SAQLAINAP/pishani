import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { RoundSpec } from '../App'
import { deckById } from '../data'
import { answer, currentWord, score, startRound, type Answer, type RoundState } from '../game/round'
import { buildQueue } from '../game/shuffle'
import { classifySwipe } from '../game/swipe'
import { createTiltDetector, tiltConfig, type Verdict } from '../game/tilt'
import { buzz } from '../lib/haptics'
import { useBack } from '../lib/back'
import { streamGravityZ } from '../lib/motion'
import { unlockOrientation } from '../lib/platform'
import { sfx } from '../lib/sound'
import { holdScreenOn, releaseScreen } from '../lib/wakelock'
import { store } from '../store/storage'
import { FitText } from '../ui/FitText'
import { CloseIcon } from '../ui/Icons'

type Phase = 'ready' | 'countdown' | 'play' | 'timeup'
type Sensor = 'waiting' | 'live' | 'missing'

// How long the green/orange flood holds before the next card. The detector
// also needs the head back upright, so this only has to cover the read.
const FLASH_MS = 420
const TIMEUP_MS = 1500
const UPRIGHT = 2.5 // |z| below this (≈15°) counts as "on the forehead"
const UPRIGHT_HOLD_MS = 900

export function Round({
  spec,
  onQuit,
  onDone,
}: {
  spec: RoundSpec
  onQuit: () => void
  onDone: (answers: Answer[], isBest: boolean) => void
}) {
  const deck = deckById(spec.deckId)!
  const settings = store.get().settings

  const [round, setRound] = useState<RoundState>(() =>
    startRound(buildQueue(deck.words, store.get().seen[deck.id] ?? []).queue),
  )
  const [phase, setPhase] = useState<Phase>('ready')
  const [count, setCount] = useState(3)
  const [left, setLeft] = useState(spec.seconds * 1000)
  const [flash, setFlash] = useState<Verdict | null>(null)
  const [sensor, setSensor] = useState<Sensor>(spec.mode === 'tilt' ? 'waiting' : 'missing')
  const [quitArmed, setQuitArmed] = useState(false)

  // Event listeners outlive renders, so they read live state from a ref.
  const live = useRef({ phase, flash, round })
  useLayoutEffect(() => {
    live.current = { phase, flash, round }
  })
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }
  const detector = useRef(createTiltDetector(tiltConfig(settings.sensitivity)))
  const endAt = useRef(0)

  const finish = useCallback(() => {
    if (live.current.phase === 'timeup') return
    live.current.phase = 'timeup'
    setPhase('timeup')
    if (settings.sound) sfx.end()
    if (settings.vibration) buzz(400)
    const answers = live.current.round.answers
    const isBest = store.recordRound(
      {
        deckId: deck.id,
        mode: spec.mode,
        seconds: spec.seconds,
        score: score(answers),
        shown: answers.length,
        at: Date.now(),
      },
      answers,
    )
    later(() => onDone(answers, isBest), TIMEUP_MS)
  }, [deck.id, spec, settings, onDone])

  const decide = useCallback(
    (v: Verdict) => {
      const L = live.current
      if (L.phase !== 'play' || L.flash) return
      if (currentWord(L.round) === undefined) return
      const next = answer(L.round, v)
      // Write the ref now, not on the next render: a second event in the same
      // frame must see the flash and be ignored.
      live.current = { ...L, round: next, flash: v }
      setRound(next)
      setFlash(v)
      if (settings.sound) (v === 'correct' ? sfx.correct : sfx.pass)()
      if (settings.vibration) buzz(v === 'correct' ? 45 : [20, 50, 20])
      later(() => {
        live.current.flash = null
        setFlash(null)
        if (currentWord(live.current.round) === undefined) finish()
      }, FLASH_MS)
    },
    [settings, finish],
  )

  const beginCountdown = useCallback(() => {
    if (live.current.phase !== 'ready') return
    live.current.phase = 'countdown'
    setPhase('countdown')
    ;[3, 2, 1].forEach((n, i) =>
      later(() => {
        setCount(n)
        if (settings.sound) sfx.count()
      }, i * 1000),
    )
    later(() => {
      detector.current.calibrate()
      endAt.current = performance.now() + spec.seconds * 1000
      live.current.phase = 'play'
      setPhase('play')
      if (settings.sound) sfx.go()
      if (settings.vibration) buzz(80)
    }, 3000)
  }, [settings, spec.seconds])

  // Screen on for the whole round; the lock drops when the tab hides, so re-take it.
  useEffect(() => {
    void holdScreenOn()
    const onVis = () => document.visibilityState === 'visible' && void holdScreenOn()
    document.addEventListener('visibilitychange', onVis)
    const pending = timers.current
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      pending.forEach(clearTimeout)
      releaseScreen()
      void unlockOrientation()
    }
  }, [])

  // Tilt: gravity z (fused sensor, or raw accelerometer fallback) → detector → verdict. Also auto-starts the countdown
  // once the phone has been held upright (on a forehead) for a moment.
  useEffect(() => {
    if (spec.mode !== 'tilt') return
    let got = false
    let uprightSince: number | null = null
    const missing = window.setTimeout(() => !got && setSensor('missing'), 1800)

    const stop = streamGravityZ(
      (z, now) => {
        if (!got) {
          got = true
          setSensor('live')
        }
        const v = detector.current.push(z, now)
        const p = live.current.phase
        if (p === 'ready') {
          if (Math.abs(detector.current.level) < UPRIGHT) {
            uprightSince ??= now
            if (now - uprightSince >= UPRIGHT_HOLD_MS) beginCountdown()
          } else uprightSince = null
        } else if (p === 'play' && v) decide(v)
      },
      () => {},
    )
    return () => {
      clearTimeout(missing)
      stop()
    }
  }, [spec.mode, beginCountdown, decide])

  // Clock. Driven off an absolute end time so a janky frame can't stretch the round.
  useEffect(() => {
    if (phase !== 'play') return
    let lastSec = Math.ceil(spec.seconds)
    const id = window.setInterval(() => {
      const rem = endAt.current - performance.now()
      setLeft(Math.max(0, rem))
      const sec = Math.ceil(rem / 1000)
      if (sec !== lastSec) {
        lastSec = sec
        if (sec <= 10 && sec > 0 && settings.sound) sfx.tick()
      }
      if (rem <= 0) {
        clearInterval(id)
        finish()
      }
    }, 100)
    return () => clearInterval(id)
  }, [phase, spec.seconds, settings.sound, finish])

  // Keyboard, for desktop play and testing: ↓ / space = correct, ↑ = pass.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') decide('correct')
      else if (e.key === 'ArrowUp') decide('pass')
      else if (e.key === 'Enter') beginCountdown()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [decide, beginCountdown])

  // Swipe works in every mode — it's the fallback when there's no sensor.
  const drag = useRef<{ x: number; y: number; t: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now() }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (!d) return
    const v = classifySwipe(e.clientX - d.x, e.clientY - d.y, performance.now() - d.t)
    if (v) decide(v)
  }

  function quit() {
    if (quitArmed) {
      onQuit()
      return
    }
    setQuitArmed(true)
    later(() => setQuitArmed(false), 2200)
  }

  // Back mid-round behaves like the Quit button: first press arms, second quits,
  // so a stray swipe from the screen edge never throws a round away.
  useBack(quit)

  const quitButton = (
    <button
      className={`slab back ${quitArmed ? 'tone-red' : 'tone-paper'} mono`}
      onClick={(e) => {
        // The ready stage starts the countdown on any tap — not this one.
        e.stopPropagation()
        quit()
      }}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label="Quit round"
    >
      <CloseIcon />
      {quitArmed ? 'Again to quit' : 'Quit'}
    </button>
  )

  if (phase === 'ready') {
    const tilt = spec.mode === 'tilt' && sensor !== 'missing'
    return (
      <div className="stage tone-concrete" onClick={beginCountdown}>
        <div className="stage-bar mono">
          {quitButton}
          <span>
            {deck.title} · {deck.tag}
          </span>
        </div>
        <div className="stage-body">
          <h1 className="ready-title">{tilt ? 'On your pishani.' : 'Hold it up.'}</h1>
          <p className="ready-hint mono">
            {tilt ? (
              <>
                Screen facing your friends. Hold still to begin — or tap anywhere.
                <br />
                Nod down = correct · Look up = pass
              </>
            ) : (
              <>
                {spec.mode === 'tilt' && sensor === 'missing' && (
                  <>
                    No motion sensor found — swipe instead.
                    <br />
                  </>
                )}
                Swipe down = correct · Swipe up = pass
                <br />
                Tap anywhere to start
              </>
            )}
          </p>
        </div>
        <span className="ghost" aria-hidden="true">
          {deck.title}
        </span>
        <span className="vertical mono">{spec.seconds} sec round</span>
      </div>
    )
  }

  if (phase === 'countdown') {
    return (
      <div className="stage tone-ink">
        <div className="stage-bar mono">
          {quitButton}
          <span>Get ready</span>
        </div>
        <div className="stage-body">
          <div className="countdown" key={count}>
            {count}
          </div>
        </div>
      </div>
    )
  }

  const word = currentWord(round)
  const secs = Math.ceil(left / 1000)
  const showManual = spec.mode === 'swipe' || sensor === 'missing'
  const lastAnswer = round.answers[round.answers.length - 1]

  return (
    <div
      className="stage play tone-paper"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current = null)}
      style={{ touchAction: 'none' }}
    >
      <div className="stage-bar mono">
        {quitButton}
        <span className={`timer ${secs <= 10 ? 'hot' : ''}`} aria-live="off">
          {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
        </span>
        <span className="tally">
          ✓ <b>{score(round.answers)}</b>
        </span>
      </div>

      <div className="slab word-slab">
        <span className="word-index mono">
          {String(round.index + 1).padStart(2, '0')} · {deck.title}
        </span>
        {showManual && (
          <div className="swipe-hints mono" aria-hidden="true">
            <span>↑ pass</span>
            <span>↓ correct</span>
          </div>
        )}
        {word && <FitText text={word} />}
      </div>

      {showManual && (
        <div className="manual">
          <button
            className="slab"
            style={{ background: 'var(--orange)', color: 'var(--ink)' }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => decide('pass')}
          >
            Pass
          </button>
          <button
            className="slab"
            style={{ background: 'var(--green)', color: '#fff' }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => decide('correct')}
          >
            Correct
          </button>
        </div>
      )}

      {flash && lastAnswer && (
        <div className={`flood ${flash}`} role="status">
          <span className="mono">{lastAnswer.word}</span>
          <span className="flood-word">{flash === 'correct' ? 'Got it' : 'Pass'}</span>
        </div>
      )}
      {phase === 'timeup' && (
        <div className="flood timeup" role="status">
          <span className="mono">
            {score(round.answers)} correct · {round.answers.length} shown
          </span>
          <span className="flood-word">Time.</span>
        </div>
      )}
    </div>
  )
}
