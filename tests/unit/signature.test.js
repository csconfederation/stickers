import { describe, expect, test } from 'bun:test';
import { strokeBounds, validateUpload } from '../../js/modules/signature.js';

const brush = (size, outlineWidth = 0) => ({ size, color: '#000000', outlineWidth, outlineColor: '#ffffff' });

describe('strokeBounds', () => {
  test('covers points plus half the brush and one pixel of anti-aliasing', () => {
    const strokes = [{ brush: brush(10), points: [{ x: 100, y: 50 }, { x: 200, y: 80 }] }];
    expect(strokeBounds(strokes, 512, 512)).toEqual({ x: 94, y: 44, width: 112, height: 42 });
  });

  test('includes the outline', () => {
    const plain = strokeBounds([{ brush: brush(4), points: [{ x: 100, y: 100 }] }], 512, 512);
    const outlined = strokeBounds([{ brush: brush(4, 6), points: [{ x: 100, y: 100 }] }], 512, 512);
    expect(outlined.width - plain.width).toBe(12);
    expect(outlined.height - plain.height).toBe(12);
  });

  test('uses every stroke', () => {
    const strokes = [
      { brush: brush(2), points: [{ x: 10, y: 10 }] },
      { brush: brush(2), points: [{ x: 300, y: 400 }] }
    ];
    expect(strokeBounds(strokes, 512, 512)).toEqual({ x: 8, y: 8, width: 294, height: 394 });
  });

  test('clamps to the canvas', () => {
    const strokes = [{ brush: brush(20), points: [{ x: -50, y: 5 }, { x: 600, y: 700 }] }];
    expect(strokeBounds(strokes, 512, 512)).toEqual({ x: 0, y: 0, width: 512, height: 512 });
  });

  test('null when nothing is inked on the canvas', () => {
    expect(strokeBounds([], 512, 512)).toBeNull();
    expect(strokeBounds([{ brush: brush(4), points: [{ x: -100, y: -100 }] }], 512, 512)).toBeNull();
  });
});

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
