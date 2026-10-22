import { describe, expect, test } from 'bun:test';
import { gradientEndpoints, needsDilation, renderComposite } from '../../js/modules/canvas.js';
import { createSignatureLayer } from '../../js/modules/layers.js';

test('gradientEndpoints', () => {
  expect(gradientEndpoints('to-bottom', 100, 50)).toEqual([0, 0, 0, 50]);
  expect(gradientEndpoints('to-right', 100, 50)).toEqual([0, 0, 100, 0]);
  expect(gradientEndpoints('to-bottom-right', 100, 50)).toEqual([0, 0, 100, 50]);
  expect(gradientEndpoints('to-bottom-left', 100, 50)).toEqual([100, 0, 0, 50]);
  expect(gradientEndpoints('unknown', 100, 50)).toEqual([0, 0, 0, 50]);
});

test('needsDilation: never at render scale 1, so the stage and export stay exact', () => {
  expect(needsDilation(1, 0.1)).toBe(false);
});

test('needsDilation: only when the signature is drawn below half size', () => {
  expect(needsDilation(0.25, 2)).toBe(false);
  expect(needsDilation(0.2, 0.5)).toBe(true);
});

// A 2D context that records each drawImage with the alpha it was drawn at.
function recordingContext(draws, name) {
  const ctx = { globalAlpha: 1, imageSmoothingQuality: 'low' };
  for (const fn of ['save', 'restore', 'setTransform', 'clearRect', 'translate', 'rotate', 'scale']) ctx[fn] = () => {};
  ctx.drawImage = (source) => draws.push({ on: name, source, alpha: ctx.globalAlpha });
  return ctx;
}

describe('renderComposite: a faded signature', () => {
  const layer = createSignatureLayer({ width: 400, height: 100 });
  layer.placements.Sticker = { x: 256, y: 256, scale: 0.5, rotation: 0, opacity: 0.1 };
  const scene = (scale) => ({
    image: null,
    assetSize: { width: 512, height: 512 },
    backgroundSettings: {},
    customBackground: false,
    layers: [layer],
    assetKey: 'Sticker',
    scale
  });

  test('dilated in a thumbnail, it reaches the asset once, at its own opacity', () => {
    const draws = [];
    const scratch = { width: 0, height: 0, getContext: () => recordingContext(draws, 'scratch') };
    globalThis.document = { createElement: () => scratch };
    try {
      renderComposite(recordingContext(draws, 'asset'), scene(0.2));
    } finally {
      delete globalThis.document;
    }
    const onAsset = draws.filter((d) => d.on === 'asset');
    expect(onAsset).toEqual([{ on: 'asset', source: scratch, alpha: 0.1 }]);
    const onScratch = draws.filter((d) => d.on === 'scratch');
    expect(onScratch).toHaveLength(9);
    expect(onScratch.every((d) => d.alpha === 1)).toBe(true);
  });

  test('on the stage and in the export it is drawn once, directly', () => {
    const draws = [];
    renderComposite(recordingContext(draws, 'asset'), scene(1));
    expect(draws).toEqual([{ on: 'asset', source: layer.image, alpha: 0.1 }]);
  });
});
