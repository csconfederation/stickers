import { describe, expect, test } from 'bun:test';
import { ASSET_TYPES, SCALE_LIMITS } from '../../js/config.js';
import {
  PLACEMENT, TEXT_FONT_PX, clearPlacements, createSignatureLayer, createTextLayer, defaultPlacement, editPlacement,
  layerSize, resolvePlacements, textFont, topLayerAt
} from '../../js/modules/layers.js';

const square = { width: 512, height: 512 };
const wide = { width: 1500, height: 500 };
const youtube = { width: 2560, height: 1440 };
// 10 px per character, whatever the font
const measure = (font, text) => text.length * 10;
const image = (width, height) => ({ width, height });
const text = (overrides = {}) => createTextLayer({ text: 'ABCDE', color: '#fff', outlineColor: '#000', outlineWidth: 0, ...overrides });

describe('layerSize', () => {
  test('a signature is its image', () => {
    expect(layerSize(createSignatureLayer(image(300, 120)), measure)).toEqual({ width: 300, height: 120 });
  });

  test('text is its measured width by the line height', () => {
    expect(layerSize(text(), measure)).toEqual({ width: 50, height: TEXT_FONT_PX * 1.2 });
  });

  test('text leaves room for its outline on every side', () => {
    expect(layerSize(text({ outlineWidth: 4 }), measure)).toEqual({ width: 58, height: TEXT_FONT_PX * 1.2 + 8 });
  });

  test('empty text keeps a one pixel width', () => {
    expect(layerSize(text({ text: '' }), measure).width).toBe(1);
  });

  test('the font is Exo 900 and one string serves measuring and drawing', () => {
    const layer = text();
    expect(layer.font).toEqual({ family: 'Exo', weight: 900 });
    expect(textFont(layer)).toBe(`900 ${TEXT_FONT_PX}px "Exo", sans-serif`);
  });
});

describe('defaultPlacement: signature', () => {
  test('square-ish asset: centered horizontally, 72% down', () => {
    const p = defaultPlacement('signature', { width: 400, height: 100 }, square);
    expect(p.x).toBe(256);
    expect(p.y).toBeCloseTo(0.72 * 512);
    expect(p.scale).toBeCloseTo(0.55 * 512 / 400); // width is the limit
    expect([p.rotation, p.opacity]).toEqual([0, 1]);
  });

  test('16:9 counts as square-ish', () => {
    const p = defaultPlacement('signature', { width: 400, height: 100 }, youtube);
    expect(p.x).toBe(1280);
    expect(p.y).toBeCloseTo(0.72 * 1440);
  });

  test('wide asset: 75% across and 70% down, clear of a centered logo', () => {
    const p = defaultPlacement('signature', { width: 400, height: 100 }, wide);
    expect(p.x).toBe(1125);
    expect(p.y).toBe(350);
    expect(p.scale).toBeCloseTo(Math.min(0.55 * 1500 / 400, 0.3 * 500 / 100)); // 1.5: the height limit
  });

  test('fits within 55% of the width and 30% of the height', () => {
    for (const asset of [square, wide, youtube]) {
      for (const size of [{ width: 600, height: 600 }, { width: 900, height: 80 }, { width: 80, height: 900 }]) {
        const p = defaultPlacement('signature', size, asset);
        expect(size.width * p.scale).toBeLessThanOrEqual(PLACEMENT.signatureMaxWidth * asset.width + 1e-6);
        expect(size.height * p.scale).toBeLessThanOrEqual(PLACEMENT.signatureMaxHeight * asset.height + 1e-6);
      }
    }
  });

  test('scale respects the global limits', () => {
    expect(defaultPlacement('signature', { width: 5, height: 5 }, youtube).scale).toBe(SCALE_LIMITS.max);
    expect(defaultPlacement('signature', { width: 90000, height: 90000 }, square).scale).toBe(SCALE_LIMITS.min);
  });
});

