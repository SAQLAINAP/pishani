import { describe, expect, it } from 'vitest'
import { createTiltDetector, normaliseZ, pitchDeg, tiltConfig, type Verdict } from './tilt'

/** Feed a pitch sequence (degrees) at 60 Hz and collect whatever fires. */
function run(ps: number[], sensitivity: 'low' | 'med' | 'high' = 'med', calibrateAfter = 0) {
  const det = createTiltDetector(tiltConfig(sensitivity))
  const out: Verdict[] = []
  ps.forEach((p, i) => {
    if (i === calibrateAfter && calibrateAfter > 0) det.calibrate()
    const v = det.push(p, i * 16)
    if (v) out.push(v)
  })
  return out
}

const hold = (p: number, frames: number) => Array<number>(frames).fill(p)
const ramp = (from: number, to: number, frames: number) =>
  Array.from({ length: frames }, (_, i) => from + ((to - from) * (i + 1)) / frames)
const tilt = (to: number, from = 0) => [...hold(from, 40), ...ramp(from, to, 6), ...hold(to, 15)]

describe('pitchDeg', () => {
  it('is 0 upright, −90 facing the floor, +90 facing the ceiling', () => {
    expect(pitchDeg(9.81, 0, 0)).toBeCloseTo(0) // landscape, upright
    expect(pitchDeg(0, 9.81, 0)).toBeCloseTo(0) // portrait, upright
    expect(pitchDeg(0, 0, -9.81)).toBeCloseTo(-90)
    expect(pitchDeg(0, 0, 9.81)).toBeCloseTo(90)
    expect(pitchDeg(6.94, 0, 6.94)).toBeCloseTo(45)
  })
})

describe('tilt detector', () => {
  it('fires correct on a nod down and pass on a look-up', () => {
    expect(run(tilt(-60))).toEqual(['correct'])
    expect(run(tilt(60))).toEqual(['pass'])
  })

  it('counts one nod once, however long it is held', () => {
    expect(run([...hold(0, 10), ...hold(-60, 120)])).toEqual(['correct'])
  })

  it('needs a settle back to upright before firing again', () => {
    const nod = [...ramp(0, -60, 8), ...hold(-60, 8), ...ramp(-60, 0, 8)]
    expect(run([...hold(0, 10), ...nod, ...hold(0, 30), ...nod, ...hold(0, 30)])).toEqual([
      'correct',
      'correct',
    ])
    // A wobble on the way back (never calm for long enough) does not re-fire.
    const wobble = [...ramp(0, -60, 8), ...ramp(-60, -10, 6), ...hold(-10, 5), ...ramp(-10, -60, 6)]
    expect(run([...hold(0, 10), ...wobble, ...hold(-60, 10)])).toEqual(['correct'])
  })

  it('ignores hand jitter around upright', () => {
    expect(run(Array.from({ length: 300 }, (_, i) => Math.sin(i) * 12))).toEqual([])
  })

  it('respects sensitivity: a 30° nod only fires on high', () => {
    expect(run(tilt(-30), 'low')).toEqual([])
    expect(run(tilt(-30), 'med')).toEqual([])
    expect(run(tilt(-30), 'high')).toEqual(['correct'])
  })

  it('looking up needs less angle than nodding down', () => {
    expect(run(tilt(30))).toEqual(['pass'])
    expect(run(tilt(-30))).toEqual([])
  })

  it('a look-up from a forehead that rests leaning back counts the same (the v0.2 bug)', () => {
    // Rest at +12°, look up 30° more → +42°. In raw z that is only
    // 9.81·(sin42° − sin12°) = 4.5 m/s² — at the old edge of firing. In degrees it
    // is simply 30° past rest.
    expect(run(tilt(42, 12), 'med', 30)).toEqual(['pass'])
    // …and a small extra lean (+10°) still doesn't.
    expect(run(tilt(22, 12), 'med', 30)).toEqual([])
    // Nodding down from the same rest works too.
    expect(run(tilt(-28, 12), 'med', 30)).toEqual(['correct'])
  })

  it('fires within 3 samples (~50 ms at 60 Hz) of a sharp nod', () => {
    const det = createTiltDetector(tiltConfig('med'))
    for (let i = 0; i < 20; i++) det.push(0, i * 16)
    const fired = hold(-60, 5).findIndex((p, i) => det.push(p, (20 + i) * 16))
    expect(fired).toBeGreaterThanOrEqual(0)
    expect(fired).toBeLessThanOrEqual(3)
  })

  it('ignores a one- or two-frame spike (the jerk at the start of a nod)', () => {
    expect(run([...hold(0, 20), 65, 65, ...ramp(0, -60, 6), ...hold(-60, 15)])).toEqual(['correct'])
  })

  it('does not turn the rebound after a nod into a pass', () => {
    const rebound = [
      ...hold(0, 20),
      ...ramp(0, -60, 6),
      ...hold(-60, 10),
      ...ramp(-60, 0, 6),
      ...hold(0, 10), // re-armed…
      ...ramp(0, 30, 3), // …then an overshoot up, ~200 ms after coming back
      ...hold(30, 2),
      ...ramp(30, 0, 3),
      ...hold(0, 30),
    ]
    expect(run(rebound)).toEqual(['correct'])
    // A deliberate look-up a moment later still counts.
    expect(run([...rebound, ...ramp(0, 40, 6), ...hold(40, 15)])).toEqual(['correct', 'pass'])
  })

  it('flips the iOS sign convention', () => {
    expect(normaliseZ(5, true)).toBe(-5)
    expect(normaliseZ(5, false)).toBe(5)
  })
})
