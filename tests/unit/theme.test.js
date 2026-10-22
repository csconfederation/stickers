import { describe, expect, test } from 'bun:test';
import { themeFromMessage } from '../../js/modules/theme.js';

const own = 'http://localhost:4311';

describe('themeFromMessage', () => {
  test('accepts light and dark from playcsc.com', () => {
    expect(themeFromMessage({ origin: 'https://playcsc.com', data: 'light' }, own)).toBe('light');
    expect(themeFromMessage({ origin: 'https://playcsc.com', data: 'dark' }, own)).toBe('dark');
  });

  test('accepts the page itself, for tests', () => {
    expect(themeFromMessage({ origin: own, data: 'light' }, own)).toBe('light');
  });

  test('rejects other origins', () => {
    expect(themeFromMessage({ origin: 'https://evil.example', data: 'light' }, own)).toBeNull();
    expect(themeFromMessage({ origin: 'https://www.playcsc.com', data: 'dark' }, own)).toBeNull();
    expect(themeFromMessage({ origin: 'http://playcsc.com', data: 'dark' }, own)).toBeNull();
  });

  test('rejects other values', () => {
    for (const data of ['auto', 'LIGHT', '', null, undefined, 1, { colorScheme: 'dark' }]) {
      expect(themeFromMessage({ origin: 'https://playcsc.com', data }, own)).toBeNull();
    }
  });
});
