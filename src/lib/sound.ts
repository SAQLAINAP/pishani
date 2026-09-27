/**
 * Synthesised cues via Web Audio — no audio files to precache, so nothing to
 * miss offline. The context is created lazily on first use (after a tap),
 * which is what mobile autoplay policies require.
 */
let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'square', gain = 0.12) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + start
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(a.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

export const sfx = {
  /** Call from a tap handler so the AudioContext is allowed to start. */
  unlock: () => void audio(),
  correct: () => {
    tone(660, 0, 0.09)
    tone(990, 0.08, 0.14)
  },
  pass: () => tone(150, 0, 0.22, 'sawtooth', 0.1),
  tick: () => tone(1200, 0, 0.03, 'square', 0.06),
  count: () => tone(440, 0, 0.12, 'square', 0.1),
  go: () => tone(880, 0, 0.25, 'square', 0.12),
  end: () => {
    tone(523, 0, 0.18)
    tone(392, 0.16, 0.18)
    tone(262, 0.32, 0.4)
  },
}
