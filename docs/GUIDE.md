# FAULT guide

## Play the circuit

- **Bend:** Frequency selects a resonant band relative to the colour carrier. Resonance controls the filter envelope. Drive adds the band back into the signal. Second band adds a band at 1.51 times the selected frequency. Fold applies a nonlinear sine transfer inside the voltage window.
- **Voltage window:** Lower threshold and Window width select the amplitudes where bending happens. These are normalised model units, not calibrated physical voltages.
- **Signal memory:** Feedback recirculates a horizontally shifted waveform from the previous frame. Sample offset is measured in the internal 2048-sample signal, not output pixels. This is not a physical sub-frame delay line.
- **Break:** Load a second clip (or use generated colour bars) and increase Interferer level. Protect sync bypasses the bend on the blanking/sync region; it does not undo interference already introduced by the dirty mixer. Reduce Hard lock to allow a simplified sync-pulse detector to move each row. Receiver drift, Line bending and Vertical roll add timing instability.
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
- Record captures the processed canvas at 1920 × 1080, with a 30 fps target. **Video only: audio is not captured.** Actual frame rate depends on rendering speed.
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
