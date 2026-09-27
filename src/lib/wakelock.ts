/** Keep the screen on during a round — a dimming phone on a forehead is useless. */
let sentinel: WakeLockSentinel | null = null

export async function holdScreenOn() {
  try {
    sentinel = (await navigator.wakeLock?.request('screen')) ?? null
  } catch {
    sentinel = null
  }
}

export function releaseScreen() {
  void sentinel?.release().catch(() => {})
  sentinel = null
}
