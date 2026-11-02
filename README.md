# Candidate Hub

A responsive Nigerian Senate and House of Representatives directory prototype. All people, parties, and platforms are fictional sample data, clearly labelled throughout the site.

## Run locally

Requires Node.js 20 or newer. No dependency installation is needed.

```sh
npm run dev
```

The development server listens on port 3000. Set `PORT` to override it. Run `npm test` for search, filter, and map tests.

## Features

- Homepage map includes all 36 Nigerian states and the FCT. Click a state or use the accessible dropdown, choose Senate or House of Representatives, then open a contestant profile.
- States without sample contestants show an explicit empty state; no real election coverage is implied.
- Search by name, constituency, background, party, or priority.
- Filter by state, office, party, and policy priority; sort by name.
- Open candidate profiles and compare up to three candidates.
- Save candidates in browser local storage, with a session fallback if storage is unavailable.
- Responsive layouts, labelled controls, keyboard-accessible dialogs, and reduced-motion support.

The site uses native JavaScript, CSS, and a small Node HTTP server. `data.js` holds the fictional dataset, `map-data.js` contains the local state geometry, `app.js` implements interactions, and `styles.css` defines the visual design. Map source and license are in `MAP-LICENSE.txt`. There are no external fonts, image services, APIs, or required credentials.

To add contestants, extend `candidates` in `data.js` with a unique ID, name, initials, exact state name, district, office (`Senate` or `House of Representatives`), party, colour class, occupation, priorities, biography, and proposals. Before publishing real records, add election-year and source verification information and replace the demo labels as part of a dedicated data integration step.

This prototype has no authentication, administrative publishing workflow, or verified live election data. Those are separate next steps before use as a public election information service. The included server is intended for local development; the frontend files can also be hosted on a static hosting service.

## GitHub Pages

The frontend uses relative asset and module URLs, so it can run under a repository URL such as `https://bimifolu.github.io/election-candidate-hub/`. In the repository's **Settings → Pages**, select **Deploy from a branch**, choose **main** and **/ (root)**, then save. GitHub Pages serves the frontend files directly; it does not run `server.js`.
