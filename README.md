# aura-site

The website for Aura, a music player for Navidrome and other Subsonic servers: the landing page and the app's privacy policy.

A static site — plain HTML, CSS and JavaScript, no build step.

The sideload build of Aura (`Aura.ipa`, for AltStore or SideStore) is published on the app repository's [Releases](https://github.com/adrbn/aura/releases), with its source, under the GPL 3.0.

## Run it locally

```bash
python3 -m http.server 5260
```

Then open <http://localhost:5260>.

## Deploy

- **Vercel** — import the repository with no framework and no build command; the output directory is the repository root. `vercel.json` turns on clean URLs (`/privacy` rather than `/privacy.html`).
- **GitHub Pages** — already publishes `main` at <https://adrbn.github.io/aura-site/>. The privacy policy URL registered in App Store Connect points there: <https://adrbn.github.io/aura-site/privacy.html>. Keep that path working, or change App Store Connect first.

## Files

| Path | What it is |
|---|---|
| `index.html` | the landing page |
| `privacy.html` | the privacy policy, linked from the App Store listing |
| `assets/site.css` | styles |
| `assets/site.js` | the playable equalizer, sung lyrics, scroll sync, the install sheet, reveals |
| `assets/fonts/` | Vavin Italic (`OFL.txt`) for emphasis, under the SIL Open Font License |
| `assets/img/` | the app icon, and `aura-og.png`, the 1200 × 630 link preview (Open Graph and Twitter card) |
| `assets/shots/` | app screenshots (WebP), shown whole in the hero's phone frames |
| `assets/covers/` | covers drawn by the app itself (radio, mixes, Radar, Wrapped) and the Radar thumbnails, cut from real captures |

## Screenshots

Only the hero uses screenshots. Each is found by file name in `assets/shots/`, shown whole at 660 × 1435; a missing one shows a hatched frame with the expected name.

| File | Screen |
|---|---|
| `home.webp` | Home — hero, left |
| `now-playing.webp` | Now Playing — hero, centre |
| `radio.webp` | a radio — hero, right |

The cards use the covers the app draws itself, cut from real captures of a real library — never redrawn in CSS, never a demo album:

- **Instant Mix** — the Blinding Lights radio cover.
- **Equalizer** — the app's curve, playable: drag a point or use the arrow keys, or pick one of the fifteen presets. Without JavaScript it shows the Electronic curve.
- **Radar** — four real releases, the ones on the server checked, one playing its preview.
- **Made For You** — Radar, Afternoon, Focus and Feel Good mixes and the September Wrapped, in a slow marquee.
- **Lyrics** — sung as you scroll, a line at a time; tap a line to jump to it.

## Before sharing the link

- The hero screenshots come from the App Store screenshot captures (`shoot.sh` in the app repository, 9:41 status bar), resized to 660 × 1435 WebP. They show a real library — keep it that way, never demo-server captures.
- The site is the App Store listing's marketing URL. It links only to this repository: its Releases for the IPA and its issues for support — never to the private app repository.
