/**
 * Forehead tilt detection.
 *
 * Why gravity instead of `deviceorientation` Euler angles: a phone standing
 * upright on a forehead sits at beta ≈ 90°, which is exactly where Euler
 * angles hit gimbal lock and jitter. The gravity vector has no singularity.
 *
 * From gravity we take ONE number: the screen's pitch — how far the screen
 * faces the floor (negative) or the ceiling (positive), in degrees. Upright is
 * 0°. Because it's measured against the whole vector, it doesn't matter which
 * way round the phone is in landscape, or whether it is in portrait at all.
 *
 * Why degrees and not the raw z component (v0.1–v0.2 used z): z = g·sin θ,
 * so each extra degree adds less z the further you already are from upright.
 * Foreheads rest leaning back ~10–15°, so a look-up started from there
 * registered far weaker than the same-sized nod down — the "tilt up feels
 * bad" bug. Thresholds in degrees are symmetric wherever you start.
 *
 * This file is pure — no DOM — so the state machine is unit-tested with
 * synthetic sample streams (tilt.test.ts).
 */

export type Verdict = 'correct' | 'pass'
export type Sensitivity = 'low' | 'med' | 'high'

export interface TiltConfig {
  /** Degrees past the resting angle for a nod down. */
  fire: number
  /**
   * Fraction of `fire` needed to look UP. Tipping your head back with a phone
   * on it is a smaller movement than nodding forward, so pass asks for less.
   */
  upScale: number
  /** The tilt must be held past the threshold this long (ms). Spikes from the
   *  head's own jerk last a frame or two; a real tilt doesn't. */
  holdMs: number
  /** Within this many degrees of rest counts as "back upright". */
  rearm: number
  /** …and must stay there this long (ms). Stops one wobbly nod counting twice. */
  settleMs: number
  /**
   * After a verdict, the OPPOSITE direction stays locked this long from the
   * moment the head is back upright. Kills the rebound: nod down, swing back
   * up past upright → a false "pass". Short enough that a real look-up right
   * after a correct isn't swallowed.
   */
  oppositeLockMs: number
  /** EMA weight of the newest sample, 0–1. Lower = smoother but laggier. */
  smoothing: number
}

// Degrees past rest. Up = 75% of down: low 45°/34°, med 35°/26°, high 25°/19°.
const FIRE: Record<Sensitivity, number> = { low: 45, med: 35, high: 25 }

export function tiltConfig(sensitivity: Sensitivity): TiltConfig {
  // smoothing 0.6 ≈ one sample of lag at 60 Hz; jitter is handled by the
  // hold + hysteresis instead of heavy smoothing.
  return {
    fire: FIRE[sensitivity],
    upScale: 0.75,
    holdMs: 30,
    rearm: 15,
    settleMs: 150,
    oppositeLockMs: 250,
    smoothing: 0.6,
  }
}

export interface TiltDetector {
  /** Treat the current smoothed reading as "upright" (foreheads lean back a bit). */
  calibrate(): void
  /** Feed one pitch sample in degrees (negative = screen toward the floor). */
  push(pitch: number, at: number): Verdict | null
  /** Smoothed pitch, for the "hold it upright" check on the ready screen. */
  readonly level: number
}

export function createTiltDetector(cfg: TiltConfig): TiltDetector {
  let ema: number | null = null
  let baseline = 0
  let armed = true
  let calmSince: number | null = null
  let last: Verdict | null = null
  /** When the opposite of `last` may fire again. */
  let oppositeFrom = 0
  let pending: { dir: Verdict; since: number } | null = null

  return {
    calibrate() {
      baseline = ema ?? 0
      armed = true
      calmSince = null
      last = null
      pending = null
    },
    get level() {
      return ema ?? 0
    },
    push(pitch, at) {
      ema = ema === null ? pitch : ema + cfg.smoothing * (pitch - ema)
      const d = ema - baseline

      if (!armed) {
        if (Math.abs(d) < cfg.rearm) {
          if (calmSince === null) {
            calmSince = at
            oppositeFrom = at + cfg.oppositeLockMs
          }
          if (at - calmSince >= cfg.settleMs) armed = true
        } else {
          calmSince = null
        }
        return null
      }

      // Nod forward (screen to the floor) = got it. Look up = pass.
      const dir: Verdict | null =
        d <= -cfg.fire ? 'correct' : d >= cfg.fire * cfg.upScale ? 'pass' : null
      const locked = dir !== null && last !== null && dir !== last && at < oppositeFrom
      if (dir === null || locked) {
        pending = null
        return null
      }
      if (pending?.dir !== dir) {
        pending = { dir, since: at }
        return null
      }
      if (at - pending.since < cfg.holdMs) return null

      armed = false
      calmSince = null
      pending = null
      last = dir
      return dir
    },
  }
}

/**
 * Android reports gravity as a reaction force (flat, face up → z = +9.81).
 * iOS Safari reports the opposite sign. Normalise so negative always means
 * "screen toward the floor".
 */
export function normaliseZ(rawZ: number, isIOS: boolean): number {
  return isIOS ? -rawZ : rawZ
}

/**
 * Screen pitch in degrees from a gravity vector: 0 upright, −90 screen facing
 * the floor, +90 facing the ceiling. `z` must already be sign-normalised.
 */
export function pitchDeg(x: number, y: number, z: number): number {
  return (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI
}
