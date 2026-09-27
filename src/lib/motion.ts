import { normaliseZ } from '../game/tilt'
import { isIOS } from './platform'

/**
 * Streams the screen-normal (z) component of gravity, sign-normalised so
 * negative = screen toward the floor.
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
  z: number | null
  start(): void
  stop(): void
}
type GravitySensorCtor = new (opts: { frequency: number }) => GravitySensorLike

export function streamGravityZ(onZ: (z: number, at: number) => void, onSource: (s: Source) => void) {
  let stopped = false
  let sensor: GravitySensorLike | null = null
  let fallbackOn = false

  const onMotion = (e: DeviceMotionEvent) => {
    const withG = e.accelerationIncludingGravity?.z
    if (withG == null) return
    // Where the platform also reports linear acceleration (Android's fused
    // TYPE_LINEAR_ACCELERATION, iOS userAcceleration), subtracting it leaves
    // pure gravity — the same signal GravitySensor gives, minus the jerk.
    const linear = e.acceleration?.z
    const z = linear == null ? withG : withG - linear
    onZ(normaliseZ(z, isIOS), e.timeStamp || performance.now())
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
        if (s.z == null) return
        if (!got) {
          got = true
          onSource('gravity')
        }
        // Same sign convention as Android devicemotion (flat, face up = +9.81).
        onZ(s.z, performance.now())
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
