import { describe, expect, test } from 'bun:test';
import { ASSET_TYPES, TEAMS } from '../../js/config.js';
import { assetLabel, assetUrl, availability, manifestTeams, parseManifest, pickAsset, thumbUrl } from '../../js/modules/assets.js';

const all = (value) => Object.fromEntries(Object.keys(ASSET_TYPES).map((key) => [key, value]));
const files = Object.values(ASSET_TYPES).map((asset) => asset.filename);

describe('urls', () => {
  test('assetUrl encodes each path segment', () => {
    expect(assetUrl('FLT', 'StickerShadow')).toBe('teams/FLT/Sticker%20Shadow.png');
    expect(assetUrl('AG', 'Sticker')).toBe('teams/AG/Sticker.png');
  });

  test('thumbUrl drops .png, adds .webp and encodes', () => {
    expect(thumbUrl('BCH', 'StickerShadow')).toBe('teams/BCH/thumbs/Sticker%20Shadow.webp');
    expect(thumbUrl('BCH', 'YoutubeBanner')).toBe('teams/BCH/thumbs/YoutubeBanner.webp');
  });
});

describe('manifest', () => {
  test('parseManifest keeps lists of file names and drops junk', () => {
    expect(parseManifest({ teams: { ATL: ['Sticker.png', 3, null], BCH: 'nope', AG: [] } })).toEqual({ ATL: ['Sticker.png'], AG: [] });
    expect(parseManifest(null)).toEqual({});
    expect(parseManifest({})).toEqual({});
    expect(parseManifest({ teams: 'x' })).toEqual({});
  });

  test('availability matches by file name', () => {
    const found = availability(['Sticker.png', 'Sticker Shadow.png', 'unknown.png']);
    expect(found.Sticker).toBe(true);
    expect(found.StickerShadow).toBe(true);
    expect(found.YoutubeBanner).toBe(false);
    expect(Object.keys(found)).toEqual(Object.keys(ASSET_TYPES));
    expect(Object.values(availability()).some(Boolean)).toBe(false);
  });

  test('teams without a manifest entry are hidden', () => {
    const shown = manifestTeams({ ATL: files, GF: ['Sticker.png'], AG: [], BCH: ['readme.txt'] });
    expect(shown.map((team) => team.prefix)).toEqual(TEAMS.map((team) => team.prefix).filter((p) => p === 'ATL' || p === 'GF'));
    expect(manifestTeams({})).toEqual([]);
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
