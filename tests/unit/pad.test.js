import { describe, expect, test } from 'bun:test';
import { closingSegment, padPixelRatio, pointWidth, segmentAt, strokeBounds, strokeSegments } from '../../js/modules/pad.js';

const brush = (size = 10, outlineWidth = 0) => ({ size, color: '#000000', outlineWidth, outlineColor: '#ffffff' });
const pt = (x, y, w = 10) => ({ x, y, w });

describe('pointWidth', () => {
  test('pen follows pressure: size * (0.35 + 0.65 * pressure)', () => {
    expect(pointWidth({ pointerType: 'pen', pressure: 0, size: 10 })).toBeCloseTo(3.5);
    expect(pointWidth({ pointerType: 'pen', pressure: 0.5, size: 10 })).toBeCloseTo(6.75);
    expect(pointWidth({ pointerType: 'pen', pressure: 1, size: 10 })).toBeCloseTo(10);
  });

  test('pen ignores speed', () => {
    expect(pointWidth({ pointerType: 'pen', pressure: 1, size: 10, speed: 50 })).toBeCloseTo(10);
  });

  test('mouse and touch: full width at rest, thinner when fast, never below 60%', () => {
    expect(pointWidth({ pointerType: 'mouse', pressure: 0.5, size: 10, speed: 0 })).toBe(10);
    const fast = pointWidth({ pointerType: 'touch', pressure: 0, size: 10, speed: 100 });
    expect(fast).toBeCloseTo(6);
    const mid = pointWidth({ pointerType: 'mouse', pressure: 0.5, size: 10, speed: 1 });
    expect(mid).toBeGreaterThan(6);
    expect(mid).toBeLessThan(10);
  });

  test('widths ease toward the target instead of jumping', () => {
    const next = pointWidth({ pointerType: 'mouse', pressure: 0.5, size: 10, speed: 100, previous: 10 });
    expect(next).toBeGreaterThan(6);
    expect(next).toBeLessThan(10);
  });

  test('without a time difference the previous width is kept', () => {
    expect(pointWidth({ pointerType: 'mouse', pressure: 0.5, size: 10, speed: undefined, previous: 7 })).toBe(7);
  });

  test('stays within 60-100% over a long fast and slow run', () => {
    let w;
    for (const speed of [0, 5, 5, 5, 5, 5, 0.1, 0, 20, 20, 0]) {
      w = pointWidth({ pointerType: 'mouse', pressure: 0.5, size: 10, speed, previous: w });
      expect(w).toBeGreaterThanOrEqual(6 - 1e-9);
      expect(w).toBeLessThanOrEqual(10 + 1e-9);
    }
  });
});

describe('strokeSegments', () => {
  test('a single point is a dot', () => {
    expect(strokeSegments([pt(5, 5)])).toEqual([{ from: pt(5, 5), control: null, to: pt(5, 5), width: 10 }]);
  });

  test('two points are a straight line in two halves', () => {
    const segments = strokeSegments([pt(0, 0), pt(10, 0)]);
    expect(segments).toHaveLength(2);
    expect(segments[0].to).toEqual({ x: 5, y: 0 });
    expect(segments[1].from).toEqual({ x: 5, y: 0 });
    expect(segments[1].to).toEqual(pt(10, 0));
  });

  test('curves run between midpoints, bending toward each sample', () => {
    const points = [pt(0, 0), pt(10, 0), pt(10, 10)];
    expect(segmentAt(points, 1)).toEqual({ from: { x: 5, y: 0 }, control: points[1], to: { x: 10, y: 5 }, width: 10 });
    expect(closingSegment(points)).toEqual({ from: { x: 10, y: 5 }, control: null, to: points[2], width: 10 });
  });

  test('consecutive segments join end to start', () => {
    const segments = strokeSegments([pt(0, 0), pt(10, 3), pt(20, 0), pt(30, 8), pt(40, 2)]);
    for (let i = 1; i < segments.length; i++) expect(segments[i].from).toEqual(segments[i - 1].to);
  });

  test('an unfinished stroke has no closing segment', () => {
    expect(strokeSegments([pt(0, 0), pt(10, 0), pt(20, 0)], false)).toHaveLength(2);
    expect(strokeSegments([pt(0, 0), pt(10, 0), pt(20, 0)], true)).toHaveLength(3);
  });
});

describe('strokeBounds', () => {
  test('covers points plus half the widest point and one pixel of anti-aliasing', () => {
    const strokes = [{ brush: brush(), points: [pt(100, 50), pt(200, 80)] }];
    expect(strokeBounds(strokes, 512, 512)).toEqual({ x: 94, y: 44, width: 112, height: 42 });
  });

  test('uses the point widths, not the brush size', () => {
    const strokes = [{ brush: brush(10), points: [pt(100, 100, 4), pt(120, 100, 20)] }];
    expect(strokeBounds(strokes, 512, 512)).toEqual({ x: 89, y: 89, width: 42, height: 22 });
  });

  test('includes the outline', () => {
    const plain = strokeBounds([{ brush: brush(4), points: [pt(100, 100, 4)] }], 512, 512);
    const outlined = strokeBounds([{ brush: brush(4, 6), points: [pt(100, 100, 4)] }], 512, 512);
    expect(outlined.width - plain.width).toBe(12);
    expect(outlined.height - plain.height).toBe(12);
  });

  test('uses every stroke', () => {
    const strokes = [
      { brush: brush(2), points: [pt(10, 10, 2)] },
      { brush: brush(2), points: [pt(300, 400, 2)] }
    ];
    expect(strokeBounds(strokes, 512, 512)).toEqual({ x: 8, y: 8, width: 294, height: 394 });
  });

  test('clamps to the pad', () => {
    const strokes = [{ brush: brush(20), points: [pt(-50, 5, 20), pt(600, 700, 20)] }];
    expect(strokeBounds(strokes, 512, 512)).toEqual({ x: 0, y: 0, width: 512, height: 512 });
  });

  test('null when nothing is inked on the pad', () => {
    expect(strokeBounds([], 512, 512)).toBeNull();
    expect(strokeBounds([{ brush: brush(4), points: [pt(-100, -100, 4)] }], 512, 512)).toBeNull();
  });
});

describe('padPixelRatio', () => {
  test('at least the device pixel ratio', () => {
    expect(padPixelRatio(2000, 1000, 2, 1000)).toBe(2);
  });

  test('raised so the bitmap is at least the wanted width', () => {
    expect(padPixelRatio(512, 512, 1, 1408)).toBeCloseTo(2.75);
    expect(padPixelRatio(326, 326, 3, 1408)).toBeCloseTo(1408 / 326);
  });

  test('capped at 4096 on the long side', () => {
    expect(padPixelRatio(300, 2000, 1, 4000)).toBeCloseTo(4096 / 2000);
  });
});
