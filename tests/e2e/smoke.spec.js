import { expect } from '@playwright/test'
import fs from 'node:fs'
import {
  test,
  ASSETS,
  TEAM_PREFIXES,
  MAGENTA,
  assetExists,
  openApp,
  chooseTeam,
  chooseAsset,
  canvasSize,
  stableRect,
  toClient,
  reaches,
  startDrawing,
  mouseStroke,
  padStroke,
  drawSignature,
  touchStroke,
  inkBox,
  inkNear,
  tileInk,
  exportedInk,
  placementOf,
  pixel,
  overhang,
  pngSize,
  noisePng,
} from './helpers.js'

const soft = expect.configure({ soft: true })

const BRUSH = 10 // brush size in the pad's CSS px

// Horizontal stroke in asset px on the 512x512 Sticker, low and wide so that a pad-to-asset
// scaling error shows up as a vertical offset (centreline) and as ink past the ends.
const FROM = { x: 40, y: 400 }
const TO = { x: 480, y: 400 }

const stage = (page) => page.locator('#mainCanvas')
const signatureBox = (page) => page.locator('#signatureBox')
const chips = (page) => page.getByTestId('layer-chip')

// Ink must sit on the stroke: present at both ends and the midpoint, centred on its y, and
// ending at its endpoints give or take a round cap. `brush` is the stroke width in asset px
// (the pen thins to 60% when moving fast, so a cap is between 30% and 50% of it).
async function expectStrokeAt(page, from, to, brush) {
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
  soft(await inkNear(page, from), `no ink within 3px of the start ${JSON.stringify(from)}`).toBe(true)
  soft(await inkNear(page, mid), `no ink within 3px of the midpoint ${JSON.stringify(mid)}`).toBe(true)
  soft(await inkNear(page, to), `no ink within 3px of the end ${JSON.stringify(to)}`).toBe(true)

  const box = await inkBox(page)
  expect(box, 'no ink on #mainCanvas').not.toBeNull()
  const seen = `ink box ${JSON.stringify(box)} for stroke ${JSON.stringify(from)} -> ${JSON.stringify(to)}`
  const overStart = from.x - box.minX
  const overEnd = box.maxX - to.x
  const cap = brush / 2
  soft(Math.abs((box.minY + box.maxY) / 2 - from.y), `ink centreline is off y=${from.y}; ${seen}`).toBeLessThanOrEqual(3)
  soft(overStart, `ink start is off by ${overStart}px; ${seen}`).toBeGreaterThanOrEqual(-3)
  soft(overStart, `ink start is off by ${overStart}px; ${seen}`).toBeLessThanOrEqual(cap + 3)
  soft(overEnd, `ink end is off by ${overEnd}px; ${seen}`).toBeGreaterThanOrEqual(-3)
  soft(overEnd, `ink end is off by ${overEnd}px; ${seen}`).toBeLessThanOrEqual(cap + 3)
}

// With its default placement, a layer must not run off any asset of the franchise.
async function expectInsideEveryAsset(page, what) {
  for (const key of Object.keys(ASSETS)) {
    await chooseAsset(page, 'ATL', key)
    const out = await overhang(page)
    soft(Math.max(out.left, out.right, out.top, out.bottom), `${what} sticks out of ATL/${key} by px: ${JSON.stringify(out)}`).toBeLessThanOrEqual(1)
  }
}

test.beforeEach(async ({ page }) => {
  await openApp(page)
})

// 1. Assets ----------------------------------------------------------------