describe('defaultPlacement: text', () => {
  const size = { width: 400, height: 120 };

  test('about 11% of the asset height', () => {
    const p = defaultPlacement('text', size, square);
    expect(size.height * p.scale).toBeCloseTo(0.11 * 512);
  });

  test('sits just under the signature default box', () => {
    const signatureSize = { width: 400, height: 100 };
    const signature = defaultPlacement('signature', signatureSize, square);
    const p = defaultPlacement('text', size, square, signatureSize);
    const signatureBottom = signature.y + signatureSize.height * signature.scale / 2;
    const textTop = p.y - size.height * p.scale / 2;
    expect(p.x).toBe(signature.x);
    expect(textTop).toBeGreaterThanOrEqual(signatureBottom);
    expect(textTop - signatureBottom).toBeCloseTo(PLACEMENT.textGap * 512);
  });

  test('without a signature it takes the signature spot', () => {
    const p = defaultPlacement('text', size, square);
    expect(p.y - size.height * p.scale / 2).toBeCloseTo(0.72 * 512 + PLACEMENT.textGap * 512);
  });

  test('stays inside the asset', () => {
    const p = defaultPlacement('text', size, wide, { width: 600, height: 600 });
    expect(p.y + size.height * p.scale / 2).toBeLessThanOrEqual(wide.height + 1e-6);
  });

  test('long text is narrowed to fit the width', () => {
    const p = defaultPlacement('text', { width: 4000, height: 120 }, square);
    expect(4000 * p.scale).toBeLessThanOrEqual(0.9 * 512 + 1e-6);
  });
});

describe('placements per asset', () => {
  const asset = (key) => ({ width: ASSET_TYPES[key].width, height: ASSET_TYPES[key].height });

  test('an asset with no stored placement resolves to the default', () => {
    const layer = createSignatureLayer(image(400, 100));
    const [p] = resolvePlacements([layer], 'Sticker', asset('Sticker'), measure);
    expect(p).toEqual(defaultPlacement('signature', { width: 400, height: 100 }, asset('Sticker')));
  });

  test('editing asset A does not move asset B', () => {
    const layer = createSignatureLayer(image(400, 100));
    const before = resolvePlacements([layer], 'YoutubeBanner', asset('YoutubeBanner'), measure)[0];

    const current = resolvePlacements([layer], 'Sticker', asset('Sticker'), measure)[0];
    layer.placements = editPlacement(layer.placements, 'Sticker', current, { x: 10, y: 20, scale: 2 }, asset('Sticker'));

    expect(resolvePlacements([layer], 'Sticker', asset('Sticker'), measure)[0]).toMatchObject({ x: 10, y: 20, scale: 2, manual: true });
    expect(resolvePlacements([layer], 'YoutubeBanner', asset('YoutubeBanner'), measure)[0]).toEqual(before);
    expect(Object.keys(layer.placements)).toEqual(['Sticker']);
  });

  test('editing keeps the other stored placements as they were', () => {
    const a = { x: 1, y: 2, scale: 1, rotation: 0, opacity: 1, manual: true };
    const placements = { TwitchBanner: a };
    const next = editPlacement(placements, 'Sticker', a, { x: 100 }, asset('Sticker'));
    expect(next.TwitchBanner).toBe(a);
    expect(placements).toEqual({ TwitchBanner: a }); // the old object is not mutated
  });

  test('edits are clamped to the asset and the scale limits', () => {
    const next = editPlacement({}, 'Sticker', { x: 5, y: 5, scale: 1, rotation: 0, opacity: 1 }, { x: 9999, scale: 99, rotation: 270 }, asset('Sticker'));
    expect(next.Sticker).toEqual({ x: 512, y: 5, scale: 5, rotation: -90, opacity: 1, manual: true });
  });

  test('changing team clears placements but keeps the layers and their content', () => {
    const sig = createSignatureLayer(image(400, 100));
    const label = text();
    sig.placements = { Sticker: { x: 1, y: 1, scale: 1, rotation: 0, opacity: 1, manual: true } };
    label.placements = { Sticker: { x: 2, y: 2, scale: 1, rotation: 0, opacity: 1, manual: true } };
    const layers = [sig, label];
    clearPlacements(layers);
    expect(layers).toHaveLength(2);
    expect(layers[0].image).toEqual(image(400, 100));
    expect(layers[1].text).toBe('ABCDE');
    expect(layers.map((l) => l.placements)).toEqual([{}, {}]);
  });

  test('text default depends on the first signature, not on its edits', () => {
    const sig = createSignatureLayer(image(400, 100));
    const label = text();
    const before = resolvePlacements([sig, label], 'Sticker', asset('Sticker'), measure)[1];
    sig.placements = { Sticker: { x: 50, y: 50, scale: 0.2, rotation: 0, opacity: 1, manual: true } };
    expect(resolvePlacements([sig, label], 'Sticker', asset('Sticker'), measure)[1]).toEqual(before);
  });
});

