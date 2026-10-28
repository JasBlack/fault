# Icons and link preview

Source files for what browsers, bookmarks and link previews show. The finished files live in `public/` and are copied next to `index.html` on deploy.

| File | Used for |
| --- | --- |
| `public/favicon.svg` | Browser tab and bookmark icon (also inlined in `src/index.html`, so the offline file has it too) |
| `public/favicon-32.png`, `public/favicon.ico` | Fallback tab icons for browsers without SVG icons (16/32/48 px in the .ico) |
| `design/icon-full.svg` → `public/apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png` | Home-screen icons (iOS rounds the corners itself), web manifest |
| `design/og-card.html` + `og-hero.jpg` → `public/og.jpg` | 1200 × 630 card shown when the link is pasted (Open Graph / X) |

The icon is a signal wave torn sideways, with a violet ghost: FAULT's lost-sync glitch in the family green `#39ff88` and violet `#b36bff`.

To rebuild the card, open `design/og-card.html` in Chrome at a 1200 × 630 window and screenshot it to `public/og.jpg`. Any headless browser works too. `og-hero.jpg` is a frame of FAULT's own output (Orbit demo, Hot circuit look). If you change `public/favicon.svg`, also update the inlined copy in the `<head>` of `src/index.html` (escape `#` as `%23`).

Link previews are cached. After changing `og.jpg`, use a preview debugger (for example the LinkedIn Post Inspector or Facebook Sharing Debugger) to refresh the cache.
