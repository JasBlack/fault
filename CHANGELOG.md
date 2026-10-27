# Changelog

## 0.4.0 — JAS.BLACK tool family

Brought FAULT in line with Code Painter, SnipSnap and Growth:

- Looks are now picture tiles (three per row, lowercase captions), rendered from FAULT's own engine with the Orbit demo.
- Cutting-mat dot grid behind the console, baked as a small PNG tile rather than a live gradient.
- Header status LEDs: **live**, plus **rec**, which turns red while recording.
- Keyboard hints shown as `kbd` chips. Notifications moved to the bottom right and are fully hidden when inactive.
- Section titles use the family's wider tracking and heavier weight.
- Page description, theme colour and favicon for hosting at fault.jas.black.
- Repository set up for GitHub Pages, with a CI check that FAULT.html matches src/.

## 0.3.0 — Code Painter family

The interface follows JAS.BLACK's Code Painter at https://paint.jas.black/ and https://github.com/JasBlack/code-painter (reference commit 2811be4):

- Archivo branding and IBM Plex Mono controls, bundled locally and embedded in FAULT.html.
- The same charcoal/light console colours with green #39ff88 and violet #b36bff accents.
- Rounded keys, indicator lights, segmented controls, compact faders and grouped panels.
- Sources, looks and capture on the left; the video stage in the centre; the circuit console on the right.
- Header transport, **console / output** views, and a **light / dark** toggle. **H** hides or restores the side panels. Theme preference is saved locally when browser storage is available.

All video processing, RGB controls, patch format and recording functions are retained from 0.2. Interface theme and output-only view do not affect exported video. The engine source is byte-identical to 0.2.

Typography is under the SIL Open Font License; the licence files are in src/fonts. The application includes no Code Painter media or processing code.

## 0.2.0 — clearer output and adjustable RGB lights

Open **03 Display** (selected at startup):

- **RGB cell size:** 3–24 output pixels per RGB group. Small cells give a fine phosphor texture; large cells make individual lights obvious. This changes display texture independently of the bend frequency.
- **RGB light strength:** blend from no visible mask (0) to fully separated RGB apertures (1). Try 0.35–0.6 with cell size 6–10. Use fullscreen to judge the finest cells; downscaling a 1080p canvas inside the UI can soften or alias small patterns.
- **Edge sharpness:** bounded sharpening of the processed picture. Default 0.65; higher values can create halos.
- **Source detail:** adds aligned high-frequency luminance detail from the source while keeping the bent colour. This is an artistic hybrid, not pure composite emulation; it fades out when the second signal is fully mixed in.

Output and recording are now 1080p. The signal model is 2048 × 576, and the built-in generators render at 1080p. This costs more GPU time than 0.1. Display texture is applied after feedback so that it does not build up each frame. It is included in recorded output; bypass stays clean.

Version 1 patch files still load, using the new defaults for missing display controls. Because the signal resolution changed, old patches can look finer and are not guaranteed to be pixel-identical.

## 0.1.0

First prototype.
