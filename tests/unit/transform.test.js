import { describe, expect, test } from 'bun:test';
import { SCALE_LIMITS } from '../../js/config.js';
import {
  boxStyle, centeredTransform, clampScale, dragTo, hitTest, normalizeAngle, normalizeTransform, resizeTo, rotateTo
} from '../../js/modules/transform.js';

const sig = { width: 100, height: 40 };
const at = (overrides = {}) => ({ x: 200, y: 200, scale: 1, rotation: 0, opacity: 1, ...overrides });

describe('hitTest', () => {
  test('unrotated box', () => {
    expect(hitTest({ x: 249, y: 219 }, at(), sig)).toBe(true);
    expect(hitTest({ x: 251, y: 200 }, at(), sig)).toBe(false);
    expect(hitTest({ x: 200, y: 221 }, at(), sig)).toBe(false);
  });

  test('respects rotation', () => {
    const t = at({ rotation: 90 });
    // A 100x40 box turned 90 degrees is 40 wide and 100 tall.
    expect(hitTest({ x: 200, y: 245 }, t, sig)).toBe(true);
    expect(hitTest({ x: 240, y: 200 }, t, sig)).toBe(false);
    expect(hitTest({ x: 225, y: 200 }, t, sig)).toBe(false);
  });

  test('45 degrees: unrotated corner misses, diagonal hits', () => {
    const t = at({ rotation: 45 });
    expect(hitTest({ x: 249, y: 219 }, t, sig)).toBe(false);
    const d = 45 / Math.SQRT2;
    expect(hitTest({ x: 200 + d, y: 200 + d }, t, sig)).toBe(true);
  });

  test('scale grows the box', () => {
    expect(hitTest({ x: 290, y: 200 }, at({ scale: 2 }), sig)).toBe(true);
    expect(hitTest({ x: 310, y: 200 }, at({ scale: 2 }), sig)).toBe(false);
  });
});

describe('resizeTo', () => {
  const start = at({ scale: 1.5, x: 100, y: 100 });

  test('keeps the center and scales with distance from it', () => {
    const next = { ...start, ...resizeTo(start, { x: 150, y: 100 }, { x: 250, y: 100 }) };
    expect(next.scale).toBeCloseTo(4.5); // 1.5 * (150 / 50)
    expect([next.x, next.y]).toEqual([100, 100]);
  });

  test('dragging toward the center shrinks, and direction does not matter', () => {
    expect(resizeTo(start, { x: 200, y: 100 }, { x: 150, y: 100 }).scale).toBeCloseTo(0.75);
    expect(resizeTo(start, { x: 200, y: 100 }, { x: 100, y: 150 }).scale).toBeCloseTo(0.75);
  });

  test('clamps to the scale limits', () => {
    expect(resizeTo(start, { x: 150, y: 100 }, { x: 5000, y: 100 }).scale).toBe(SCALE_LIMITS.max);
    expect(resizeTo(start, { x: 150, y: 100 }, { x: 100, y: 100 }).scale).toBe(SCALE_LIMITS.min);
  });

  test('a grab on the center leaves the scale alone', () => {
    expect(resizeTo(start, { x: 100, y: 100 }, { x: 300, y: 300 }).scale).toBe(1.5);
  });
});

describe('rotateTo', () => {
  const start = at({ rotation: 10, x: 0, y: 0 });

  test('adds the swept angle to the starting rotation', () => {
    expect(rotateTo(start, { x: 0, y: -50 }, { x: 50, y: 0 }).rotation).toBeCloseTo(100);
  });

  test('wraps into (-180, 180]', () => {
    expect(rotateTo(start, { x: 50, y: 0 }, { x: -50, y: -1 }).rotation).toBeLessThan(-160);
  });

  test('shift snaps to 15 degrees', () => {
    const p = { x: 50 * Math.cos(0.5), y: 50 * Math.sin(0.5) };
    const free = rotateTo(start, { x: 50, y: 0 }, p).rotation;
    expect(free).toBeCloseTo(10 + 0.5 * 180 / Math.PI);
    expect(rotateTo(start, { x: 50, y: 0 }, p, true).rotation).toBe(45); // 38.65 rounds to 45
  });
});

describe('dragTo', () => {
  test('moves by the pointer delta in canvas pixels', () => {
    expect(dragTo(at(), { x: 10, y: 10 }, { x: 25, y: 4 })).toEqual({ x: 215, y: 194 });
  });
});

describe('limits and normalizing', () => {
  test('scale limits are 10% to 500%', () => {
    expect(SCALE_LIMITS).toEqual({ min: 0.1, max: 5 });
    expect(clampScale(0.01)).toBe(0.1);
    expect(clampScale(9)).toBe(5);
    expect(clampScale(2)).toBe(2);
  });

  test('normalizeAngle wraps', () => {
    expect(normalizeAngle(270)).toBe(-90);
    expect(normalizeAngle(-190)).toBe(170);
    expect(normalizeAngle(180)).toBe(180);
    expect(normalizeAngle(-180)).toBe(180);
    expect(normalizeAngle(720)).toBe(0);
  });

  test('normalizeTransform clamps every field', () => {
    const t = normalizeTransform({ x: -5, y: 9999, scale: 12, rotation: 365, opacity: 3 }, { width: 512, height: 300 });
    expect(t).toEqual({ x: 0, y: 300, scale: 5, rotation: 5, opacity: 1 });
  });
});

describe('centeredTransform', () => {
  const canvas = { width: 512, height: 512 };

  test('small images stay at 100% in the center', () => {
    expect(centeredTransform({ width: 200, height: 100 }, canvas)).toEqual({ x: 256, y: 256, scale: 1, rotation: 0, opacity: 1 });
  });

  test('shrinks to fit within 80% of the canvas', () => {
    const t = centeredTransform({ width: 1024, height: 256 }, canvas);
    expect(t.scale).toBeCloseTo(0.4);
    const t2 = centeredTransform({ width: 256, height: 2048 }, canvas);
    expect(t2.scale).toBeCloseTo(0.2);
  });

  test('never goes below the minimum scale', () => {
    expect(centeredTransform({ width: 20000, height: 20000 }, canvas).scale).toBe(SCALE_LIMITS.min);
  });
});

describe('boxStyle', () => {
  test('expresses the box as percentages of the canvas', () => {
    const style = boxStyle(at({ x: 256, y: 256, scale: 2, rotation: 30 }), { width: 128, height: 64 }, { width: 512, height: 512 });
    expect(style).toEqual({ left: 25, top: 37.5, width: 50, height: 25, rotation: 30 });
  });
});
