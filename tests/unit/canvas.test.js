import { expect, test } from 'bun:test';
import { gradientEndpoints } from '../../js/modules/canvas.js';

test('gradientEndpoints', () => {
  expect(gradientEndpoints('to-bottom', 100, 50)).toEqual([0, 0, 0, 50]);
  expect(gradientEndpoints('to-right', 100, 50)).toEqual([0, 0, 100, 0]);
  expect(gradientEndpoints('to-bottom-right', 100, 50)).toEqual([0, 0, 100, 50]);
  expect(gradientEndpoints('to-bottom-left', 100, 50)).toEqual([100, 0, 0, 50]);
  expect(gradientEndpoints('unknown', 100, 50)).toEqual([0, 0, 0, 50]);
});
