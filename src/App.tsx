import { useState } from 'react'
import type { Answer } from './game/round'
import type { Mode } from './store/storage'
import { Home } from './screens/Home'
import { Round } from './screens/Round'
import { Results } from './screens/Results'
import { Settings } from './screens/Settings'
import { lockLandscape } from './lib/platform'
import { sfx } from './lib/sound'

export interface RoundSpec {
  deckId: string
  mode: Mode
  seconds: number
}

/**
 * The whole app is a four-state machine, so there is no router: a PWA and a
 * Capacitor WebView both boot into index.html and nothing is deep-linkable
 * in a party game anyway.
 */
type View =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'round'; spec: RoundSpec; run: number }
  | { name: 'results'; spec: RoundSpec; answers: Answer[]; isBest: boolean }

export function App() {
  const [view, setView] = useState<View>({ name: 'home' })

  // Must run inside the tap handler: fullscreen, orientation lock and the
  // AudioContext are all gated on a user gesture.
  function start(spec: RoundSpec) {
    sfx.unlock()
    void lockLandscape()
    setView({ name: 'round', spec, run: Date.now() })
  }

  switch (view.name) {
    case 'home':
      return <Home onStart={start} onSettings={() => setView({ name: 'settings' })} />
    case 'settings':
      return <Settings onBack={() => setView({ name: 'home' })} />
    case 'round':
      return (
        <Round
          key={view.run}
          spec={view.spec}
          onQuit={() => setView({ name: 'home' })}
          onDone={(answers, isBest) => setView({ name: 'results', spec: view.spec, answers, isBest })}
        />
      )
    case 'results':
      return (
        <Results
          spec={view.spec}
          answers={view.answers}
          isBest={view.isBest}
          onAgain={() => start(view.spec)}
          onHome={() => setView({ name: 'home' })}
        />
      )
  }
}
