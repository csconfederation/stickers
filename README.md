# CSC Sticker Generator

Sign your franchise's sticker once and download it on every asset: sticker, profile picture, banners, wallpaper. Live at <https://stickers.playcsc.com>, embedded at <https://playcsc.com/stickers>.

Static site: vanilla HTML, CSS and ES modules, no build step for the app.

## Run locally

```bash
python3 scripts/build_assets.py   # teams/manifest.json + thumbnails (gitignored; needs Pillow)
python3 -m http.server 4173       # any port but 8080
```

Rerun the script after adding or removing team PNGs.

## Add or update a franchise

1. Upload the PNGs to `teams/<PREFIX>/`, named as in the table. A team can skip any of them; the app shows missing ones as unavailable.
2. New franchise or new name: edit `TEAMS` in `js/config.js`.
3. Push to `main`. The Pages deploy generates the manifest and thumbnails. An unreadable PNG fails the deploy, so check the Actions tab.

| File | Export size |
|---|---|
| `Sticker.png`, `Sticker Shadow.png` | 512×512 (background can be swapped) |
| `SeasonTeamSticker.png`, `SeasonSignatureSticker.png`, `ProfilePicture.png` | 512×512 |
| `DiscordBanner.png` | 1200×480 |
| `TwitterBanner.png` | 1500×500 |
| `TwitchBanner.png` | 1920×480 |
| `DesktopBackground.png` | 1920×1080 |
| `YoutubeBanner.png` | 2560×1440 |

## Code

- `index.html`, `css/styles.css`, `js/app.js`: the UI.
- `js/config.js`: franchises, asset types, limits.
- `js/modules/`: the engine. Layers and per-asset placements (`layers.js`), the signing pad (`pad.js`), rendering and export (`canvas.js`), geometry (`transform.js`), saved settings (`state.js`), the asset manifest (`assets.js`), and the theme from CSC-Web (`theme.js`).
- `scripts/build_assets.py`: the deploy-time manifest and thumbnails.

CSC-Web's `/stickers` page posts its color scheme (`'light'` or `'dark'`) to the iframe; the site accepts it only from `https://playcsc.com`. The visual system is CSC-Web's [DESIGN.md](https://github.com/csconfederation/CSC-Web/blob/main/DESIGN.md).

## Test

```bash
bun install
bun test tests/unit   # pure logic
bun run test:e2e      # Playwright; builds the manifest first if it's missing
```

CI runs both on pull requests.

## Credits

Development: chobits (2025). Sticker designs: spideY and chobits; Cameron King and Skimix (2026). Team assets: CSC franchise teams.
