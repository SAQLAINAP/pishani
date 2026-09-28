/** A deck is a titled list of things to guess. Colour is assigned in data/index.ts. */
export interface Deck {
  /** Stable id — used as the storage key for best scores and shuffle progress. */
  id: string
  /** Main label on the slab, e.g. "Movies". */
  title: string
  /** Small qualifier under the title, e.g. "Indian" or "International". */
  tag: string
  /** One-line hint on the setup sheet. */
  blurb: string
  words: string[]
  /** Quiz-only categories (General Knowledge) have no Heads Up words. */
  quizOnly?: boolean
  /** Newer categories, flagged on the slab while their question banks settle in. */
  beta?: boolean
}