test.describe('1. assets', () => {
  test('first visit opens the franchise wall with every franchise', { tag: '@desktop' }, async ({ page }) => {
    const wall = page.getByTestId('franchise-wall')
    const prefixes = await wall.locator('[data-testid^="team-"]').evaluateAll((els) =>
      els.map((el) => el.dataset.testid.slice('team-'.length))
    )
    expect(prefixes.sort()).toEqual(TEAM_PREFIXES)

    await page.getByTestId('wall-close').click()
    await expect(wall).toBeHidden()
    await expect(page.locator('#stage')).toHaveAttribute('data-state', 'empty')
    await expect(page.getByTestId('download')).toBeDisabled()
    await page.getByTestId('franchise-chip').click()
    await expect(wall).toBeVisible()
  })

  for (const team of TEAM_PREFIXES) {
    test(`${team}: available assets load at their size, missing ones show as unavailable`, { tag: '@desktop' }, async ({ page }) => {
      await chooseTeam(page, team)
      await expect.poll(() => canvasSize(page), { message: `${team}: Sticker canvas size` }).toEqual([512, 512])

      const tiles = await page.locator('[data-testid^="asset-"]').evaluateAll((els) =>
        els.map((el) => el.dataset.testid.slice('asset-'.length))
      )
      soft(tiles.sort(), `${team}: kit tiles`).toEqual(Object.keys(ASSETS).sort())

      let available = 0
      for (const [key, spec] of Object.entries(ASSETS)) {
        const pick = page.getByTestId(`asset-${key}`)
        const tile = page.locator(`.kit-tile[data-asset="${key}"]`)
        const where = `${team}/${key}`

        if (!assetExists(team, key)) {
          await soft(pick, `${where} has no file, so it should be aria-disabled`).toHaveAttribute('aria-disabled', 'true')
          await soft(tile, `${where} has no file, so it should be unavailable (not an error)`).toHaveAttribute('data-state', 'unavailable')
          await soft(page.getByTestId(`download-${key}`), `${where} has no file, so no download button`).toBeHidden()
          const before = await stage(page).getAttribute('data-asset')
          await pick.click({ force: true })
          await soft(pick, `${where} became current though it has no file`).not.toHaveAttribute('aria-current', 'true')
          await soft(stage(page), `${where} replaced the stage though it has no file`).toHaveAttribute('data-asset', before)
          continue
        }

        available++
        await soft(pick, `${where} has a file, so it should be enabled`).toHaveAttribute('aria-disabled', 'false')
        await pick.click()
        await soft(stage(page), `${where} did not draw`).toHaveAttribute('data-asset', where)
        await soft(pick, `${where} is not marked current`).toHaveAttribute('aria-current', 'true')
        await soft.poll(() => canvasSize(page), { message: `${where}: canvas size`, timeout: 2_000 }).toEqual([spec.width, spec.height])
      }

      for (const key of Object.keys(ASSETS).filter((k) => assetExists(team, k))) {
        await soft(page.locator(`.kit-tile[data-asset="${key}"]`), `${team}/${key} thumbnail`).toHaveAttribute('data-state', 'ready', { timeout: 10_000 })
      }
      await soft(page.locator('#kitCount')).toHaveText(`${available} of ${Object.keys(ASSETS).length}`)
    })
  }
})

// 2. Drawing accuracy -------------------------------------------------------

// Draws one stroke on the pad over the stage, applies it, and checks where the ink landed.
async function expectPadStrokeLands(page, asset, from, to) {
  expect(await inkBox(page), `${asset} already has magenta in it`).toBeNull()
  await startDrawing(page, { size: BRUSH })
  const art = await stableRect(page, '#mainCanvas')
  const pad = await stableRect(page, '#drawingCanvas')
  for (const k of ['left', 'top', 'width', 'height']) {
    expect(Math.abs(pad[k] - art[k]), `pad ${k} vs the art`).toBeLessThan(1.5)
  }

  const a = await toClient(page, from)
  const b = await toClient(page, to)
  expect(await reaches(page, '#drawingCanvas', a), 'stroke start is not on the pad').toBe(true)
  expect(await reaches(page, '#drawingCanvas', b), 'stroke end is not on the pad').toBe(true)

  await mouseStroke(page, a, b)
  await page.getByTestId('apply').click()
  await expect(signatureBox(page)).toHaveClass(/\bactive\b/)

  await expectStrokeAt(page, from, to, (BRUSH * ASSETS[asset].width) / art.width)
}

