import type { Sensitivity, Verdict } from '../game/tilt'

/**
 * v0 persistence: the state lives in memory while the app runs and is
 * mirrored to localStorage under one versioned key so it survives restarts.
 * No database — there is nothing here that needs one.
 */
export type Mode = 'tilt' | 'swipe'

export interface Settings {
  sound: boolean
  vibration: boolean
  sensitivity: Sensitivity
  mode: Mode
  seconds: number
}

export interface RoundRecord {
  deckId: string
  mode: Mode
  seconds: number
  score: number
  shown: number
  at: number
}

export interface SaveData {
  v: 0
  settings: Settings
  best: Record<string, number>
  history: RoundRecord[]
  /** Words already shown per deck — drives the no-repeat shuffle bag. */
  seen: Record<string, string[]>
}

export const STORAGE_NAME = 'pishani:v0'
export const HISTORY_LIMIT = 20
export const DURATIONS = [30, 60, 90, 120] as const

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  vibration: true,
  sensitivity: 'med',
  mode: 'tilt',
  seconds: 60,
}

export function freshData(): SaveData {
  return { v: 0, settings: { ...DEFAULT_SETTINGS }, best: {}, history: [], seen: {} }
}

/** Parse whatever is in storage; anything unexpected falls back to defaults. */
export function parse(raw: string | null): SaveData {
  if (!raw) return freshData()
  try {
    const d = JSON.parse(raw) as Partial<SaveData>
    if (!d || typeof d !== 'object' || d.v !== 0) return freshData()
    const s = { ...DEFAULT_SETTINGS, ...(d.settings ?? {}) }
    if (!['low', 'med', 'high'].includes(s.sensitivity)) s.sensitivity = 'med'
    if (s.mode !== 'tilt' && s.mode !== 'swipe') s.mode = 'tilt'
    if (!DURATIONS.includes(s.seconds as (typeof DURATIONS)[number])) s.seconds = 60
    return {
      v: 0,
      settings: s,
      best: isRecord(d.best) ? d.best : {},
      history: Array.isArray(d.history) ? d.history.slice(0, HISTORY_LIMIT) : [],
      seen: isRecord(d.seen) ? d.seen : {},
    }
  } catch {
    return freshData()
  }
}

function isRecord(x: unknown): x is Record<string, never> {
  return !!x && typeof x === 'object' && !Array.isArray(x)
}

type Listener = () => void

/** Tiny observable store; React reads it through useSyncExternalStore. */
export function createStore(backing: Pick<Storage, 'getItem' | 'setItem'> | null) {
  let data = parse(safe(() => backing?.getItem(STORAGE_NAME) ?? null, null))
  const listeners = new Set<Listener>()

  function commit(next: SaveData) {
    data = next
    safe(() => backing?.setItem(STORAGE_NAME, JSON.stringify(next)), undefined)
    listeners.forEach((l) => l())
  }

  return {
    get: () => data,
    subscribe(l: Listener) {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    updateSettings(patch: Partial<Settings>) {
      commit({ ...data, settings: { ...data.settings, ...patch } })
    },
    setSeen(deckId: string, seen: string[]) {
      commit({ ...data, seen: { ...data.seen, [deckId]: seen } })
    },
    /** Records a finished round. Returns true if it set a new best. */
    recordRound(rec: RoundRecord, shownWords: { word: string; verdict: Verdict }[]): boolean {
      const prev = data.best[rec.deckId] ?? 0
      const isBest = rec.score > prev
      const seen = [...new Set([...(data.seen[rec.deckId] ?? []), ...shownWords.map((a) => a.word)])]
      commit({
        ...data,
        best: isBest ? { ...data.best, [rec.deckId]: rec.score } : data.best,
        history: [rec, ...data.history].slice(0, HISTORY_LIMIT),
        seen: { ...data.seen, [rec.deckId]: seen },
      })
      return isBest
    },
    resetStats() {
      commit({ ...freshData(), settings: data.settings })
    },
  }
}

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    // Private mode / quota — keep working from memory.
    return fallback
  }
}

export type Store = ReturnType<typeof createStore>

export const store = createStore(typeof localStorage === 'undefined' ? null : localStorage)
