import { ASSET_TYPES, DEFAULT_ASSET } from '../config.js';

export const assetUrl = (prefix, asset) => `teams/${prefix}/${encodeURIComponent(ASSET_TYPES[asset].filename)}`;

// { [asset]: boolean } for every asset type; a failed request counts as missing.
export async function probeAssets(prefix) {
  const keys = Object.keys(ASSET_TYPES);
  const found = await Promise.all(keys.map(async (key) => {
    try {
      return (await fetch(assetUrl(prefix, key), { method: 'HEAD' })).ok;
    } catch {
      return false;
    }
  }));
  return Object.fromEntries(keys.map((key, i) => [key, found[i]]));
}

// The wanted asset if the team has it, else Sticker, else the first one it has.
export function pickAsset(wanted, available) {
  if (wanted && available[wanted]) return wanted;
  if (available[DEFAULT_ASSET]) return DEFAULT_ASSET;
  return Object.keys(available).find((key) => available[key]) ?? null;
}

export function assetLabel(asset, available) {
  const { displayName, width, height } = ASSET_TYPES[asset];
  const label = `${displayName} (${width}x${height})`;
  return available && !available[asset] ? `${label} (not available)` : label;
}
