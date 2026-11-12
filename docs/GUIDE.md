# FAULT guide

## Play the circuit

- **Bend:** Frequency selects a resonant band relative to the colour carrier. Resonance controls the filter envelope. Drive adds the band back into the signal. Second band adds a band at 1.51 times the selected frequency. Fold applies a nonlinear sine transfer inside the voltage window.
- **Relief:** removes the slow brightness from the signal and amplifies what is left until it clips. *Relief* sets the amount. *Flatten to grey* decides how far flat areas sink to mid-grey (bevels show best over grey). *Edge gain* sets how hard edges are driven. *Droop length* is how far each edge's light and shadow trail along the line. *Line streaks* makes a line that carries more signal sit darker across its whole width, as a set with no black-level clamp does. Relief works along each scanline, so vertical edges emboss most; a smaller term against the lines above lights top edges.
- **Voltage window:** Lower threshold and Window width select the amplitudes where bending happens. These are normalised model units, not calibrated physical voltages.
- **Signal memory:** Feedback recirculates a horizontally shifted waveform from the previous frame. Sample offset is measured in the internal 2048-sample signal, not output pixels. This is not a physical sub-frame delay line.
- **Break:** Load a second clip (or use generated colour bars) and increase Interferer level. Protect sync bypasses the bend on the blanking/sync region; it does not undo interference already introduced by the dirty mixer. Reduce Hard lock to allow a simplified sync-pulse detector to move each row. Receiver drift, Line bending and Vertical roll add timing instability.
- **Colour cleanup (comb filter)** (display tab, Picture): removes the rainbow speckle that fine detail picks up, for a cleaner picture. For solid blacks as well, raise *Black level cut* and *Picture* on the tube tab and lower *Mask strength*. The **Clean tube** and **Clean emboss** looks start from those settings.
- **Tube tab, Tube type:** one press sets the whole screen: *Sony PVM* (studio Trinitron: fine stripes, sharp beam, neutral white), *Trinitron TV* (coarser stripes, cooler and more saturated, more glow), *Slot-mask TV* (staggered slots, softer beam, bulging glass), *Dot-mask set* (round phosphor dots, soft, very curved), *Mono monitor* (no mask, cool white phosphor) and *Flat* (no tube). Phosphor colour (SMPTE-C primaries, D65 or D93 white) and the PVM's stripe pitch follow published figures; the rest is the general character of each kind of set, not a measurement of specific units.
- **Tube tab, Carrier texture:** *Carrier texture* shows the colour carrier in the brightness as a dot pattern, stronger in bright areas. *Weave* lets its phase wander from line to line. *Disorder* makes that wander irregular: arms of changing length and lean, slow fanning across the width, occasional seams and patches where it fades. At 0 the weave is a fixed zigzag. *Carrier size* makes the pattern coarser. *Chroma smear* trails colour to the right of whatever caused it.
- **Tube tab, Tube:** *Cathode-ray tube* turns the tube model on. *Mask* chooses none, stripes (aperture grille), slots or dots; *Mask pitch* is the width of one RGB triad in output pixels and *Mask strength* how much it shows. *Picture* and *Black level cut* are the set's contrast and brightness knobs: turn them up for crushed blacks and overdriven whites. *Scanline beam* shows the raster as separate lines whose thickness follows brightness, and *Visible lines* sets how many there are. *Focus* is how sharply the beam can change along a line. *Phosphor colour* raises saturation, *White point* moves from studio 6500K to the cool 9300K of consumer sets, and *Monochrome tube* gives a black-and-white screen.
- **Tube tab, Glass:** *Screen shape* switches between 16:9 and a 4:3 tube. *Screen curve* bulges the glass; *Cylindrical tube* curves it left to right only, as a Trinitron does. *Glow* and *Halation* are light scattered close to and far from bright areas inside the faceplate. *Glass reflection* lifts the black of the unlit screen. *Dark corners* dims the edges. *Flat stripe mask* only applies with the tube off. A fine mask shows best in **output** view or fullscreen, where the picture is not scaled down. Recordings include all of it; bypass stays clean.
- **Mask tab:** apply the effect to part of the picture and leave the rest clean. *Key from the picture* selects a brightness band (*Brightness from / to*) or a colour (press *pick key colour*, then click the picture; *Colour tolerance* widens it). The key follows moving video. *Smart select* and *colour wand* select by clicking the picture: smart select finds the object under the click with a small model that runs in your browser (it downloads about 36 MB the first time, and nothing is uploaded); the wand takes the connected area of similar colour, set by *Wand tolerance*. Click adds, Alt-click removes. On video, a clicked area follows its subject by colour: FAULT learns the area's colours on the frame you clicked and each frame keeps matching pixels near where the selection last was. *Follow reach* is how far the subject may move between frames, and *Follow in video* switches following off. It works best when the subject's colours differ from its surroundings; after a cut or loop it searches the whole picture, which can also catch other areas of the same colour. Pause, click, then play. *Feather* softens the edge, *Invert selection* swaps inside and outside, *clear selection* removes clicked areas and *mask off* resets everything.
- **Output:** Frame feedback recirculates the decoded image with zoom and rotation. Input gain changes the signal before encoding. Colour phase changes the decoder reference. Dry/wet and Bypass compare with the unprocessed source.
- **Clear feedback** clears both signal and frame history. Changing patches also clears history.
- Double-click a slider to restore that control's default.

