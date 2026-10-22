import { describe, expect, test } from 'bun:test';
import { ASSET_TYPES, SCALE_LIMITS, UPLOAD } from '../../js/config.js';
import { padPlacement, uploadSize, validateUpload } from '../../js/modules/signature.js';

describe('validateUpload', () => {
  const file = (type, size) => ({ type, size });

  test('accepts PNG, JPEG, WebP, GIF and BMP up to 10 MB', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp']) {
      expect(validateUpload(file(type, 10 * 1024 * 1024))).toBeNull();
    }
  });

  test('accepts files the old data-URL check rejected (3.75 to 5 MB)', () => {
    expect(validateUpload(file('image/png', 4 * 1024 * 1024))).toBeNull();
  });

  test('rejects other types and oversize files', () => {
    expect(validateUpload(file('image/svg+xml', 100))).toContain('Unsupported');
    expect(validateUpload(file('', 100))).toContain('Unsupported');
    expect(validateUpload(file('image/png', 10 * 1024 * 1024 + 1))).toContain('too large');
  });
});

describe('padPlacement', () => {
  // A 200x100 CSS px signature whose bounds start at (50, 40) on a 400x300 pad, captured at 2x.
  const capture = {
    image: { width: 400, height: 200 },
    bounds: { x: 50, y: 40, width: 200, height: 100 },
    padSize: { width: 400, height: 300 }
  };

  test('same-size stage: centered where drawn, scale undoes the pad resolution', () => {
    expect(padPlacement(capture, { width: 400, height: 300 })).toEqual({ x: 150, y: 90, scale: 0.5, rotation: 0, opacity: 1 });
  });

  test('larger stage: positions and scale follow the stage', () => {
    const p = padPlacement(capture, { width: 2000, height: 1500 });
    expect(p.x).toBe(750);
    expect(p.y).toBe(450);
    expect(p.scale).toBeCloseTo(2.5);
  });
});

describe('uploadSize', () => {
  test('caps the longer side at UPLOAD.maxSide, keeping the aspect ratio', () => {
    expect(uploadSize(6000, 300)).toEqual({ width: 2560, height: 128 });
    expect(uploadSize(300, 6000)).toEqual({ width: 128, height: 2560 });
  });

  test('leaves smaller images alone', () => {
    expect(uploadSize(1000, 500)).toEqual({ width: 1000, height: 500 });
  });

  test('a capped upload fits every asset at the smallest scale', () => {
    const shortest = Math.min(...Object.values(ASSET_TYPES).flatMap((a) => [a.width, a.height]));
    expect(UPLOAD.maxSide * SCALE_LIMITS.min).toBeLessThanOrEqual(shortest);
  });
});
