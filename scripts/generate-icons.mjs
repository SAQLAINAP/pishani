/*
 * One SVG (public/favicon.svg) → every raster icon: the PWA manifest icons
 * and the Android launcher mipmaps. Adapted from resume-forge.
 *
 *   npm run icons
 *
 * Android adaptive icons layer a foreground over a flat background colour
 * (res/values/ic_launcher_background.xml = concrete #d4d0c8), so the
 * foreground raster is the slab mark with the concrete ground stripped out.
 * The mark sits inside the central ~66% safe zone, so launcher masks
 * (circle, squircle, teardrop) never clip it.
 */
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const RES = join(ROOT, 'android', 'app', 'src', 'main', 'res')

const DENSITIES = [
  ['mdpi', 48, 108],
  ['hdpi', 72, 162],
  ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324],
  ['xxxhdpi', 192, 432],
]

const png = (svg, size, out, bg) =>
  sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: bg ?? { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(out)

async function round(svg, size, out) {
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  )
  const base = await sharp(svg, { density: 384 }).resize(size, size).png().toBuffer()
  await sharp(base).composite([{ input: mask, blend: 'dest-in' }]).png().toFile(out)
}

const svg = await readFile(join(ROOT, 'public', 'favicon.svg'))
await png(svg, 192, join(ROOT, 'public', 'icon-192.png'))
await png(svg, 512, join(ROOT, 'public', 'icon-512.png'))
console.log('public/icon-{192,512}.png')

if (existsSync(RES)) {
  // Strip the concrete ground and board lines — everything before the shadow slab.
  const text = svg.toString('utf8')
  const fg = Buffer.from(text.replace(/<!-- Concrete ground -->[\s\S]*?<!-- Cantilever/, '<!-- Cantilever'))
  for (const [name, legacy, fgSize] of DENSITIES) {
    const dir = join(RES, `mipmap-${name}`)
    await mkdir(dir, { recursive: true })
    await png(svg, legacy, join(dir, 'ic_launcher.png'))
    await round(svg, legacy, join(dir, 'ic_launcher_round.png'))
    // The foreground canvas is 108dp. The slab covers ~65% of the SVG, so
    // rendering the SVG at 92dp puts the slab at ~60dp — inside the 66dp
    // safe circle every launcher mask preserves.
    const inner = Math.round((fgSize * 92) / 108)
    const mark = await sharp(fg, { density: 384 }).resize(inner, inner).png().toBuffer()
    const pad = Math.round((fgSize - inner) / 2)
    await sharp({ create: { width: fgSize, height: fgSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: mark, left: pad, top: pad }])
      .png({ compressionLevel: 9 })
      .toFile(join(dir, 'ic_launcher_foreground.png'))
    console.log(`mipmap-${name}/`)
  }

  // Splash screens: flat concrete with the slab mark centred at ~28% of the
  // short side. Sizes are read from the existing files so every density and
  // orientation bucket Capacitor ships is covered.
  const { readdir } = await import('node:fs/promises')
  for (const dir of (await readdir(RES)).filter((d) => d.startsWith('drawable'))) {
    const file = join(RES, dir, 'splash.png')
    if (!existsSync(file)) continue
    const { width, height } = await sharp(file).metadata()
    const side = Math.round(Math.min(width, height) * 0.28)
    const mark = await sharp(fg, { density: 384 }).resize(side, side).png().toBuffer()
    const out = await sharp({ create: { width, height, channels: 4, background: '#d4d0c8' } })
      .composite([{ input: mark, left: Math.round((width - side) / 2), top: Math.round((height - side) / 2) }])
      .png({ compressionLevel: 9 })
      .toBuffer()
    await sharp(out).toFile(file)
    console.log(`${dir}/splash.png ${width}x${height}`)
  }
} else {
  console.log('android/ not found — skipped mipmaps (run `npx cap add android` first)')
}
