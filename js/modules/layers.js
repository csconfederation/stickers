// Layers carry content shared by every asset of a team. Where each one sits is
// per asset: layer.placements[assetKey] once the user edits it, else
// layer.origins[assetKey] (where a signature was drawn on that asset), else
// defaultPlacement().
import { ASSET_TYPES } from '../config.js';
import { clampScale, hitTest, normalizeTransform } from './transform.js';

// Text is laid out at this font size; a text layer's scale 1 means 100px glyphs.
export const TEXT_FONT_PX = 100;
const LINE_HEIGHT = 1.2;

// Fractions of the asset size; tune these to taste. An asset type can override any
// of them with placement hints in ASSET_TYPES (js/config.js), and pin the
// signature's center with centerX and centerY.
export const PLACEMENT = {
  signatureMaxWidth: 0.55,
  signatureMaxHeight: 0.3,
  squareMaxAspect: 2, // assets up to this width/height ratio count as square-ish
  squareCenterY: 0.72,
  wideCenterX: 0.75, // wide assets keep clear of a logo that sits centered or left
  wideCenterY: 0.7,
  textHeight: 0.11,
  textMaxWidth: 0.9,
  textGap: 0.01,
  stackStep: 0.12 // each further layer of a kind starts this much lower, so they don't pile up
};

let nextId = 1;
const newId = () => `layer-${nextId++}`;

export const createSignatureLayer = (image) => ({ id: newId(), kind: 'signature', image, placements: {}, origins: {} });

export const createTextLayer = ({ text, color, outlineColor, outlineWidth }) => ({
  id: newId(),
  kind: 'text',
  text,
  color,
  outlineColor,
  outlineWidth,
  font: { family: 'Exo', weight: 900 },
  placements: {},
  origins: {}
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

function signatureAnchor(asset, tuning) {
  if (tuning.centerX !== undefined) return { x: asset.width * tuning.centerX, y: asset.height * tuning.centerY };
  const wide = asset.width / asset.height > tuning.squareMaxAspect;
  return wide
    ? { x: asset.width * tuning.wideCenterX, y: asset.height * tuning.wideCenterY }
    : { x: asset.width / 2, y: asset.height * tuning.squareCenterY };
}

function signatureDefault(size, asset, tuning) {
  const scale = Math.min(tuning.signatureMaxWidth * asset.width / size.width, tuning.signatureMaxHeight * asset.height / size.height);
  return { ...signatureAnchor(asset, tuning), scale: clampScale(scale) };
}

// index counts the layers of this kind before it. signatureSize is the first
// signature layer's size, if any: text goes just under that signature's default
// box, or at the signature spot when there is none. hints are the asset type's
// overrides of PLACEMENT.
export function defaultPlacement(kind, size, asset, index = 0, signatureSize = null, hints = null) {
  const tuning = hints ? { ...PLACEMENT, ...hints } : PLACEMENT;
  let x;
  let y;
  let scale;
  if (kind === 'signature') {
    ({ x, y, scale } = signatureDefault(size, asset, tuning));
  } else {
    const anchor = signatureAnchor(asset, tuning);
    const signature = signatureSize && signatureDefault(signatureSize, asset, tuning);
    const bottom = signature ? anchor.y + signatureSize.height * signature.scale / 2 : anchor.y;
    scale = clampScale(Math.min(tuning.textHeight * asset.height / size.height, tuning.textMaxWidth * asset.width / size.width));
    x = anchor.x;
    y = bottom + tuning.textGap * asset.height + size.height * scale / 2;
  }
  const half = size.height * scale / 2;
  y = Math.min(y + index * tuning.stackStep * asset.height, asset.height - half);
  return { x, y, scale, rotation: 0, opacity: 1 };
}

// Placement of every layer on one asset, in layer order.
export function resolvePlacements(layers, assetKey, asset, measure) {
  const sizes = layers.map((layer) => layerSize(layer, measure));
  const firstSignature = layers.findIndex((layer) => layer.kind === 'signature');
  const signatureSize = firstSignature === -1 ? null : sizes[firstSignature];
  const hints = ASSET_TYPES[assetKey]?.placement;
  const seen = { signature: 0, text: 0 };
  return layers.map((layer, i) => {
    const index = seen[layer.kind]++;
    return layer.placements[assetKey] ?? layer.origins[assetKey] ?? defaultPlacement(layer.kind, sizes[i], asset, index, signatureSize, hints);
  });
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
  for (const layer of layers) {
    layer.placements = {};
    layer.origins = {};
  }
};
