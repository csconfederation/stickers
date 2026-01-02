# Team Asset Structure Documentation

This document describes the organization and structure of team assets in the CSC Signature Overlay Tool.

## Overview

The application supports 22 CSC franchise teams, each with standardized asset collections organized in individual directories.

## Directory Structure

```
teams/
├── ACA/              # The Academics
├── ATL/              # Atlantis  
├── ATO/              # Automata
├── AVI/              # The Aviary
├── BOA/              # Kingsnakes
├── BOO/              # The Red Room
├── BCH/              # The Beach
├── COW/              # What Do You Beef
├── CSC/              # CSC
├── DRG/              # Pact of Embers
├── FNL/              # Final Girl
├── FRG/              # The Toad-em Pole
├── GF/               # Gone Fishin'
├── GRN/              # The Greenhouse
├── H4K/              # H4ck3r H4v3n
├── HG/               # Headhunter's Guild
├── HR/               # The High Rollers
├── NAN/              # NAdes
├── OS/               # Order of the Samurai
├── TEE/              # The 19th Hole
├── UPS/              # Upsetti Spaghetti
└── WIZ/              # Counter-Spell
```

## Asset Types

Each team directory contains up to 8 standardized asset files:

### Core Assets (All Teams)
- `DesktopBackground.png` - 1920×1080 desktop wallpaper
- `DiscordBanner.png` - 1200×480 Discord server banner
- `ProfilePicture.png` - 512×512 square profile image
- `Sticker.png` - 512×512 sticker design
- `Sticker Shadow.png` - 512×512 sticker with shadow effect
- `TwitchBanner.png` - 1920×480 Twitch channel banner

### Extended Assets (Most Teams)
- `TwitterBanner.png` - 1500×500 Twitter/X header image
- `YoutubeBanner.png` - 2560×1440 YouTube channel art

## Team Details

### Complete Team List

| ID | Prefix | Full Name | Directory |
|----|--------|-----------|-----------|
| 24 | ACA | The Academics | `/teams/ACA/` |
| 19 | ATL | Atlantis | `/teams/ATL/` |
| 11 | ATO | Automata | `/teams/ATO/` |
| 12 | AVI | The Aviary | `/teams/AVI/` |
| 9 | BCH | The Beach | `/teams/BCH/` |
| 29 | BOA | Kingsnakes | `/teams/BOA/` |
| 10 | BOO | The Red Room | `/teams/BOO/` |
| 20 | COW | What Do You Beef | `/teams/COW/` |
| 0 | CSC | CSC | `/teams/CSC/` |
| 30 | DRG | Pact of Embers | `/teams/DRG/` |
| 52 | FNL | Final Girl | `/teams/FNL/` |
| 25 | FRG | The Toad-em Pole | `/teams/FRG/` |
| 55 | GF | Gone Fishin' | `/teams/GF/` |
| 49 | GRN | The Greenhouse | `/teams/GRN/` |
| 13 | H4K | H4ck3r H4v3n | `/teams/H4K/` |
| 3 | HG | Headhunter's Guild | `/teams/HG/` |
| 48 | HR | The High Rollers | `/teams/HR/` |
| 4 | NAN | NAdes | `/teams/NAN/` |
| 6 | OS | Order of the Samurai | `/teams/OS/` |
| 54 | TEE | The 19th Hole | `/teams/TEE/` |
| 14 | UPS | Upsetti Spaghetti | `/teams/UPS/` |
| 56 | WIZ | Counter-Spell | `/teams/WIZ/` |

### Special Cases

#### Team dB (Dead Beats)
- **Directory**: `/teams/dB/` (lowercase 'd', uppercase 'B')
- **Prefix**: `dB` 
- **Note**: Only team with mixed case prefix

#### Team AVI (The Aviary)
- **Missing Assets**: TwitterBanner.png, YoutubeBanner.png
- **Status**: Limited asset collection

## Asset Specifications

### Image Requirements

| Asset Type | Dimensions | Format | Usage |
|------------|------------|--------|-------|
| DesktopBackground | 1920×1080 | PNG | Desktop wallpapers |
| DiscordBanner | 1200×480 | PNG | Discord server banners |
| ProfilePicture | 512×512 | PNG | Profile/avatar images |
| Sticker | 512×512 | PNG | Sticker designs |
| Sticker Shadow | 512×512 | PNG | Sticker with shadow |
| TwitchBanner | 1920×480 | PNG | Twitch channel banners |
| TwitterBanner | 1500×500 | PNG | Twitter/X headers |
| YoutubeBanner | 2560×1440 | PNG | YouTube channel art |

