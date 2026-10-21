// Layers carry content shared by every asset of a team; where each one sits is
// stored per asset in layer.placements[assetKey] once the user edits it. An
// asset without a stored placement gets defaultPlacement().
import { clampScale, hitTest, normalizeTransform } from './transform.js';

// Text is laid out at this font size; a text layer's scale 1 means 100px glyphs.
export const TEXT_FONT_PX = 100;
const LINE_HEIGHT = 1.2;

// Fractions of the asset size; tune these to taste.
export const PLACEMENT = {
  signatureMaxWidth: 0.55,
  signatureMaxHeight: 0.3,
  squareMaxAspect: 2, // assets up to this width/height ratio count as square-ish
  squareCenterY: 0.72,
  wideCenterX: 0.75, // wide assets keep clear of a logo that sits centered or left
  wideCenterY: 0.7,
  textHeight: 0.11,
  textMaxWidth: 0.9,
  textGap: 0.01
};

let nextId = 1;
const newId = () => `layer-${nextId++}`;

export const createSignatureLayer = (image) => ({ id: newId(), kind: 'signature', image, placements: {} });

export const createTextLayer = ({ text, color, outlineColor, outlineWidth }) => ({
  id: newId(),
  kind: 'text',
  text,
  color,
  outlineColor,
  outlineWidth,
  font: { family: 'Exo', weight: 900 },
  placements: {}
});

// One font string for measuring and drawing, so hit boxes match the glyphs.
export const textFont = (layer) => `${layer.font.weight} ${TEXT_FONT_PX}px "${layer.font.family}", sans-serif`;

// measure(font, text) returns the text's width in pixels.
export const measureWith = (ctx) => (font, text) => {
  ctx.save();
  ctx.font = font;
  const { width } = ctx.measureText(text);
  ctx.restore();
  return width;
};

// Natural size in layer pixels, before scale. Text includes room for its outline.
export function layerSize(layer, measure) {
  if (layer.kind === 'signature') return { width: layer.image.width, height: layer.image.height };
  const margin = 2 * layer.outlineWidth;
  return {
    width: Math.max(measure(textFont(layer), layer.text), 1) + margin,
    height: TEXT_FONT_PX * LINE_HEIGHT + margin
  };
}

function signatureAnchor(asset) {
  const wide = asset.width / asset.height > PLACEMENT.squareMaxAspect;
  return wide
    ? { x: asset.width * PLACEMENT.wideCenterX, y: asset.height * PLACEMENT.wideCenterY }
    : { x: asset.width / 2, y: asset.height * PLACEMENT.squareCenterY };
}

function signatureDefault(size, asset) {
  const scale = Math.min(PLACEMENT.signatureMaxWidth * asset.width / size.width, PLACEMENT.signatureMaxHeight * asset.height / size.height);
  return { ...signatureAnchor(asset), scale: clampScale(scale) };
}

// signatureSize is the first signature layer's size, if any: text goes just
// under that signature's default box, or at the signature spot when there is none.
export function defaultPlacement(kind, size, asset, signatureSize = null) {
  let x;
  let y;
  let scale;
  if (kind === 'signature') {
    ({ x, y, scale } = signatureDefault(size, asset));
  } else {
    const anchor = signatureAnchor(asset);
    const signature = signatureSize && signatureDefault(signatureSize, asset);
    const bottom = signature ? anchor.y + signatureSize.height * signature.scale / 2 : anchor.y;
    scale = clampScale(Math.min(PLACEMENT.textHeight * asset.height / size.height, PLACEMENT.textMaxWidth * asset.width / size.width));
    const half = size.height * scale / 2;
    x = anchor.x;
    y = Math.min(bottom + PLACEMENT.textGap * asset.height + half, asset.height - half);
  }
  return { x, y, scale, rotation: 0, opacity: 1 };
}

// Placement of every layer on one asset, in layer order.
export function resolvePlacements(layers, assetKey, asset, measure) {
  const sizes = layers.map((layer) => layerSize(layer, measure));
  const firstSignature = layers.findIndex((layer) => layer.kind === 'signature');
  const signatureSize = firstSignature === -1 ? null : sizes[firstSignature];
  return layers.map((layer, i) => layer.placements[assetKey] ?? defaultPlacement(layer.kind, sizes[i], asset, signatureSize));
}

// The topmost layer under the point, or null.
export function topLayerAt(layers, point, assetKey, asset, measure) {
  const placements = resolvePlacements(layers, assetKey, asset, measure);
  for (let i = layers.length - 1; i >= 0; i--) {
    if (hitTest(point, placements[i], layerSize(layers[i], measure))) return layers[i];
  }
  return null;
}

export const manualPlacement = (placement, asset) => ({ ...normalizeTransform(placement, asset), manual: true });

// A copy of placements with one asset's entry changed; the others are untouched.
export function editPlacement(placements, assetKey, current, change, asset) {
  return { ...placements, [assetKey]: manualPlacement({ ...current, ...change }, asset) };
}

export const clearPlacements = (layers) => {
  for (const layer of layers) layer.placements = {};
};
