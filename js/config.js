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
// placement overrides PLACEMENT (js/modules/layers.js) for where layers land by
// default: centerX/centerY pin the signature's center, and the rest are fractions
// of the asset's size like PLACEMENT's.
export const ASSET_TYPES = {
  // Discord crops avatars to a circle, so both layers stay inside it.
  ProfilePicture: {
    width: 512, height: 512, displayName: 'Profile Picture', filename: 'ProfilePicture.png',
    placement: { centerX: 0.5, centerY: 0.68, signatureMaxWidth: 0.5, signatureMaxHeight: 0.24, textHeight: 0.1, textMaxWidth: 0.6 }
  },
  // Banners: right of the centered logo and clear of the avatar that overlaps bottom left.
  DiscordBanner: {
    width: 1200, height: 480, displayName: 'Discord Banner', filename: 'DiscordBanner.png',
    placement: { centerX: 0.81, centerY: 0.44, signatureMaxWidth: 0.3, signatureMaxHeight: 0.42, textHeight: 0.15, textMaxWidth: 0.34 }
  },
  TwitterBanner: {
    width: 1500, height: 500, displayName: 'Twitter/X Banner', filename: 'TwitterBanner.png',
    placement: { centerX: 0.8, centerY: 0.44, signatureMaxWidth: 0.3, signatureMaxHeight: 0.44, textHeight: 0.15, textMaxWidth: 0.34 }
  },
  // YouTube shows only the middle 1546x423 on every device; both layers stay inside it.
  YoutubeBanner: {
    width: 2560, height: 1440, displayName: 'YouTube Banner', filename: 'YoutubeBanner.png',
    placement: { centerX: 0.68, centerY: 0.47, signatureMaxWidth: 0.22, signatureMaxHeight: 0.19, textHeight: 0.065, textMaxWidth: 0.22 }
  },
  TwitchBanner: {
    width: 1920, height: 480, displayName: 'Twitch Banner', filename: 'TwitchBanner.png',
    placement: { centerX: 0.79, centerY: 0.44, signatureMaxWidth: 0.26, signatureMaxHeight: 0.46, textHeight: 0.16, textMaxWidth: 0.3 }
  },
  // Bottom right, like a signed print: clear of logos large and small, above a taskbar.
  DesktopBackground: {
    width: 1920, height: 1080, displayName: 'Desktop Background', filename: 'DesktopBackground.png',
    placement: { centerX: 0.82, centerY: 0.78, signatureMaxWidth: 0.3, signatureMaxHeight: 0.16, textHeight: 0.06, textMaxWidth: 0.3 }
  },
  Sticker: { width: 512, height: 512, displayName: 'Sticker', filename: 'Sticker.png', customBackground: true },
  StickerShadow: { width: 512, height: 512, displayName: 'Sticker Shadow', filename: 'Sticker Shadow.png', customBackground: true },
  // Season stickers are a disc in a lettered ring: both layers stay on the disc.
  SeasonTeamSticker: {
    width: 512, height: 512, displayName: 'Season Team Sticker', filename: 'SeasonTeamSticker.png',
    placement: { centerX: 0.5, centerY: 0.6, signatureMaxWidth: 0.46, signatureMaxHeight: 0.2, textHeight: 0.08, textMaxWidth: 0.4 }
  },
  SeasonSignatureSticker: {
    width: 512, height: 512, displayName: 'Season Signature Sticker', filename: 'SeasonSignatureSticker.png',
    placement: { centerX: 0.5, centerY: 0.6, signatureMaxWidth: 0.46, signatureMaxHeight: 0.2, textHeight: 0.08, textMaxWidth: 0.4 }
  }
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
