import { afterEach, describe, expect, test } from 'bun:test';
import { ASSET_TYPES } from '../../js/config.js';
import { assetLabel, assetUrl, pickAsset, probeAssets } from '../../js/modules/assets.js';

const all = (value) => Object.fromEntries(Object.keys(ASSET_TYPES).map((key) => [key, value]));

describe('assetUrl', () => {
  test('encodes file names with spaces', () => {
    expect(assetUrl('FLT', 'StickerShadow')).toBe('teams/FLT/Sticker%20Shadow.png');
    expect(assetUrl('AG', 'Sticker')).toBe('teams/AG/Sticker.png');
  });
});

describe('pickAsset', () => {
  test('keeps the wanted asset when available', () => {
    expect(pickAsset('YoutubeBanner', all(true))).toBe('YoutubeBanner');
  });

  test('falls back to Sticker', () => {
    expect(pickAsset('YoutubeBanner', { ...all(true), YoutubeBanner: false })).toBe('Sticker');
    expect(pickAsset(null, all(true))).toBe('Sticker');
  });

  test('then to the first available asset', () => {
    expect(pickAsset('Sticker', { ...all(false), TwitchBanner: true, DiscordBanner: true })).toBe('DiscordBanner');
  });

  test('null when nothing is available', () => {
    expect(pickAsset('Sticker', all(false))).toBeNull();
  });
});

describe('assetLabel', () => {
  test('marks missing assets', () => {
    const available = { ...all(true), StickerShadow: false };
    expect(assetLabel('Sticker', available)).toBe('Sticker (512x512)');
    expect(assetLabel('StickerShadow', available)).toBe('Sticker Shadow (512x512) (not available)');
    expect(assetLabel('StickerShadow', null)).toBe('Sticker Shadow (512x512)');
  });
});

describe('probeAssets', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = realFetch; });

  test('sends one HEAD request per asset and reports the results', async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push([url, options.method]);
      if (url.endsWith('Sticker%20Shadow.png')) return { ok: false };
      if (url.endsWith('TwitterBanner.png')) throw new TypeError('network');
      return { ok: true };
    };
    const found = await probeAssets('FLT');
    expect(calls).toHaveLength(Object.keys(ASSET_TYPES).length);
    expect(calls.every(([, method]) => method === 'HEAD')).toBe(true);
    expect(found.StickerShadow).toBe(false);
    expect(found.TwitterBanner).toBe(false);
    expect(found.Sticker).toBe(true);
    expect(Object.keys(found)).toEqual(Object.keys(ASSET_TYPES));
  });
});
