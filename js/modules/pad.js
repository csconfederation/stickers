// A signature pad over any canvas element. Strokes are kept in the pad's CSS
// pixels as points with a width each, so they can be replayed after a resize
// or an undo. A stroke is { brush: { size, color, outlineWidth, outlineColor },
// points: [{ x, y, w }] }.
import { clamp, pointerToCanvas } from './utils.js';

const MAX_BITMAP_SIDE = 4096;
const SPEED_SLOWDOWN = 0.2; // share of the brush width lost per px/ms of pointer speed
const MIN_SPEED_FACTOR = 0.6;
const WIDTH_SMOOTHING = 0.7; // weight of the previous point's width

// Line width at a point. A pen follows pressure; a mouse or finger gets thinner
// when moving fast, between 60% and 100% of the brush size.
export function pointWidth({ pointerType, pressure, size, speed, previous }) {
  if (pointerType === 'pen') return size * (0.35 + 0.65 * pressure);
  if (speed === undefined) return previous ?? size;
  const target = size * clamp(1 - SPEED_SLOWDOWN * speed, MIN_SPEED_FACTOR, 1);
  return previous === undefined ? target : previous * WIDTH_SMOOTHING + target * (1 - WIDTH_SMOOTHING);
}

// Bitmap scale for a pad: at least the screen's pixel ratio, and enough
// resolution that the signature stays sharp at the widest export, capped.
export function padPixelRatio(cssWidth, cssHeight, devicePixelRatio, minBitmapWidth) {
  const wanted = Math.max(devicePixelRatio, minBitmapWidth / cssWidth);
  return Math.min(wanted, MAX_BITMAP_SIDE / Math.max(cssWidth, cssHeight));
}

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// Strokes are drawn as quadratic curves between segment midpoints, bending
// toward each sample. Segment k needs point k + 1, so it can be drawn as soon as
// that point arrives; the closing segment finishes the stroke at its last point.
export function segmentAt(points, k) {
  if (k === 0) return { from: points[0], control: null, to: mid(points[0], points[1]), width: points[0].w };
  return { from: mid(points[k - 1], points[k]), control: points[k], to: mid(points[k], points[k + 1]), width: points[k].w };
}

export function closingSegment(points) {
  const last = points.length - 1;
  return { from: mid(points[last - 1], points[last]), control: null, to: points[last], width: points[last].w };
}

export function strokeSegments(points, closed = true) {
  if (points.length === 1) return [{ from: points[0], control: null, to: points[0], width: points[0].w }];
  const segments = [];
  for (let k = 0; k < points.length - 1; k++) segments.push(segmentAt(points, k));
  if (closed) segments.push(closingSegment(points));
  return segments;
}

// Smallest rect in CSS px containing all ink, outline included; null if none is
// on the pad. The extra pixel covers anti-aliasing past the geometric edge.
export function strokeBounds(strokes, width, height) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { brush, points } of strokes) {
    const reach = Math.max(...points.map((p) => p.w)) / 2 + brush.outlineWidth + 1;
    for (const p of points) {
      minX = Math.min(minX, p.x - reach);
      minY = Math.min(minY, p.y - reach);
      maxX = Math.max(maxX, p.x + reach);
      maxY = Math.max(maxY, p.y + reach);
    }
  }
  const x = Math.max(0, Math.floor(minX));
  const y = Math.max(0, Math.floor(minY));
  const right = Math.min(width, Math.ceil(maxX));
  const bottom = Math.min(height, Math.ceil(maxY));
  if (!(right > x && bottom > y)) return null;
  return { x, y, width: right - x, height: bottom - y };
}

// The outline is painted behind everything already on the pad, so it can never
// cover its stroke's main line.
function paintSegment(ctx, { from, control, to, width }, brush) {
  // A zero-length line renders nothing; a hair of length draws the round cap as a dot.
  const isDot = !control && from.x === to.x && from.y === to.y;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  if (control) ctx.quadraticCurveTo(control.x, control.y, to.x, to.y);
  else ctx.lineTo(isDot ? to.x + 0.01 : to.x, to.y);
  ctx.strokeStyle = brush.color;
  ctx.lineWidth = width;
  ctx.stroke();
  if (brush.outlineWidth > 0) {
    ctx.globalCompositeOperation = 'destination-over';
    ctx.strokeStyle = brush.outlineColor;
    ctx.lineWidth = width + brush.outlineWidth * 2;
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }
}

