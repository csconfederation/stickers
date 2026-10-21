import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import {
  ASSETS,
  TEAM_PREFIXES,
  MAGENTA,
  assetExists,
  openApp,
  chooseTeam,
  chooseAsset,
  afterLoadToast,
  canvasSize,
  settle,
  startDrawing,
  applySignature,
  toClient,
  toCanvas,
  reachesDrawingCanvas,
  reachableBox,
  mouseStroke,
  touchStroke,
  inkNear,
  inkBox,
  signatureBoxWidth,
  pngSize,
  noisePng,
} from './helpers.js'

const soft = expect.configure({ soft: true })

const BRUSH = 10

// Horizontal stroke in canvas px on the 512x512 Sticker, low and wide so that a pointer-to-canvas
// scaling error shows up as a vertical offset (centreline) and as ink running past the end.
const FROM = { x: 40, y: 400 }
const TO = { x: 480, y: 400 }

// Ink must sit on the stroke: present at both ends and the midpoint, centred on its y, and
// ending at the endpoints, give or take a round cap (BRUSH / 2) that must be the same at both ends.
async function expectStrokeAt(page, from, to) {
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
  soft(await inkNear(page, from), `no ink within 3px of the start ${JSON.stringify(from)}`).toBe(true)
  soft(await inkNear(page, mid), `no ink within 3px of the midpoint ${JSON.stringify(mid)}`).toBe(true)
  soft(await inkNear(page, to), `no ink within 3px of the end ${JSON.stringify(to)}`).toBe(true)

  const box = await inkBox(page)
  expect(box, 'no ink on #mainCanvas').not.toBeNull()
  const seen = `ink box ${JSON.stringify(box)} for stroke ${JSON.stringify(from)} -> ${JSON.stringify(to)}`
  const overStart = from.x - box.minX
  const overEnd = box.maxX - to.x
  soft(Math.abs((box.minY + box.maxY) / 2 - from.y), `ink centreline is off y=${from.y}; ${seen}`).toBeLessThanOrEqual(3)
  soft(overStart, `ink start is off by ${overStart}px; ${seen}`).toBeGreaterThanOrEqual(-3)
  soft(overStart, `ink start is off by ${overStart}px; ${seen}`).toBeLessThanOrEqual(BRUSH / 2 + 3)
  soft(overEnd, `ink end is off by ${overEnd}px; ${seen}`).toBeGreaterThanOrEqual(-3)
  soft(overEnd, `ink end is off by ${overEnd}px; ${seen}`).toBeLessThanOrEqual(BRUSH / 2 + 3)
  soft(Math.abs(overStart - overEnd), `ink overshoots the start by ${overStart}px but the end by ${overEnd}px; ${seen}`).toBeLessThanOrEqual(3)
}

test.beforeEach(async ({ page }) => {
  await openApp(page)
})

// 1. Assets ----------------------------------------------------------------

test.describe('1. assets', () => {
  test('team dropdown lists every teams/ folder', { tag: '@desktop' }, async ({ page }) => {
    const values = await page.locator('#teamSelect option').evaluateAll((os) =>
      os.map((o) => o.value).filter(Boolean)
    )
    expect(values.sort()).toEqual(TEAM_PREFIXES)
  })

  for (const team of TEAM_PREFIXES) {
    test(`${team}: every asset loads at its size, missing files are not offered`, { tag: '@desktop' }, async ({ page }) => {
      const first = await chooseTeam(page, team)
      soft(first.error, `${team}: selecting the team (auto-loads Sticker) raised "${first.message}"`).toBe(false)
      await soft.poll(() => canvasSize(page), { message: `${team}: Sticker canvas size`, timeout: 2_000 }).toEqual([512, 512])

      for (const [key, spec] of Object.entries(ASSETS)) {
        const option = page.locator(`#assetSelect option[value="${key}"]`)
        const optionCount = await option.count()

        if (!assetExists(team, key)) {
          const offered = optionCount > 0 && (await option.isEnabled())
          soft(offered, `${team}: teams/${team}/${spec.file} does not exist but "${key}" is selectable`).toBe(false)
          continue
        }

        const selectable = optionCount === 1 && (await option.isEnabled())
        soft(selectable, `${team}: teams/${team}/${spec.file} exists but "${key}" is not selectable`).toBe(true)
        if (!selectable) continue

        const result = await chooseAsset(page, key)
        soft(result.error, `${team}/${key}: error toast "${result.message}"`).toBe(false)
        await soft
          .poll(() => canvasSize(page), { message: `${team}/${key}: canvas size`, timeout: 2_000 })
          .toEqual([spec.width, spec.height])
      }
    })
  }
})

