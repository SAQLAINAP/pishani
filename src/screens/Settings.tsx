import { useState } from 'react'
import { deckById } from '../data'
import type { Sensitivity } from '../game/tilt'
import { useBack } from '../lib/back'
import { store, type Theme } from '../store/storage'
import { useSave } from '../store/useStore'

const SENS: { v: Sensitivity; label: string }[] = [
  { v: 'low', label: 'Low' },
  { v: 'med', label: 'Med' },
  { v: 'high', label: 'High' },
]

const THEMES: { v: Theme; label: string }[] = [
  { v: 'system', label: 'Auto' },
  { v: 'light', label: 'Light' },
  { v: 'dark', label: 'Dark' },
]

function OnOff({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      <button aria-pressed={value} onClick={() => onChange(true)}>
        On
      </button>
      <button aria-pressed={!value} onClick={() => onChange(false)}>
        Off
      </button>
    </div>
  )
}

export function Settings({ onBack }: { onBack: () => void }) {
  const { settings, history } = useSave()
  const [confirmReset, setConfirmReset] = useState(false)
  useBack(onBack)

  return (
    <div className="screen">
      <main className="settings">
        <button className="slab back tone-paper mono" onClick={onBack}>
          ← Decks
        </button>
        <h1>Setup</h1>

        <div className="row">
          <span className="label">
            Theme<small>Auto follows your phone</small>
          </span>
          <div className="seg" role="group" aria-label="Theme">
            {THEMES.map((t) => (
              <button
                key={t.v}
                aria-pressed={settings.theme === t.v}
                onClick={() => store.updateSettings({ theme: t.v })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="row">
          <span className="label">
            Sound<small>Beeps, ticks, the buzzer</small>
          </span>
          <OnOff label="Sound" value={settings.sound} onChange={(sound) => store.updateSettings({ sound })} />
        </div>
        <div className="row">
          <span className="label">
            Vibration<small>Android only</small>
          </span>
          <OnOff
            label="Vibration"
            value={settings.vibration}
            onChange={(vibration) => store.updateSettings({ vibration })}
          />
        </div>
        <div className="row">
          <span className="label">
            Tilt sensitivity<small>High = smaller nod</small>
          </span>
          <div className="seg" role="group" aria-label="Tilt sensitivity">
            {SENS.map((s) => (
              <button
                key={s.v}
                aria-pressed={settings.sensitivity === s.v}
                onClick={() => store.updateSettings({ sensitivity: s.v })}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="row">
          <span className="label">
            Stats<small>Best scores, history, seen cards</small>
          </span>
          <div className="seg">
            <button
              aria-pressed={confirmReset}
              onClick={() => {
                if (confirmReset) {
                  store.resetStats()
                  setConfirmReset(false)
                } else setConfirmReset(true)
              }}
            >
              {confirmReset ? 'Sure? Tap' : 'Reset'}
            </button>
          </div>
        </div>

        <section className="history">
          <div className="section-label mono">Recent rounds</div>
          {history.length === 0 ? (
            <p className="empty mono">Nothing yet. Go play.</p>
          ) : (
            <table>
              <tbody>
                {history.map((h) => {
                  const d = deckById(h.deckId)
                  return (
                    <tr key={h.at}>
                      <td>{new Date(h.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                      <td>
                        {d ? `${d.title} · ${d.tag}` : h.deckId}
                      </td>
                      <td>
                        {h.mode} {h.seconds}s
                      </td>
                      <td>{h.score}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="history">
          <div className="section-label mono">How to play</div>
          <p className="mono" style={{ fontSize: 12, lineHeight: 1.7, margin: 0 }}>
            One player holds the phone on their forehead, screen facing out. Everyone else shouts clues,
            acts, hums — anything but saying the word. Tilt mode: nod down if you got it, look up to
            pass. Swipe mode: swipe down for correct, up to pass. Most correct before the buzzer wins.
          </p>
        </section>
      </main>
    </div>
  )
}
