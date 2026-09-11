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
| `assets/site.css`, `assets/site.js` | styles; sung lyrics, scroll sync, the install sheet, reveals |
| `assets/fonts/` | Vavin Italic, under the SIL Open Font License (`OFL.txt`) |
| `assets/img/` | the app icon |
| `assets/shots/` | app screenshots (WebP) |

## Screenshots

Each is found by file name in `assets/shots/`; a missing one shows a hatched frame with the expected name.

| File | Screen |
|---|---|
| `home.webp` | Home — hero, left |
| `now-playing.webp` | Now Playing — hero, centre |
| `playlists.webp` | Playlists — hero, right |
| `eq.webp` | Equalizer — large bento card |
| `settings.webp` | Settings (Lyrics + Playback) — "Tuned your way." card |
| `made-for-you.webp` | the Made For You row, cropped from Home |

## Before sharing the link

- Retake the screenshots against a demo library of freely licensed music, with the app's default accent and a clean status bar.
- The links to `github.com/adrbn/aura` — source, issues, releases, and "Get the IPA" — resolve once that repository is public.
