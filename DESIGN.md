---
name: CSC Sticker Generator
description: Sign once, own the whole kit. A CSC surface inside CSC-Web's Match-Night Lobby.
colors:
  ground: "#0a0e1a"
  surface: "#0f1629"
  raised: "#141d35"
  sunken: "#0a0e1a"
  border: "rgba(4, 42, 82, 0.8)"
  border-strong: "#1d3a5f"
  control-border: "#042a52cc"
  hairline: "#1e293b"
  text: "#ffffff"
  text-2: "#f1f5f9"
  muted: "#94a3b8"
  subtle: "#64748b"
  orange: "#f7931e"
  orange-hover: "#fdb74b"
  orange-press: "#d97b0d"
  on-orange: "#1c1103"
  navy: "#07407b"
  navy-hover: "#0a5299"
  on-navy: "#ffffff"
  danger: "#e74c3c"
  success: "#2ecc71"
  focus: "#fdb74b"
  track: "#1e293b"
  check-a: "#0c1222"
  check-b: "#111a2e"
  scrim: "rgba(5, 8, 15, 0.78)"
  skeleton-a: "#111a2e"
  skeleton-b: "#18233d"
  paper: "#f1f5f9"
  paper-dark: "#1e293b"
  paper-line: "rgba(15, 23, 42, 0.28)"
  paper-line-dark: "rgba(241, 245, 249, 0.3)"
  paper-ink: "#475569"
  paper-ink-dark: "#94a3b8"
  handle: "#ffffff"
  box-edge: "rgba(10, 14, 26, 0.55)"
  selection: "rgba(247, 147, 30, 0.35)"
  swatch-edge: "rgba(255, 255, 255, 0.22)"
  swatch-mat: "#64748b"
  ground-light: "#eef2f7"
  surface-light: "#ffffff"
  raised-light: "#f4f7fb"
  sunken-light: "#f1f5f9"
  border-light: "#cbd5e1"
  border-strong-light: "#94a3b8"
  control-border-light: "#94a3b8"
  hairline-light: "#e2e8f0"
  text-light: "#020617"
  text-2-light: "#0f172a"
  muted-light: "#475569"
  orange-hover-light: "#fba73d"
  danger-light: "#c0392b"
  success-light: "#1e8449"
  focus-light: "#d97b0d"
  track-light: "#cbd5e1"
  check-a-light: "#e9eef5"
  check-b-light: "#f8fafc"
  scrim-light: "rgba(15, 23, 42, 0.5)"
  skeleton-a-light: "#e2e8f0"
  skeleton-b-light: "#f1f5f9"
  swatch-edge-light: "rgba(15, 23, 42, 0.28)"
typography:
  title:
    fontFamily: "Exo, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.04em"
  chip-name:
    fontFamily: "Exo, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
  brand:
    fontFamily: "Exo, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.06em"
  label:
    fontFamily: "Exo, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.12em"
  label-small:
    fontFamily: "Exo, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.12em"
  body:
    fontFamily: "Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  hint:
    fontFamily: "Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  mono:
    fontFamily: "Martian Mono, Monaco, Courier, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0"
    fontFeature: "tnum"
rounded:
  hair: "2px"
  tight: "3px"
  sm: "4px"
  soft: "6px"
  md: "8px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  button-download:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.on-orange}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "42px"
  button-download-hover:
    backgroundColor: "{colors.orange-hover}"
  button-download-active:
    backgroundColor: "{colors.orange-press}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "40px"
  button-outline-hover:
    backgroundColor: "{colors.raised}"
  button-commit:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.on-navy}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "40px"
  button-commit-hover:
    backgroundColor: "{colors.navy-hover}"
  franchise-chip:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.text}"
    typography: "{typography.chip-name}"
    rounded: "{rounded.sm}"
    padding: "0 10px 0 4px"
    height: "44px"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
  tab-selected:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.on-navy}"
  layer-chip:
    backgroundColor: "transparent"
    textColor: "{colors.text-2}"
    rounded: "{rounded.full}"
    padding: "0 12px 0 10px"
    height: "30px"
  layer-chip-selected:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.on-navy}"
  input-text:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "40px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "12px 16px 14px"
  wall-item:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.text}"
    rounded: "{rounded.soft}"
    padding: "10px 6px"
  wall-item-hover:
    backgroundColor: "{colors.raised}"
  kit-thumb:
    backgroundColor: "{colors.check-a}"
    rounded: "{rounded.tight}"
  kit-thumb-unavailable:
    backgroundColor: "{colors.sunken}"
  swatch:
    backgroundColor: "{colors.swatch-mat}"
    rounded: "{rounded.sm}"
    padding: "4px"
    width: "44px"
