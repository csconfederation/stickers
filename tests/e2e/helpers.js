import { test as base, expect } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

// Same checkout the web server serves (see playwright.config.js).
const APP_DIR = path.resolve(process.env.APP_DIR ?? path.join(import.meta.dirname, '../..'))

// What the app should offer. Kept here, not imported from js/config.js, so a refactor
// that changes the config can't silently change the expectations.
export const ASSETS = {
  ProfilePicture: { width: 512, height: 512, file: 'ProfilePicture.png' },
  DiscordBanner: { width: 1200, height: 480, file: 'DiscordBanner.png' },
  TwitterBanner: { width: 1500, height: 500, file: 'TwitterBanner.png' },
  YoutubeBanner: { width: 2560, height: 1440, file: 'YoutubeBanner.png' },
  TwitchBanner: { width: 1920, height: 480, file: 'TwitchBanner.png' },
  DesktopBackground: { width: 1920, height: 1080, file: 'DesktopBackground.png' },
  Sticker: { width: 512, height: 512, file: 'Sticker.png' },
  StickerShadow: { width: 512, height: 512, file: 'Sticker Shadow.png' },
  SeasonTeamSticker: { width: 512, height: 512, file: 'SeasonTeamSticker.png' },
  SeasonSignatureSticker: { width: 512, height: 512, file: 'SeasonSignatureSticker.png' },
}

// Franchises that have at least one asset: the ones the franchise wall should list.
export const TEAM_PREFIXES = fs
  .readdirSync(path.join(APP_DIR, 'teams'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .filter((d) => fs.readdirSync(path.join(APP_DIR, 'teams', d.name)).some((f) => f.endsWith('.png')))
  .map((d) => d.name)
  .sort()

export const assetExists = (team, key) =>
  fs.existsSync(path.join(APP_DIR, 'teams', team, ASSETS[key].file))

export const MAGENTA = '#ff00ff'

// `test` with a page that (a) never reaches Google Fonts, so text falls back to sans-serif
// instead of depending on the network, and (b) fails the test on any error toast or
// uncaught page error, which no flow in these tests should produce.
export const test = base.extend({
  page: async ({ page }, use) => {
    const pageErrors = []
    page.on('pageerror', (e) => pageErrors.push(String(e)))
    await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
      route.fulfill({ status: 200, contentType: 'text/css', body: '' })
    )
    await page.addInitScript(() => {
      window.__errorToasts = []
      new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node.classList?.contains('toast-error')) window.__errorToasts.push(node.textContent)
          }
        }
      }).observe(document, { childList: true, subtree: true })

      // Bounding box and count of pixels near a colour on a canvas; null when there are none.
      const masks = {
        magenta: (r, g, b) => r > 180 && g < 80 && b > 180,
      }
      window.__ink = (canvas, color) => {
        if (!canvas.width || !canvas.height) return null
        const d = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
        const match = masks[color]
        let box = null
        let count = 0
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 150 || !match(d[i], d[i + 1], d[i + 2])) continue
          const x = (i / 4) % canvas.width
          const y = Math.floor(i / 4 / canvas.width)
          box ??= { minX: x, minY: y, maxX: x, maxY: y }
          box.minX = Math.min(box.minX, x)
          box.maxX = Math.max(box.maxX, x)
          box.minY = Math.min(box.minY, y)
          box.maxY = Math.max(box.maxY, y)
          count++
        }
        return box && { ...box, count }
      }
    })
    await use(page)
    expect.soft(pageErrors, 'uncaught page errors').toEqual([])
    expect.soft(await page.evaluate(() => window.__errorToasts).catch(() => []), 'error toasts').toEqual([])
  },
})

// First visit: storage is empty, so the franchise wall opens by itself once the manifest loads.
export async function openApp(page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await expect(page.getByTestId('franchise-wall')).toBeVisible()
}

// Picks a franchise from the wall (opening it if needed) and waits for its asset to be drawn.
export async function chooseTeam(page, prefix, asset = 'Sticker') {
  if (!(await page.getByTestId('franchise-wall').isVisible())) await page.getByTestId('franchise-chip').click()
  await page.getByTestId(`team-${prefix}`).click()
  await expect(page.locator('#mainCanvas')).toHaveAttribute('data-asset', `${prefix}/${asset}`)
}

// Picks an asset tile and waits for its background to be drawn.
export async function chooseAsset(page, prefix, asset) {
  await page.getByTestId(`asset-${asset}`).click()
  await expect(page.locator('#mainCanvas')).toHaveAttribute('data-asset', `${prefix}/${asset}`)
}

export const canvasSize = (page) =>
  page.evaluate(() => {
    const c = document.getElementById('mainCanvas')
    return [c.width, c.height]
  })

// Rect of an element once layout has stopped moving (three identical frames in a row).
export const stableRect = (page, selector) =>
  page.evaluate(
    (sel) =>
      new Promise((resolve) => {
        const el = document.querySelector(sel)
        let last = ''
        let same = 0
        const tick = () => {
          const r = el.getBoundingClientRect()
          const now = [r.left, r.top, r.width, r.height].join()
          same = now === last ? same + 1 : 0
          last = now
          if (same >= 3) resolve({ left: r.left, top: r.top, width: r.width, height: r.height })
          else requestAnimationFrame(tick)
        }
        tick()
      }),
    selector
  )

