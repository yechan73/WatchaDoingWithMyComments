# Development Plan

Work phase by phase. Do not jump ahead into crawling, login, backend services, or broad package additions.

## Phase 0. Documentation and Repo Preparation

Outputs:

- `README.md`
- `docs/SWRS.md`
- `docs/DATA_POLICY.md`
- `docs/DEVELOPMENT_PLAN.md`
- `.gitignore`

Completion criteria:

- Documentation exists.
- Sensitive/raw data patterns are ignored.
- GitHub private repo connection is handled by the user or with explicit approval.

## Phase 1. Next.js Project Creation

Goals:

- Create Next.js + TypeScript app.
- Configure TailwindCSS.
- Configure lint/format tools.

Verification:

- Dev server starts.
- Build succeeds.
- Basic home screen renders.

## Phase 2. Sample Data Connection

Goals:

- Add `QuizItem` type.
- Add `src/data/users/sample.json`.
- Add dataset manifest.
- Load and count datasets on the home screen.

Verification:

- Sample dataset appears.
- Data count is visible.
- Invalid data does not crash the app.

## Phase 3. Quiz Engine

Goals:

- Shuffle dataset.
- Limit selected question count.
- Track current question.
- Track submissions and score.

Verification:

- Unit tests cover quiz generation and progression.

## Phase 4. Answer Matching

Goals:

- Implement title normalization.
- Implement Levenshtein similarity or a small equivalent.
- Support aliases.

Verification:

- Unit tests cover exact, normalized, fuzzy, alias, and incorrect cases.

## Phase 5. Quiz UI

Goals:

- Implement card front.
- Implement answer input.
- Submit by button and Enter.
- Reveal answer state.
- Move to next question.

Verification:

- A 10-question sample game can be completed.
- Keyboard-only play works.

## Phase 6. Card Flip and Results

Goals:

- Add card flip animation.
- Reveal poster/title/year/rating/director.
- Add final score screen and wrong-answer list.

Verification:

- End-to-end manual play works.
- Missing poster uses placeholder.

## Phase 7. Local Data Normalization Script

Goals:

- Read local JSON files from `data-raw/`.
- Support single response, multiple responses, or raw comment arrays.
- Filter empty, spoiler, improper, and duplicate items.
- Output `QuizItem[]`.

Hard constraint:

- No Watcha API calls.
- No cookie/header/auth handling.

Verification:

- Unit tests cover supported input shapes and filtering.

## Phase 8. Deployment Preparation

Goals:

- Polish README.
- Confirm no sensitive files are committed.
- Deploy to Vercel if desired.

Verification:

- Production build succeeds.
- Deployed app runs from static/local dataset.
- No live Watcha API collection exists.