The source's brightness, contrast, detail and colour strongly influence the bend. Start with high-contrast footage, adjust Frequency slowly, then push Drive and Fold.

## Loading media

- Click **open picture / video**, or drop files anywhere on the page. The browser never opens or downloads a dropped file.
- Drop onto **interferer / input b** to load the second signal. Dropping two files at once loads the first as the source and the second as the interferer. Dropping a saved patch (`.json`) restores its settings.
- **Pictures:** PNG, JPEG, WebP, AVIF, SVG, BMP and anything else your browser opens. HEIC opens in Safari only. Very large photos are scaled to 4096 px on the long side.
- **Animated pictures:** GIF, animated WebP, APNG and animated AVIF loop like a video and can be scrubbed with the seek bar. This needs a browser with WebCodecs (current Chrome, Edge, Firefox or Safari). Older browsers show the first frame.
- **Video:** MP4, MOV, WebM and MKV, as long as your browser can decode the codec inside. H.264 and VP9 are safe. HEVC depends on your Mac and browser. ProRes does not play in Chrome, so export it as H.264 MP4 or try Safari. A file that can't be decoded gets a message and leaves the current source running.

## Playback and capture

- Space pauses/resumes source playback and oscillators. Feedback processing can still settle while paused.
- B toggles clean bypass. C clears history. Keyboard shortcuts are ignored while editing controls.
- Seek works for source A videos. Loaded sources loop and their audio is muted.
- **Capture** does the right thing for the source. With a still picture loaded it saves one 1920 × 1080 PNG immediately. With a video it rewinds to the first frame, records the clip once through and stops at the end; an animated picture records one loop; a built-in demo records until you press **stop**. The take downloads automatically as MP4 (WebM in Firefox, which cannot record MP4).
- Recording captures the processed canvas at 1920 × 1080, with a 30 fps target. **Video only: audio is not captured.** Actual frame rate depends on rendering speed.
- Stop recording, then click the take link to save it. WebM is preferred where supported, with MP4 as a fallback. No guarantee of ProRes or frame-accurate offline export.
- Each take is limited to 10 minutes to bound memory use. Download takes before closing; they are not stored persistently.
- Save patch downloads a JSON settings file. Load patch restores it. Media is not embedded in patches. Built-in patch changes discard unsaved slider changes.

## Processing model

1. Fit each source inside a 16:9 frame, preserving its aspect ratio.
2. Encode RGB into a simplified YIQ composite signal at 2048 × 576, with horizontal sync, a burst region and alternating carrier phase by line.
3. Sum an optional independently drifting second encoded source.
4. Apply two windowed finite-impulse-response resonant bands, amplitude gating, nonlinear folding and bounded signal feedback.
5. Estimate horizontal timing from the sync region with a simple correlation search and temporal smoothing.
6. Low-pass and demodulate the signal back to RGB, add optional aligned source detail, and apply image feedback.
7. Sharpen and draw independently sized RGB apertures at the final output resolution.

The model is deliberately reduced for interactive GPU use. It is not broadcast-compliant NTSC, a component-level circuit simulator, a full PLL receiver, or a reproduction of Timecode/GLAZE. There is no real vertical-sync recovery or burst-tracking colour PLL. Vertical roll is an explicit control. Temporal feedback behaviour varies with actual frame rate. No source code, preset files, binaries or media from those products is included.