test('2. drawing on the pad lands where the pointer is', { tag: '@desktop' }, async ({ page }) => {
  await chooseTeam(page, 'ATL')
  await expectPadStrokeLands(page, 'Sticker', FROM, TO)
})

// The Sticker shows 1:1 at this size; the banner is scaled down 2.8x, so a missing
// pad-to-asset factor only shows here.
test('2b. drawing on a scaled-down banner lands where the pointer is', { tag: '@desktop' }, async ({ page }) => {
  await chooseTeam(page, 'ATL', 'Sticker')
  await chooseAsset(page, 'ATL', 'YoutubeBanner')
  await expectPadStrokeLands(page, 'YoutubeBanner', { x: 200, y: 1100 }, { x: 2300, y: 1100 })
})

// 3. Reset ------------------------------------------------------------------

test('3. reset puts a drawn signature back where it was drawn', { tag: '@desktop' }, async ({ page }) => {
  await chooseTeam(page, 'ATL')
  await drawSignature(page, FROM, TO, { size: BRUSH })

  const slider = page.getByTestId('scale')
  const rectOf = () => stableRect(page, '#signatureBox')
  const sliderBefore = await slider.inputValue()
  const before = await rectOf()
  const scaleBefore = (await placementOf(page)).scale
  expect(before.width).toBeGreaterThan(50)

  await slider.fill('150')
  await slider.dispatchEvent('input')
  await expect
    .poll(async () => (await rectOf()).width, { message: 'scaling to 150 should widen the box' })
    .toBeCloseTo((before.width * 1.5) / scaleBefore, -1)

  await page.getByTestId('reset').click()
  await soft.poll(async () => Number(await slider.inputValue()), { message: 'scale slider after reset', timeout: 2_000 }).toBeCloseTo(Number(sliderBefore), 0)
  const after = await rectOf()
  for (const k of ['left', 'top', 'width', 'height']) {
    soft(after[k], `signature box ${k} after reset (was ${before[k]})`).toBeCloseTo(before[k], 0)
  }
})

// 4. Restore ----------------------------------------------------------------

const SAVED_BACKGROUND = {
  type: 'solid',
  solidColor: '#336699',
  gradientColor1: '#112233',
  gradientColor2: '#445566',
  gradientDirection: 'to-right',
}

const seedState = (page, state) =>
  page.evaluate((s) => localStorage.setItem('csc_sticker_state', JSON.stringify(s)), state)

test.describe('4. restore', () => {
  test('saved franchise and asset come back, and nothing replaces them', async ({ page }) => {
    await seedState(page, { teamPrefix: 'ATL', asset: 'DiscordBanner', backgroundSettings: SAVED_BACKGROUND })
    // A slow Sticker load models a real network; if restore also loads the Sticker, it lands last.
    await page.route('**/teams/*/Sticker.png', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })
    await page.reload()

    await expect(stage(page)).toHaveAttribute('data-asset', 'ATL/DiscordBanner')
    await expect.poll(() => canvasSize(page)).toEqual([1200, 480])
    await expect(page.getByTestId('franchise-wall')).toBeHidden()
    await expect(page.getByTestId('franchise-chip')).toContainText('ATL')
    await expect(page.getByTestId('asset-DiscordBanner')).toHaveAttribute('aria-current', 'true')

    // The background controls follow the saved settings even though this asset has no backdrop.
    await expect(page.getByTestId('bg-solid')).toBeChecked()
    await expect(page.getByTestId('bg-color')).toHaveValue('#336699')
    await expect(page.getByTestId('bg-gradient-from')).toHaveValue('#112233')
    await expect(page.getByTestId('bg-gradient-to')).toHaveValue('#445566')
    await expect(page.getByTestId('bg-gradient-direction')).toHaveValue('to-right')

    await page.waitForTimeout(1_000) // negative check: nothing may replace it
    await expect(stage(page)).toHaveAttribute('data-asset', 'ATL/DiscordBanner')
    expect(await canvasSize(page)).toEqual([1200, 480])

    // And the saved backdrop is what the Sticker gets: its transparent corner is the solid colour.
    await chooseAsset(page, 'ATL', 'Sticker')
    await expect(page.getByTestId('tab-background')).toBeVisible()
    await expect.poll(() => pixel(page, 2, 2)).toEqual([0x33, 0x66, 0x99, 255])
  })

  test('a saved asset the franchise lacks falls back to the Sticker', async ({ page }) => {
    await seedState(page, { teamPrefix: 'AVI', asset: 'YoutubeBanner', backgroundSettings: SAVED_BACKGROUND })
    await page.reload()
    await expect(stage(page)).toHaveAttribute('data-asset', 'AVI/Sticker')
    await expect(page.getByTestId('asset-YoutubeBanner')).toHaveAttribute('aria-disabled', 'true')
  })
})

