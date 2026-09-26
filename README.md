# aura-site

The website for [Aura](https://github.com/adrbn/aura), a music player for Navidrome and other Subsonic servers: the landing page and the app's privacy policy.

A static site — plain HTML, CSS and JavaScript, no build step.

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
| `assets/site.css` | styles, including the cover reconstructions (sized in container units) |
| `assets/site.js` | the playable equalizer, the Get It card's cycle, sung lyrics, scroll sync, the install sheet, reveals |
| `assets/fonts/` | Vavin Italic (`OFL.txt`) for emphasis; Archivo Extra Condensed Black, Expanded Black and Expanded Bold (`Archivo-OFL.txt`) for the covers — both under the SIL Open Font License |
| `assets/img/` | the app icon |
| `assets/shots/` | app screenshots (WebP), shown whole in the hero's phone frames |

## Screenshots

Only the hero uses screenshots. Each is found by file name in `assets/shots/`, shown whole at 660 × 1435; a missing one shows a hatched frame with the expected name.

| File | Screen |
|---|---|
| `home.webp` | Home — hero, left |
| `now-playing.webp` | Now Playing — hero, centre |
| `radio.webp` | a radio — hero, right |

Everything else is rebuilt in HTML, CSS and a little JavaScript rather than cropped from a screenshot:

- **Instant Mix** — a radio cover drawn the way the app draws one: the seed artist's disc sending out rings, two similar artists beside it, the name on a black band.
- **Equalizer** — the app's curve, playable: drag a point or use the arrow keys, or pick one of the fifteen presets. Without JavaScript it shows the Electronic curve.
- **Radar** — four made-up releases, marked as on the server or missing, one playing its preview.
- **Made For You** — the typographic covers (Radar, Evening, Chill, Soul Jazz, a 2025 Wrapped) in a slow marquee.
- **Get It** — the fetch card above the mini player, stepping from "Looking on Soulseek" to "In your library". Without JavaScript it rests on "Downloading".
- **Lyrics** — sung as you scroll, a line at a time; Translate puts a French line under each, as the app does with its on-device translation.

The artists and releases on these are invented.

## Before sharing the link

- Retake the three hero screenshots against a demo library of freely licensed music, with the app's default accent and a clean status bar.
- The links to `github.com/adrbn/aura` — source, issues, releases, and "Get the IPA" — resolve once that repository is public.