// 2. Drawing accuracy -------------------------------------------------------

test('2. drawing lands where the pointer is', { tag: '@desktop' }, async ({ page }) => {
  await chooseTeam(page, 'ATL')
  expect(await inkBox(page), 'sticker already has magenta in it').toBeNull()

  await startDrawing(page, { size: BRUSH })
  const a = await toClient(page, FROM)
  const b = await toClient(page, TO)
  expect(await reachesDrawingCanvas(page, a), 'stroke start is not on the drawing canvas').toBe(true)
  expect(await reachesDrawingCanvas(page, b), 'stroke end is not on the drawing canvas').toBe(true)

  await mouseStroke(page, a, b)
  await applySignature(page)
  await expect(page.locator('#transformSection')).toBeVisible()

  await expectStrokeAt(page, FROM, TO)
})

// 3. Reset ------------------------------------------------------------------

test('3. reset transform restores scale', { tag: '@desktop' }, async ({ page }) => {
  await chooseTeam(page, 'ATL')
  await startDrawing(page, { size: BRUSH })
  await mouseStroke(page, await toClient(page, FROM), await toClient(page, TO))
  await applySignature(page)
  await expect(page.locator('#transformSection')).toBeVisible()
  await settle(page)

  const before = await signatureBoxWidth(page)
  expect(before).toBeGreaterThan(50)

  const slider = page.locator('#scaleSlider')
  await slider.fill('150')
  await slider.dispatchEvent('input')
  await expect.poll(() => signatureBoxWidth(page), { message: 'scaling to 150 should widen the box' })
    .toBeCloseTo(before * 1.5, 0)

  await page.locator('#resetTransform').click()
  await soft(slider, 'scale slider after reset').toHaveValue('100')
  await soft
    .poll(() => signatureBoxWidth(page), { message: 'box width after reset', timeout: 2_000 })
    .toBeCloseTo(before, 0)
})

// 4. Restore ----------------------------------------------------------------

test('4. saved asset is restored and not replaced by a second load', async ({ page }) => {
  await page.evaluate(() =>
    localStorage.setItem(
      'csc_sticker_state',
      JSON.stringify({
        teamPrefix: 'ATL',
        asset: 'DiscordBanner',
        backgroundSettings: {
          type: 'original',
          solidColor: '#ffffff',
          gradientColor1: '#ffffff',
          gradientColor2: '#000000',
          gradientDirection: 'to-bottom',
        },
      })
    )
  )
  // A slow Sticker load models a real network; if restore also loads the Sticker, it lands last.
  await page.route('**/teams/*/Sticker.png', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    await route.continue()
  })
  await page.reload()

  await expect(page.locator('#teamSelect')).toHaveValue('ATL')
  await expect(page.locator('#assetSelect')).toHaveValue('DiscordBanner')
  await expect.poll(() => canvasSize(page)).toEqual([1200, 480])

  await page.waitForTimeout(1_000) // negative check: nothing may replace it
  await expect(page.locator('#assetSelect')).toHaveValue('DiscordBanner')
  expect(await canvasSize(page)).toEqual([1200, 480])
})

// 5. Export -----------------------------------------------------------------

