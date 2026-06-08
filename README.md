# Watcha Doing with My Comments

Personal web quiz game based on locally prepared Watcha Pedia comment data.

The repository currently contains a working sample quiz app, answer matching logic, tests, and a local JSON normalization script. Do not implement crawler, login, API bypass, or live Watcha API collection features.

## Project Intent

`Watcha Doing with My Comments` is a private toy project where a player guesses a movie title from a one-line comment. The MVP must use normalized local JSON data, not live Watcha API calls.

## Core Constraints

- Do not call Watcha API from the app during gameplay.
- Do not implement crawling, authentication bypass, cookie reuse, header spoofing, or bot-detection bypass.
- Use local JSON files prepared by the user.
- Keep raw data and sensitive request artifacts out of Git.
- Prefer a private GitHub repository during MVP development.

## Documents

- [SWRS](docs/SWRS.md): software/work requirements specification.
- [Data Policy](docs/DATA_POLICY.md): data handling, privacy, and allowed/disallowed data.
- [Dataset Guide](docs/DATASET_GUIDE.md): safe manual dataset preparation flow.
- [Development Plan](docs/DEVELOPMENT_PLAN.md): phase-based implementation plan.
- [Planning](docs/PLANNING.md): current implementation status and remaining work.

## Local Commands

```bash
npm run dev
npm test
npm run lint
npm run build
```

## Normalize Local Data

The normalization script reads only local JSON files and writes normalized `QuizItem[]` data.

```bash
npm run normalize:data -- --input data-raw/comments.json --output src/data/users/my-comments.json
```

Supported input shapes:

- A single Watcha-like response object.
- An array of Watcha-like page response objects.
- An array already cut down to raw comment objects.

After writing a normalized JSON file under `src/data/users/`, restart the dev
server or rebuild the app. Local dataset files appear in the home screen dataset
dropdown.

## Recommended Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Zod
- Vitest
- Optional: Framer Motion, lucide-react, shadcn/ui

## MVP Definition

The MVP is complete when a local/static dataset can be selected, a quiz can be played end to end, answers are matched with tolerant title normalization, results are shown, and no live Watcha API collection exists in the product.
