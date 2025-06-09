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
    type: 'original',
    solidColor: '#ffffff',
    gradientColor1: '#ffffff',
    gradientColor2: '#000000',
    gradientDirection: 'to-bottom'
  }
};

export const DRAWING_CONFIG = {
  defaultBrushSize: 3,
  minBrushSize: 1,
  maxBrushSize: 20,
  defaultColor: '#000000'
};