---

# Design System: CSC Sticker Generator

## Overview

**Creative North Star: "The Signing Table"**

**Parent system: [CSC-Web DESIGN.md](https://github.com/csconfederation/CSC-Web/blob/main/DESIGN.md), the Match-Night Lobby.** It is binding. Its palette, type stack, Kerned-Label, Two-Color, Floodlight and No-Shadow rules apply here unchanged. This file records only the tokens this surface ships, its own components, and where it deliberately departs from the parent.

The surface is a tool, not a page. The franchise art is the only saturated field; the chrome is the slate stack in 1px borders, so the sticker reads first. One orange primary (Download) per screen, and orange marks what is currently selected.

**Key Characteristics:**
- Every color is a CSS custom property in `css/styles.css`; `[data-theme="light"]` (set from CSC-Web's postMessage) swaps in the light set from CSC-Web's lobby and combine-queue values.
- Flat: tonal layers and 1px borders, zero `box-shadow`.
- Exo kerned labels, Roboto body, Martian Mono for sizes and prefix codes.
- Desktop holds stage, tray and kit in one viewport; phones stack them.
- One authored motion: the signature stamping onto the kit.

## Colors

The parent's Floodlight palette mapped to surface roles. Light-theme values are the `-light` siblings in the frontmatter; tokens without one keep their dark value in both themes.

### Primary
- **Floodlight Orange** (`orange`): Download, the current selection (kit tile ring, wall item, signature box and handles), the text-input focus border, the accent bar's left end. Focus rings use `focus` (Flare; Banked Ember in light); text selection is orange at 35%. Hover Flare (`orange-hover`), press Banked Ember (`orange-press`), which also edges the warning toast.
- **Lobby Ink** (`on-orange`): the label on orange.

### Secondary
- **CT-Side Navy** (`navy`, `navy-hover`): selected tab, selected layer chip, segmented control, commit buttons (Apply), slider fill and thumb ring, the accent bar's right end. Text on navy is `on-navy`.

### Neutral
- **Server-Room Black** (`ground`, `sunken`): page ground; recessed fields, chip, wall items.
- **Match-Night Slate** (`surface`): tray, kit, wall, stage message. `raised` is the hover fill.
- **Deep Patrol / 80** (`border`, `control-border`): `border` edges panels and tiles; `control-border` (the same Deep Patrol / 80, as CSC-Web's control border) edges buttons, inputs, swatches, segmented controls, chips and the wall dialog. `border-strong` is left only for scrollbars, the unavailable tile's dashed outline, wall-item hover and toasts. `hairline` divides inside a panel.
- **Text stack** (`text`, `text-2`, `muted`, `subtle`): headings, body, hints and labels, disabled.
- **Checkerboard** (`check-a`, `check-b`): transparency behind the stage and kit thumbnails.
- **Signing paper** (`paper`, `paper-dark`, with `paper-line*` and `paper-ink*`): the phone signing sheet.
- **Swatch mat** (`swatch-mat`): mid slate behind every color input, at least 3.9:1 against near-black and white.

### Named Rules
**The Art-Is-The-Field Rule.** Only the franchise art is saturated. Chrome never takes a tier, performance or extra brand color.

**The Orange-Means-Current Rule.** Orange appears only on Download (and its hover and press), the current-selection rings (kit tile on stage, chosen franchise, selected layer's box), focus (`focus` rings, the input border, the caret), text selection, the accent bar and warning toasts. No control but Download turns orange on hover.

## Typography

**Display Font:** Exo (600–900 loaded), fallback sans-serif
**Body Font:** Roboto (400/500/700)
**Label/Mono Font:** Martian Mono (500/700), fallback Monaco, Courier

**Character:** The parent's pairing at tool density: no display or headline roles; the largest type is the 1.125rem panel title.

### Hierarchy
- **Title** (`title`): "Your kit", "Pick your franchise", "Sign it".
- **Chip name** (`chip-name`): the franchise name in the header chip.
- **Brand** (`brand`): the header wordmark; hidden below 600px.
- **Label** (`label`): tabs, field labels, Download, stage asset name.
- **Small label** (`label-small`): kit tile names (two-line clamp), the sign line.
- **Body** (`body`) and **Hint** (`hint`, max 60ch): copy, buttons, layer chips, stage hint.
- **Mono** (`mono`): prefix codes, asset sizes (`512×512`), counts, slider readouts; tabular figures.

### Named Rules
**The Mono-For-Measures Rule.** Pixel sizes, prefix codes and numeric readouts are Martian Mono; nothing else is.

## Layout

| Width | Layout |
|---|---|
| ≥ 900px | One viewport, no page scroll. Grid `2fr / minmax(300px, 1fr)`, 16px gap, 16px 20px padding. Left: stage over tray (tray capped at 48vh, scrolls). Right: the kit, scrolling inside itself. |
| < 900px | Stack in order stage, kit, tray. The kit runs edge to edge as a horizontal snap strip, tiles 92px tall. Stage hint hidden. |
| < 600px | Brand hidden, chip fills the header. Tabs, segmented controls and selects go full width; layer sliders one per row with the label beside. Wall and signing go full screen (signing also on coarse pointers ≤ 500px tall). |

- **Stage fit:** the canvas is never shown above 1:1 and fits the free box by aspect (`container-type: size` on desktop, 60svh cap when stacked).
- **No-reflow:** tray panels share one grid cell and the closed sign view keeps its space, so switching tools never resizes the stage. While signing, nothing may resize the stage (it would stretch the ink).
- **Touch:** `pointer: coarse` raises `--control` from 40px (CSC-Web's input height) to 44px; tabs, chips, icon buttons and handle hit areas follow.
- **Rhythm:** 4 / 8 / 12 / 16 / 20px.

## Elevation & Depth

Flat, as the parent requires: there is no `box-shadow` anywhere in the surface. Depth is ground → surface → raised fills plus `border` / `control-border`. Modals (wall, phone sheet) sit over `scrim` (or `ground` for the sign sheet), not a shadow.

## Shapes

Small, square-leaning corners: 4px on controls, 8px on panels and the signing paper, 6px on the tab track and wall items, 3px on kit thumbnails and segment fills, 2px on handles and swatch insets. Pills (999px) only for layer chips and scrollbar thumbs. The orange→navy accent bar (2px) sits under the header, edge to edge.

## Components

### Buttons
- **Download (primary):** one per screen, header right. Orange fill, `on-orange` label, kerned label type, 42px (44px coarse), 24px padding (14px under 600px). Disabled (raised fill, subtle text) unless the stage is ready: not while an asset loads, after one failed, or while signing.
- **Outline:** transparent, `control-border` edge, Roboto 500. Hover: raised fill, subtle edge. Danger variant hovers to `danger` edge and text.
- **Commit:** navy fill for Apply-type actions inside the tray.
- **Icon button:** 32px (44px coarse), muted glyph, raised hover. Inline SVG sprite icons, 18px, 1.75 stroke.

### Franchise chip (header)
Sunken, `control-border`, 44px: 36px sticker thumbnail, mono prefix code behind a hairline divider, Exo name with ellipsis, caret. Opens the franchise wall. Empty state reads "Pick your franchise" with a grid icon.

### Franchise wall
Modal `dialog`, max 980px wide, surface with a `control-border` edge over `scrim`, rises 8px over 200ms. Grid `auto-fill minmax(104px, 1fr)`, 8px gap (3 columns full screen below 600px). Item: sunken tile, 72px sticker, mono code, two-line muted name. Current franchise: orange border plus 1px orange inner outline. Focus: 2px `text` outline offset 2px (stays distinct from the orange ring). Art shimmers until loaded.

### Stage
Checkerboard (16px cells) under the canvas, 1px `border` outline. States: loading (shimmer sweep), empty and error (35% opacity plus a centered stage message; error edges it `danger`). Overlay signing: dashed `muted` outline, crosshair.
- **Selection box:** 1.5px orange outline over a 1px `box-edge` inner line, so it holds on orange art.
- **Default placement:** every new layer starts inside the asset (shrunk if larger, moved in from the edge), so the export never cuts it.
- **Handles:** 12px white squares (2px radius, 2px orange border) at the corners, a round rotate handle 30px above on an orange stem. Coarse pointers get a 16px invisible hit margin.

### Tool tray
Surface panel, 8px radius. Head: tabs (SIGN · TEXT · BACKGROUND, the last for stickers only) and layer chips; body: the active panel; foot: the selected layer's sliders and actions behind a hairline.
- **Tabs:** sunken track (6px radius, 2px inset), kerned-label tabs with 16px icons; selected is navy.
- **Segmented control:** the same pattern for in-panel choices (background type), Roboto 500 0.8125rem.
- **Layer chips:** pills, `control-border`, icon plus truncated name (max 180px); pressed is navy fill.
- **Sliders:** 4px track, navy-hover fill to the value (`--fill`, set from JS), white thumb with a navy ring (16px; 24px coarse). Label and mono readout above, on one row on phones.
- **Inputs:** sunken, `control-border`, 40px (44px coarse); focus is an orange border, no ring. Selects carry an inline SVG caret.

### Swatch mat
Every color input is a 44px well in `swatch-mat` with 4px padding; the swatch inside carries a 1px `swatch-edge`, so white, black and mid colors all read.

### Signing sheet
One `dialog`, two modes. The sheet opens below 600px wide, or on a coarse pointer up to 500px tall (a phone on its side); otherwise the overlay. The sheet's styles key off `:modal`, not a breakpoint, so it still fits if the phone rotates or the window widens while it is open.
- **Desktop overlay:** the player signs straight onto the stage art; the sign tools (size, ink, outline, Clear / Undo / Apply) sit inline in the tray, and the paper is not shown.
- **Phone sheet, portrait:** full-screen modal on `ground`, padded to all four safe-area insets: "Sign it" title, rounded paper filling the height with a "Sign above the line" rule at 26% from the bottom, tools in a two-column grid, 48px actions.
- **Phone sheet, landscape:** paper on the left under the title, tools in a 280–340px column beside it, 44px actions.

### The kit
The signature component: a tile per asset, live signed thumbnails, a muted header count.
- **Aspect-true tiles:** each thumb has its asset's real ratio (`--ar`); rows flex-grow by ratio so a row shares one height (squares 2×2, banners full width under 340px of kit).
- **Tile:** checkerboard (10px), 3px radius, kerned small label, mono size, 26px download icon (44px when stacked).
- **Current:** 2px orange ring, offset 2px. Focus: 2px `focus` ring.
- **Unavailable:** sunken, dashed `border-strong` outline, canvas hidden, centered muted "Not made for {team} yet", `not-allowed` cursor. Never an error look.
- **Loading:** shimmer. The kit is 50% opacity and inert until a franchise is picked.

### Landing stamp (motion)
When a signature is applied, it stamps onto each ready kit tile in turn: from scale 1.8, 4px blur and 0 opacity to rest over 460ms, 45ms stagger, `cubic-bezier(0.16, 1, 0.3, 1)`, scaled from the placement point. Only the new layer animates over a snapshot of the old tile. Skipped entirely under reduced motion.

### Deviations from CSC-Web DESIGN.md

| Deviation | Parent says | Why |
|---|---|---|
| Download label is `on-orange` (`#1c1103`, CSC-Web's `--lb-t-ink`) | Primary: white text | White on `#f7931e` is about 2.3:1; the lobby's ink passes AA. |
| Kit thumbnails and the landing stamp dilate signatures below half scale | — | Strokes shrunk under a device pixel vanish into the art. Below 0.5 effective scale the layer is also drawn one device pixel off in 8 directions; the stage and the export (scale 1) stay exact. |
| Phone signing paper turns dark slate (`paper-dark`) under light ink, and the default ink is white | — | The paper flips by ink luminance so the pen always shows; with the default white ink the sheet is dark. |
| Outline buttons hover to a raised fill and subtle edge | Hover swaps the border to orange | Orange is kept to Download and the current selection. |
| Layer chips are pills, transparent or navy | Pills: Deep Patrol fill, orange text | The pressed state is a selection toggle, matching the navy tabs. |

## Do's and Don'ts

### Do:
- **Do** take every color from the custom properties in `css/styles.css` and add a `[data-theme="light"]` value for any new one.
- **Do** keep orange to Download, the current selection, focus and the accent bar.
- **Do** show a missing asset as an unavailable tile ("Not made for X yet"), never as an error.
- **Do** keep thumbnails aspect-true and live; keep the stage and export at exact scale.
- **Do** put sizes, codes and readouts in Martian Mono, and labels in the Exo kerned label.
- **Do** keep 44px touch targets under `pointer: coarse` and cut all motion under `prefers-reduced-motion`.

### Don't:
- **Don't** put white text on Floodlight Orange.
- **Don't** add `box-shadow`; use a tonal step or a stronger border.
- **Don't** let a tool switch or the signing pad resize the stage.
- **Don't** add a second orange button, or an orange hover on anything but Download.
- **Don't** add motion beyond the 180ms state transitions, the 200ms wall rise and toast, the loading shimmer, the busy-icon spin and the landing stamp.
