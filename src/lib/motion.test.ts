import { afterEach, describe, expect, it, vi } from 'vitest'
import { streamPitch, type Source } from './motion'

vi.mock('./platform', () => ({ isIOS: false }))

class FakeSensor extends EventTarget {
  static mode: 'emit' | 'error' | 'silent' = 'emit'
  x: number | null = null
  y: number | null = null
  z: number | null = null
  start() {
    queueMicrotask(() => {
      if (FakeSensor.mode === 'emit') {
        // Screen tipped 45° toward the floor.
        this.x = 6.94
        this.y = 0
        this.z = -6.94
        this.dispatchEvent(new Event('reading'))
      } else if (FakeSensor.mode === 'error') this.dispatchEvent(new Event('error'))
    })
  }
  stop() {}
}

type V = { x: number; y: number; z: number }
/** A landscape phone: gravity mostly along x, plus `z` out of the screen. */
function motion(z: number, linearZ?: number) {
  const e = new Event('devicemotion') as Event & { accelerationIncludingGravity: V; acceleration: V | null }
  e.accelerationIncludingGravity = { x: 9.81, y: 0, z }
  e.acceleration = linearZ === undefined ? null : { x: 0, y: 0, z: linearZ }
  window.dispatchEvent(e)
}
const deg = (z: number) => (Math.atan2(z, 9.81) * 180) / Math.PI

const tick = () => new Promise((r) => setTimeout(r, 0))

afterEach(() => {
  delete (globalThis as { GravitySensor?: unknown }).GravitySensor
  vi.useRealTimers()
})

describe('streamGravityZ', () => {
  it('prefers the fused GravitySensor when it delivers readings', async () => {
    ;(globalThis as { GravitySensor?: unknown }).GravitySensor = FakeSensor
    FakeSensor.mode = 'emit'
    const zs: number[] = []
    let src: Source | null = null
    const stop = streamPitch((z) => zs.push(z), (s) => (src = s))
    await tick()
    motion(5) // ignored: not on the fallback
    expect(src).toBe('gravity')
    expect(zs).toHaveLength(1)
    expect(zs[0]).toBeCloseTo(-45)
    stop()
  })

  it('falls back to devicemotion when the sensor errors', async () => {
    ;(globalThis as { GravitySensor?: unknown }).GravitySensor = FakeSensor
    FakeSensor.mode = 'error'
    const zs: number[] = []
    let src: Source | null = null
    const stop = streamPitch((z) => zs.push(z), (s) => (src = s))
    await tick()
    motion(4)
    expect(src).toBe('devicemotion')
    expect(zs[0]).toBeCloseTo(deg(4))
    stop()
  })

  it('falls back when the sensor stays silent', async () => {
    vi.useFakeTimers()
    ;(globalThis as { GravitySensor?: unknown }).GravitySensor = FakeSensor
    FakeSensor.mode = 'silent'
    let src: Source | null = null
    const stop = streamPitch(() => {}, (s) => (src = s))
    vi.advanceTimersByTime(700)
    expect(src).toBe('devicemotion')
    stop()
  })

  it('subtracts linear acceleration so a jerk does not look like a tilt', () => {
    const zs: number[] = []
    const stop = streamPitch((z) => zs.push(z), () => {})
    motion(7, 6.5) // raw spike of +7, of which +6.5 is the head moving
    stop()
    expect(zs[0]).toBeCloseTo(deg(0.5)) // ≈ 3°, not ≈ 35°
  })

  it('uses devicemotion straight away where there is no GravitySensor (iOS)', () => {
    const zs: number[] = []
    const stop = streamPitch((z) => zs.push(z), () => {})
    motion(-3)
    stop()
    motion(-3) // after stop: ignored
    expect(zs).toHaveLength(1)
    expect(zs[0]).toBeCloseTo(deg(-3))
  })
})
