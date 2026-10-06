# 🌸 Stargazer Psychiatry Interview Trainer — Phase 3

A GBA-inspired, local-first web rehearsal game for Isabella's Psychiatry residency interview preparation.

## Phase 3: Gameplay / Simulation Layer

This release adds:

- Connected interviewer follow-up chains
- Pressure Run mode
- Boss Room mode for high-risk questions
- 10 / 15 / 30 question standard runs
- Timed spoken-answer rehearsal
- Resumeable mock interview sessions using localStorage
- Session history
- In-run readiness ratings
- Save points and game-like interview progression
- Stargazer interviewer mascot treatment
- Responsive mobile layout

## Run locally

Because the question database is loaded with `fetch()`, serve the repository through a local HTTP server rather than opening `index.html` directly.

For example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## GitHub Pages

This is a static site and can be deployed directly with GitHub Pages. No backend is required for the current release.

## Privacy

Rehearsal data is stored in the browser's localStorage. The app does not send interview answers to a server.

## Phase roadmap

1. Visual shell — complete
2. Personalized interview engine — complete
3. Gameplay / simulation — complete
4. Analytics, voice rehearsal, deeper scoring — next
5. Final QA, accessibility, polish, GitHub deployment — final


## iPhone / iPad Home Screen
The repository now includes a real PNG `apple-touch-icon` rather than relying on the SVG favicon. When hosted over HTTPS (for example GitHub Pages), open the site in Safari and choose **Share → Add to Home Screen**. If an older icon is cached, remove the existing Home Screen bookmark first and add it again.

## Before Interview Save Point
The Before Interview module is a 2–3 minute final checkpoint covering the opening, Radiology explanation, six-year interval, Why Psychiatry, and closing statement. Checklist state is stored locally in the browser.
