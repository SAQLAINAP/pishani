import { useEffect, useState } from 'react'
import type { RoundSpec } from '../App'
import type { PlayableDeck } from '../data'
import { hasQuiz } from '../data/quiz'
import { useBack } from '../lib/back'
import { canTilt, isTouch, requestMotion } from '../lib/platform'
import { DURATIONS, QUIZ_COUNTS, QUIZ_SECONDS, store, type Mode, type Settings } from '../store/storage'
import { useSave } from '../store/useStore'
import { CloseIcon, FlameIcon } from '../ui/Icons'

/**
 * Round setup as a short questionnaire instead of one screen of controls.
 *
 * - One decision per step, big tappable answers; a tap saves and moves on.
 * - Steps that can't vary are skipped (Actions has no quiz; quiz-only decks
 *   have no Tilt/Swipe; Group-only "answer style" disappears for Solo).
 * - Once a device has been through it, the sheet opens on the last step — a
 *   one-line summary with START — so a repeat game is a single tap, and each
 *   part of the summary is a chip that jumps back to its own step.
 */
type Step = 'mode' | 'time' | 'players' | 'style' | 'pace' | 'go'

interface Pace {
  id: string
  label: string
  secs: number
  count: number
  fire?: boolean
}

// Presets replace two rows of numbers; Custom keeps full control.
const PACES: Pace[] = [
  { id: 'quick', label: 'Quick', secs: 10, count: 10 },
  { id: 'standard', label: 'Standard', secs: 15, count: 15 },
  { id: 'marathon', label: 'Marathon', secs: 20, count: 25 },
  { id: 'blitz', label: 'Blitz', secs: 5, count: 15, fire: true },
]

const paceOf = (s: Settings) => PACES.find((p) => p.secs === s.quizSeconds && p.count === s.quizCount)