export class DrawingPad {
  // getBrush() is read when each stroke starts, so a brush change applies to the next stroke.
  constructor(canvas, getBrush) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.getBrush = getBrush;
    this.strokes = [];
    this.active = null;
    this.last = null;
    this.pointerId = null;
    this.cssSize = { width: 0, height: 0 };
    this.pixelRatio = 1;
    this.bindPointer();
  }

  get isEmpty() {
    return this.strokes.length === 0;
  }

  // Sets the displayed size and bitmap scale. Strokes scale with the pad so they
  // stay over the same spot when the display size changes.
  resize(cssWidth, cssHeight, pixelRatio) {
    const old = this.cssSize;
    if (old.width === cssWidth && old.height === cssHeight && this.pixelRatio === pixelRatio) return;
    const factor = old.width && old.height ? Math.min(cssWidth / old.width, cssHeight / old.height) : 1;
    if (Math.abs(factor - 1) > 1e-9) this.scaleStrokes(factor);
    this.cssSize = { width: cssWidth, height: cssHeight };
    this.pixelRatio = pixelRatio;
    this.canvas.width = Math.round(cssWidth * pixelRatio);
    this.canvas.height = Math.round(cssHeight * pixelRatio);
    this.redraw();
  }

  scaleStrokes(factor) {
    for (const { brush, points } of this.strokes) {
      brush.size *= factor;
      brush.outlineWidth *= factor;
      for (const p of points) {
        p.x *= factor;
        p.y *= factor;
        p.w *= factor;
      }
    }
  }

  // sample is { x, y, pressure, pointerType, time } with x/y in pad CSS px.
  start(sample, brush) {
    const w = pointWidth({ pointerType: sample.pointerType, pressure: sample.pressure, size: brush.size });
    this.active = { brush: { ...brush }, points: [{ x: sample.x, y: sample.y, w }] };
    this.strokes.push(this.active);
    this.last = sample;
    paintSegment(this.ctx, strokeSegments(this.active.points)[0], brush);
  }

  extend(sample) {
    const stroke = this.active;
    if (!stroke) return;
    const prev = stroke.points[stroke.points.length - 1];
    const elapsed = sample.time - this.last.time;
    const speed = elapsed > 0 ? Math.hypot(sample.x - prev.x, sample.y - prev.y) / elapsed : undefined;
    const w = pointWidth({ pointerType: sample.pointerType, pressure: sample.pressure, size: stroke.brush.size, speed, previous: prev.w });
    stroke.points.push({ x: sample.x, y: sample.y, w });
    this.last = sample;
    paintSegment(this.ctx, segmentAt(stroke.points, stroke.points.length - 2), stroke.brush);
  }

  end() {
    const stroke = this.active;
    this.active = null;
    if (stroke && stroke.points.length > 1) paintSegment(this.ctx, closingSegment(stroke.points), stroke.brush);
  }

  undo() {
    this.active = null;
    this.strokes.pop();
    this.redraw();
  }

  clear() {
    this.active = null;
    this.strokes = [];
    this.redraw();
  }

  redraw() {
    const { ctx, canvas, pixelRatio } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    for (const stroke of this.strokes) {
      for (const segment of strokeSegments(stroke.points, stroke !== this.active)) paintSegment(ctx, segment, stroke.brush);
    }
  }

  // The inked area as its own canvas (bitmap pixels) with its bounds and the
  // pad's size in CSS px, or null when nothing is drawn.
  capture() {
    const { width, height } = this.cssSize;
    const bounds = strokeBounds(this.strokes, width, height);
    if (!bounds) return null;
    const r = this.pixelRatio;
    const x = Math.floor(bounds.x * r);
    const y = Math.floor(bounds.y * r);
    const w = Math.min(this.canvas.width, Math.ceil((bounds.x + bounds.width) * r)) - x;
    const h = Math.min(this.canvas.height, Math.ceil((bounds.y + bounds.height) * r)) - y;
    const image = document.createElement('canvas');
    image.width = w;
    image.height = h;
    image.getContext('2d').drawImage(this.canvas, x, y, w, h, 0, 0, w, h);
    return {
      image,
      bounds: { x: x / r, y: y / r, width: w / r, height: h / r },
      padSize: { ...this.cssSize },
      pixelRatio: r
    };
  }

  bindPointer() {
    const canvas = this.canvas;
    const sample = (e, rect) => ({
      ...pointerToCanvas(e.clientX, e.clientY, rect, this.cssSize),
      pressure: e.pressure,
      pointerType: e.pointerType,
      time: e.timeStamp
    });

    canvas.addEventListener('pointerdown', (e) => {
      if (this.pointerId !== null || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      canvas.setPointerCapture(e.pointerId);
      this.pointerId = e.pointerId;
      this.start(sample(e, canvas.getBoundingClientRect()), this.getBrush());
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.pointerId) return;
      const rect = canvas.getBoundingClientRect();
      const events = e.getCoalescedEvents?.() ?? [];
      for (const event of events.length ? events : [e]) this.extend(sample(event, rect));
    });
    const finish = (e) => {
      if (e.pointerId !== this.pointerId) return;
      this.pointerId = null;
      this.end();
    };
    canvas.addEventListener('pointerup', finish);
    canvas.addEventListener('pointercancel', finish);
  }
}
