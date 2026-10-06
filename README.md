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
