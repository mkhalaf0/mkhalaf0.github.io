# Majd Khalaf's portfolio

Personal academic website for [mkhalaf0.github.io](https://mkhalaf0.github.io/).

This is a static GitHub Pages site. No build step or package installation is required.

## Preview

From the repository directory, run:

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Editing

- `index.html`: biography, publications, news, experience, and other content.
- `styles.css`: responsive layouts, semantic theme colors, and motion.
- `theme.js`: early theme selection, before the page renders.
- `script.js`: filters, clipboard feedback, accessible image dialog, reveals, and map.
- `conference-data.js`: conference locations and popup content.
- `assets/`: self-hosted Manrope fonts and Leaflet 1.9.4, with their licenses.

The page follows the system color preference until a visitor chooses a theme. CSS and JavaScript animations respect reduced motion. Native disclosures keep the long archive readable even without JavaScript.

The June 2026 "Now" update is archived. Publications reflect the October 2026 résumé, with the accepted CapGaze title and four authors confirmed from the attached manuscript. Under-review entries use broad topic labels and omit identifying metadata and materials. Do not upload the private résumé or review manuscripts.

The interactive map uses standard OpenStreetMap tiles with visible attribution and normal browser caching. It requests tiles when the map enters the viewport. The conference list remains available if the map cannot load. See the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

## Checks

```sh
node --check script.js
node --check theme.js
node --check conference-data.js
git diff --check
```

Before publishing, check phone, tablet, and laptop sizes; both themes; the More menu; publication filters; citations; image dismissal; and conference popups. GitHub Pages serves the root directory; all asset paths are relative.
