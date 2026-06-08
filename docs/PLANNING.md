# Planning

Last reviewed: 2026-06-09

This document summarizes the remaining work after reading `docs/SWRS.md`,
`docs/DEVELOPMENT_PLAN.md`, and `docs/DATA_POLICY.md`, then comparing them
against the current repository.

## Current Snapshot

The repository is beyond the original documentation-only phase. It already has:

- Next.js, TypeScript, TailwindCSS, ESLint, Vitest, and build scripts.
- A static sample dataset at `src/data/users/sample.json`.
- A dataset manifest at `src/data/manifest.json`.
- Dataset files under `src/data/users/` are loaded into the home screen dropdown.
- Core quiz types, quiz session creation, shuffle, rating formatting, and answer matching.
- Basic quiz UI: setup screen, question card, answer input, reveal, next question, and result screen.
- Unit tests for quiz generation and answer matching.
- A local normalization script at `scripts/normalize-watcha-comments.ts`.
- Raw/private data ignore rules for `data-raw/*.json`, HAR files, cookies, env files, and build outputs.
- The sample quiz app has been manually checked.

Latest local verification:

- `npm test` passed: 3 files, 17 tests.
- `npm run lint` passed.
- `npm run build` passed with a static `/` route.

## Guiding Constraints

- Do not add live Watcha API calls.
- Do not implement crawling, login, authentication bypass, cookie reuse, or header spoofing.
- Gameplay must use local normalized JSON datasets.
- Raw data belongs under `data-raw/` and should not be committed by default.
- Treat this as a private or limited-sharing MVP until data consent and privacy are rechecked.

## Phase Status

| Phase | Status | Notes |
| --- | --- | --- |
| Phase 0. Documentation and repo preparation | Mostly done | Docs and ignore rules exist. README is outdated because it still says the repo is in documentation/repo-preparation phase. |
| Phase 1. Next.js project creation | Done | App builds successfully. |
| Phase 2. Sample data connection | Done for MVP | Local JSON dataset files are loaded into the home screen dropdown. |
| Phase 3. Quiz engine | Done for MVP | Session creation, shuffling, count limiting, and tests exist. |
| Phase 4. Answer matching | Done for MVP | Normalization, Levenshtein similarity, aliases, and tests exist. More Korean punctuation cases can be added later. |
| Phase 5. Quiz UI | Mostly done | End-to-end sample quiz flow exists. Sample app behavior has been checked. Accessibility pass remains. |
| Phase 6. Card flip and results | Partial | Result screen exists. Poster reveal exists. A real flip animation and stronger missing-poster design remain. |
| Phase 7. Local data normalization script | Done for MVP | Local-only script exists with tests. Manifest integration and real-data dry runs remain. |
| Phase 8. Deployment preparation | Not started | Needs README update, sensitive-data review, and optional Vercel setup. |

## Remaining Work

### P0. Align Documentation With Reality

Goal: make the docs match the implemented state so future coding agents do not start from a stale assumption.

Tasks:

- Update `README.md` to say the project has a working sample quiz, not only documentation.
- Update `docs/DEVELOPMENT_PLAN.md` with current phase status or point it to this planning document.
- Keep `docs/SWRS.md` as the requirements source of truth, but avoid duplicating status in too many files.

Acceptance:

- A new contributor can read README plus docs and understand what is already implemented.

### P1. Harden the Local Data Normalization Script

Goal: keep the local normalization path reliable as real personal data is introduced.

Tasks:

- Run the script against a small real local JSON sample under `data-raw/`.
- Confirm the output dataset works in the quiz UI.
- Decide whether aliases should stay manual or be supplied by a companion local file.
- Consider generating or updating `src/data/manifest.json` after normalization.
- Keep the script local-only. Do not call Watcha or any external URL.

Acceptance:

- A local JSON file under `data-raw/` can produce a normalized dataset under `src/data/users/`.
- The generated dataset can be selected and played in the app.

### P2. Improve Dataset Handling

Goal: support more than one local dataset cleanly.

Tasks:

- Add stronger validation for dataset shape before gameplay.
- Decide whether `itemCount` should be manually maintained, derived at load time, or updated by a script.
- Add user-facing handling for empty or invalid datasets.

Acceptance:

- The home screen can select between local datasets when present.
- Bad data does not crash the whole app.

### P3. Polish Gameplay UX

Goal: make the current sample game feel complete on desktop and mobile.

Tasks:

- Add an actual card flip animation or intentionally simplify the requirement if the current reveal is preferred.
- Improve the missing-poster state so it feels designed, not like a raw placeholder.
- Ensure keyboard-only flow works after reveal and next-question actions.
- Review difficulty behavior:
  - easy: rating and director,
  - normal: rating only,
  - hard: no hints.
- Consider whether `near` answers should be shown as near-correct or still counted as incorrect for MVP.
- Manually verify mobile layout, long comments, long movie titles, and no text overlap.

Acceptance:

- A 10-question game can be completed comfortably with keyboard and mouse.
- Missing poster, long text, and mobile views look intentional.

### P4. Expand Tests and QA

Goal: protect the core game behavior before adding real personal data.

Tasks:

- Add tests for `normalize-watcha-comments`.
- Add more `normalizeTitle` cases for Korean punctuation, English subtitles, brackets, and whitespace.
- Add component or interaction tests for answer submission and result rendering.
- Optionally add Playwright later for a smoke test of the full game flow.
- Run `npm test`, `npm run lint`, and `npm run build` before merging feature work.

Acceptance:

- Core data transformation, answer matching, and quiz progression are covered by tests.

### P5. Prepare for Private Deployment

Goal: make the app safe to run outside the local dev machine.

Tasks:

- Review committed data for private comments, friend data, or anything that needs consent.
- Confirm there are no cookies, tokens, HAR files, request headers, or `.env` files in Git.
- Update README with setup, local data preparation, test, build, and deployment instructions.
- Deploy to Vercel only after the data review is complete.

Acceptance:

- Production build succeeds.
- Deployment uses only bundled normalized JSON data.
- No live Watcha API collection exists.

## Recommended Next Sprint

1. Run the normalization script against a small real local dataset.
2. Confirm the generated dataset appears in the dropdown and plays end to end.
3. Add stronger dataset validation and invalid-data UI.
4. Do one accessibility and mobile QA pass on the quiz UI.

This order keeps the project aligned with its main promise: a personal quiz game
powered by local data, not a Watcha API client.
