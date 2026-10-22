import { expect, test } from 'bun:test';
import { dilationOffsets, gradientEndpoints } from '../../js/modules/canvas.js';

test('gradientEndpoints', () => {
  expect(gradientEndpoints('to-bottom', 100, 50)).toEqual([0, 0, 0, 50]);
  expect(gradientEndpoints('to-right', 100, 50)).toEqual([0, 0, 100, 0]);
  expect(gradientEndpoints('to-bottom-right', 100, 50)).toEqual([0, 0, 100, 50]);
  expect(gradientEndpoints('to-bottom-left', 100, 50)).toEqual([100, 0, 0, 50]);
  expect(gradientEndpoints('unknown', 100, 50)).toEqual([0, 0, 0, 50]);
});

test('dilationOffsets: none at render scale 1, so the stage and export stay exact', () => {
  expect(dilationOffsets(1, 0.1)).toEqual([]);
});

test('dilationOffsets: none when the signature is drawn at half size or more', () => {
  expect(dilationOffsets(0.25, 2)).toEqual([]);
});

test('dilationOffsets: eight neighbours one device pixel away when shrunk further', () => {
  const offsets = dilationOffsets(0.2, 0.5); // 0.1 device px per layer px
  expect(offsets).toHaveLength(8);
  for (const [dx, dy] of offsets) {
    expect(Math.max(Math.abs(dx), Math.abs(dy))).toBeCloseTo(10);
  }
  expect(new Set(offsets.map(String)).size).toBe(8);
});
