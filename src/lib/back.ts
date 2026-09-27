import { App as CapApp } from '@capacitor/app'
import { useEffect, useRef } from 'react'
import { isNative } from './platform'

/**
 * One back-button pipeline for Android (hardware back / edge swipe) and the
 * browser (back button / gesture).
 *
 * Whatever is on top of the screen — an open sheet, a dialog, the current
 * view — registers a handler; only the most recently registered one runs.
 * Children mount after their parents, so a sheet opened over Home naturally
 * sits above Home's handler.
 *
 * Native: Capacitor's backButton event replaces the default "close the app".
 * Web: a single sentinel history entry catches back; it is re-armed after
 * every press so the page never navigates away on its own.
 */
type Handler = () => void
const stack: Handler[] = []

function dispatch() {
  stack[stack.length - 1]?.()
}

let started = false
export function initBack() {
  if (started) return
  started = true
  if (isNative) {
    void CapApp.addListener('backButton', dispatch)
    return
  }
  history.pushState({ pishani: 'sentinel' }, '')
  window.addEventListener('popstate', () => {
    if (leaving) return
    history.pushState({ pishani: 'sentinel' }, '')
    dispatch()
  })
}

let leaving = false
/** Quit for real: close the Android app, or step the browser back past us. */
export function exitApp() {
  if (isNative) {
    void CapApp.exitApp()
    return
  }
  leaving = true
  history.go(-2)
}

/** Register `fn` as the back handler while `active` is true. */
export function useBack(fn: Handler, active = true) {
  const ref = useRef(fn)
  useEffect(() => {
    ref.current = fn
  })
  useEffect(() => {
    if (!active) return
    const h: Handler = () => ref.current()
    stack.push(h)
    return () => {
      const i = stack.lastIndexOf(h)
      if (i >= 0) stack.splice(i, 1)
    }
  }, [active])
}

/** Test hook. */
export const _backStackSize = () => stack.length
export const _dispatchBack = dispatch