// 5. Export -----------------------------------------------------------------

test('5. downloads are PNGs at the asset size', async ({ page }) => {
  async function download(button) {
    const [dl] = await Promise.all([page.waitForEvent('download'), button.click()])
    return { name: dl.suggestedFilename(), size: pngSize(fs.readFileSync(await dl.path())) }
  }

  await chooseTeam(page, 'ATL')

  // The header button exports the asset on the stage.
  const current = await download(page.getByTestId('download'))
  expect(current.name).toMatch(/^ATL_atlantis_Sticker_\d{4}-\d{2}-\d{2}\.png$/)
  expect(current.size).toEqual([512, 512])

  // A tile's button exports that asset without opening it.
  const tile = await download(page.getByTestId('download-YoutubeBanner'))
  expect(tile.name).toMatch(/^ATL_atlantis_YoutubeBanner_\d{4}-\d{2}-\d{2}\.png$/)
  expect(tile.size).toEqual([2560, 1440])
  await expect(stage(page)).toHaveAttribute('data-asset', 'ATL/Sticker')
})

// 6. Fit to view ------------------------------------------------------------

// 'fits', or the measurements that explain why not.
const fitReport = (page, aspect) =>
  page.evaluate((want) => {
    const r = document.getElementById('mainCanvas').getBoundingClientRect()
    const root = document.documentElement
    const vw = root.clientWidth
    const vh = window.innerHeight
    const problems = []
    if (!(r.left >= 0 && r.top >= 0 && r.right <= vw + 0.5 && r.bottom <= vh + 0.5)) problems.push('canvas outside viewport')
    if (root.scrollWidth > root.clientWidth) problems.push('page scrolls sideways')
    if (root.scrollHeight > root.clientHeight) problems.push('page scrolls down')
    if (Math.abs(r.width / r.height / want - 1) > 0.01) problems.push('canvas is distorted')
    return problems.length
      ? JSON.stringify({ problems, canvasRect: [r.left, r.top, r.right, r.bottom].map(Math.round), viewport: [vw, vh], scroll: [root.scrollWidth, root.scrollHeight] })
      : 'fits'
  }, aspect)

const FRAMES = [
  { width: 1440, height: 900 },
  { width: 1280, height: 828 },
]

test('6. a banner fits the page without scrolling', { tag: '@desktop' }, async ({ page }) => {
  await chooseTeam(page, 'ATL', 'Sticker')
  await chooseAsset(page, 'ATL', 'YoutubeBanner')
  await expect.poll(() => canvasSize(page)).toEqual([2560, 1440])

  for (const frame of FRAMES) {
    await page.setViewportSize(frame)
    await expect
      .poll(() => fitReport(page, 2560 / 1440), { message: `${frame.width}x${frame.height}`, timeout: 3_000 })
      .toBe('fits')
    expect((await stableRect(page, '#mainCanvas')).width, `${frame.width}x${frame.height}: canvas is too small to work on`).toBeGreaterThan(300)
  }
})

test('6b. it still fits with a layer selected', { tag: '@desktop' }, async ({ page }) => {
  await chooseTeam(page, 'ATL')
  await chooseAsset(page, 'ATL', 'YoutubeBanner')
  await drawSignature(page, { x: 100, y: 300 }, { x: 300, y: 300 })

  for (const frame of FRAMES) {
    await page.setViewportSize(frame)
    await expect
      .poll(() => fitReport(page, 2560 / 1440), { message: `${frame.width}x${frame.height}`, timeout: 3_000 })
      .toBe('fits')
  }
})

