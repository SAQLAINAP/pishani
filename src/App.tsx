import { useState } from 'react'
import { deckById } from './data'
import { quizFor } from './data/quiz'
import { buildQuiz, type QuizCard } from './game/quiz'
import type { Answer } from './game/round'
import { store, type Mode, type QuizStyle } from './store/storage'
import { Quiz } from './screens/Quiz'
import { QuizDone } from './screens/QuizDone'
import { Home } from './screens/Home'
import { Round } from './screens/Round'
import { Results } from './screens/Results'
import { Settings } from './screens/Settings'
import { lockLandscape } from './lib/platform'
import { sfx } from './lib/sound'

export interface RoundSpec {
  deckId: string
  mode: Mode
  /** Round length for tilt/swipe; seconds per question for quiz. */
  seconds: number
  quizStyle?: QuizStyle
  /** Questions per quiz. */
  count?: number
}

/**
 * The whole app is a small state machine, so there is no router: a PWA and a
 * Capacitor WebView both boot into index.html and nothing is deep-linkable
 * in a party game anyway.
 */
type View =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'round'; spec: RoundSpec; run: number }
  | { name: 'results'; spec: RoundSpec; answers: Answer[]; isBest: boolean }
  | { name: 'quiz'; spec: RoundSpec; cards: QuizCard[]; run: number }
  | { name: 'quizDone'; spec: RoundSpec; asked: QuizCard[] }

/** Quiz shuffle bags live next to the word bags, under their own prefix. */
const quizSeenKey = (deckId: string) => `quiz:${deckId}`

export function App() {
  const [view, setView] = useState<View>({ name: 'home' })

  // Must run inside the tap handler: fullscreen, orientation lock and the
  // AudioContext are all gated on a user gesture.
  function start(spec: RoundSpec) {
    sfx.unlock()
    if (spec.mode === 'quiz') {
      // No orientation lock: the phone sits on a table, either way up.
      const bag = buildQuiz(
        quizFor(spec.deckId),
        store.get().seen[quizSeenKey(spec.deckId)] ?? [],
        spec.count ?? 10,
      )
      store.setSeen(quizSeenKey(spec.deckId), bag.seen)
      setView({ name: 'quiz', spec, cards: bag.cards, run: Date.now() })
      return
    }
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
    case 'quiz':
      return (
        <Quiz
          key={view.run}
          title={deckById(view.spec.deckId)?.title ?? ''}
          cards={view.cards}
          style={view.spec.quizStyle ?? 'mcq'}
          seconds={view.spec.seconds}
          onQuit={() => setView({ name: 'home' })}
          onDone={(asked) => setView({ name: 'quizDone', spec: view.spec, asked })}
        />
      )
    case 'quizDone':
      return (
        <QuizDone
          title={deckById(view.spec.deckId)?.title ?? ''}
          asked={view.asked}
          onAgain={() => start(view.spec)}
          onHome={() => setView({ name: 'home' })}
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
