// Team and asset configurations with franchise IDs
export const TEAMS = [
  { id: '24', prefix: 'ACA', name: 'The Academics' },
  { id: '19', prefix: 'ATL', name: 'Atlantis' },
  { id: '11', prefix: 'ATO', name: 'Automata' },
  { id: '12', prefix: 'AVI', name: 'The Aviary' },
  { id: '10', prefix: 'BS', name: 'Big Slime' },
  { id: '20', prefix: 'COW', name: 'What Do You Beef' },
  { id: '0', prefix: 'CSC', name: 'CSC' }, // Original CSC team
  { id: '29', prefix: 'dB', name: 'Dead Beats' },
  { id: '30', prefix: 'DRG', name: 'Pact of Embers' },
  { id: '25', prefix: 'FRG', name: 'The Toad-em Pole' },
  { id: '55', prefix: 'GF', name: "Gone Fishin'" },
  { id: '49', prefix: 'GRN', name: 'The Greenhouse' },
  { id: '13', prefix: 'H4K', name: 'H4ck3r H4v3n' },
  { id: '3', prefix: 'HG', name: "Headhunter's Guild" },
  { id: '48', prefix: 'HR', name: 'The High Rollers' },
  { id: '4', prefix: 'NAN', name: 'NAdes' },
  { id: '6', prefix: 'OS', name: 'Order of the Samurai' },
  { id: '9', prefix: 'SAV', name: 'The Savanna' },
  { id: '54', prefix: 'TEE', name: 'The 19th Hole' },
  { id: '52', prefix: 'TSC', name: 'The Starling Corporation' },
  { id: '14', prefix: 'UPS', name: 'Upsetti Spaghetti' },
  { id: '56', prefix: 'WIZ', name: 'Counter-Spell' }
].sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

export const ASSET_TYPES = {
  ProfilePicture: { 
    width: 512, 
    height: 512, 
    displayName: 'Profile Picture',
    filename: 'ProfilePicture.png'
  },
  DiscordBanner: { 
    width: 1200, 
    height: 480, 
    displayName: 'Discord Banner',
    filename: 'DiscordBanner.png'
  },
  TwitterBanner: { 
    width: 1500, 
    height: 500, 
    displayName: 'Twitter/X Banner',
    filename: 'TwitterBanner.png'
  },
  YoutubeBanner: { 
    width: 2560, 
    height: 1440, 
    displayName: 'YouTube Banner',
    filename: 'YoutubeBanner.png'
  },
  TwitchBanner: { 
    width: 1920, 
    height: 480, 
    displayName: 'Twitch Banner',
    filename: 'TwitchBanner.png'
  },
  DesktopBackground: { 
    width: 1920, 
    height: 1080, 
    displayName: 'Desktop Background',
    filename: 'DesktopBackground.png'
  },
  Sticker: { 
    width: 512, 
    height: 512, 
    displayName: 'Sticker',
    filename: 'Sticker.png'
  },
  StickerShadow: { 
    width: 512, 
    height: 512, 
    displayName: 'Sticker Shadow',
    filename: 'Sticker Shadow.png'
  }
};

// Note: These constants must be defined before DEFAULT_STATE
// Background type constants
export const BACKGROUND_TYPES = {
  ORIGINAL: 'original',
  SOLID: 'solid',
  GRADIENT: 'gradient',
  TRANSPARENT: 'transparent'
};

// Gradient direction constants
export const GRADIENT_DIRECTIONS = {
  TO_BOTTOM: 'to-bottom',
  TO_RIGHT: 'to-right',
  TO_BOTTOM_RIGHT: 'to-bottom-right',
  TO_BOTTOM_LEFT: 'to-bottom-left'
};

export const DEFAULT_STATE = {
  teamId: null,
  teamPrefix: null,
  teamName: null,
  asset: null,
  backgroundImage: null,
  signature: null,
  signatureType: null,
  transform: {
    x: 100,
    y: 100,
    scale: 1,
    rotation: 0,
    opacity: 1
  },
  backgroundSettings: {
    type: BACKGROUND_TYPES.ORIGINAL,
    solidColor: '#ffffff',
    gradientColor1: '#ffffff',
    gradientColor2: '#000000',
    gradientDirection: GRADIENT_DIRECTIONS.TO_BOTTOM
  }
};

export const DRAWING_CONFIG = {
  defaultBrushSize: 3,
  minBrushSize: 1,
  maxBrushSize: 20,
  defaultColor: '#000000'
};

// Asset key constants
export const ASSET_KEYS = {
  STICKER: 'Sticker',
  STICKER_SHADOW: 'StickerShadow',
  PROFILE_PICTURE: 'ProfilePicture',
  DISCORD_BANNER: 'DiscordBanner',
  TWITTER_BANNER: 'TwitterBanner',
  YOUTUBE_BANNER: 'YoutubeBanner',
  TWITCH_BANNER: 'TwitchBanner',
  DESKTOP_BACKGROUND: 'DesktopBackground'
};

// CSS class constants
export const CSS_CLASSES = {
  HIDDEN: 'hidden',
  ACTIVE: 'active',
  DRAWING_MODE: 'drawing-mode'
};

// UI text constants
export const UI_TEXT = {
  DRAWING_INSTRUCTION: 'Draw your signature on the canvas below, then click "Apply Signature" when finished.',
  DRAWING_MODE_TOOLTIP: 'Click and drag to draw on the canvas',
  SELECT_TEAM_PLACEHOLDER: 'Select a Team'
};

// File size and dimension limits
export const FILE_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MIN_FILE_SIZE: 100, // 100 bytes
  MAX_IMAGE_DIMENSION: 4096,
  MIN_IMAGE_DIMENSION: 1,
  FILE_READ_TIMEOUT: 30000, // 30 seconds
  IMAGE_LOAD_TIMEOUT: 10000, // 10 seconds
  MAX_DATA_URL_SIZE: 10 * 1024 * 1024 // 10MB
};

// Animation and timing constants
export const TIMING = {
  RENDER_DEBOUNCE: 16, // 60fps
  SAVE_DEBOUNCE: 500,
  TOAST_DURATION: 3000,
  TOAST_ANIMATION: 300,
  PERFORMANCE_CHECK_INTERVAL: 30000, // 30 seconds
  MEMORY_WARNING_THRESHOLD: 50 * 1024 * 1024 // 50MB
};

// Transform limits
export const TRANSFORM_LIMITS = {
  MIN_SCALE: 0.1,
  MAX_SCALE: 5,
  MIN_ROTATION: -180,
  MAX_ROTATION: 180,
  MIN_OPACITY: 0,
  MAX_OPACITY: 1
};