// 7. Touch drawing ----------------------------------------------------------

test('7. a touch drag on the phone pad draws', { tag: '@mobile' }, async ({ page }) => {
  await chooseTeam(page, 'ATL')
  expect(await inkBox(page), 'sticker already has magenta in it').toBeNull()

  await page.getByTestId('draw').click()
  await page.getByTestId('brush-color').fill(MAGENTA)
  await page.getByTestId('brush-size').fill('10')

  // Phones sign on a full-screen sheet with its own pad.
  const pad = await stableRect(page, '#signPad')
  expect(pad.width).toBeGreaterThan(200)
  const y = pad.top + pad.height / 2
  const a = { x: pad.left + 0.2 * pad.width, y }
  const b = { x: pad.left + 0.8 * pad.width, y }
  expect(await reaches(page, '#signPad', a), 'stroke start is not on the sheet pad').toBe(true)
  expect(await reaches(page, '#signPad', b), 'stroke end is not on the sheet pad').toBe(true)

  await touchStroke(page, a, b)
  await page.waitForTimeout(800) // Chrome's gesture detector swallows a tap that comes right after a drag
  await page.getByTestId('apply').tap()

  await expect(signatureBox(page)).toHaveClass(/\bactive\b/)
  await expect(chips(page)).toHaveCount(1)
  const ink = await inkBox(page)
  expect(ink, 'no ink on the stage after the touch stroke').not.toBeNull()
  // A horizontal stroke stays horizontal on the art.
  expect(ink.maxX - ink.minX).toBeGreaterThan(3 * (ink.maxY - ink.minY))
})

test('7b. turning the phone while signing keeps Apply and Cancel reachable', { tag: '@mobile' }, async ({ page }) => {
  await chooseTeam(page, 'ATL')
  await page.getByTestId('draw').click()
  await page.getByTestId('brush-color').fill(MAGENTA)
  await page.getByTestId('brush-size').fill('10')
  const pad = await stableRect(page, '#signPad')
  const y = pad.top + pad.height / 2
  await touchStroke(page, { x: pad.left + 0.2 * pad.width, y }, { x: pad.left + 0.8 * pad.width, y })

  await page.setViewportSize({ width: 844, height: 390 })
  for (const id of ['apply', 'cancel-sign']) {
    const button = page.getByTestId(id)
    await expect
      .poll(async () => {
        const box = await button.boundingBox()
        return box ? reaches(page, `[data-testid="${id}"]`, { x: box.x + box.width / 2, y: box.y + box.height / 2 }) : false
      }, { message: `${id} can be pressed after turning the phone` })
      .toBe(true)
  }

  await page.getByTestId('apply').click()
  await expect(signatureBox(page)).toHaveClass(/\bactive\b/)
  expect(await inkBox(page), 'the stroke was lost').not.toBeNull()
})

// 8. Theme ------------------------------------------------------------------

test('8. theme message sets data-theme', async ({ page }) => {
  const theme = () => page.evaluate(() => document.documentElement.dataset.theme)
  await page.evaluate(() => window.postMessage('light', location.origin))
  await expect.poll(theme).toBe('light')
  await page.evaluate(() => window.postMessage('dark', location.origin))
  await expect.poll(theme).toBe('dark')
})

test('8b. theme messages only count from CSC-Web or the page itself', async ({ page }) => {
  const theme = () => page.evaluate(() => document.documentElement.dataset.theme)
  const post = (origin, data) =>
    page.evaluate(([o, d]) => window.dispatchEvent(new MessageEvent('message', { origin: o, data: d })), [origin, data])

  await post('https://evil.example', 'light')
  await post('https://playcsc.com', 'blue') // not a theme
  await page.waitForTimeout(200)
  expect(await theme(), 'a stranger or a bad value changed the theme').toBeUndefined()

  await post('https://playcsc.com', 'light')
  await expect.poll(theme).toBe('light')
  await post('https://evil.example', 'dark')
  await page.waitForTimeout(200)
  expect(await theme(), 'a stranger changed the theme').toBe('light')
})

