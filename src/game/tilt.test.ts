import { describe, expect, it } from 'vitest'
import { createTiltDetector, normaliseZ, tiltConfig, type Verdict } from './tilt'

/** Feed a z-sequence at 60 Hz and collect whatever fires. */
function run(zs: number[], sensitivity: 'low' | 'med' | 'high' = 'med', calibrateAfter = 0) {
  const det = createTiltDetector(tiltConfig(sensitivity))
  const out: Verdict[] = []
  zs.forEach((z, i) => {
    if (i === calibrateAfter && calibrateAfter > 0) det.calibrate()
    const v = det.push(z, i * 16)
    if (v) out.push(v)
  })
  return out
}

const hold = (z: number, frames: number) => Array<number>(frames).fill(z)
const ramp = (from: number, to: number, frames: number) =>
  Array.from({ length: frames }, (_, i) => from + ((to - from) * (i + 1)) / frames)

describe('tilt detector', () => {
  it('fires correct on a forward nod and pass on a look-up', () => {
    expect(run([...hold(0, 20), ...ramp(0, -9, 10), ...hold(-9, 10)])).toEqual(['correct'])
    expect(run([...hold(0, 20), ...ramp(0, 9, 10), ...hold(9, 10)])).toEqual(['pass'])
  })

  it('counts one nod once, however long it is held', () => {
    expect(run([...hold(0, 10), ...hold(-9, 120)])).toEqual(['correct'])
  })

  it('needs a settle back to upright before firing again', () => {
    const nod = [...ramp(0, -9, 8), ...hold(-9, 8), ...ramp(-9, 0, 8)]
    // Two nods separated by a proper rest (≥ 250 ms) = two events.
    expect(run([...hold(0, 10), ...nod, ...hold(0, 30), ...nod, ...hold(0, 30)])).toEqual([
      'correct',
      'correct',
    ])
    // A wobble on the way back (never calm for 250 ms) does not re-fire.
    const wobble = [...ramp(0, -9, 8), ...ramp(-9, -1, 6), ...hold(-1, 5), ...ramp(-1, -9, 6)]
    expect(run([...hold(0, 10), ...wobble, ...hold(-9, 10)])).toEqual(['correct'])
  })

  it('ignores hand jitter around upright', () => {
    const jitter = Array.from({ length: 300 }, (_, i) => Math.sin(i) * 2.5)
    expect(run(jitter)).toEqual([])
  })

  it('respects sensitivity: a 30° tilt only fires on high', () => {
    const tilt30 = [...hold(0, 10), ...ramp(0, -4.9, 10), ...hold(-4.9, 30)]
    expect(run(tilt30, 'low')).toEqual([])
    expect(run(tilt30, 'med')).toEqual([])
    expect(run(tilt30, 'high')).toEqual(['correct'])
  })

  it('calibrates to a forehead that leans back', () => {
    // Resting at +3 (screen tipped slightly up). Without calibration a small
    // further look-up (+3 more, ≈18°) would fire; after calibration it doesn't.
    const leanBack = [...hold(3, 40), ...ramp(3, 6, 10), ...hold(6, 10)]
    expect(run(leanBack, 'med', 30)).toEqual([])
    expect(run([...hold(3, 40), ...ramp(3, -6, 10), ...hold(-6, 10)], 'med', 30)).toEqual(['correct'])
  })

  it('fires within 3 samples (~50 ms at 60 Hz) of a sharp nod', () => {
    const det = createTiltDetector(tiltConfig('med'))
    for (let i = 0; i < 20; i++) det.push(0, i * 16)
    const fired = [-9, -9, -9, -9, -9].findIndex((z, i) => det.push(z, (20 + i) * 16))
    expect(fired).toBeGreaterThanOrEqual(0)
    expect(fired).toBeLessThanOrEqual(3)
  })

  it('ignores a one- or two-frame spike (the jerk at the start of a nod)', () => {
    // +9 for two frames (would be a "pass"), then the real nod down.
    expect(run([...hold(0, 20), 9, 9, ...ramp(0, -9, 6), ...hold(-9, 15)])).toEqual(['correct'])
  })

  it('looking up needs less angle than nodding down', () => {
    const tilt = (z: number) => [...hold(0, 20), ...ramp(0, z, 6), ...hold(z, 15)]
    // ≈30° either way: counts as a look-up, not as a nod.
    expect(run(tilt(4.9))).toEqual(['pass'])
    expect(run(tilt(-4.9))).toEqual([])
  })

  it('does not turn the rebound after a nod into a pass', () => {
    // Nod down, come back, overshoot up past upright shortly after settling.
    const rebound = [
      ...hold(0, 20),
      ...ramp(0, -9, 6),
      ...hold(-9, 10),
      ...ramp(-9, 0, 6),
      ...hold(0, 12), // ~190 ms calm: re-armed…
      ...ramp(0, 6, 4), // …then a quick swing up
      ...hold(6, 4),
      ...ramp(6, 0, 4),
      ...hold(0, 30),
    ]
    expect(run(rebound)).toEqual(['correct'])
    // A deliberate look-up a moment later still counts.
    expect(run([...rebound, ...ramp(0, 7, 6), ...hold(7, 15)])).toEqual(['correct', 'pass'])
  })

  it('flips the iOS sign convention', () => {
    expect(normaliseZ(5, true)).toBe(-5)
    expect(normaliseZ(5, false)).toBe(5)
  })
})
