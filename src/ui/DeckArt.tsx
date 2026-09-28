/**
 * One geometric pictogram per deck, drawn like a civic-building poster:
 * flat masses, hard edges, one red accent. Everything is currentColor (the
 * slab's text colour), a 30% tint of it, or --art-accent (red; white on the
 * red MIX slab), so each piece re-colours itself for every slab tone and for
 * dark mode. Cut-outs are even-odd paths, so the slab's own concrete shows
 * through the holes instead of a painted-on fake background.
 *
 * viewBox is 120×72 for every piece.
 */

const F = 'currentColor'
const A = 'var(--art-accent)'
const T = { fill: 'currentColor', opacity: 0.3 } // tint

/** Path fragments for even-odd compound shapes. */
const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`
const circ = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
const Cut = ({ d, fill = F }: { d: string; fill?: string }) => <path d={d} fill={fill} fillRule="evenodd" />

const ART: Record<string, () => React.JSX.Element> = {
  // Art-deco single-screen cinema: stepped tower, bulb marquee, three doors.
  'movies-in': () => (
    <>
      <rect x="20" y="24" width="80" height="48" {...T} />
      <rect x="51" y="2" width="18" height="14" fill={F} />
      <rect x="42" y="14" width="36" height="10" fill={F} />
      <Cut
        d={
          rect(14, 28, 92, 13) +
          Array.from({ length: 11 }, (_, i) => circ(20 + i * 8, 34.5, 1.9)).join('')
        }
        fill={A}
      />
      <rect x="32" y="50" width="14" height="22" fill={F} />
      <rect x="53" y="50" width="14" height="22" fill={F} />
      <rect x="74" y="50" width="14" height="22" fill={F} />
    </>
  ),

  // Film reel unspooling into a strip, with a play button.
  'movies-intl': () => (
    <>
      <Cut
        d={
          circ(34, 32, 26) +
          [0, 72, 144, 216, 288]
            .map((a) => circ(34 + 14 * Math.cos((a * Math.PI) / 180), 32 + 14 * Math.sin((a * Math.PI) / 180), 5))
            .join('') +
          circ(34, 32, 3)
        }
      />
      <Cut d={rect(34, 54, 86, 16) + Array.from({ length: 8 }, (_, i) => rect(62 + i * 7, 58, 4, 8)).join('')} />
      <polygon points="80,6 108,22 80,38" fill={A} />
    </>
  ),

  // Stage: curtains, a spotlight beam, a star on the boards.
  'actors-in': () => (
    <>
      <polygon points="50,6 70,6 102,64 18,64" {...T} />
      <rect x="46" y="0" width="28" height="8" fill={F} />
      <rect x="0" y="0" width="12" height="64" fill={F} />
      <rect x="108" y="0" width="12" height="64" fill={F} />
      <rect x="0" y="64" width="120" height="8" fill={F} />
      <polygon
        points="60,30 64.4,40.9 76.2,41.5 67,48.9 70.1,60.3 60,53.8 49.9,60.3 53,48.9 43.8,41.5 55.6,40.9"
        fill={A}
      />
    </>
  ),

  // Twin-reel film camera on a tripod.
  'actors-intl': () => (
    <>
      <Cut d={circ(38, 15, 13) + circ(38, 15, 4)} />
      <Cut d={circ(66, 15, 13) + circ(66, 15, 4)} />
      <rect x="22" y="28" width="60" height="30" fill={F} />
      <polygon points="82,34 108,24 108,62 82,52" fill={A} />
      <polygon points="44,58 51,58 41,72 34,72" fill={F} />
      <polygon points="56,58 63,58 73,72 66,72" fill={F} />
    </>
  ),

  // Ribbon mic, sound waves, a note.
  'singers-in': () => (
    <>
      <Cut d={circ(38, 22, 17) + rect(27, 15, 22, 3) + rect(25, 21, 26, 3) + rect(27, 27, 22, 3)} />
      <rect x="34" y="39" width="8" height="24" fill={F} />
      <rect x="24" y="64" width="28" height="6" fill={F} />
      <path d="M64 10a20 20 0 0 1 0 26M74 2a31 31 0 0 1 0 42" stroke={A} strokeWidth="5" fill="none" />
      <circle cx="96" cy="60" r="7" fill={A} />
      <rect x="100" y="28" width="4" height="32" fill={A} />
      <rect x="100" y="28" width="14" height="5" fill={A} />
    </>
  ),

  // CRT set with rabbit ears, playing.
  'series-tv': () => (
    <>
      <path d="M60 16 44 2M60 16 76 2" stroke={F} strokeWidth="4" />
      <Cut d={rect(16, 16, 88, 50) + circ(94, 30, 4) + circ(94, 44, 4)} />
      <rect x="24" y="23" width="58" height="36" fill={A} />
      <polygon points="46,31 62,41 46,51" fill={F} />
      <rect x="26" y="66" width="8" height="6" fill={F} />
      <rect x="86" y="66" width="8" height="6" fill={F} />
    </>
  ),

  // Thali from above: steel rim, katoris, a roti.
  'foods-in': () => (
    <>
      <circle cx="60" cy="36" r="34" {...T} />
      <Cut d={circ(60, 36, 34) + circ(60, 36, 30)} />
      <circle cx="60" cy="15" r="8" fill={F} />
      <circle cx="80" cy="24" r="8" fill={A} />
      <circle cx="84" cy="45" r="8" fill={F} />
      <circle cx="68" cy="60" r="7" fill={F} />
      <Cut d={circ(44, 42, 14) + circ(44, 42, 10)} />
    </>
  ),

  // A slice with pepperoni, hard shadow behind.
  'foods-intl': () => (
    <>
      <polygon points="26,14 106,14 66,72" {...T} />
      <polygon points="20,8 100,8 60,66" fill={F} />
      <rect x="16" y="2" width="88" height="10" fill={F} />
      <circle cx="46" cy="24" r="6" fill={A} />
      <circle cx="72" cy="22" r="5" fill={A} />
      <circle cx="60" cy="42" r="5.5" fill={A} />
    </>
  ),

  // Skyline with lit windows against a red sun.
  cities: () => (
    <>
      <circle cx="90" cy="20" r="15" fill={A} />
      <rect x="2" y="36" width="16" height="36" fill={F} />
      <Cut d={rect(20, 18, 16, 54) + [24, 32, 40, 48, 56].map((y) => rect(24, y, 3, 4) + rect(29, y, 3, 4)).join('')} />
      <rect x="38" y="40" width="18" height="32" {...T} />
      <Cut d={rect(56, 8, 14, 64) + [14, 22, 30, 38, 46, 54].map((y) => rect(61, y, 4, 4)).join('')} />
      <rect x="72" y="30" width="20" height="42" fill={F} />
      <rect x="94" y="46" width="24" height="26" {...T} />
    </>
  ),

  // Wireframe globe with a flag planted on it.
  countries: () => (
    <>
      <circle cx="46" cy="38" r="30" {...T} />
      <g stroke={F} strokeWidth="3.5" fill="none">
        <circle cx="46" cy="38" r="30" />
        <ellipse cx="46" cy="38" rx="12" ry="30" />
        <path d="M16 38h60M20 24h52M20 52h52M46 8v60" />
      </g>
      <rect x="86" y="4" width="4" height="46" fill={F} />
      <polygon points="90,4 116,11 90,19" fill={A} />
      <rect x="80" y="48" width="16" height="4" fill={F} />
    </>
  ),

  // Pyramid, domed tomb and lattice tower under one sun.
  landmarks: () => (
    <>
      <circle cx="104" cy="14" r="10" fill={A} />
      <polygon points="2,72 30,30 58,72" {...T} />
      <polygon points="30,30 58,72 30,72" fill={F} />
      <path d="M62 42Q62 22 76 14Q90 22 90 42Z" fill={F} />
      <rect x="75" y="4" width="2" height="10" fill={F} />
      <Cut d={rect(60, 42, 32, 30) + 'M70 72V58a6 6 0 0 1 12 0V72Z'} />
      <Cut d={'M104 28h2l12 44h-26Z' + 'M99 72v-6a6 6 0 0 1 12 0v6Z'} />
    </>
  ),

  // Price tag with a barcode.
  'brands-in': () => (
    <>
      <polygon points="26,24 76,24 96,44 76,64 26,64" {...T} />
      <Cut d={'M20 18h50l20 20-20 20H20Z' + circ(76, 38, 4)} fill={A} />
      {[
        [26, 3],
        [31, 2],
        [35, 4],
        [41, 2],
        [45, 3],
        [50, 2],
        [54, 5],
        [61, 2],
      ].map(([x, w]) => (
        <rect key={x} x={x} y="26" width={w} height="24" fill={F} />
      ))}
    </>
  ),

  // Shopping bag with a round logo.
  'brands-intl': () => (
    <>
      <rect x="37" y="30" width="60" height="42" {...T} />
      <path d="M46 26v-8a14 14 0 0 1 28 0v8" stroke={F} strokeWidth="5" fill="none" />
      <rect x="30" y="24" width="60" height="44" fill={F} />
      <circle cx="60" cy="46" r="13" fill={A} />
    </>
  ),

  // Bat, ball, stumps.
  sports: () => (
    <>
      <rect x="78" y="20" width="5" height="50" fill={F} />
      <rect x="88" y="20" width="5" height="50" fill={F} />
      <rect x="98" y="20" width="5" height="50" fill={F} />
      <rect x="76" y="15" width="29" height="4" fill={F} />
      <polygon points="10,62 20,70 52,30 42,22" fill={F} />
      <polygon points="45,25 50,29 62,14 57,10" {...T} />
      <circle cx="62" cy="58" r="9" fill={A} />
      <path d="M55 52q7 6 14 12" stroke={F} strokeWidth="1.5" fill="none" />
    </>
  ),

  // Two paw prints walking off the slab.
  animals: () => (
    <>
      <circle cx="44" cy="50" r="17" fill={F} />
      <circle cx="22" cy="30" r="7.5" fill={F} />
      <circle cx="36" cy="18" r="7.5" fill={F} />
      <circle cx="53" cy="18" r="7.5" fill={F} />
      <circle cx="67" cy="30" r="7.5" fill={F} />
      <circle cx="98" cy="30" r="9" fill={A} />
      <circle cx="86" cy="18" r="4" fill={A} />
      <circle cx="94" cy="11" r="4" fill={A} />
      <circle cx="103" cy="11" r="4" fill={A} />
      <circle cx="111" cy="18" r="4" fill={A} />
    </>
  ),

  // A sprinter built from thick strokes, with speed lines.
  actions: () => (
    <>
      <rect x="6" y="24" width="26" height="4" {...T} />
      <rect x="0" y="34" width="34" height="4" {...T} />
      <rect x="10" y="44" width="22" height="4" {...T} />
      <circle cx="74" cy="11" r="8" fill={A} />
      <path
        d="M70 22 58 44M66 28l14 8 10-6M66 28l-12 6-8-6M58 44l14 12-4 14M58 44 48 58l-14 2"
        stroke={F}
        strokeWidth="7"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
    </>
  ),

  // A lightbulb moment: glass, screw base, red rays.
  gk: () => (
    <>
      <circle cx="66" cy="30" r="22" {...T} />
      <circle cx="60" cy="26" r="22" fill={F} />
      <rect x="48" y="44" width="24" height="10" fill={F} />
      <rect x="50" y="56" width="20" height="4" fill={F} />
      <rect x="52" y="62" width="16" height="4" fill={F} />
      <rect x="56" y="68" width="8" height="4" fill={F} />
      <g fill={A}>
        <rect x="14" y="24" width="16" height="5" />
        <rect x="90" y="24" width="16" height="5" />
        <polygon points="24,4 28,1 38,13 34,16" />
        <polygon points="96,4 92,1 82,13 86,16" />
      </g>
      <rect x="50" y="16" width="6" height="16" fill="var(--art-accent)" opacity="0.9" />
    </>
  ),

  // A monitor showing </>.
  tech: () => (
    <>
      <Cut d={rect(18, 4, 84, 52) + rect(24, 10, 72, 40)} />
      <rect x="54" y="56" width="12" height="8" fill={F} />
      <rect x="40" y="64" width="40" height="6" fill={F} />
      <g fill={A}>
        <polygon points="46,20 34,30 46,40 49,36 41,30 49,24" />
        <polygon points="74,20 86,30 74,40 71,36 79,30 71,24" />
        <polygon points="63,16 67,17 57,44 53,43" />
      </g>
    </>
  ),

  // A medical cross and a heartbeat trace.
  health: () => (
    <>
      <rect x="44" y="2" width="36" height="36" {...T} />
      <Cut d={'M52 6h20v12h12v20H72v12H52V38H40V18h12Z'} fill={A} />
      <path d="M0 62h30l6-12 8 20 8-26 8 18h60" stroke={F} strokeWidth="5" fill="none" strokeLinejoin="miter" />
    </>
  ),

  // Rising bars and an arrow breaking out of them.
  finance: () => (
    <>
      <rect x="8" y="48" width="16" height="24" fill={F} />
      <rect x="30" y="36" width="16" height="36" fill={F} />
      <rect x="52" y="26" width="16" height="46" {...T} />
      <rect x="74" y="12" width="16" height="60" fill={F} />
      <path d="M6 40 34 22l18 10L96 6" stroke={A} strokeWidth="6" fill="none" />
      <polygon points="100,2 86,4 96,16" fill={A} />
    </>
  ),

  // A classical facade: red pediment, four columns, a stepped base.
  history: () => (
    <>
      <polygon points="18,24 60,4 102,24" fill={A} />
      <rect x="18" y="24" width="84" height="6" fill={F} />
      {[24, 44, 64, 84].map((x) => (
        <rect key={x} x={x} y="32" width="10" height="30" fill={F} />
      ))}
      <rect x="14" y="62" width="92" height="5" fill={F} />
      <rect x="8" y="67" width="104" height="5" {...T} />
    </>
  ),

  // A speech bubble with big quote marks.
  taglines: () => (
    <>
      <polygon points="24,12 108,12 108,52 60,52 44,70 46,52 24,52" {...T} />
      <polygon points="16,6 100,6 100,46 52,46 36,64 38,46 16,46" fill={F} />
      <g fill={A}>
        <rect x="36" y="16" width="10" height="10" />
        <polygon points="36,26 46,26 40,36 34,36" />
        <rect x="52" y="16" width="10" height="10" />
        <polygon points="52,26 62,26 56,36 50,36" />
      </g>
    </>
  ),

  // Three cards fanned out, the top one a question.
  mix: () => (
    <>
      <rect x="30" y="10" width="36" height="52" transform="rotate(-16 48 36)" {...T} />
      <rect x="42" y="8" width="36" height="52" transform="rotate(-4 60 34)" fill={F} />
      <rect x="54" y="10" width="36" height="52" transform="rotate(10 72 36)" fill={A} />
      <text
        x="72"
        y="48"
        transform="rotate(10 72 36)"
        textAnchor="middle"
        fontSize="34"
        fontWeight="900"
        fill="var(--red)"
        style={{ fontFamily: 'var(--sans)' }}
      >
        ?
      </text>
    </>
  ),
}

export function DeckArt({ id }: { id: string }) {
  const Art = ART[id]
  if (!Art) return null
  return (
    <svg className="deck-art" viewBox="0 0 120 72" aria-hidden="true" preserveAspectRatio="xMinYMid meet">
      <Art />
    </svg>
  )
}

/** Exposed for the deck-integrity test: every deck must have a picture. */
export const ART_IDS = Object.keys(ART)
