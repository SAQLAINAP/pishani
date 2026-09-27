import { describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn(), exitApp: vi.fn() } }))
vi.mock('./platform', () => ({ isNative: false }))

import { renderHook } from './testing'
import { _backStackSize, _dispatchBack, useBack } from './back'

describe('back stack', () => {
  it('only the top-most handler runs, and unmounting pops it', () => {
    const home = vi.fn()
    const sheet = vi.fn()
    const a = renderHook(() => useBack(home))
    const b = renderHook(() => useBack(sheet))
    _dispatchBack()
    expect(sheet).toHaveBeenCalledTimes(1)
    expect(home).not.toHaveBeenCalled()
    b.unmount()
    _dispatchBack()
    expect(home).toHaveBeenCalledTimes(1)
    a.unmount()
    expect(_backStackSize()).toBe(0)
  })

  it('an inactive handler is not registered', () => {
    const fn = vi.fn()
    const h = renderHook(() => useBack(fn, false))
    _dispatchBack()
    expect(fn).not.toHaveBeenCalled()
    h.unmount()
  })
})
