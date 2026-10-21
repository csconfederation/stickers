import { UPLOAD } from '../config.js';

// A stroke is { brush: { size, color, outlineWidth, outlineColor }, points: [{ x, y }] }.

// Smallest pixel rect containing all ink, outline included; null if nothing is
// on the canvas. The extra pixel covers anti-aliasing past the geometric edge.
export function strokeBounds(strokes, width, height) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { brush, points } of strokes) {
    const reach = brush.size / 2 + brush.outlineWidth + 1;
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

// Returns an error message, or null if the file is acceptable.
export function validateUpload(file) {
  if (!UPLOAD.types.includes(file.type)) return 'Unsupported file type. Use a PNG, JPEG, WebP, GIF or BMP image.';
  if (file.size > UPLOAD.maxBytes) return 'File too large. The maximum size is 10 MB.';
  return null;
}

// One segment of a stroke. The outline is painted behind everything already on
// the pad, so it can never cover this stroke's main line.
function paintSegment(ctx, from, to, brush) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = brush.color;
  ctx.lineWidth = brush.size;
  ctx.stroke();
  if (brush.outlineWidth > 0) {
    ctx.globalCompositeOperation = 'destination-over';
    ctx.strokeStyle = brush.outlineColor;
    ctx.lineWidth = brush.size + brush.outlineWidth * 2;
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }
}

export class DrawingPad {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.strokes = [];
    this.active = null;
  }

  get isEmpty() {
    return this.strokes.length === 0;
  }

  // Resizing clears the bitmap, so replay the strokes afterwards.
  resize(width, height) {
    if (this.canvas.width === width && this.canvas.height === height) return;
    this.canvas.width = width;
    this.canvas.height = height;
    this.redraw();
  }

  start(point, brush) {
    this.active = { brush: { ...brush }, points: [point] };
    this.strokes.push(this.active);
    paintSegment(this.ctx, point, point, brush);
  }

  extend(point) {
    if (!this.active) return;
    const last = this.active.points[this.active.points.length - 1];
    this.active.points.push(point);
    paintSegment(this.ctx, last, point, this.active.brush);
  }

  end() {
    this.active = null;
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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const { brush, points } of this.strokes) {
      paintSegment(this.ctx, points[0], points[0], brush);
      for (let i = 1; i < points.length; i++) paintSegment(this.ctx, points[i - 1], points[i], brush);
    }
  }

  // The inked area as its own canvas plus the center it was drawn around.
  capture() {
    const bounds = strokeBounds(this.strokes, this.canvas.width, this.canvas.height);
    if (!bounds) return null;
    const source = document.createElement('canvas');
    source.width = bounds.width;
    source.height = bounds.height;
    source.getContext('2d').drawImage(
      this.canvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height
    );
    return { source, center: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 } };
  }
}
