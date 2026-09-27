const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.5,
  strokeLinecap: 'square' as const,
  strokeLinejoin: 'miter' as const,
}

export const GearIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <rect x="8" y="8" width="8" height="8" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
  </svg>
)

export const CloseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
)
