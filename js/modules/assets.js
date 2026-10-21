import { ASSET_TYPES, DEFAULT_ASSET, TEAMS } from '../config.js';

const segment = encodeURIComponent;

export const assetUrl = (prefix, asset) => `teams/${segment(prefix)}/${segment(ASSET_TYPES[asset].filename)}`;

// Thumbnails are generated at deploy time next to the full-size files.
export const thumbUrl = (prefix, asset) =>
  `teams/${segment(prefix)}/thumbs/${segment(ASSET_TYPES[asset].filename.replace(/\.png$/i, ''))}.webp`;

// teams/manifest.json is { teams: { [prefix]: [file names] } }, written by the deploy build.
export async function loadManifest() {
  const response = await fetch('teams/manifest.json');
  if (!response.ok) throw new Error(`manifest: ${response.status}`);
  return parseManifest(await response.json());
}

export function parseManifest(json) {
  const teams = {};
  for (const [prefix, files] of Object.entries(json?.teams ?? {})) {
    if (Array.isArray(files)) teams[prefix] = files.filter((file) => typeof file === 'string');
  }
  return teams;
}

// Teams the manifest has at least one known asset for, in TEAMS order.
export const manifestTeams = (manifest) =>
  TEAMS.filter((team) => Object.values(availability(manifest[team.prefix])).some(Boolean));

// { [asset]: boolean } by file name.
export function availability(files = []) {
  return Object.fromEntries(Object.entries(ASSET_TYPES).map(([key, asset]) => [key, files.includes(asset.filename)]));
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
