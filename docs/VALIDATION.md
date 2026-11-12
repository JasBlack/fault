# FAULT validation

## Passed during 0.3 development

- JavaScript syntax checks for the application, graphics engine and Electron entry point.
- Captured the actual six shader programs from the JavaScript engine; compiled and linked each in an EGL/OpenGL ES 3 context using system Mesa.
- Rendered the complete encode → bend → receiver → decode → feedback/output → presentation pipeline on a generated test image.
- Checked nonblank, full-range output for default bending, strong folding, released sync with interference, and clean bypass.
- Visually inspected generated bend/fold output. Corrected decoder sampling to stay on individual signal rows rather than interpolating opposite-phase carrier lines.
- Verified the single-file edition includes all application code and styles without remote runtime dependencies.

## Not verified here

- Actual browser UI interactions, HTML media decoding, file dialogs, patch import/export and MediaRecorder output.
- Browser GPU implementation and performance on a MacBook.
- Electron installation, launch, macOS packaging, signing or notarisation.
- Audio capture (not implemented), frame-accurate offline export (not implemented), MIDI (not implemented), camera input (not implemented).

The local Chromium executable was unavailable and its download did not return a valid browser archive. The managed preview service was also unavailable. Those prevented end-to-end browser verification. The direct graphics-runtime checks do not substitute for those tests.

The deliverable is an experimental prototype, not a production release or a signed native installer.

## Additional 0.2 checks

- Compiled and linked all six updated shader stages and rendered the complete pipeline at 1920 × 1080 with a 2048 × 576 signal.
- Checked seven render configurations: hot bend, fold, released sync, clean bypass, fine RGB mask, coarse RGB mask and no mask.
- Verified that clean bypass matches the source even with maximum phosphor and sharpening controls (mean error under 0.01 per 8-bit channel in the generated test).
- Verified different RGB cell sizes produce different patterns, and visually inspected full-resolution crops of mask-off, 6-pixel and 18-pixel cells.
- JavaScript syntax checks pass. End-to-end browser controls and Mac performance remain unverified in this environment.

## Additional 0.3 checks

- Inspected Code Painter's live easy and console views, and its source styling (commit 2811be4).
- JavaScript syntax checks passed for updated app and Electron shell.
- Parsed built HTML: all IDs are unique, and every literal app event hook resolves to an element.
- Validated all four bundled font files with fontTools and confirmed they are embedded in the single-file edition.
- Compared the graphics engine byte-for-byte with the 0.2 deliverable: unchanged. GPU checks were therefore not repeated for this styling update.
- Local live preview remains unavailable (managed preview daemon missing). The redesigned layout has not been browser-rendered in this environment, and on-Mac validation remains outstanding.

## Browser check before first publish (October 2026)

- Loaded the built `FAULT.html` in headless Chromium (Playwright, SwiftShader software WebGL 2) at 1440 × 900 and 390 × 844.
- The engine started, the Orbit demo rendered through the full pipeline, and there were no console errors or page exceptions.
- Theme toggle and a look preset switched correctly. The mobile layout stacks without horizontal scroll.
- Fixed: the hidden notification toast could peek into view on narrow or scrolled layouts; it is now fully hidden when inactive.
- 0.4 restyle re-checked the same way: look tiles, both themes, phone layout, bottom-right toast. Recording produced a WebM take and the rec LED lit red.
- Still not verified: real-GPU performance on a Mac, Safari, file dialogs, playback of recorded takes, and the Electron shell.

## 0.4.1 media and drop checks (headless Chromium)

- Simulated drops on the stage, the console panel and input B, plus the file picker. The page never navigated away, and there were no page errors.
- Drop highlight stays on while moving over child elements and clears when the drag leaves.
- Loaded: WebM (VP9), MP4 and MOV (H.264), MKV with no MIME type, animated GIF and WebP (frames advance), SVG, a 6000 × 3000 JPEG.
- ProRes .mov and a corrupt .mov show the codec message and keep the current source.
- Not checked: HEVC .mov, HEIC in Safari, real Finder drag-and-drop on macOS.

## 0.5.0 relief and tube checks (headless Chromium, software WebGL)

- All shader stages compile and the three new looks render on the Orbit demo and on a flat-colour test illustration, with no page errors.
- Compared renders side by side with reference photographs while tuning: embossed bevels over grey, herringbone carrier texture, stripe mask, curved 4:3 tube with black surround.
- Bypass still shows the clean source. With every new control at its default the earlier looks render as before, apart from line bending now defaulting to off.
- Not checked: frame rate on a real GPU. The relief and tube stages add texture reads (about 80 per signal sample with relief on), so slower integrated GPUs may drop below 30 fps.

## 0.6.0 tube model checks (headless Chromium, software WebGL)

- All shader stages compile. The five tube types and the three tube looks render on the Orbit demo and a test illustration with no page errors; version 2 patches still load.
- Compared against reference photographs while tuning. Texture disorder and mask structure are close; the references still have harder contrast and cooler whites than the defaults.
- Not checked: frame rate on a real GPU (the tube stage adds about 35 texture reads per output pixel), and how fine masks look when the canvas is scaled down in console view.

## 0.7.0 mask checks (headless Chromium)

- Brightness key, picked-colour key, colour wand and smart select each limited the effect to the expected area on a test illustration, with no page errors.
- Smart select was run with the real transformers.js 3.8.1 library and SlimSAM model files, served to the page from local copies; the live jsDelivr and Hugging Face downloads were not exercised from this environment.
- Not checked: smart select speed on real hardware, Safari, and selection on video frames.

## 0.7.1 follow checks (headless Chromium)

- On a test video stepped frame by frame, a wand selection followed a moving ball for 150 frames, ignored a square of the same colour elsewhere, and found the ball again after the video jumped back (also selecting the square at that point).
- Not checked: real footage, where subject and background colours overlap, and real-time playback on a GPU.