// 9. Big upload -------------------------------------------------------------

test('9. a 4.5 MB upload becomes a signature', async ({ page }) => {
  const buffer = noisePng()
  expect(buffer.length).toBeGreaterThan(4_000_000)
  expect(buffer.length).toBeLessThan(5 * 1024 * 1024)

  await chooseTeam(page, 'ATL')
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByTestId('upload').click()])
  await chooser.setFiles({ name: 'noise.png', mimeType: 'image/png', buffer })

  await expect(signatureBox(page)).toHaveClass(/\bactive\b/)
  await expect(chips(page)).toHaveCount(1)
  await expect(chips(page)).toContainText('Signature')
})

test('9b. a wrong or oversized file is refused with a message', { tag: '@desktop' }, async ({ page }) => {
  const toasts = () => page.evaluate(() => window.__errorToasts)
  await chooseTeam(page, 'ATL')

  await page.locator('#fileInput').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('x'.repeat(500)) })
  await expect.poll(toasts).toEqual([expect.stringMatching(/Unsupported file type/)])

  await page.locator('#fileInput').setInputFiles({ name: 'huge.png', mimeType: 'image/png', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) })
  await expect.poll(toasts).toEqual([expect.stringMatching(/Unsupported file type/), expect.stringMatching(/too large/i)])

  await expect(chips(page)).toHaveCount(0)
  await page.evaluate(() => { window.__errorToasts.length = 0 }) // these toasts are the expected outcome
})

// 10. Layers ----------------------------------------------------------------

