export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Not supported (iOS Safari) — sound and colour carry the feedback.
  }
}
