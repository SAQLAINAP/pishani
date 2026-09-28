import { Capacitor } from '@capacitor/core'
import { ScreenOrientation } from '@capacitor/screen-orientation'

export const isNative = Capacitor.isNativePlatform()

export const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const isTouch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches

/**
 * Tilt needs a phone you can put on your forehead. The Android app always
 * qualifies; in a browser, only touch-first devices (phones, tablets) do —
 * a laptop, even a touchscreen one, reports a fine primary pointer.
 */
export const canTilt = isNative || isTouch

type MotionPermission = { requestPermission?: () => Promise<'granted' | 'denied'> }

/**
 * iOS 13+ gates motion sensors behind a permission prompt that must be
 * triggered from a tap. Android and desktop resolve straight away.
 */
export async function requestMotion(): Promise<boolean> {
  const DME = (globalThis as { DeviceMotionEvent?: MotionPermission }).DeviceMotionEvent
  if (!DME) return false
  if (typeof DME.requestPermission !== 'function') return true
  try {
    return (await DME.requestPermission()) === 'granted'
  } catch {
    return false
  }
}

/**
 * Lock landscape for a round. Native uses the Capacitor plugin. On the web
 * the Screen Orientation API only works in fullscreen, so on touch devices we
 * go fullscreen first; everywhere else this silently does nothing and the
 * layout just adapts.
 */
export async function lockLandscape() {
  try {
    if (isNative) {
      await ScreenOrientation.lock({ orientation: 'landscape' })
      return
    }
    if (!isTouch) return
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.()
    await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.(
      'landscape',
    )
  } catch {
    // Not allowed here — fine.
  }
}

export async function unlockOrientation() {
  try {
    if (isNative) {
      await ScreenOrientation.unlock()
      return
    }
    screen.orientation?.unlock?.()
    if (document.fullscreenElement) await document.exitFullscreen()
  } catch {
    // ignore
  }
}
