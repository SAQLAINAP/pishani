import { useState } from 'react'
import type { RoundSpec } from '../App'
import { DECKS, MIX, QUIZ_ONLY, type PlayableDeck } from '../data'
import { exitApp, useBack } from '../lib/back'
import { store } from '../store/storage'
import { useSave } from '../store/useStore'
import { DeckArt } from '../ui/DeckArt'
import { GearIcon, ThemeIcon } from '../ui/Icons'
import { SetupSheet } from './SetupSheet'

// Index numbers stay as a Swiss grid device, but never as "02/17" or a card
// count — totals make the content feel finite.
const pad = (n: number) => String(n).padStart(2, '0')

function toggleTheme() {
  const dark = document.documentElement.dataset.theme === 'dark'
  store.updateSettings({ theme: dark ? 'light' : 'dark' })
}

export function Home({ onStart, onSettings }: { onStart: (s: RoundSpec) => void; onSettings: () => void }) {
  const save = useSave()
  const [picked, setPicked] = useState<{ deck: PlayableDeck; index: number } | null>(null)
  const [leaving, setLeaving] = useState(false)

  // Back on Home asks before quitting; back again (or Stay) dismisses the ask.
  // An open setup sheet registers its own handler on top of this one.
  useBack(() => setLeaving((v) => !v))

  return (
    <div className="screen">
      <div className="grid-lines" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <main className="home" style={{ position: 'relative' }}>
        <header className="masthead">
          <div className="masthead-top">
            <button className="slab icon-btn tone-paper" onClick={toggleTheme} aria-label="Toggle dark mode">
              <ThemeIcon />
            </button>
            <button className="slab icon-btn tone-paper" onClick={onSettings} aria-label="Settings">
              <GearIcon />
            </button>
          </div>
          <h1 className="wordmark" aria-label="Pishani">
            Pishani<span className="dot">.</span>
          </h1>
          <div className="masthead-sub mono">
            <span>
              <span className="fa" lang="fa">
                پیشانی
              </span>{' '}
              &nbsp;(n.) forehead
            </span>
          </div>
        </header>

        <div className="section-label mono">01 — Pick a deck</div>
        <div className="decks">
          <DeckSlab deck={MIX} index={1} best={save.best[MIX.id]} onPick={setPicked} />
          {DECKS.map((d, i) => (
            <DeckSlab key={d.id} deck={d} index={i + 2} best={save.best[d.id]} onPick={setPicked} />
          ))}
        </div>

        <div className="section-label mono" style={{ marginTop: 'clamp(26px, 6vw, 44px)' }}>
          02 — Quizmaster only
        </div>
        <div className="decks">
          {QUIZ_ONLY.map((d, i) => (
            <DeckSlab key={d.id} deck={d} index={DECKS.length + 2 + i} best={undefined} onPick={setPicked} />
          ))}
        </div>

        <footer className="legend mono">
          <span>[ Tilt ↓ = correct ]</span>
          <span>[ Tilt ↑ = pass ]</span>
          <span>[ Swipe ↓ correct · ↑ pass ]</span>
          <span>[ Quiz: lock it before the buzzer ]</span>
        </footer>
      </main>

      {leaving && <LeaveDialog onStay={() => setLeaving(false)} />}

      {picked && (
        <SetupSheet
          deck={picked.deck}
          label={pad(picked.index)}
          onClose={() => setPicked(null)}
          onStart={onStart}
        />
      )}
    </div>
  )
}

function LeaveDialog({ onStay }: { onStay: () => void }) {
  return (
    <>
      <div className="scrim" onClick={onStay} />
      <section className="dialog slab tone-paper" role="alertdialog" aria-modal="true" aria-labelledby="leave-title">
        <span className="mono">One more round?</span>
        <h2 id="leave-title" className="dialog-title">
          Leave Pishani?
        </h2>
        <div className="dialog-actions">
          {/* Staying is the primary action — it gets the red. */}
          <button className="slab cta tone-red" onClick={onStay}>
            Stay
          </button>
          <button className="slab cta tone-paper" onClick={exitApp}>
            Leave
          </button>
        </div>
      </section>
    </>
  )
}

function DeckSlab({
  deck,
  index,
  best,
  onPick,
}: {
  deck: PlayableDeck
  index: number
  best: number | undefined
  onPick: (p: { deck: PlayableDeck; index: number }) => void
}) {
  const isMix = deck.id === MIX.id
  return (
    <button
      className={`slab deck ${isMix ? 'mix tone-red' : `tone-${deck.tone}`}`}
      onClick={() => onPick({ deck, index })}
      aria-label={`${deck.title}, ${deck.tag}`}
    >
      {isMix ? (
        <>
          <span className="deck-head mono" style={{ alignSelf: 'flex-start' }}>
            {pad(index)}
          </span>
          <span className="mix-copy">
            <span className="deck-title">{deck.title}</span>
            <span className="deck-tag">{deck.blurb}</span>
          </span>
          <DeckArt id={deck.id} />
          <span className="deck-foot mono" style={{ borderTop: 0, flexDirection: 'column', gap: 4 }}>
            <span>Best</span>
            <b>{best ?? '—'}</b>
          </span>
        </>
      ) : (
        <>
          <span className="deck-head mono">
            <span>{pad(index)}</span>
            {deck.beta && <span className="beta">Beta</span>}
          </span>
          <DeckArt id={deck.id} />
          <span>
            <span className="deck-title">{deck.title}</span>
            <span className="deck-tag">{deck.tag}</span>
          </span>
          <span className="deck-foot mono">
            {deck.quizOnly ? (
              <span>Quizmaster</span>
            ) : (
              <>
                <span>Best</span>
                <b>{best ?? '—'}</b>
              </>
            )}
          </span>
        </>
      )}
    </button>
  )
}