test.describe('10. layers', () => {
  test('10a. a text layer shows on the stage, on the kit and in the export', { tag: '@desktop' }, async ({ page }) => {
    await chooseTeam(page, 'ATL')
    await expect(page.locator('.kit-tile[data-asset="DiscordBanner"]')).toHaveAttribute('data-state', 'ready')
    expect(await inkBox(page), 'sticker already has magenta in it').toBeNull()
    expect(await tileInk(page, 'DiscordBanner'), 'Discord thumbnail already has magenta in it').toBeNull()

    await page.getByTestId('tab-text').click()
    await page.getByTestId('text-color').fill(MAGENTA)
    await page.getByTestId('text-outline-color').fill(MAGENTA)
    await page.getByTestId('text-outline-width').fill('12') // thick, so thumbnails keep solid pixels
    await page.getByTestId('text-input').fill('QA TEXT')
    await page.getByTestId('add-text').click()

    await expect(chips(page)).toHaveCount(1)
    await expect(chips(page)).toContainText('QA TEXT')
    await expect(signatureBox(page)).toHaveClass(/\bactive\b/)
    await expect.poll(async () => (await inkBox(page))?.count ?? 0, { message: 'magenta pixels on the stage' }).toBeGreaterThan(500)
    await expect.poll(async () => (await tileInk(page, 'DiscordBanner'))?.count ?? 0, { message: 'magenta pixels on the Discord tile' }).toBeGreaterThan(20)

    const discord = await exportedInk(page, 'DiscordBanner')
    expect(discord.size).toEqual([1200, 480])
    expect(discord.ink?.count ?? 0, 'magenta pixels in the Discord export').toBeGreaterThan(500)

    // Editing the text renames the layer.
    await page.getByTestId('text-input').fill('HELLO')
    await expect(chips(page)).toContainText('HELLO')
  })

  test('10b. each asset keeps its own placement', { tag: '@desktop' }, async ({ page }) => {
    const sticker = () => placementOf(page)
    await chooseTeam(page, 'ATL')
    await drawSignature(page, FROM, TO, { size: BRUSH })
    const stickerBefore = await sticker()

    await chooseAsset(page, 'ATL', 'DiscordBanner')
    await expect(chips(page).first()).toHaveAttribute('aria-pressed', 'true')
    const discordBefore = await placementOf(page)
    expect(discordBefore, 'the layer sits somewhere else on a different asset').not.toEqual(stickerBefore)

    // Drag it on the Sticker...
    await chooseAsset(page, 'ATL', 'Sticker')
    expect(await sticker()).toEqual(stickerBefore)
    const box = await stableRect(page, '#signatureBox')
    const from = { x: box.left + box.width / 2, y: box.top + box.height / 2 }
    await mouseStroke(page, from, { x: from.x + 60, y: from.y - 40 }, 10)
    const stickerMoved = await sticker()
    expect(stickerMoved.x, 'dragged right').toBeGreaterThan(stickerBefore.x + 30)
    expect(stickerMoved.y, 'dragged up').toBeLessThan(stickerBefore.y - 20)

    // ...and the Discord banner has not moved.
    await chooseAsset(page, 'ATL', 'DiscordBanner')
    expect(await placementOf(page)).toEqual(discordBefore)

    // Scale it on the Discord banner...
    await page.getByTestId('scale').fill('50')
    await expect.poll(async () => (await placementOf(page)).scale).toBeCloseTo(0.5, 2)

    // ...and the Sticker keeps where it was dragged.
    await chooseAsset(page, 'ATL', 'Sticker')
    expect(await sticker()).toEqual(stickerMoved)
  })

  test('10c. undo and clear on the pad', { tag: '@desktop' }, async ({ page }) => {
    await chooseTeam(page, 'ATL')
    await startDrawing(page, { size: BRUSH })
    await padStroke(page, { x: 60, y: 150 }, { x: 300, y: 150 })
    await padStroke(page, { x: 60, y: 350 }, { x: 300, y: 350 })

    await page.getByTestId('undo').click()
    await page.getByTestId('apply').click()
    await expect(signatureBox(page)).toHaveClass(/\bactive\b/)
    const ink = await inkBox(page)
    expect(ink, 'no ink after undoing one of two strokes').not.toBeNull()
    expect(ink.maxY, 'the undone lower stroke is still there').toBeLessThan(200)
    expect(ink.minY, 'the first stroke is gone').toBeGreaterThan(100)

    // Clear leaves nothing to apply; cancel adds no layer.
    await startDrawing(page, { size: BRUSH })
    await padStroke(page, { x: 60, y: 250 }, { x: 300, y: 250 })
    await expect(page.getByTestId('apply')).toBeEnabled()
    await page.getByTestId('clear').click()
    await expect(page.getByTestId('apply')).toBeDisabled()
    await page.getByTestId('cancel-sign').click()
    await expect(chips(page)).toHaveCount(1)
  })

  test('10d. delete removes a layer and the toast brings it back', { tag: '@desktop' }, async ({ page }) => {
    await chooseTeam(page, 'ATL')
    await drawSignature(page, FROM, TO, { size: BRUSH })
    await expect(chips(page)).toHaveCount(1)
    expect(await inkBox(page)).not.toBeNull()

    // Done drops the selection; the layer chip picks it again.
    await page.getByTestId('done').click()
    await expect(signatureBox(page)).not.toHaveClass(/\bactive\b/)
    await chips(page).first().click()
    await expect(signatureBox(page)).toHaveClass(/\bactive\b/)

    await page.getByTestId('delete').click()
    await expect(chips(page)).toHaveCount(0)
    await expect(signatureBox(page)).not.toHaveClass(/\bactive\b/)
    expect(await inkBox(page), 'ink still on the stage after delete').toBeNull()

    await page.getByTestId('toast-undo').click()
    await expect(chips(page)).toHaveCount(1)
    await expect(signatureBox(page)).toHaveClass(/\bactive\b/)
    expect(await inkBox(page), 'ink did not come back after undo').not.toBeNull()
  })

  test('10e. a long text stays on every asset', { tag: '@desktop' }, async ({ page }) => {
    await chooseTeam(page, 'ATL')
    await page.getByTestId('tab-text').click()
    await page.getByTestId('text-input').fill('Counter-Strike Global Offensive Champion') // the field's 40 characters
    await page.getByTestId('add-text').click()
    await expect(chips(page)).toHaveCount(1)
    await expectInsideEveryAsset(page, 'a 40-character text')
  })

  test('10f. a wide signature stays on every asset', { tag: '@desktop' }, async ({ page }) => {
    await chooseTeam(page, 'ATL')
    await drawSignature(page, FROM, TO, { size: BRUSH })
    await expectInsideEveryAsset(page, 'a wide signature')
  })
})