// Asset px <-> client px, through #mainCanvas's rect so any CSS scaling is honoured.
export const toClient = (page, p) =>
  page.evaluate(({ x, y }) => {
    const c = document.getElementById('mainCanvas')
    const r = c.getBoundingClientRect()
    return { x: r.left + (x * r.width) / c.width, y: r.top + (y * r.height) / c.height }
  }, p)

// True when a pointer at this client point would reach the element (not clipped or covered).
export const reaches = (page, selector, p) =>
  page.evaluate(({ sel, x, y }) => document.elementFromPoint(x, y) === document.querySelector(sel), { sel: selector, ...p })

// Opens the pad and sets the brush. On a desktop-width page the pad is laid over the stage.
export async function startDrawing(page, { color = MAGENTA, size = 10 } = {}) {
  await page.getByTestId('draw').click()
  await page.getByTestId('brush-color').fill(color)
  await page.getByTestId('brush-size').fill(String(size))
  await stableRect(page, '#mainCanvas')
}

export async function mouseStroke(page, from, to, steps = 20) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps })
  await page.mouse.up()
}

// A stroke between two asset-px points on the pad over the stage.
export async function padStroke(page, from, to) {
  await mouseStroke(page, await toClient(page, from), await toClient(page, to))
}

// Draws one stroke on the pad over the stage and applies it; resolves once the layer is selected.
export async function drawSignature(page, from, to, options) {
  await startDrawing(page, options)
  await padStroke(page, from, to)
  await page.getByTestId('apply').click()
  await expect(page.locator('#signatureBox')).toHaveClass(/\bactive\b/)
}

export async function touchStroke(page, from, to, steps = 20) {
  const cdp = await page.context().newCDPSession(page)
  const send = (type, p) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: p ? [{ x: p.x, y: p.y }] : [] })
  await send('touchStart', from)
  for (let i = 1; i <= steps; i++) {
    await send('touchMove', {
      x: from.x + ((to.x - from.x) * i) / steps,
      y: from.y + ((to.y - from.y) * i) / steps,
    })
  }
  await send('touchEnd')
  await cdp.detach()
}

// Ink of a colour on a canvas: { minX, minY, maxX, maxY, count } in canvas px, or null.
export const inkBox = (page, color = 'magenta', selector = '#mainCanvas') =>
  page.evaluate(([sel, col]) => window.__ink(document.querySelector(sel), col), [selector, color])

export const tileInk = (page, asset, color = 'magenta') =>
  inkBox(page, color, `.kit-tile[data-asset="${asset}"] canvas`)

// RGBA of one pixel on #mainCanvas.
export const pixel = (page, x, y) =>
  page.evaluate(([px, py]) => [...document.getElementById('mainCanvas').getContext('2d').getImageData(px, py, 1, 1).data], [x, y])

// How far the selected layer's box sticks out past each edge of the asset, in asset px
// (negative: inside by that much).
export const overhang = (page) =>
  page.evaluate(() => {
    const c = document.getElementById('mainCanvas')
    const r = c.getBoundingClientRect()
    const b = document.getElementById('signatureBox').getBoundingClientRect()
    const k = c.width / r.width
    return {
      left: Math.round((r.left - b.left) * k),
      right: Math.round((b.right - r.right) * k),
      top: Math.round((r.top - b.top) * k),
      bottom: Math.round((b.bottom - r.bottom) * k),
    }
  })

// The PNG the app would download for an asset, decoded: { size, ink }.
export const exportedInk = (page, asset, color = 'magenta') =>
  page.evaluate(
    async ([key, col]) => {
      const bitmap = await createImageBitmap(await window.app.exportAsset(key))
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      canvas.getContext('2d').drawImage(bitmap, 0, 0)
      return { size: [bitmap.width, bitmap.height], ink: window.__ink(canvas, col) }
    },
    [asset, color]
  )

// Ink of a colour within `radius` canvas px of a point on #mainCanvas.
export const inkNear = (page, p, radius = 3, color = 'magenta') =>
  page.evaluate(
    ({ x, y, r, col }) => {
      const c = document.getElementById('mainCanvas')
      const cx = Math.round(x)
      const cy = Math.round(y)
      const x0 = Math.max(0, cx - r)
      const y0 = Math.max(0, cy - r)
      const w = Math.min(c.width, cx + r + 1) - x0
      const h = Math.min(c.height, cy + r + 1) - y0
      if (w <= 0 || h <= 0) return false
      const win = document.createElement('canvas')
      win.width = w
      win.height = h
      win.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, w, h)
      return window.__ink(win, col) !== null
    },
    { ...p, r: radius, col: color }
  )

// Placement { x, y, scale, rotation, opacity } of a layer on the asset on the stage.
export const placementOf = (page, layerIndex = 0) =>
  page.evaluate((i) => {
    const { x, y, scale, rotation, opacity } = window.app.placementOf(window.app.state.layers[i])
    return { x, y, scale, rotation, opacity }
  }, layerIndex)

// Width/height from the PNG IHDR chunk; throws if the bytes are not a PNG.
export function pngSize(buf) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (!buf.subarray(0, 8).equals(sig) || buf.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('not a PNG')
  }
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)]
}

// size x size RGB noise PNG with stored (uncompressed) deflate blocks: ~4.5 MB at 1225.
export function noisePng(size = 1225) {
  const rowLen = size * 3 + 1
  const raw = randomBytes(rowLen * size)
  for (let y = 0; y < size; y++) raw[y * rowLen] = 0 // filter: none
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(zlib.crc32(body))
    return Buffer.concat([len, body, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // colour type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 0 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