### File Naming Conventions
- **Exact Match Required**: File names must match exactly (case-sensitive)
- **Spaces Allowed**: Some files include spaces (`Sticker Shadow.png`)
- **Extension**: All files use `.png` extension
- **No Variations**: No alternative naming schemes supported

### Quality Standards
- **Resolution**: Native resolution for each asset type
- **Format**: PNG with transparency support where applicable
- **Compression**: Optimized for web delivery
- **Color Space**: sRGB color space
- **Transparency**: Alpha channel preserved for overlays

## Asset Availability Matrix

| Team | Desktop | Discord | Profile | Sticker | Shadow | Twitch | Twitter | YouTube |
|------|---------|---------|---------|---------|--------|--------|---------|---------|
| ACA | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ATL | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ATO | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AVI | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| BCH | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| BOA | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| BOO | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| COW | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CSC | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DRG | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| FNL | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| FRG | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GF | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GRN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| H4K | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| HG | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| HR | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| NAN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| OS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| TEE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| UPS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| WIZ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Summary:**
- **Complete Asset Sets**: 21 teams have all 8 asset types
- **Partial Asset Set**: 1 team (AVI) missing 2 asset types
- **Total Assets**: 174 individual asset files

## Adding New Teams

### Directory Setup
1. Create new directory in `/teams/` using team prefix
2. Add all 8 standard asset files
3. Ensure exact file naming matches specifications
4. Verify image dimensions and formats

### Configuration Update
1. Update `TEAMS` array in `/js/config.js`
2. Add team object with ID, prefix, and name
3. Maintain alphabetical sorting by team name
4. Test team selection and asset loading

### Example Team Addition
```javascript
// Add to TEAMS array in config.js
{
  id: '57',           // Unique franchise ID
  prefix: 'NEW',      // Team prefix (directory name)
  name: 'New Team'    // Display name
}
```

## Asset Management

### File Organization
- **Consistent Structure**: All teams follow identical file organization
- **Centralized Storage**: All assets stored in `/teams/` directory
- **Version Control**: All assets tracked in git repository
- **Access Control**: Read-only access for application

### Maintenance Tasks
- **Regular Audits**: Verify all teams have complete asset sets
- **Quality Checks**: Ensure assets meet specification requirements
- **Updates**: Replace assets when teams update branding
- **Backup**: Maintain backups of all team assets

### Common Issues
- **Missing Files**: 404 errors when assets don't exist
- **Wrong Dimensions**: Layout issues with incorrect sizes
- **File Naming**: Case sensitivity and exact name matching required
- **Format Issues**: Non-PNG files may not load correctly

## Browser Compatibility

### Loading Behavior
- **Modern Browsers**: Full PNG support with transparency
- **Older Browsers**: May have limitations with large files
- **Mobile Devices**: Automatic scaling for responsive display
- **Performance**: Larger assets may load slower on slower connections

### Caching
- **Browser Cache**: Assets cached for improved performance
- **Version Control**: File updates require cache clearing
- **CDN Support**: Assets can be served from CDN if needed

## Security Considerations

### Asset Security
- **Read-Only Access**: Assets cannot be modified through application
- **Path Traversal Protection**: Directory traversal attacks prevented
- **File Type Validation**: Only PNG files are loaded
- **Size Limits**: Large files may be rejected for performance

### Content Security
- **Official Assets**: Only official team assets should be included
- **Copyright Compliance**: Ensure proper licensing for all assets
- **Brand Guidelines**: Assets should comply with team brand guidelines

## Performance Optimization

### Loading Optimization
- **Lazy Loading**: Assets loaded only when selected
- **Compression**: PNG files optimized for web delivery
- **Caching**: Browser caching reduces repeated downloads
- **Progressive Loading**: Large assets load progressively

### Storage Optimization
- **File Sizes**: Keep assets under 1MB when possible
- **Compression**: Use PNG compression without quality loss
- **Cleanup**: Remove unused or duplicate assets
- **Monitoring**: Track asset loading performance

---

This asset documentation ensures consistent team asset management and provides guidance for adding new teams or updating existing assets.