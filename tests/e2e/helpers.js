import { expect } from '@playwright/test'
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

export const TEAM_PREFIXES = fs
  .readdirSync(path.join(APP_DIR, 'teams'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()

export const assetExists = (team, key) =>
  fs.existsSync(path.join(APP_DIR, 'teams', team, ASSETS[key].file))

export const MAGENTA = '#ff00ff'

export async function openApp(page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  // Options are appended in the same task that wires the listeners.
  await expect(page.locator('#teamSelect option').nth(1)).toBeAttached()
}

// Toasts pile up for ~3 s, so clear them first and wait for the one this action raises.
export async function afterLoadToast(page, action) {
  await page.evaluate(() => document.querySelectorAll('.toast').forEach((t) => t.remove()))
  await action()
  const toast = page.locator('.toast-success, .toast-error').first()
  await toast.waitFor({ state: 'attached', timeout: 10_000 })
  return {
    error: ((await toast.getAttribute('class')) ?? '').includes('toast-error'),
    message: (await toast.textContent()) ?? '',
  }
}

export const chooseTeam = (page, prefix) =>
  afterLoadToast(page, () => page.locator('#teamSelect').selectOption(prefix))

export const chooseAsset = (page, key) =>
  afterLoadToast(page, () => page.locator('#assetSelect').selectOption(key))

export const canvasSize = (page) =>
  page.evaluate(() => {
    const c = document.getElementById('mainCanvas')
    return [c.width, c.height]
  })

// Drawing mode scales the canvas wrapper with a CSS transition; positions are only
// meaningful once every animation has finished.
export const settle = (page) =>
  page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))))

export async function startDrawing(page, { color = MAGENTA, size = 10 } = {}) {
  await page.locator('#drawBtn').click()
  await page.locator('#brushColor').fill(color)
  await page.locator('#brushSize').fill(String(size))
  await settle(page)
}

export const applySignature = (page) => page.locator('#doneDrawing').click()

// canvas px <-> client px on #drawingCanvas, using its bounding rect so CSS scaling is honoured.
export const toClient = (page, p) =>
  page.evaluate(({ x, y }) => {
    const c = document.getElementById('drawingCanvas')
    const r = c.getBoundingClientRect()
    return { x: r.left + (x * r.width) / c.width, y: r.top + (y * r.height) / c.height }
  }, p)

export const toCanvas = (page, p) =>
  page.evaluate(({ x, y }) => {
    const c = document.getElementById('drawingCanvas')
    const r = c.getBoundingClientRect()
    return { x: ((x - r.left) * c.width) / r.width, y: ((y - r.top) * c.height) / r.height }
  }, p)

// True when a pointer at this client point would reach #drawingCanvas (not clipped or covered).
export const reachesDrawingCanvas = (page, p) =>
  page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id === 'drawingCanvas', p)

// Client-space box of #drawingCanvas that pointers can actually reach (viewport and scroll clipping applied).
export const reachableBox = (page) =>
  page.evaluate(() => {
    const c = document.getElementById('drawingCanvas')
    const r = c.getBoundingClientRect()
    const n = 50
    let box = null
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = r.left + ((i + 0.5) * r.width) / n
        const y = r.top + ((j + 0.5) * r.height) / n
        if (document.elementFromPoint(x, y) !== c) continue
        box ??= { left: x, top: y, right: x, bottom: y }
        box.left = Math.min(box.left, x)
        box.top = Math.min(box.top, y)
        box.right = Math.max(box.right, x)
        box.bottom = Math.max(box.bottom, y)
      }
    }
    return box
  })

export async function mouseStroke(page, from, to, steps = 20) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps })
  await page.mouse.up()
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

// Magenta ink within `radius` canvas px of a point on #mainCanvas.
export const inkNear = (page, p, radius = 3) =>
  page.evaluate(
    ({ x, y, r }) => {
      const c = document.getElementById('mainCanvas')
      const cx = Math.round(x)
      const cy = Math.round(y)
      const x0 = Math.max(0, cx - r)
      const y0 = Math.max(0, cy - r)
      const w = Math.min(c.width, cx + r + 1) - x0
      const h = Math.min(c.height, cy + r + 1) - y0
      if (w <= 0 || h <= 0) return false
      const d = c.getContext('2d').getImageData(x0, y0, w, h).data
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 200 && d[i + 1] < 60 && d[i + 2] > 200 && d[i + 3] > 200) return true
      }
      return false
    },
    { ...p, r: radius }
  )

// Bounding box (canvas px) of all magenta ink on #mainCanvas, or null when there is none.
export const inkBox = (page) =>
  page.evaluate(() => {
    const c = document.getElementById('mainCanvas')
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
    let box = null
    for (let i = 0; i < d.length; i += 4) {
      if (!(d[i] > 200 && d[i + 1] < 60 && d[i + 2] > 200 && d[i + 3] > 200)) continue
      const x = (i / 4) % c.width
      const y = Math.floor(i / 4 / c.width)
      box ??= { minX: x, minY: y, maxX: x, maxY: y }
      box.minX = Math.min(box.minX, x)
      box.maxX = Math.max(box.maxX, x)
      box.minY = Math.min(box.minY, y)
      box.maxY = Math.max(box.maxY, y)
    }
    return box
  })

// Rendered (post-transform) size of #signatureBox.
export const signatureBoxWidth = (page) =>
  page.evaluate(() => document.getElementById('signatureBox').getBoundingClientRect().width)

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
