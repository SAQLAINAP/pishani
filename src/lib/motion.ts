import { normaliseZ, pitchDeg } from '../game/tilt'
import { isIOS } from './platform'

/**
 * Streams the screen's pitch in degrees, from gravity: negative = screen
 * toward the floor, positive = toward the ceiling (see pitchDeg).
 *
 * Preferred source: the Generic Sensor `GravitySensor` (Chrome / Android
 * WebView). It is Android's fused gravity — accelerometer + gyroscope — so it
 * tracks the *rotation* of a nod directly. The fallback, `devicemotion`'s
 * accelerationIncludingGravity, is the raw accelerometer: the head's own
 * forward jerk at the start of a nod briefly pushes z the wrong way before
 * gravity wins, which reads as lag — and a sharp nod's spike can even read
 * as the opposite tilt. The fallback subtracts the reported linear
 * acceleration when there is one, which removes that. iOS only has the
 * fallback.
 */
export type Source = 'gravity' | 'devicemotion'

interface GravitySensorLike extends EventTarget {
  x: number | null
  y: number | null
  z: number | null
  start(): void
  stop(): void
}
type GravitySensorCtor = new (opts: { frequency: number }) => GravitySensorLike

export function streamPitch(onPitch: (deg: number, at: number) => void, onSource: (s: Source) => void) {
  let stopped = false
  let sensor: GravitySensorLike | null = null
  let fallbackOn = false

  const onMotion = (e: DeviceMotionEvent) => {
    const g = e.accelerationIncludingGravity
    if (g?.x == null || g.y == null || g.z == null) return
    // Where the platform also reports linear acceleration (Android's fused
    // TYPE_LINEAR_ACCELERATION, iOS userAcceleration), subtracting it leaves
    // pure gravity — the same signal GravitySensor gives, minus the jerk.
    const l = e.acceleration
    const x = g.x - (l?.x ?? 0)
    const y = g.y - (l?.y ?? 0)
    const z = g.z - (l?.z ?? 0)
    onPitch(pitchDeg(x, y, normaliseZ(z, isIOS)), e.timeStamp || performance.now())
  }

  function fallback() {
    if (stopped || fallbackOn) return
    fallbackOn = true
    sensor?.stop()
    sensor = null
    window.addEventListener('devicemotion', onMotion)
    onSource('devicemotion')
  }

  const Ctor = (globalThis as { GravitySensor?: GravitySensorCtor }).GravitySensor
  if (!Ctor) {
    fallback()
  } else {
    try {
      const s = new Ctor({ frequency: 60 })
      sensor = s
      let got = false
      s.addEventListener('reading', () => {
        if (s.x == null || s.y == null || s.z == null) return
        if (!got) {
          got = true
          onSource('gravity')
        }
        // Same sign convention as Android devicemotion (flat, face up = +9.81).
        onPitch(pitchDeg(s.x, s.y, s.z), performance.now())
      })
      // Blocked by permissions policy, no sensor, etc. → raw accelerometer.
      s.addEventListener('error', fallback)
      s.start()
      // Constructed fine but silent (some WebViews): don't wait forever.
      window.setTimeout(() => !got && fallback(), 600)
    } catch {
      fallback()
    }
  }

  return () => {
    stopped = true
    sensor?.stop()
    window.removeEventListener('devicemotion', onMotion)
  }
}
