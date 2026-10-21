import { describe, expect, test } from 'bun:test';
import { clamp, exportFilename, pointerToCanvas } from '../../js/modules/utils.js';

describe('pointerToCanvas', () => {
  const canvas = { width: 2560, height: 1440 };

  test('identity at 1:1', () => {
    const rect = { left: 50, top: 20, width: 2560, height: 1440 };
    expect(pointerToCanvas(150, 120, rect, canvas)).toEqual({ x: 100, y: 100 });
  });

  test('scales from displayed pixels to canvas pixels', () => {
    const rect = { left: 300, top: 100, width: 640, height: 360 };
    expect(pointerToCanvas(620, 280, rect, canvas)).toEqual({ x: 1280, y: 720 });
  });

  test('points outside the canvas map outside it', () => {
    const rect = { left: 0, top: 0, width: 256, height: 256 };
    const p = pointerToCanvas(-10, 300, rect, { width: 512, height: 512 });
    expect(p).toEqual({ x: -20, y: 600 });
  });
});

describe('exportFilename', () => {
  test('prefix_name_asset_date.png', () => {
    const name = exportFilename('GF', "Gone Fishin'", 'Sticker', new Date('2026-03-04T12:00:00Z'));
    expect(name).toBe('GF_gone_fishin__Sticker_2026-03-04.png');
  });

  test('defaults to today', () => {
    expect(exportFilename('CSC', 'CSC', 'YoutubeBanner')).toMatch(/^CSC_csc_YoutubeBanner_\d{4}-\d{2}-\d{2}\.png$/);
  });
});

test('clamp', () => {
  expect(clamp(5, 0, 3)).toBe(3);
  expect(clamp(-1, 0, 3)).toBe(0);
  expect(clamp(2, 0, 3)).toBe(2);
});
