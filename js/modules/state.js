import { TEAMS, ASSET_TYPES, BACKGROUND_TYPES, GRADIENT_DIRECTIONS, DEFAULT_STATE } from '../config.js';

const STORAGE_KEY = 'csc_sticker_state';
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export const createState = () => structuredClone(DEFAULT_STATE);

const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
const pickColor = (value, fallback) => (typeof value === 'string' && HEX_COLOR.test(value) ? value.toLowerCase() : fallback);

// Turns whatever was in localStorage into a safe { teamPrefix, asset,
// backgroundSettings }. The signature and its transform are never saved.
export function parseSavedState(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    raw = null;
  }
  if (!raw || typeof raw !== 'object') raw = {};
  const bg = raw.backgroundSettings && typeof raw.backgroundSettings === 'object' ? raw.backgroundSettings : {};
  const defaults = DEFAULT_STATE.backgroundSettings;

  const teamPrefix = pick(raw.teamPrefix, TEAMS.map((team) => team.prefix), null);
  return {
    teamPrefix,
    asset: teamPrefix ? pick(raw.asset, Object.keys(ASSET_TYPES), null) : null,
    backgroundSettings: {
      type: pick(bg.type, Object.values(BACKGROUND_TYPES), defaults.type),
      solidColor: pickColor(bg.solidColor, defaults.solidColor),
      gradientColor1: pickColor(bg.gradientColor1, defaults.gradientColor1),
      gradientColor2: pickColor(bg.gradientColor2, defaults.gradientColor2),
      gradientDirection: pick(bg.gradientDirection, Object.values(GRADIENT_DIRECTIONS), defaults.gradientDirection)
    }
  };
}

export function serializeState(state) {
  const { teamPrefix, asset, backgroundSettings } = state;
  return JSON.stringify({ teamPrefix, asset, backgroundSettings });
}

export function loadSavedState() {
  let text = null;
  try {
    text = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked (private mode, iframe policies); start fresh.
  }
  return parseSavedState(text);
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, serializeState(state));
  } catch {
    // Same as above: saving is best effort.
  }
}
