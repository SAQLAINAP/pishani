import { useId } from 'react'

/**
 * Simplified, hand-drawn-in-code logo sketches for the Taglines & Logos quiz.
 * These are deliberately *representations* — geometric approximations in
 * brand colours, not the trademarked artwork itself — so nothing copyrighted
 * is bundled. Logos too detailed to sketch fairly are asked as text instead.
 *
 * Every sketch sits on its own paper tile (viewBox 0 0 100 100) so brand
 * colours read the same in light and dark mode.
 */
type Draw = (uid: string) => React.JSX.Element

const LOGOS: Record<string, Draw> = {
  nike: () => (
    <path d="M8 62C20 78 40 76 92 36C60 58 34 70 22 64C16 61 14 56 18 48C10 54 6 58 8 62Z" fill="#111" />
  ),
  adidas: () => (
    <g fill="#111">
      <polygon points="14,80 28,80 40,58 26,58" />
      <polygon points="34,80 48,80 69,42 55,42" />
      <polygon points="54,80 68,80 98,26 84,26" />
    </g>
  ),
  mcdonalds: () => (
    <>
      <rect x="6" y="6" width="88" height="88" fill="#DA291C" />
      <path d="M20 84C20 22 46 22 50 62C54 22 80 22 80 84" stroke="#FFC72C" strokeWidth="12" fill="none" />
    </>
  ),
  apple: (uid) => (
    <>
      <defs>
        <mask id={`bite${uid}`}>
          <rect width="100" height="100" fill="#fff" />
          <circle cx="86" cy="46" r="11" fill="#000" />
        </mask>
      </defs>
      <path
        d="M50 32C40 24 18 26 18 52C18 74 34 90 44 88C48 87 52 87 56 88C66 90 82 72 82 54C82 36 66 24 50 32Z"
        fill="#555"
        mask={`url(#bite${uid})`}
      />
      <path d="M50 28C50 16 58 9 65 9C65 19 58 26 50 28Z" fill="#555" />
    </>
  ),
  olympics: () => (
    <g fill="none" strokeWidth="4">
      <circle cx="22" cy="42" r="13" stroke="#0081C8" />
      <circle cx="50" cy="42" r="13" stroke="#111" />
      <circle cx="78" cy="42" r="13" stroke="#EE334E" />
      <circle cx="36" cy="56" r="13" stroke="#FCB131" />
      <circle cx="64" cy="56" r="13" stroke="#00A651" />
    </g>
  ),
  mercedes: () => (
    <>
      <circle cx="50" cy="50" r="40" fill="none" stroke="#8a8d91" strokeWidth="5" />
      <polygon points="50,12 55,47 83,69 50,55 17,69 45,47" fill="#8a8d91" />
    </>
  ),
  audi: () => (
    <g fill="none" stroke="#6b6e72" strokeWidth="4.5">
      <circle cx="23" cy="50" r="14" />
      <circle cx="41" cy="50" r="14" />
      <circle cx="59" cy="50" r="14" />
      <circle cx="77" cy="50" r="14" />
    </g>
  ),
  mitsubishi: () => (
    <g fill="#E60012">
      <polygon points="50,52 40,35 50,18 60,35" />
      <polygon points="50,52 30.3,51.8 20.6,69 40.3,69.2" />
      <polygon points="50,52 69.7,51.8 79.4,69 59.7,69.2" />
    </g>
  ),
  toyota: () => (
    <g fill="none" stroke="#C00" strokeWidth="5">
      <ellipse cx="50" cy="50" rx="40" ry="27" />
      <ellipse cx="50" cy="38" rx="26" ry="10" />
      <ellipse cx="50" cy="53" rx="10" ry="23" />
    </g>
  ),
  mastercard: () => (
    <>
      <circle cx="38" cy="50" r="22" fill="#EB001B" />
      <circle cx="62" cy="50" r="22" fill="#F79E1B" />
      <path d="M50 31.56A22 22 0 0 1 50 68.44A22 22 0 0 1 50 31.56Z" fill="#FF5F00" />
    </>
  ),
  target: () => (
    <>
      <circle cx="50" cy="50" r="40" fill="#CC0000" />
      <circle cx="50" cy="50" r="27" fill="#fff" />
      <circle cx="50" cy="50" r="14" fill="#CC0000" />
    </>
  ),
  pepsi: () => (
    <>
      <circle cx="50" cy="50" r="38" fill="#fff" stroke="#004B93" strokeWidth="2" />
      <path d="M12 46A38 38 0 0 1 88 42C66 40 40 50 12 46Z" fill="#E32934" />
      <path d="M12 54C36 60 66 50 88 48A38 38 0 0 1 12 54Z" fill="#004B93" />
    </>
  ),
  bmw: () => (
    <>
      <circle cx="50" cy="50" r="40" fill="#111" />
      <circle cx="50" cy="50" r="26" fill="#fff" />
      <path d="M50 50L50 24A26 26 0 0 0 24 50Z" fill="#0066B1" />
      <path d="M50 50L50 76A26 26 0 0 0 76 50Z" fill="#0066B1" />
    </>
  ),
  chevrolet: () => (
    <polygon
      points="8,40 36,40 40,30 60,30 64,40 92,40 86,60 64,60 60,70 40,70 36,60 14,60"
      fill="#D1A63C"
      stroke="#6b5317"
      strokeWidth="3"
    />
  ),
  microsoft: () => (
    <>
      <rect x="16" y="16" width="32" height="32" fill="#F25022" />
      <rect x="52" y="16" width="32" height="32" fill="#7FBA00" />
      <rect x="16" y="52" width="32" height="32" fill="#00A4EF" />
      <rect x="52" y="52" width="32" height="32" fill="#FFB900" />
    </>
  ),
  youtube: () => (
    <>
      <rect x="10" y="24" width="80" height="52" rx="14" fill="#FF0000" />
      <polygon points="42,38 64,50 42,62" fill="#fff" />
    </>
  ),
  instagram: (uid) => (
    <>
      <defs>
        <linearGradient id={`ig${uid}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset="0.35" stopColor="#FA7E1E" />
          <stop offset="0.6" stopColor="#D62976" />
          <stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#ig${uid})`} strokeWidth="7">
        <rect x="18" y="18" width="64" height="64" rx="20" />
        <circle cx="50" cy="50" r="15" />
      </g>
      <circle cx="68" cy="32" r="4.5" fill="#D62976" />
    </>
  ),
  spotify: () => (
    <>
      <circle cx="50" cy="50" r="40" fill="#1DB954" />
      <g fill="none" stroke="#111" strokeLinecap="round">
        <path d="M26 40Q50 30 76 42" strokeWidth="7" />
        <path d="M30 54Q50 46 72 56" strokeWidth="6" />
        <path d="M34 66Q50 60 68 68" strokeWidth="5" />
      </g>
    </>
  ),
  android: () => (
    <>
      <path d="M22 64A28 28 0 0 1 78 64Z" fill="#3DDC84" />
      <circle cx="38" cy="52" r="3.5" fill="#fff" />
      <circle cx="62" cy="52" r="3.5" fill="#fff" />
      <path d="M34 42L26 30M66 42L74 30" stroke="#3DDC84" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  dominos: () => (
    <g transform="rotate(-35 50 50)">
      <rect x="32" y="14" width="36" height="36" fill="#E31837" />
      <rect x="32" y="50" width="36" height="36" fill="#006491" />
      <circle cx="50" cy="32" r="5.5" fill="#fff" />
      <circle cx="42" cy="60" r="5.5" fill="#fff" />
      <circle cx="58" cy="76" r="5.5" fill="#fff" />
    </g>
  ),
  amazon: () => (
    <>
      <path d="M14 48Q50 74 82 50" stroke="#FF9900" strokeWidth="7" fill="none" strokeLinecap="round" />
      <polygon points="90,44 74,42 84,56" fill="#FF9900" />
    </>
  ),
  tata: () => (
    <>
      <ellipse cx="50" cy="50" rx="36" ry="28" fill="none" stroke="#486AAE" strokeWidth="6" />
      <path d="M22 40Q50 26 78 40" stroke="#486AAE" strokeWidth="6" fill="none" />
      <path d="M50 34V76" stroke="#486AAE" strokeWidth="8" />
    </>
  ),
  chrome: () => (
    <>
      <path d="M50 50L17.1 31A38 38 0 0 1 82.9 31Z" fill="#DB4437" />
      <path d="M50 50L82.9 31A38 38 0 0 1 50 88Z" fill="#F4B400" />
      <path d="M50 50L50 88A38 38 0 0 1 17.1 31Z" fill="#0F9D58" />
      <circle cx="50" cy="50" r="17" fill="#fff" />
      <circle cx="50" cy="50" r="13" fill="#4285F4" />
    </>
  ),
  hyundai: () => (
    <>
      <ellipse cx="50" cy="50" rx="40" ry="27" fill="none" stroke="#002C5F" strokeWidth="5" />
      <g fill="#002C5F">
        <polygon points="30,66 38,66 48,34 40,34" />
        <polygon points="56,66 64,66 74,34 66,34" />
        <polygon points="38,54 66,44 64,50 36,60" />
      </g>
    </>
  ),
  dropbox: () => (
    <g fill="#0061FF">
      {[
        [34, 30],
        [66, 30],
        [34, 52],
        [66, 52],
      ].map(([cx, cy]) => (
        <polygon key={`${cx}${cy}`} points={`${cx},${cy - 11} ${cx + 16},${cy} ${cx},${cy + 11} ${cx - 16},${cy}`} />
      ))}
      <polygon points="50,64 64,72 50,80 36,72" />
    </g>
  ),
}

export const LOGO_IDS = Object.keys(LOGOS)

export function LogoArt({ id }: { id: string }) {
  const uid = useId().replace(/:/g, '')
  const draw = LOGOS[id]
  if (!draw) return null
  return (
    <svg className="logo-art" viewBox="0 0 100 100" role="img" aria-label="Logo clue">
      <rect width="100" height="100" fill="#f4f1ea" />
      {draw(uid)}
    </svg>
  )
}
