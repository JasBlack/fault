# Changelog

## 0.7.5 — interferer off, show mask

- Interferer / input B has three choices: **＋ clip** (load a second picture or video), **bars** (generated colour bars) and **none** (turns the second input off). Before, there was no way back to no interferer once one was chosen.
- **show mask** on the mask tab tints the areas the effect reaches in hatched purple. It is shown on screen only and never appears in captures.

## 0.7.4 — output keeps the source's shape

- The picture, saved PNGs and recordings now take the shape of the loaded picture or video: 9:16 stays 9:16 (1080 × 1920), 4:5 becomes 1288 × 1610, 16:9 stays 1920 × 1080. Each is about the same number of pixels as 1080p, with the long side at most 1920. The built-in demos stay 16:9.
- The signal raster scales with the frame, so scanlines, carrier texture and the tube mask have the same density in any shape.
- *Screen shape 4:3* applies only to landscape pictures wider than 4:3.
- A recording that captured no frames (the picture rendered too slowly) now says so instead of silently producing nothing.

## 0.7.3 — record live

- New **record live** button in the capture panel: records what is on screen from that moment until you press stop, without rewinding. Use it to capture yourself moving the controls.
- The main **capture** button is unchanged: a picture saves at once, a clip records from start to end. Every finished capture downloads automatically.

## 0.7.2 — capture records the whole clip as MP4

- With a video loaded, **capture** rewinds to the first frame, records the clip once through and stops by itself at the end. Press **stop** to finish early. Animated pictures record one full loop. The built-in demos record until you press stop.
- Recordings are MP4 (H.264) where the browser can make them: current Chrome, Edge and Safari. Firefox cannot, so it saves WebM and says so.
- The finished take downloads automatically, named after the source, and stays listed in the capture panel.

## 0.7.1 — selections follow video

- A clicked selection (smart select or wand) now follows its subject through video, animated pictures and the demos. FAULT learns the colours of the selected area on the frame you clicked, then each frame keeps the pixels with those colours near where the selection was a frame earlier. It runs on the GPU every frame.
- If the subject is lost (a cut, a loop, or a very fast move), FAULT looks for its colours across the whole picture and carries on from there. That can also pick up other areas of the same colour.
- *Follow in video* turns this off (the selection then stays fixed on the screen). *Follow reach* sets how far the subject may move between frames; at maximum the selection is everything with the learned colours.
- Following is by colour, so it works best when the subject's colours differ from what is around it.

## 0.7.0 — effect on part of the picture

A new **mask** tab limits the effect to a selection; everywhere else shows the clean source.

- **Key from the picture:** select a brightness band, or a colour picked from the stage with *pick key colour*. The key is computed live from the source, so it follows moving video.
- **Smart select:** click an object to select it, using a small Segment Anything model (SlimSAM) that runs in the browser. Nothing is uploaded. The model and its runtime (about 36 MB) download on first use from jsDelivr and Hugging Face, so the first use needs an internet connection; if they cannot load, FAULT falls back to the wand.
- **Colour wand:** click to select the connected area of similar colour. Works offline.
- Click adds to the selection, Alt-click removes. *Invert*, *Feather*, *clear selection* and *mask off* are in the tab. Clicked areas stay fixed on the screen and are cleared when a new source loads; the selection is kept when you change look.
- The page's content security policy now allows those two hosts, for smart select only.

## 0.6.5 — full-screen picture

- Looks and tube types no longer curve the screen, so the picture fills the frame edge to edge with square corners. *Screen curve* on the tube tab brings back the bulged glass, rounded corners and black surround.

## 0.6.4 — capture

- The record button is now **capture**. With a still picture loaded it saves a 1080p PNG immediately; with a video, an animated picture or a built-in demo it records as before.
- Saved pictures always use your exact tube settings, not the coarser on-screen preview.
- Every look now starts in 16:9. *Screen shape* on the tube tab still switches to a 4:3 tube, and choosing a tube type no longer changes the shape.

## 0.6.3 — tidier panels

- Removed the 1 to 4 number badges from the left panel titles.
- Capture panel says each thing once: size and frame rate on one line, "video only, no audio" below, then your takes.

## 0.6.2 — clean looks

- **Colour cleanup (comb filter)** on the display tab: removes the rainbow speckle that fine black-and-white detail picks up in composite video, by averaging each line's colour with the next (the carrier flips phase between lines, so false colour cancels and real colour stays). Vertical colour detail is slightly softened, as on sets with a comb filter.
- Two new looks with strong blacks and little colour noise: **Clean tube** (a sharp PVM picture with a light mask and no bending artefacts) and **Clean emboss** (the relief bevels without the carrier texture).

