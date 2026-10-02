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
| `assets/site.css` | styles, including the cover reconstructions (sized in container units) |
| `assets/site.js` | the playable equalizer, sung lyrics, scroll sync, the install sheet, reveals |
| `assets/fonts/` | Vavin Italic (`OFL.txt`) for emphasis; Archivo Extra Condensed Black, Expanded Black and Expanded Bold (`Archivo-OFL.txt`) for the covers — both under the SIL Open Font License |
| `assets/img/` | the app icon, and `aura-og.png`, the 1200 × 630 link preview (Open Graph and Twitter card) |
| `assets/shots/` | app screenshots (WebP), shown whole in the hero's phone frames |
| `assets/covers/` | 160 × 160 WebP covers of the Creative Commons albums in the Radar demo, from the Navidrome demo library |

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
- **Radar** — four real, freely licensed albums, the ones on the server checked, one playing its preview.
- **Made For You** — the typographic covers (Radar, Evening, Chill, Soul Jazz, a 2025 Wrapped) in a slow marquee.
- **Lyrics** — sung as you scroll, a line at a time; tap a line to jump to it.

The artists and albums on these are real Creative Commons releases from the [Navidrome demo library](https://demo.navidrome.org), credited with their licenses in the page footer:

| Album | License | Source |
|---|---|---|
| Nine Inch Nails — *The Slip* (2008) | CC BY-NC-SA 3.0 US | [Wikipedia](https://en.wikipedia.org/wiki/The_Slip_(album)) |
| Brad Sucks — *I Don't Know What I'm Doing* (2003) | CC BY-NC-SA 2.5 | [Jamendo release on archive.org](https://archive.org/details/jamendo-003798) |
| The Polish Ambassador — *Pushing Through The Pavement* (2014) | CC BY-NC-SA 3.0 | [Jamendo release on archive.org](https://archive.org/details/jamendo-136167) |
| Natasha Beller — *Fairytale* (2018) | CC BY-NC-SA 4.0 | [blocSonic](https://blocsonic.com/releases/natasha-beller/fairytale/) |

Only use releases whose license allows adaptation (no ND) and say where it's from.

## Before sharing the link

- The hero screenshots come from the App Store screenshot captures (`shoot.sh` in the app repository, 9:41 status bar), resized to 660 × 1435 WebP. They show a personal library; retake them against a demo library of freely licensed music if that matters.
- The site is the App Store listing's marketing URL. It links only to this repository: its Releases for the IPA and its issues for support — never to the private app repository.
