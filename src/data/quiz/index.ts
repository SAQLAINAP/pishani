import type { QuizQuestion } from './types'

export type { QuizQuestion }

/**
 * Quiz question banks, keyed by deck id. Each file in this folder exports one
 * or more named arrays; the export name decides which deck it belongs to.
 * Collected with import.meta.glob so adding a category is just adding a file
 * (plus a line below) — decks.test.ts fails if any quiz deck comes up short.
 */
const EXPORT_TO_DECK: Record<string, string> = {
  moviesIndian: 'movies-in',
  moviesIntl: 'movies-intl',
  actorsIndian: 'actors-in',
  actorsIntl: 'actors-intl',
  singersIndian: 'singers-in',
  webSeriesTv: 'series-tv',
  moviesHindi: 'movies-hi',
  moviesKannada: 'movies-kn',
  moviesTamil: 'movies-ta',
  moviesTelugu: 'movies-te',
  moviesMalayalam: 'movies-ml',
  bangaloreFood: 'blr-food',
  bangaloreAreas: 'blr-areas',
  bangaloreLandmarks: 'blr-landmarks',
  bangaloreMisc: 'blr-misc',
  foodsIndian: 'foods-in',
  foodsIntl: 'foods-intl',
  cities: 'cities',
  countries: 'countries',
  landmarks: 'landmarks',
  brandsIndian: 'brands-in',
  brandsIntl: 'brands-intl',
  sports: 'sports',
  animals: 'animals',
  gk: 'gk',
  // Quiz-only categories.
  tech: 'tech',
  health: 'health',
  finance: 'finance',
  history: 'history',
  // Two files, one category: text clues + drawn logo clues.
  taglines: 'taglines',
  taglinesLogos: 'taglines',
}

const modules = import.meta.glob<Record<string, unknown>>(['./*.ts', '!./index.ts', '!./types.ts'], {
  eager: true,
})

const BANKS: Record<string, QuizQuestion[]> = {}
for (const mod of Object.values(modules)) {
  for (const [name, value] of Object.entries(mod)) {
    const id = EXPORT_TO_DECK[name]
    if (id && Array.isArray(value)) BANKS[id] = [...(BANKS[id] ?? []), ...(value as QuizQuestion[])]
  }
}

/** Deck ids that are expected to have a quiz (Actions doesn't — you can't quiz a mime). */
export const QUIZ_DECK_IDS = [...new Set(Object.values(EXPORT_TO_DECK))]

/** Collections quiz on their own bank plus every section's (see data/index.ts). */
const ROLLUP: Record<string, string[]> = {
  'movies-in': ['movies-hi', 'movies-kn', 'movies-ta', 'movies-te', 'movies-ml'],
  blr: ['blr-food', 'blr-areas', 'blr-landmarks', 'blr-misc'],
}

export function quizFor(deckId: string): QuizQuestion[] {
  if (deckId === 'mix') return Object.values(BANKS).flat()
  return [deckId, ...(ROLLUP[deckId] ?? [])].flatMap((id) => BANKS[id] ?? [])
}

export function hasQuiz(deckId: string): boolean {
  return quizFor(deckId).length > 0
}
