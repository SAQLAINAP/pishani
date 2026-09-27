import { useEffect } from 'react'
import type { RoundSpec } from '../App'
import type { PlayableDeck } from '../data'
import { requestMotion } from '../lib/platform'
import { DURATIONS, store, type Mode } from '../store/storage'
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

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [onClose])

  function setMode(mode: Mode) {
    store.updateSettings({ mode })
  }

  function start() {
    // iOS only shows the motion prompt from inside a tap; ask here, but never
    // block the round on it — Round falls back to swipe if no sensor data.
    if (settings.mode === 'tilt') void requestMotion()
    onStart({ deckId: deck.id, mode: settings.mode, seconds: settings.seconds })
  }

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <section className="sheet tone-paper" role="dialog" aria-modal="true" aria-label={`${deck.title} setup`}>
        <div className="sheet-head">
          <span className="mono" style={{ fontSize: 11, lineHeight: 1.6 }}>
            Deck {label} · {deck.words.length} cards
            <br />
            {deck.tag} · Best {best[deck.id] ?? '—'}
          </span>
          <button className="slab icon-btn tone-paper" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <h2 className="sheet-title">{deck.title}</h2>
        <p>{deck.blurb}</p>

        <div className="field">
          <span className="mono">02 — Mode</span>
          <div className="seg" role="group" aria-label="Mode">
            <button aria-pressed={settings.mode === 'tilt'} onClick={() => setMode('tilt')}>
              Tilt
              <small>Phone on forehead</small>
            </button>
            <button aria-pressed={settings.mode === 'swipe'} onClick={() => setMode('swipe')}>
              Swipe
              <small>↓ correct · ↑ pass</small>
            </button>
          </div>
        </div>

        <div className="field">
          <span className="mono">03 — Time</span>
          <div className="seg" role="group" aria-label="Round length">
            {DURATIONS.map((s) => (
              <button
                key={s}
                aria-pressed={settings.seconds === s}
                onClick={() => store.updateSettings({ seconds: s })}
              >
                {s}
                <small>sec</small>
              </button>
            ))}
          </div>
        </div>

        <div className="cta-row" style={{ marginTop: 22 }}>
          <button className="slab cta tone-red" onClick={start}>
            Start <span className="arrow">→</span>
          </button>
        </div>
      </section>
    </>
  )
}