describe('topLayerAt', () => {
  const stage = square;
  const stored = (layer, x, y, extra = {}) => {
    layer.placements.Sticker = { x, y, scale: 1, rotation: 0, opacity: 1, manual: true, ...extra };
    return layer;
  };

  test('the topmost layer wins where layers overlap', () => {
    const bottom = stored(createSignatureLayer(image(200, 200)), 256, 256);
    const top = stored(createSignatureLayer(image(100, 100)), 256, 256);
    expect(topLayerAt([bottom, top], { x: 256, y: 256 }, 'Sticker', stage, measure)).toBe(top);
    expect(topLayerAt([top, bottom], { x: 256, y: 256 }, 'Sticker', stage, measure)).toBe(bottom);
  });

  test('falls through to a lower layer outside the top one', () => {
    const bottom = stored(createSignatureLayer(image(200, 200)), 256, 256);
    const top = stored(createSignatureLayer(image(100, 100)), 256, 256);
    expect(topLayerAt([bottom, top], { x: 340, y: 256 }, 'Sticker', stage, measure)).toBe(bottom);
  });

  test('null when nothing is hit', () => {
    const only = stored(createSignatureLayer(image(100, 100)), 100, 100);
    expect(topLayerAt([only], { x: 400, y: 400 }, 'Sticker', stage, measure)).toBeNull();
    expect(topLayerAt([], { x: 1, y: 1 }, 'Sticker', stage, measure)).toBeNull();
  });

  test('a rotated layer on top is hit by its rotated shape only', () => {
    const bottom = stored(createSignatureLayer(image(400, 400)), 256, 256);
    const top = stored(createSignatureLayer(image(200, 20)), 256, 256, { rotation: 90 });
    // 90 degrees: the thin bar is vertical, 20 wide and 200 tall
    expect(topLayerAt([bottom, top], { x: 256, y: 340 }, 'Sticker', stage, measure)).toBe(top);
    expect(topLayerAt([bottom, top], { x: 340, y: 256 }, 'Sticker', stage, measure)).toBe(bottom);
  });

  test('uses defaults for layers without a placement on this asset', () => {
    const layer = createSignatureLayer(image(400, 100));
    const p = defaultPlacement('signature', { width: 400, height: 100 }, stage);
    expect(topLayerAt([layer], { x: p.x, y: p.y }, 'Sticker', stage, measure)).toBe(layer);
    expect(topLayerAt([layer], { x: 5, y: 5 }, 'Sticker', stage, measure)).toBeNull();
  });

  test('hits text by its measured box', () => {
    const label = stored(text(), 256, 256); // 50 x 120 natural
    expect(topLayerAt([label], { x: 256 + 24, y: 256 + 59 }, 'Sticker', stage, measure)).toBe(label);
    expect(topLayerAt([label], { x: 256 + 26, y: 256 }, 'Sticker', stage, measure)).toBeNull();
  });
});