test('5. download is a PNG at the asset size', async ({ page }) => {
  async function download() {
    const [dl] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#exportBtn').click(),
    ])
    expect(dl.suggestedFilename()).toMatch(/\.png$/)
    return pngSize(fs.readFileSync(await dl.path()))
  }

  await chooseTeam(page, 'ATL')
  await expect.poll(() => canvasSize(page)).toEqual([512, 512])
  expect(await download()).toEqual([512, 512])

  await chooseAsset(page, 'YoutubeBanner')
  await expect.poll(() => canvasSize(page)).toEqual([2560, 1440])
  expect(await download()).toEqual([2560, 1440])
})

// 6. Fit to view ------------------------------------------------------------

test('6. large banner fits the viewport', { tag: '@desktop' }, async ({ page }) => {
  await chooseTeam(page, 'ATL')
  await chooseAsset(page, 'YoutubeBanner')
  await expect.poll(() => canvasSize(page)).toEqual([2560, 1440])

  // Resolves to 'fits', or to the measurements that explain why not.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const r = document.getElementById('mainCanvas').getBoundingClientRect()
          const root = document.documentElement
          const vw = root.clientWidth
          const vh = window.innerHeight
          const inside = r.left >= 0 && r.top >= 0 && r.right <= vw && r.bottom <= vh
          const noHScroll = root.scrollWidth <= root.clientWidth
          return inside && noHScroll
            ? 'fits'
            : JSON.stringify({
                canvasRect: [r.left, r.top, r.right, r.bottom].map(Math.round),
                viewport: [vw, vh],
                canvasInsideViewport: inside,
                pageScrollWidth: root.scrollWidth,
                noHorizontalScroll: noHScroll,
              })
        }),
      { timeout: 3_000 }
    )
    .toBe('fits')
})

// 7. Touch drawing ----------------------------------------------------------

test('7. touch drag draws', { tag: '@mobile' }, async ({ page }) => {
  await chooseTeam(page, 'ATL')
  expect(await inkBox(page), 'sticker already has magenta in it').toBeNull()
  await startDrawing(page, { size: BRUSH })
  await page.locator('#drawingCanvas').scrollIntoViewIfNeeded()

  // Stroke inside the part of the canvas that pointers can reach, so a layout that clips the
  // canvas is not mistaken for an app that ignores touch.
  const box = await reachableBox(page)
  expect(box, 'no part of #drawingCanvas can be reached by a pointer').not.toBeNull()
  const y = (box.top + box.bottom) / 2
  const a = { x: box.left + 0.2 * (box.right - box.left), y }
  const b = { x: box.left + 0.8 * (box.right - box.left), y }
  expect(await reachesDrawingCanvas(page, a)).toBe(true)
  expect(await reachesDrawingCanvas(page, b)).toBe(true)
  const from = await toCanvas(page, a)
  const to = await toCanvas(page, b)

  await touchStroke(page, a, b)
  await applySignature(page)
  await soft(page.locator('#transformSection'), 'no signature was created from the touch stroke').toBeVisible({ timeout: 3_000 })

  await expectStrokeAt(page, from, to)
})

// 8. Theme ------------------------------------------------------------------

test('8. theme message sets data-theme', async ({ page }) => {
  await page.evaluate(() => window.postMessage('light', location.origin))
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe('light')
})

// 9. Big upload -------------------------------------------------------------

test('9. 4.5 MB upload is accepted', async ({ page }) => {
  const buffer = noisePng()
  // Under the 5 MiB file limit, but its base64 data URL is over 5 MiB.
  expect(buffer.length).toBeGreaterThan(4_000_000)
  expect(buffer.length).toBeLessThan(5 * 1024 * 1024)

  await chooseTeam(page, 'ATL')
  await page.locator('#uploadBtn').click()
  const upload = await afterLoadToast(page, () =>
    page.locator('#fileInput').setInputFiles({ name: 'noise.png', mimeType: 'image/png', buffer })
  )
  soft(upload.error, `upload raised "${upload.message}"`).toBe(false)
  await soft(page.locator('#transformSection'), 'transform controls after upload').toBeVisible()
})
