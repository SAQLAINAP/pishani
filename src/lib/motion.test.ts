import { afterEach, describe, expect, it, vi } from 'vitest'
import { streamGravityZ, type Source } from './motion'

vi.mock('./platform', () => ({ isIOS: false }))

class FakeSensor extends EventTarget {
  static mode: 'emit' | 'error' | 'silent' = 'emit'
  z: number | null = null
  start() {
    queueMicrotask(() => {
      if (FakeSensor.mode === 'emit') {
        this.z = -8
        this.dispatchEvent(new Event('reading'))
      } else if (FakeSensor.mode === 'error') this.dispatchEvent(new Event('error'))
    })
  }
  stop() {}
}

function motion(z: number) {
  const e = new Event('devicemotion') as Event & { accelerationIncludingGravity: { z: number } }
  e.accelerationIncludingGravity = { z }
  window.dispatchEvent(e)
}

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
    const stop = streamGravityZ((z) => zs.push(z), (s) => (src = s))
    await tick()
    motion(5) // ignored: not on the fallback
    expect(src).toBe('gravity')
    expect(zs).toEqual([-8])
    stop()
  })

  it('falls back to devicemotion when the sensor errors', async () => {
    ;(globalThis as { GravitySensor?: unknown }).GravitySensor = FakeSensor
    FakeSensor.mode = 'error'
    const zs: number[] = []
    let src: Source | null = null
    const stop = streamGravityZ((z) => zs.push(z), (s) => (src = s))
    await tick()
    motion(4)
    expect(src).toBe('devicemotion')
    expect(zs).toEqual([4])
    stop()
  })

  it('falls back when the sensor stays silent', async () => {
    vi.useFakeTimers()
    ;(globalThis as { GravitySensor?: unknown }).GravitySensor = FakeSensor
    FakeSensor.mode = 'silent'
    let src: Source | null = null
    const stop = streamGravityZ(() => {}, (s) => (src = s))
    vi.advanceTimersByTime(700)
    expect(src).toBe('devicemotion')
    stop()
  })

  it('uses devicemotion straight away where there is no GravitySensor (iOS)', () => {
    const zs: number[] = []
    const stop = streamGravityZ((z) => zs.push(z), () => {})
    motion(-3)
    stop()
    motion(-3) // after stop: ignored
    expect(zs).toEqual([-3])
  })
})