## 0.6.1 — tube model checked against published figures

- **Phosphor colour:** the tube now uses the SMPTE-C (P22) phosphor primaries, converted for an sRGB screen, in place of a hand-picked tint. *White point* moves between D65 (studio monitors) and D93 (x 0.283, y 0.298), the cooler white Japanese consumer sets were aligned to.
- **Mask pitch:** Sony PVM stays at 3 px per triad, which matches a 20-inch PVM (0.25 to 0.31 mm stripe pitch, 800 TV lines, roughly 415 to 515 triads across). Consumer types are coarser, in line with their roughly 300 TV lines: Trinitron TV 5 px, Slot-mask TV 5.5 px, Dot-mask set 5 px.
- **Damper wires:** aperture-grille tubes show the two faint horizontal shadows of their damper wires.
- Colour phosphors decay in tens of microseconds, far less than a frame, so the model adds no frame-to-frame trails.

## 0.6.0 — cathode-ray tube model and tube types

- **Tube model** (tube tab, *Cathode-ray tube* on): the screen stage now works in linear light the way a tube does. The signal drives the guns through a 2.4 power law; each scanline is a Gaussian electron spot that swells with brightness, so bright lines merge and dim lines stay thin; the mask (aperture-grille stripes, staggered slots or dot triads) is applied to light and averaged over each output pixel; light scatters in the faceplate as bloom and halation; phosphor colour and white point (6500K to 9300K) are applied; highlights roll off without shifting hue.
- **Tube types**: Sony PVM, Trinitron TV, Slot-mask TV, Dot-mask set, Mono monitor and Flat. Each is a starting point modelled on the general character of that kind of set, not a measurement of a specific unit.
- New controls: Picture (contrast), Black level cut, Scanline beam, Visible lines, Focus, Phosphor colour, Monochrome tube, Cylindrical tube, Halation, Glass reflection. Mask pitch and strength moved from the display tab to the tube tab.
- **Disorder** (carrier texture): the herringbone no longer repeats on a fixed zigzag. Its arms change length and lean, it drifts differently across the width, jumps at the occasional seam, comes and goes in patches, and hardens toward on/off dots.
- Relief tube, Silver emboss and Herringbone now use the tube model (Trinitron TV, Sony PVM and Slot-mask TV).

## 0.5.0 — relief, carrier texture and the tube

Built from a study of 47 photographs of bent video on CRT screens.

- **Relief** (bend tab): the picture through a coupling capacitor that is too small, then amplified until it clips. Flat areas settle to grey while every edge becomes a bright bevel with a shadow trailing behind it, so shapes look inflated or pressed in metal. Controls: Relief, Flatten to grey, Edge gain, Droop length, Line streaks.
- **Carrier texture** (new tube tab): the colour carrier shows in the brightness as a dot pattern. Weave turns the checkerboard into a drifting herringbone that bends around the picture. Chroma smear trails colour to the right of shapes.
- **Tube** (new tube tab): 4:3 screen shape, screen curve with a black surround, unbroken vertical stripe mask, glow, dark corners and a cool tint.
- Three new looks: **Relief tube**, **Silver emboss** and **Herringbone**.
- Line bending now defaults to off, so the picture no longer wobbles unless you ask for it. Lost lock keeps its tearing.
- Patch format is version 3. Version 1 and 2 patches still load; controls they do not mention take their defaults.
- All new controls default to off, so the existing looks are otherwise unchanged.

## 0.4.2 — icon and link preview

- New FAULT icon (a torn signal wave, green with a violet ghost) for browser tabs, bookmarks and home screens: SVG, 32 px PNG, .ico, Apple touch icon, 192/512 px manifest icons.
- Link-preview card (1200 × 630) for pasted links in iMessage, Slack, Discord, X and others, in the same style as the other JAS.BLACK tools.
- Web manifest, Open Graph and X card tags. Deploy now publishes `public/` beside the page. Sources are in `design/`.

## 0.4.1 — dropping and media

- Drop files anywhere on the page. The browser never opens or downloads a dropped file any more (previously a drop that missed the stage handler could open the picture or download a .mov).
- The drop highlight no longer flickers while dragging over the stage.
- Drop onto **interferer / input b** to load the second signal (purple highlight). Two files at once fill both inputs. Patch `.json` files can be dropped too.
- Animated GIF, WebP, APNG and AVIF now play and loop (decoded with WebCodecs), with seeking.
- Files without a browser-supplied type (often .mov and .mkv) are recognised by extension. Pictures go through a canvas, which adds SVG and very large photos.
- Clear messages for undecodable files, such as ProRes .mov in Chrome or HEIC outside Safari.

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
