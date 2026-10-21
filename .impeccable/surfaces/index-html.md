---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Surface: CSC Sticker Generator (index.html)

Mode: Operate. A player picks their franchise, signs, adds their name or number, and downloads assets. Phone and desktop are equal; the page also runs inside the playcsc.com/stickers iframe (viewport height minus CSC-Web's header). World: CSC-Web DESIGN.md, settled and binding.

Features in scope: franchise wall picker, signing pad (pressure, undo, full-screen on phones), text layer, per-asset placements, sticker background swap, light/dark from CSC-Web's postMessage.

## Direction contract

THESIS: Sign once, own the whole kit. Your signature shows up live on every asset your franchise has. This refuses the category default of one canvas plus a settings sidebar.

OWN-WORLD: CSC-Web's Match-Night Lobby.
- Server-Room Black ground and Match-Night Slate panels with 1px Deep Patrol/80 borders, no shadows.
- Exo kerned labels, Roboto body, Martian Mono for sizes and prefix codes.
- Floodlight Orange only on Download and the current selection ring. The orange→navy 2px bar under the header.
- The franchise art is the only saturated field.

STORY: The player sees their team's sticker large and signs it. The signature is already placed on their avatar, banners and wallpaper; they tweak one and download.

FIRST VIEWPORT:
- Header: the franchise chip (sticker thumbnail, prefix code, name) opens the franchise wall; Download, the one orange primary, sits right.
- Body: the stage takes about two thirds, fit to the space. Under it, the tool tray: SIGN · TEXT · BACKGROUND (stickers only), then the selected layer's controls.
- Right column, THE KIT: a tile per asset with live signed thumbnails, a platform label and its Martian Mono size. The current tile is ringed orange.
- Phones: header, stage, tray, and the kit as a swipe strip. SIGN opens a full-screen pad.

Signature move:
- The kit, a live sheet of every asset already signed.
- The franchise wall, a packed grid of team stickers with prefix codes, the chosen one ringed in Floodlight Orange.

FORM: "Sign once, get the kit", position 6 of 7 on the ordered list; seed key 47fe5f10.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
