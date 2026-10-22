import { BACKGROUND_TYPES, GRADIENT_DIRECTIONS } from '../config.js';
import { layerSize, measureWith, resolvePlacements, textFont } from './layers.js';
import { pointerToCanvas } from './utils.js';

// [x0, y0, x1, y1] of the gradient line for a direction.
export function gradientEndpoints(direction, width, height) {
  switch (direction) {
    case GRADIENT_DIRECTIONS.TO_RIGHT: return [0, 0, width, 0];
    case GRADIENT_DIRECTIONS.TO_BOTTOM_RIGHT: return [0, 0, width, height];
    case GRADIENT_DIRECTIONS.TO_BOTTOM_LEFT: return [width, 0, 0, height];
    default: return [0, 0, 0, height];
  }
}

function paintBackdrop(ctx, { type, solidColor, gradientColor1, gradientColor2, gradientDirection }, { width, height }) {
  if (type === BACKGROUND_TYPES.SOLID) {
    ctx.fillStyle = solidColor;
  } else if (type === BACKGROUND_TYPES.GRADIENT) {
    const gradient = ctx.createLinearGradient(...gradientEndpoints(gradientDirection, width, height));
    gradient.addColorStop(0, gradientColor1);
    gradient.addColorStop(1, gradientColor2);
    ctx.fillStyle = gradient;
  } else {
    return;
  }
  ctx.fillRect(0, 0, width, height);
}

// Shrunk far below its bitmap (kit thumbnails, the landing stamp), a signature's
// strokes thin under a device pixel and vanish into the art. Below this scale it
// is first drawn a device pixel off in each direction, which thickens it.
const MIN_SIGNATURE_SCALE = 0.5;

// Never at render scale 1, so the stage and the export stay exact.
export const needsDilation = (renderScale, layerScale) => renderScale < 1 && renderScale * layerScale < MIN_SIGNATURE_SCALE;

const DILATION = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
let scratch = null; // reused for every dilated draw

// Draws the signature nine times, a device pixel apart, into the scratch canvas at
// full alpha, then onto ctx once, so its opacity applies once rather than stacking.
function drawDilated(ctx, image, size, deviceScale) {
  const w = Math.ceil(size.width * deviceScale) + 2;
  const h = Math.ceil(size.height * deviceScale) + 2;
  scratch ??= document.createElement('canvas');
  if (scratch.width < w || scratch.height < h) {
    scratch.width = Math.max(w, scratch.width);
    scratch.height = Math.max(h, scratch.height);
  }
  const sctx = scratch.getContext('2d');
  sctx.clearRect(0, 0, w, h);
  for (const [dx, dy] of DILATION) sctx.drawImage(image, 1 + dx, 1 + dy, size.width * deviceScale, size.height * deviceScale);
  const pad = 1 / deviceScale;
  ctx.drawImage(scratch, 0, 0, w, h, -size.width / 2 - pad, -size.height / 2 - pad, w / deviceScale, h / deviceScale);
}

function drawLayer(ctx, layer, placement, size, renderScale) {
  ctx.save();
  ctx.globalAlpha = placement.opacity;
  ctx.translate(placement.x, placement.y);
  ctx.rotate(placement.rotation * Math.PI / 180);
  ctx.scale(placement.scale, placement.scale);
  if (layer.kind === 'signature' && needsDilation(renderScale, placement.scale)) {
    drawDilated(ctx, layer.image, size, renderScale * placement.scale);
  } else if (layer.kind === 'signature') {
    ctx.drawImage(layer.image, -size.width / 2, -size.height / 2);
  } else {
    ctx.font = textFont(layer);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    if (layer.outlineWidth > 0) {
      ctx.strokeStyle = layer.outlineColor;
      ctx.lineWidth = layer.outlineWidth * 2; // half of it sits under the fill
      ctx.strokeText(layer.text, 0, 0);
    }
    ctx.fillStyle = layer.color;
    ctx.fillText(layer.text, 0, 0);
  }
  ctx.restore();
}

// Draws one asset: its image (over the custom backdrop where customBackground
// allows one), then every layer in order. assetSize is the export size; scale
// shrinks the whole thing (1 for the stage and export, less for kit thumbnails,
// where image is the thumbnail).
export function renderComposite(ctx, { image, assetSize, backgroundSettings, customBackground, layers, assetKey, scale = 1 }) {
  const { width, height } = assetSize;
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  if (image) {
    if (customBackground) paintBackdrop(ctx, backgroundSettings, assetSize);
    ctx.drawImage(image, 0, 0, width, height);
  }
  const measure = measureWith(ctx);
  const placements = resolvePlacements(layers, assetKey, assetSize, measure);
  layers.forEach((layer, i) => drawLayer(ctx, layer, placements[i], layerSize(layer, measure), scale));
  ctx.restore();
}

export class CanvasManager {
  // The wrapper's --w/--h custom properties drive its displayed size (see CSS).
  constructor(canvas, wrapper) {
    this.canvas = canvas;
    this.wrapper = wrapper;
    this.ctx = canvas.getContext('2d');
  }

  // Assigning width/height clears the bitmap, so only do it on a real change.
  setDimensions(width, height) {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.wrapper.style.setProperty('--w', width);
    this.wrapper.style.setProperty('--h', height);
  }

  pointFromEvent(event) {
    return pointerToCanvas(event.clientX, event.clientY, this.canvas.getBoundingClientRect(), this.canvas);
  }

  render(scene) {
    renderComposite(this.ctx, { ...scene, scale: 1 });
  }
}
