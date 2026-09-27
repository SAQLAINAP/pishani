import { useState } from 'react'
import type { RoundSpec } from '../App'
import { DECKS, MIX, type PlayableDeck } from '../data'
import { useSave } from '../store/useStore'
import { GearIcon } from '../ui/Icons'
import { SetupSheet } from './SetupSheet'

const TOTAL = DECKS.length + 1
const pad = (n: number) => String(n).padStart(2, '0')
const CARD_COUNT = DECKS.reduce((n, d) => n + d.words.length, 0)

export function Home({ onStart, onSettings }: { onStart: (s: RoundSpec) => void; onSettings: () => void }) {
  const save = useSave()
  const [picked, setPicked] = useState<{ deck: PlayableDeck; index: number } | null>(null)

  return (
    <div className="screen">
      <div className="grid-lines" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <main className="home" style={{ position: 'relative' }}>
        <header className="masthead">
          <div className="masthead-top mono">
            <div className="meta">
              N° 01 — Forehead guessing game
              <br />
              v0.1 · Works offline
            </div>
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
            <span>
              {DECKS.length} decks · {CARD_COUNT.toLocaleString('en-IN')} cards
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

        <footer className="legend mono">
          <span>[ Tilt ↓ = correct ]</span>
          <span>[ Tilt ↑ = pass ]</span>
          <span>[ Swipe ↓ correct · ↑ pass ]</span>
        </footer>
      </main>

      {picked && (
        <SetupSheet
          deck={picked.deck}
          label={`${pad(picked.index)}/${pad(TOTAL)}`}
          onClose={() => setPicked(null)}
          onStart={onStart}
        />
      )}
    </div>
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
      aria-label={`${deck.title} ${deck.tag}, ${deck.words.length} cards`}
    >
      {isMix ? (
        <>
          <span className="deck-head mono" style={{ flexDirection: 'column', gap: 4 }}>
            <span>
              {pad(index)}/{pad(TOTAL)}
            </span>
            <span>{deck.words.length} cards</span>
          </span>
          <span className="mix-copy">
            <span className="deck-title">{deck.title}</span>
            <span className="deck-tag">{deck.blurb}</span>
          </span>
          <span className="deck-foot mono" style={{ borderTop: 0, flexDirection: 'column', gap: 4 }}>
            <span>Best</span>
            <b>{best ?? '—'}</b>
          </span>
        </>
      ) : (
        <>
          <span className="deck-head mono">
            <span>
              {pad(index)}/{pad(TOTAL)}
            </span>
            <span>{deck.words.length}</span>
          </span>
          <span>
            <span className="deck-title">{deck.title}</span>
            <span className="deck-tag">{deck.tag}</span>
          </span>
          <span className="deck-foot mono">
            <span>Best</span>
            <b>{best ?? '—'}</b>
          </span>
        </>
      )}
    </button>
  )
}
