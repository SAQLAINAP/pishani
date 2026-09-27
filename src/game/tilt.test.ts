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
    // further look-up would fire; after calibration it takes a real tilt.
    const leanBack = [...hold(3, 40), ...ramp(3, 8, 10), ...hold(8, 10)]
    expect(run(leanBack, 'med', 30)).toEqual([])
    expect(run([...hold(3, 40), ...ramp(3, -6, 10), ...hold(-6, 10)], 'med', 30)).toEqual(['correct'])
  })

  it('flips the iOS sign convention', () => {
    expect(normaliseZ(5, true)).toBe(-5)
    expect(normaliseZ(5, false)).toBe(5)
  })
})
