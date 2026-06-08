# Watcha Doing with My Comments

Personal web quiz game based on locally prepared Watcha Pedia comment data.

This repository is currently in the documentation/repo-preparation phase. Do not implement crawler, login, API bypass, or live Watcha API collection features.

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
- [Development Plan](docs/DEVELOPMENT_PLAN.md): phase-based implementation plan.

## Recommended Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Zod
- Vitest
- Optional: Framer Motion, lucide-react, shadcn/ui

## MVP Definition

The MVP is complete when a local/static dataset can be selected, a quiz can be played end to end, answers are matched with tolerant title normalization, results are shown, and no live Watcha API collection exists in the product.
