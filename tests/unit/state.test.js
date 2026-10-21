import { describe, expect, test } from 'bun:test';
import { DEFAULT_STATE } from '../../js/config.js';
import { createState, parseSavedState, serializeState } from '../../js/modules/state.js';

describe('createState', () => {
  test('does not share nested objects with the defaults', () => {
    const state = createState();
    state.layers.push({ id: 'x' });
    state.backgroundSettings.type = 'solid';
    expect(DEFAULT_STATE.layers).toEqual([]);
    expect(DEFAULT_STATE.backgroundSettings.type).toBe('original');
    expect(createState().backgroundSettings.type).toBe('original');
  });

  test('each call returns a fresh state', () => {
    expect(createState().layers).not.toBe(createState().layers);
  });
});

describe('parseSavedState', () => {
  const defaults = DEFAULT_STATE.backgroundSettings;

  test('keeps valid values', () => {
    const saved = {
      teamPrefix: 'GF',
      asset: 'YoutubeBanner',
      backgroundSettings: { type: 'gradient', solidColor: '#112233', gradientColor1: '#AABBCC', gradientColor2: '#000000', gradientDirection: 'to-right' }
    };
    expect(parseSavedState(JSON.stringify(saved))).toEqual({
      ...saved,
      backgroundSettings: { ...saved.backgroundSettings, gradientColor1: '#aabbcc' }
    });
  });

  test('falls back for unknown team, asset, type and direction', () => {
    const parsed = parseSavedState(JSON.stringify({
      teamPrefix: 'XXX', asset: 'Nope', backgroundSettings: { type: 'plaid', gradientDirection: 'sideways' }
    }));
    expect(parsed.teamPrefix).toBeNull();
    expect(parsed.asset).toBeNull();
    expect(parsed.backgroundSettings).toEqual(defaults);
  });

  test('rejects colors that are not #rrggbb', () => {
    const parsed = parseSavedState(JSON.stringify({
      teamPrefix: 'AG',
      backgroundSettings: { solidColor: '#fff', gradientColor1: 'red', gradientColor2: '#12345g', type: 'solid' }
    }));
    expect(parsed.backgroundSettings).toEqual({ ...defaults, type: 'solid' });
  });

  test('drops the asset without a valid team', () => {
    expect(parseSavedState(JSON.stringify({ asset: 'Sticker' })).asset).toBeNull();
  });

  test('survives garbage', () => {
    for (const text of [null, '', '{', 'null', '42', '"x"', '[]', '{"backgroundSettings":5}']) {
      expect(parseSavedState(text)).toEqual({ teamPrefix: null, asset: null, backgroundSettings: defaults });
    }
  });

  test('ignores transform and other saved keys', () => {
    const parsed = parseSavedState(JSON.stringify({ teamPrefix: 'AG', transform: { x: 1 }, teamName: '<b>' }));
    expect(parsed).not.toHaveProperty('transform');
    expect(parsed).not.toHaveProperty('teamName');
  });
});

test('serializeState saves team, asset and background only (no layers)', () => {
  const state = createState();
  state.teamPrefix = 'AG';
  state.asset = 'Sticker';
  state.layers.push({ id: 'layer-1', kind: 'text', placements: { Sticker: { x: 99 } } });
  state.selectedId = 'layer-1';
  expect(JSON.parse(serializeState(state))).toEqual({
    teamPrefix: 'AG', asset: 'Sticker', backgroundSettings: state.backgroundSettings
  });
});
