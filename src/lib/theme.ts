import { store, type Theme } from '../store/storage'

const META: Record<'light' | 'dark', string> = { light: '#efece6', dark: '#141412' }

function resolve(pref: Theme): 'light' | 'dark' {
  if (pref !== 'system') return pref
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply() {
  const t = resolve(store.get().settings.theme)
  document.documentElement.dataset.theme = t
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META[t])
}

/**
 * Resolves the Theme setting to data-theme on <html>. Runs before the first
 * render (no flash), follows the OS while on "system", and re-applies
 * whenever the setting changes.
 */
export function initTheme() {
  apply()
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply)
  store.subscribe(apply)
}
