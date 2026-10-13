import type { Deck } from './types'
import { moviesIndian } from './decks/moviesIndian'
import { moviesIntl } from './decks/moviesIntl'
import { actorsIndian } from './decks/actorsIndian'
import { actorsIntl } from './decks/actorsIntl'
import { singersIndian } from './decks/singersIndian'
import { webSeriesTv } from './decks/webSeriesTv'
import { cities } from './decks/cities'
import { countries } from './decks/countries'
import { foodsIndian } from './decks/foodsIndian'
import { foodsIntl } from './decks/foodsIntl'
import { brandsIndian } from './decks/brandsIndian'
import { brandsIntl } from './decks/brandsIntl'
import { actions } from './decks/actions'
import { sports } from './decks/sports'
import { animals } from './decks/animals'
import { landmarks } from './decks/landmarks'
import { moviesHindi } from './decks/moviesHindi'
import { moviesKannada } from './decks/moviesKannada'
import { moviesTamil } from './decks/moviesTamil'
import { moviesTelugu } from './decks/moviesTelugu'
import { moviesMalayalam } from './decks/moviesMalayalam'
import { bangaloreAreas, bangaloreFood, bangaloreLandmarks, bangaloreMisc } from './decks/bangalore'

export type { Deck }

/**
 * Slab surface for each deck. Montgomery brutalism is mostly raw concrete, so
 * the tones are concrete shades plus ink; red is reserved for MIX (and for
 * the one primary action on each screen) so it keeps its signal value.
 */
export type Tone = 'paper' | 'concrete' | 'stone' | 'ink'

export interface PlayableDeck extends Deck {
  tone: Tone
  /**
   * A collection: one slab on Home that opens onto a section picker. The
   * parent itself plays as "All" (its words are its own plus every
   * section's), and each section is a full deck with its own id, best score
   * and shuffle bag.
   */
  sections?: PlayableDeck[]
}

/** Parent deck whose words are the union of its own and its sections'. */
function collection(parent: Deck, sections: Deck[], tone: Tone = 'paper'): Deck & { sections: PlayableDeck[] } {
  return {
    ...parent,
    words: [...new Set([...parent.words, ...sections.flatMap((s) => s.words)])],
    sections: sections.map((s) => ({ ...s, tone })),
  }
}

const moviesIndianAll = collection(moviesIndian, [moviesHindi, moviesKannada, moviesTamil, moviesTelugu, moviesMalayalam])

const bangalore = collection(
  {
    id: 'blr',
    title: 'Bangalore',
    tag: 'Namma Bengaluru',
    blurb: 'Dosas, layouts, landmarks and traffic. Only for locals (and survivors).',
    words: [],
  },
  [bangaloreFood, bangaloreAreas, bangaloreLandmarks, bangaloreMisc],
)

// Same order as the shelves on Home, so index numbers and the tone rhythm run in sequence.
const ORDER: Deck[] = [
  moviesIndianAll,
  moviesIntl,
  webSeriesTv,
  actorsIndian,
  actorsIntl,
  singersIndian,
  sports,
  bangalore,
  cities,
  countries,
  foodsIndian,
  foodsIntl,
  brandsIndian,
  brandsIntl,
  landmarks,
  animals,
  actions,
]

// A fixed 4-step rhythm reads as poured concrete modules rather than a rainbow.
const RHYTHM: Tone[] = ['concrete', 'paper', 'ink', 'stone']

export const DECKS: PlayableDeck[] = ORDER.map((d, i) => ({ ...d, tone: RHYTHM[i % RHYTHM.length] }))

export const MIX_ID = 'mix'

export const MIX: PlayableDeck = {
  id: MIX_ID,
  title: 'Mix',
  tag: 'Everything',
  blurb: 'Every deck in one pile. Pure chaos.',
  tone: 'ink',
  // A Set because a word can legitimately live in two decks (a film and its TV show).
  words: [...new Set(DECKS.flatMap((d) => d.words))],
}

/** Quiz-only category: no words to act out, just questions. */
export const GK: PlayableDeck = {
  id: 'gk',
  title: 'General Knowledge',
  tag: 'Quiz only',
  blurb: 'Science, history, geography, India. Pure quizmaster.',
  tone: 'stone',
  words: [],
  quizOnly: true,
}

const quizDeck = (d: Omit<PlayableDeck, 'words' | 'quizOnly'>): PlayableDeck => ({ ...d, words: [], quizOnly: true })

/**
 * Quiz-only categories: topics you can quiz but can't act out on a forehead.
 * Listed in their own "Quizmaster only" section on Home.
 */
export const QUIZ_ONLY: PlayableDeck[] = [
  GK,
  quizDeck({
    id: 'taglines',
    title: 'Taglines & Logos',
    tag: 'Slogans · Dialogues · Logos',
    blurb: 'Finish the jingle, name the film, spot the logo.',
    tone: 'ink',
  }),
  quizDeck({
    id: 'tech',
    title: 'Tech & Software',
    tag: 'Quiz only',
    blurb: 'Code, chips, the internet and who built it.',
    tone: 'concrete',
    beta: true,
  }),
  quizDeck({
    id: 'health',
    title: 'Medic & Health',
    tag: 'Quiz only',
    blurb: 'Body, medicine and the discoveries behind them.',
    tone: 'paper',
    beta: true,
  }),
  quizDeck({
    id: 'finance',
    title: 'Finance & Econ',
    tag: 'Quiz only',
    blurb: 'Money, markets and the ideas that run them.',
    tone: 'ink',
    beta: true,
  }),
  quizDeck({
    id: 'history',
    title: 'History & Geopolitics',
    tag: 'Quiz only',
    blurb: 'Empires, wars, treaties and the maps they drew.',
    tone: 'stone',
    beta: true,
  }),
]

/** Every section of every collection, flattened. */
export const SECTIONS: PlayableDeck[] = DECKS.flatMap((d) => d.sections ?? [])

export function deckById(id: string): PlayableDeck | undefined {
  if (id === MIX_ID) return MIX
  return DECKS.find((d) => d.id === id) ?? SECTIONS.find((d) => d.id === id) ?? QUIZ_ONLY.find((d) => d.id === id)
}

/** The collection a section belongs to (or the deck itself). */
export function parentOf(id: string): PlayableDeck | undefined {
  return DECKS.find((d) => d.id === id || d.sections?.some((s) => s.id === id))
}
