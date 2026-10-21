# Product

<!-- impeccable:product-schema 1 -->

The sticker generator is a CSC surface. CSC-Web's [PRODUCT.md](https://github.com/csconfederation/CSC-Web/blob/main/PRODUCT.md) (users, brand personality, anti-references, design principles, accessibility) and [DESIGN.md](https://github.com/csconfederation/CSC-Web/blob/main/DESIGN.md) (the visual system) govern it. This file records only what is specific to the sticker tool.

## Platform

web

## Users

CSC players, making assets for themselves. A player picks their franchise, signs its sticker (or avatar, banner, wallpaper), adds their name or number, and downloads the result for Discord, Twitter/X, Twitch, YouTube or their desktop. Phone and desktop matter equally: people sign with a finger on a phone, and edit banners and wallpapers on a computer.

## Product Purpose

Turn the franchise art the league's designers make each season into something a player can own: their signature on their team's sticker. Success: a player gets from "pick my team" to a downloaded, signed asset in under a minute on any device, and the result looks good enough to use as their avatar.

## Operating Context

- Served at stickers.playcsc.com, and embedded in an iframe at playcsc.com/stickers (CSC-Web `src/pages/Stickers.tsx`) under the "My CSC" nav group. The iframe's height is the viewport minus CSC-Web's header.
- CSC-Web posts its color scheme (`'light'` or `'dark'`) to the iframe; dark is the default.
- Players arrive Discord-logged-in on playcsc.com, but the tool needs no login and knows nothing about the player.

## Capabilities and Constraints

- Static GitHub Pages site: vanilla HTML/CSS/ES modules, no backend, no build step for the app code. A deploy-time script may generate derived files (asset manifest, thumbnails).
- Franchises and their asset files live in `teams/<PREFIX>/`. Designers upload them through the GitHub web UI, so the app must cope with any asset type missing for a team.
- Asset types and export sizes: Sticker, Sticker Shadow, Season Team Sticker, Season Signature Sticker and Profile Picture at 512×512; Discord Banner 1200×480; Twitter/X Banner 1500×500; Twitch Banner 1920×480; Desktop Background 1920×1080; YouTube Banner 2560×1440. Exports are PNG at exactly these sizes.
- Layers: one or more drawn or uploaded signatures, plus a text layer (name or number). Each layer can be moved, scaled, rotated and faded. Stickers can swap the original background for a solid color, gradient or transparency.
- Work persists in the browser (team, asset, background); nothing leaves the device.

## Brand Commitments

- CSC-Web's visual system is binding: Floodlight Orange / CT-Side Navy, the dark slate stack, Exo / Roboto / Martian Mono, kerned uppercase Exo labels, no shadows, one orange primary per screen.
- The franchise art is the hero. The tool's chrome never competes with it.

## Evidence on Hand

- Franchise art for 23 franchises in `teams/` (sticker, shadow sticker, season stickers, profile picture, banners, wallpaper; coverage varies per team).
- Credits: chobits, spidey, ry, Cameron King, Skimix (footer and README).
- No usage analytics exist; don't invent numbers.

## Product Principles

1. **The sticker is the stage.** Every control serves the art and the signature on it.
2. **Signing is the moment.** The pad must feel like signing with a good pen, on a phone as much as with a mouse.
3. **Nothing breaks on a missing file.** Unavailable assets are visible as unavailable, never as errors.
4. **What you see is what you download.** The export matches the stage pixel for pixel, at the asset's real size.

## Accessibility & Inclusion

CSC-Web's requirements apply (WCAG 2.1 AA where it doesn't fight the brand, 44px touch targets on phones, `prefers-reduced-motion`). Every canvas action also has a control or keyboard path: layer move, scale, rotate, delete.
