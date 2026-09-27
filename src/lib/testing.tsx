import { act } from 'react'
import { createRoot } from 'react-dom/client'

// React needs this flag to run act() outside a test framework integration.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** Minimal renderHook — enough to mount a hook and unmount it again. */
export function renderHook(hook: () => void) {
  function Probe() {
    hook()
    return null
  }
  const root = createRoot(document.createElement('div'))
  act(() => root.render(<Probe />))
  return { unmount: () => act(() => root.unmount()) }
}
