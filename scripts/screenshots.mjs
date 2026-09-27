/*
 * Regenerates docs/screenshots/*.webp for the README by driving the real app
 * in headless Chrome at phone, landscape and tablet sizes. WebP at 2x: the
 * concrete grain makes PNGs ~2 MB each.
 *
 * puppeteer-core is installed with --no-save to keep it out of the app's
 * dependency graph:
 *
 *   npm install --no-save puppeteer-core
 *   npm run dev -- --port 5199 &
 *   npm run screenshots            # or: OUT=/some/dir npm run screenshots
 */
import puppeteer from 'puppeteer-core'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdir } from 'node:fs/promises'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = process.env.BASE ?? 'http://localhost:5199'
const OUT = process.env.OUT ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'screenshots')

const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
const LAND = { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true }
const SMALL = { width: 320, height: 568, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
const TABLET = { width: 1024, height: 1366, deviceScaleFactor: 2, isMobile: true, hasTouch: true }

// A lived-in save so the deck slabs show best scores.
const SEED = {
  v: 0,
  settings: { sound: false, vibration: true, sensitivity: 'med', mode: 'swipe', seconds: 60 },
  best: { mix: 17, 'movies-in': 14, 'foods-in': 11, cities: 9, 'actors-in': 12, actions: 8 },
  history: [],
  seen: {},
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function open(browser, viewport) {
  const page = await browser.newPage()
  await page.setViewport(viewport)
  await page.evaluateOnNewDocument((seed) => {
    if (!localStorage.getItem('pishani:v0')) localStorage.setItem('pishani:v0', JSON.stringify(seed))
  }, SEED)
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  return page
}

const shot = (page, name) => page.screenshot({ path: join(OUT, `${name}.webp`), type: 'webp', quality: 82 }).then(() => console.log(name))

async function clickText(page, selector, text) {
  await page.evaluate(
    (sel, t) => [...document.querySelectorAll(sel)].find((el) => el.textContent.includes(t))?.click(),
    selector,
    text,
  )
}

await mkdir(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
try {
  // Phone portrait: home, setup sheet, results.
  let page = await open(browser, PHONE)
  await shot(page, '01-home')
  await page.evaluate(() => window.scrollTo(0, 900))
  await sleep(200)
  await shot(page, '02-home-scrolled')
  await page.evaluate(() => window.scrollTo(0, 0))
  await clickText(page, 'button.deck', 'Movies')
  await sleep(350)
  await shot(page, '03-setup')
  await page.close()

  // Landscape play — this is how a round actually looks on a forehead.
  page = await open(browser, LAND)
  await clickText(page, 'button.deck', 'Food')
  await sleep(300)
  await clickText(page, '.seg button', '30')
  await clickText(page, 'button.cta', 'Start')
  await sleep(400)
  await shot(page, '04-ready')
  await page.keyboard.press('Enter')
  await sleep(1100)
  await shot(page, '05-countdown')
  await sleep(2400)
  await shot(page, '06-play')
  await page.keyboard.press('ArrowDown')
  await sleep(120)
  await shot(page, '07-correct')
  await sleep(700)
  for (const k of ['ArrowDown', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowUp', 'ArrowDown', 'ArrowDown']) {
    await page.keyboard.press(k)
    await sleep(700)
  }
  await shot(page, '08-play-2')
  await page.keyboard.press('ArrowUp')
  await sleep(120)
  await shot(page, '09-pass')
  // Wait out the 30 s round.
  await page.waitForSelector('.flood.timeup', { timeout: 40000 })
  await sleep(200)
  await shot(page, '10-timeup')
  await page.waitForSelector('.results', { timeout: 5000 })
  await page.setViewport(PHONE)
  await sleep(500)
  await shot(page, '11-results')
  await page.close()

  page = await open(browser, PHONE)
  await page.click('button[aria-label="Settings"]')
  await sleep(300)
  await shot(page, '12-settings')
  await page.close()

  page = await open(browser, SMALL)
  await shot(page, '13-home-320')
  await page.close()

  page = await open(browser, TABLET)
  await shot(page, '14-home-tablet')
  await page.close()
} finally {
  await browser.close()
}
