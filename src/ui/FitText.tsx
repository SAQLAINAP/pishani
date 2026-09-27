import { useLayoutEffect, useRef } from 'react'

/**
 * Sets the largest font size at which `text` fits its box without breaking
 * a word — "Dilwale Dulhania Le Jayenge" and "Goa" both fill the slab.
 * Binary search on font-size, re-run on resize and once webfonts land.
 */
export function FitText({ text, className = '' }: { text: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const b = box.current
    const el = inner.current
    if (!b || !el) return

    const fit = () => {
      const cs = getComputedStyle(b)
      const w = b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const h = b.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      if (w <= 0 || h <= 0) return
      let lo = 12
      let hi = Math.max(lo, Math.min(h, 480))
      while (hi - lo > 1) {
        const mid = (lo + hi) / 2
        el.style.fontSize = `${mid}px`
        const fits = el.scrollWidth <= w + 0.5 && el.scrollHeight <= h + 0.5
        if (fits) lo = mid
        else hi = mid
      }
      el.style.fontSize = `${Math.floor(lo)}px`
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(b)
    void document.fonts?.ready.then(fit)
    return () => ro.disconnect()
  }, [text])

  return (
    <div className="fit" ref={box}>
      <div className={`fit-text ${className}`} ref={inner} style={{ width: '100%' }}>
        {text}
      </div>
    </div>
  )
}
