/**
 * Forehead tilt detection.
 *
 * Why gravity instead of `deviceorientation` Euler angles: a phone standing
 * upright on a forehead sits at beta ≈ 90°, which is exactly where Euler
 * angles hit gimbal lock and jitter. The gravity vector has no singularity.
 *
 * We only read the z axis (the one pointing out of the screen). Upright, z ≈ 0.
 * Nodding forward turns the screen toward the floor, tilting back turns it
 * toward the ceiling, and z swings hard one way or the other. Because x and y
 * are ignored, it doesn't matter which way round the phone is in landscape,
 * or whether it is in portrait at all.
 *
 * This file is pure — no DOM — so the state machine is unit-tested with
 * synthetic sample streams (tilt.test.ts).
 */

export type Verdict = 'correct' | 'pass'
export type Sensitivity = 'low' | 'med' | 'high'

export interface TiltConfig {
  /** |z − baseline| (m/s²) for a nod down. 9.81 would be a full 90°. */
  fire: number
  /**
   * Fraction of `fire` needed to look UP. Tipping your head back with a phone
   * on it is a smaller movement than nodding forward, so pass asks for less.
   */
  upScale: number
  /** The tilt must be held past the threshold this long (ms). Spikes from the
   *  head's own jerk last a frame or two; a real tilt doesn't. */
  holdMs: number
  /** |z − baseline| must fall below this before the next tilt can fire. */
  rearm: number
  /** …and stay below it this long (ms). Stops one wobbly nod counting twice. */
  settleMs: number
  /**
   * After a verdict, the OPPOSITE direction stays locked this long from the
   * moment the head is back upright. Kills the rebound: nod down, swing back
   * up past upright → a false "pass". Shorter than the card flash, so it
   * never blocks a real answer.
   */
  oppositeLockMs: number
  /** EMA weight of the newest sample, 0–1. Lower = smoother but laggier. */
  smoothing: number
}

// fire ≈ asin(fire / 9.81): low ≈ 50°, med ≈ 38°, high ≈ 27° down;
// up is 75% of that (≈ 35° / 27° / 20°).
const FIRE: Record<Sensitivity, number> = { low: 7.5, med: 6, high: 4.5 }

export function tiltConfig(sensitivity: Sensitivity): TiltConfig {
  // smoothing 0.6 ≈ one sample of lag at 60 Hz; jitter is handled by the
  // hold + hysteresis instead of heavy smoothing.
  return {
    fire: FIRE[sensitivity],
    upScale: 0.75,
    holdMs: 30,
    rearm: 3,
    settleMs: 150,
    oppositeLockMs: 400,
    smoothing: 0.6,
  }
}

export interface TiltDetector {
  /** Treat the current smoothed reading as "upright" (foreheads lean back a bit). */
  calibrate(): void
  /** Feed one z sample (already sign-normalised: negative = screen toward floor). */
  push(z: number, at: number): Verdict | null
  /** Smoothed z, for the "hold it upright" check on the ready screen. */
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
    push(z, at) {
      ema = ema === null ? z : ema + cfg.smoothing * (z - ema)
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