// 11. Failed loads ----------------------------------------------------------

test.describe('11. failed loads', () => {
  test('11a. a franchise list that fails to load can be retried', { tag: '@desktop' }, async ({ page }) => {
    let fail = true
    await page.route('**/teams/manifest.json', (route) => (fail ? route.fulfill({ status: 500, body: 'down' }) : route.continue()))
    await page.reload()
    await expect(page.locator('#stage')).toHaveAttribute('data-state', 'error')
    await expect(page.locator('#stageMessageText')).toContainText('franchise list')

    fail = false
    await page.locator('#stageMessageBtn').click()
    await expect(page.getByTestId('franchise-wall')).toBeVisible()
    await expect(page.locator('[data-testid^="team-"]')).toHaveCount(TEAM_PREFIXES.length)
  })

  test('11b. an asset that fails to load can be retried', { tag: '@desktop' }, async ({ page }) => {
    await chooseTeam(page, 'ATL')
    let fail = true
    await page.route('**/teams/ATL/DiscordBanner.png', (route) => (fail ? route.abort() : route.continue()))
    await page.getByTestId('asset-DiscordBanner').click()
    await expect(page.locator('#stage')).toHaveAttribute('data-state', 'error')
    await expect(page.locator('#stageMessageText')).toContainText('Discord Banner')

    fail = false
    await page.locator('#stageMessageBtn').click()
    await expect(stage(page)).toHaveAttribute('data-asset', 'ATL/DiscordBanner')
    await expect(page.locator('#stage')).toHaveAttribute('data-state', 'ready')
  })
})

// 12. Background ------------------------------------------------------------

test('12. the backdrop controls recolour the Sticker and Sticker Shadow only', { tag: '@desktop' }, async ({ page }) => {
  const corner = () => pixel(page, 2, 2) // transparent in the art
  const opposite = () => pixel(page, 509, 509)
  const near = (rgba, want) => rgba.every((v, i) => Math.abs(v - want[i]) <= 3)
  await chooseTeam(page, 'ATL')
  await page.getByTestId('tab-background').click()
  expect((await corner())[3], 'original keeps the art transparent').toBe(0)

  await page.getByTestId('bg-solid').check()
  await page.getByTestId('bg-color').fill('#336699')
  await expect.poll(corner).toEqual([0x33, 0x66, 0x99, 255])

  await page.getByTestId('bg-gradient').check()
  await page.getByTestId('bg-gradient-from').fill('#ff0000')
  await page.getByTestId('bg-gradient-to').fill('#0000ff')
  await expect.poll(async () => near(await corner(), [255, 0, 0, 255]) && near(await opposite(), [0, 0, 255, 255]), { message: 'top to bottom: red at the top, blue at the bottom' }).toBe(true)
  await page.getByTestId('bg-gradient-direction').selectOption('to-right')
  await expect.poll(async () => near(await pixel(page, 509, 2), [0, 0, 255, 255]) && near(await pixel(page, 2, 509), [255, 0, 0, 255]), { message: 'left to right: red on the left, blue on the right' }).toBe(true)

  await page.getByTestId('bg-transparent').check()
  await expect.poll(async () => (await corner())[3]).toBe(0)

  await page.getByTestId('bg-solid').check()
  await chooseAsset(page, 'ATL', 'StickerShadow')
  await expect(page.getByTestId('tab-background')).toBeVisible()
  await expect.poll(corner).toEqual([0x33, 0x66, 0x99, 255])

  await chooseAsset(page, 'ATL', 'ProfilePicture')
  await expect(page.getByTestId('tab-background')).toBeHidden()
})
