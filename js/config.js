export const TEAMS = [
  { prefix: 'AG', name: 'All Good' },
  { prefix: 'ATL', name: 'Atlantis' },
  { prefix: 'AVI', name: 'The Aviary' },
  { prefix: 'COS', name: 'Cosmic' },
  { prefix: 'BCH', name: 'The Beach' },
  { prefix: 'BOA', name: 'Kingsnakes' },
  { prefix: 'BS', name: 'Big Slime' },
  { prefix: 'COW', name: 'What Do You Beef' },
  { prefix: 'CSC', name: 'CSC' },
  { prefix: 'DRG', name: 'Pact of Embers' },
  { prefix: 'FLT', name: 'Armada' },
  { prefix: 'FNL', name: 'Final Girl' },
  { prefix: 'FRG', name: 'The Toad-em Pole' },
  { prefix: 'GF', name: "Gone Fishin'" },
  { prefix: 'H4K', name: 'H4ck3r H4v3n' },
  { prefix: 'HG', name: "Headhunter's Guild" },
  { prefix: 'JDM', name: 'Midnight Club' },
  { prefix: 'NAN', name: 'NAdes' },
  { prefix: 'MYT', name: 'The Acheron' },
  { prefix: 'OS', name: 'Order of the Samurai' },
  { prefix: 'TEE', name: 'The 19th Hole' },
  { prefix: 'UPS', name: 'Upsetti Spaghetti' },
  { prefix: 'WIZ', name: 'Counter-Spell' }
].sort((a, b) => a.name.localeCompare(b.name));

// width/height are the export size in pixels. customBackground marks the
// assets whose backdrop the user can replace with a solid color or gradient.
export const ASSET_TYPES = {
  ProfilePicture: { width: 512, height: 512, displayName: 'Profile Picture', filename: 'ProfilePicture.png' },
  DiscordBanner: { width: 1200, height: 480, displayName: 'Discord Banner', filename: 'DiscordBanner.png' },
  TwitterBanner: { width: 1500, height: 500, displayName: 'Twitter/X Banner', filename: 'TwitterBanner.png' },
  YoutubeBanner: { width: 2560, height: 1440, displayName: 'YouTube Banner', filename: 'YoutubeBanner.png' },
  TwitchBanner: { width: 1920, height: 480, displayName: 'Twitch Banner', filename: 'TwitchBanner.png' },
  DesktopBackground: { width: 1920, height: 1080, displayName: 'Desktop Background', filename: 'DesktopBackground.png' },
  Sticker: { width: 512, height: 512, displayName: 'Sticker', filename: 'Sticker.png', customBackground: true },
  StickerShadow: { width: 512, height: 512, displayName: 'Sticker Shadow', filename: 'Sticker Shadow.png', customBackground: true },
  SeasonTeamSticker: { width: 512, height: 512, displayName: 'Season Team Sticker', filename: 'SeasonTeamSticker.png' },
  SeasonSignatureSticker: { width: 512, height: 512, displayName: 'Season Signature Sticker', filename: 'SeasonSignatureSticker.png' }
};

export const DEFAULT_ASSET = 'Sticker';

export const BACKGROUND_TYPES = {
  ORIGINAL: 'original',
  SOLID: 'solid',
  GRADIENT: 'gradient',
  TRANSPARENT: 'transparent'
};

export const GRADIENT_DIRECTIONS = {
  TO_BOTTOM: 'to-bottom',
  TO_RIGHT: 'to-right',
  TO_BOTTOM_RIGHT: 'to-bottom-right',
  TO_BOTTOM_LEFT: 'to-bottom-left'
};

// Never mutate this; build state with createState() (js/modules/state.js).
// layers is [{ id, kind, ..., placements }]; see js/modules/layers.js.
export const DEFAULT_STATE = {
  teamPrefix: null,
  asset: null,
  backgroundImage: null,
  layers: [],
  selectedId: null,
  backgroundSettings: {
    type: BACKGROUND_TYPES.ORIGINAL,
    solidColor: '#ffffff',
    gradientColor1: '#ffffff',
    gradientColor2: '#000000',
    gradientDirection: GRADIENT_DIRECTIONS.TO_BOTTOM
  }
};

// Used by both the scale slider and the corner handles.
export const SCALE_LIMITS = { min: 0.1, max: 5 };

export const UPLOAD = {
  maxBytes: 10 * 1024 * 1024,
  types: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp']
};
