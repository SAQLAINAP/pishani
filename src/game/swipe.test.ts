import { describe, expect, it } from 'vitest'
import { classifySwipe } from './swipe'

describe('classifySwipe', () => {
  it('down is correct, up is pass', () => {
    expect(classifySwipe(0, 120, 200)).toBe('correct')
    expect(classifySwipe(0, -120, 200)).toBe('pass')
  })
  it('ignores short slow drags and taps', () => {
    expect(classifySwipe(0, 30, 400)).toBeNull()
    expect(classifySwipe(0, 0, 50)).toBeNull()
  })
  it('accepts a short fast flick', () => {
    expect(classifySwipe(0, 40, 50)).toBe('correct')
  })
  it('ignores mostly-horizontal drags', () => {
    expect(classifySwipe(150, 90, 200)).toBeNull()
  })
})