const TIME_NOTE: Record<number, string> = { 30: 'Quick fire', 60: 'Classic', 90: 'Relaxed', 120: 'Epic' }

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

  const wordsOK = !deck.quizOnly
  const quizOK = hasQuiz(deck.id)
  // Resolve the saved mode against what this deck and device allow, without
  // overwriting the saved preference for other decks.
  let mode: Mode = settings.mode
  if (!wordsOK) mode = 'quiz'
  if (mode === 'quiz' && !quizOK) mode = canTilt ? 'tilt' : 'swipe'
  if (mode === 'tilt' && !canTilt) mode = 'swipe'
  const isQuiz = mode === 'quiz'
  const solo = settings.quizPlayers === 'solo'

  const modeChoices: Mode[] = [
    ...(wordsOK && canTilt ? (['tilt'] as const) : []),
    ...(wordsOK ? (['swipe'] as const) : []),
    ...(quizOK ? (['quiz'] as const) : []),
  ]

  const steps: Step[] = [
    ...(modeChoices.length > 1 ? (['mode'] as const) : []),
    ...(isQuiz ? (['players', ...(solo ? [] : (['style'] as const)), 'pace'] as const) : (['time'] as const)),
    'go',
  ]

  const [step, setStep] = useState<Step>(() => (settings.setupSeen ? 'go' : steps[0]))
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd')
  const [custom, setCustom] = useState(false)
  const at = Math.max(0, steps.indexOf(step))

  function go(next: Step, d: 'fwd' | 'back' = 'fwd') {
    setDir(d)
    setCustom(false)
    setStep(next)
  }
  /** Save a choice, then advance — recomputing the path, since choices change it. */
  function choose(patch: Partial<Settings>, from: Step) {
    store.updateSettings(patch)
    const s = { ...store.get().settings }
    const q = (patch.mode ?? mode) === 'quiz'
    const path: Step[] = [
      ...(modeChoices.length > 1 ? (['mode'] as const) : []),
      ...(q ? (['players', ...(s.quizPlayers === 'solo' ? [] : (['style'] as const)), 'pace'] as const) : (['time'] as const)),
      'go',
    ]
    go(path[path.indexOf(from) + 1] ?? 'go')
  }
  function back() {
    if (at === 0 || step === steps[0]) return onClose()
    go(steps[at - 1], 'back')
  }

  // Android back / Escape step backwards through the questionnaire first.
  useBack(back)
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && back()
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  })

  function start() {
    // iOS only shows the motion prompt from inside a tap.
    if (mode === 'tilt') void requestMotion()
    if (!settings.setupSeen) store.updateSettings({ setupSeen: true })
    onStart(
      isQuiz
        ? {
            deckId: deck.id,
            mode,
            seconds: settings.quizSeconds,
            // Solo is always four options — there's nothing to tap in reveal-only.
            quizStyle: solo ? 'mcq' : settings.quizStyle,
            count: settings.quizCount,
            solo,
          }
        : { deckId: deck.id, mode, seconds: settings.seconds },
    )
  }

  const MODE_INFO: Record<Mode, { title: string; note: string }> = {
    tilt: { title: 'Tilt', note: 'Phone on your forehead. Nod down if you got it, look up to pass.' },
    swipe: canTilt
      ? { title: 'Swipe', note: 'Hold it up. Swipe down if you got it, swipe up to pass.' }
      : { title: 'Classic', note: 'Screen facing away. Buttons or the ↓ ↑ keys.' },
    quiz: { title: 'Quiz', note: 'A quizmaster asks, the clock ticks, the answer drops at zero.' },
  }

  const pace = paceOf(settings)

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <section className="sheet tone-paper" role="dialog" aria-modal="true" aria-label={`${deck.title} setup`}>
        <div className="sheet-head">
          <div className="sheet-id">
            <span className="mono">
              Deck {label} · {deck.tag}
              {!isQuiz && best[deck.id] !== undefined && ` · Best ${best[deck.id]}`}
            </span>
            <h2 className="sheet-title compact">{deck.title}</h2>
          </div>
          <button className="slab icon-btn tone-paper" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {step !== 'go' && (
          <div className="progress" aria-label={`Step ${at + 1} of ${steps.length - 1}`}>
            {steps.slice(0, -1).map((s, i) => (
              <span key={s} className={i <= at ? 'on' : ''} />
            ))}
          </div>
        )}

        <div className={`step step-${dir}`} key={step}>
          {step === 'mode' && (
            <>
              <h3 className="step-q">How are you playing?</h3>
              <div className="choices">
                {modeChoices.map((m, i) => (
                  <Choice
                    key={m}
                    index={i}
                    title={MODE_INFO[m].title}
                    note={MODE_INFO[m].note}
                    on={mode === m}
                    onClick={() => choose({ mode: m }, 'mode')}
                  />
                ))}
              </div>
            </>
          )}

          {step === 'time' && (
            <>
              <h3 className="step-q">How long is a round?</h3>
              <div className="tiles">
                {DURATIONS.map((sec) => (
                  <button
                    key={sec}
                    className={`slab tile ${settings.seconds === sec ? 'on' : ''}`}
                    onClick={() => choose({ seconds: sec }, 'time')}
                  >
                    <b>{sec}</b>
                    <span className="mono">sec · {TIME_NOTE[sec]}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'players' && (
            <>
              <h3 className="step-q">Who's playing?</h3>
              <div className="choices">
                <Choice
                  index={0}
                  title="A group"
                  note="Phone in the middle. Everyone locks an answer; the app reveals it."
                  on={!solo}
                  onClick={() => choose({ quizPlayers: 'group' }, 'players')}
                />
                <Choice
                  index={1}
                  title="Just me"
                  note={`KBC-style. ${isTouch ? 'Tap' : 'Click'} to lock it in; the app keeps score.`}
                  on={solo}
                  onClick={() => choose({ quizPlayers: 'solo' }, 'players')}
                />
              </div>
            </>
          )}

          {step === 'style' && (
            <>
              <h3 className="step-q">How do answers show?</h3>
              <div className="choices">
                <Choice
                  index={0}
                  title="A B C D"
                  note="Four options. The right one lights up green."
                  on={settings.quizStyle === 'mcq'}
                  onClick={() => choose({ quizStyle: 'mcq' }, 'style')}
                />
                <Choice
                  index={1}
                  title="Reveal"
                  note="Just the question. Shout it out; the answer drops at zero."
                  on={settings.quizStyle === 'reveal'}
                  onClick={() => choose({ quizStyle: 'reveal' }, 'style')}
                />
              </div>
            </>
          )}

          {step === 'pace' && (
            <>
              <h3 className="step-q">Pick a pace</h3>
              <div className="tiles">
                {PACES.map((p) => (
                  <button
                    key={p.id}
                    className={`slab tile ${p.fire ? 'fire' : ''} ${pace?.id === p.id && !custom ? 'on' : ''}`}
                    onClick={() => choose({ quizSeconds: p.secs, quizCount: p.count }, 'pace')}
                  >
                    <b>
                      {p.fire && <FlameIcon />}
                      {p.label}
                    </b>
                    <span className="mono">
                      {p.count} questions · {p.secs}s each
                    </span>
                  </button>
                ))}
              </div>
              {custom ? (
                <div className="custom">
                  <div className="field">
                    <span className="mono">Seconds per question</span>
                    <div className="seg" role="group" aria-label="Seconds per question">
                      {QUIZ_SECONDS.map((sec) => (
                        <button
                          key={sec}
                          className={sec === 5 ? 'fire' : undefined}
                          aria-pressed={settings.quizSeconds === sec}
                          onClick={() => store.updateSettings({ quizSeconds: sec })}
                        >
                          {sec === 5 && <FlameIcon />}
                          {sec}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="field">
                    <span className="mono">Questions</span>
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
                  <button className="link mono" onClick={() => go('go')}>
                    Done →
                  </button>
                </div>
              ) : (
                <button className="link mono" onClick={() => setCustom(true)}>
                  {pace ? 'Custom…' : `Custom: ${settings.quizCount} q · ${settings.quizSeconds}s — change`}
                </button>
              )}
            </>
          )}

          {step === 'go' && (
            <>
              <p className="blurb">{deck.blurb}</p>
              <div className="summary" aria-label="Your setup">
                {modeChoices.length > 1 && (
                  <button className="chip" onClick={() => go('mode', 'back')}>
                    {MODE_INFO[mode].title}
                  </button>
                )}
                {isQuiz ? (
                  <>
                    <button className="chip" onClick={() => go('players', 'back')}>
                      {solo ? 'Solo' : 'Group'}
                    </button>
                    {!solo && (
                      <button className="chip" onClick={() => go('style', 'back')}>
                        {settings.quizStyle === 'mcq' ? 'A B C D' : 'Reveal'}
                      </button>
                    )}
                    <button className={`chip ${settings.quizSeconds === 5 ? 'hot' : ''}`} onClick={() => go('pace', 'back')}>
                      {pace ? pace.label : 'Custom'} · {settings.quizCount} q · {settings.quizSeconds}s
                    </button>
                  </>
                ) : (
                  <button className="chip" onClick={() => go('time', 'back')}>
                    {settings.seconds} sec
                  </button>
                )}
                <span className="mono chip-hint">Tap to change</span>
              </div>
              <div className="cta-row">
                <button className="slab cta tone-red" onClick={start} autoFocus={!isTouch}>
                  {isQuiz ? 'Start quiz' : 'Start'} <span className="arrow">→</span>
                </button>
              </div>
            </>
          )}
        </div>

        {step !== 'go' && (
          <div className="step-foot">
            <button className="link mono" onClick={back}>
              ← {at === 0 ? 'Close' : 'Back'}
            </button>
            {settings.setupSeen && (
              <button className="link mono" onClick={() => go('go')}>
                Skip to start →
              </button>
            )}
          </div>
        )}
      </section>
    </>
  )
}

function Choice({
  index,
  title,
  note,
  on,
  onClick,
}: {
  index: number
  title: string
  note: string
  on: boolean
  onClick: () => void
}) {
  return (
    <button className={`slab choice ${on ? 'on' : ''}`} onClick={onClick} aria-pressed={on}>
      <span className="choice-key mono">{'ABC'[index]}</span>
      <span className="choice-body">
        <b>{title}</b>
        <span>{note}</span>
      </span>
      <span className="choice-arrow mono" aria-hidden="true">
        {on ? '●' : '→'}
      </span>
    </button>
  )
}
