# Watcha Doing with My Comments - SWRS

> Software Requirements Specification / Software Work Requirements Specification
>
> Purpose: Define requirements, constraints, implementation sequence, and verification standards so AI coding agents such as Codex, Claude Code, Cursor, and Windsurf can develop consistently in a personal Git repository.
>
> Current phase: Do not write application code yet. This document is the standard for writing the code well later.

## 0. Document Information

| Item | Content |
| --- | --- |
| Service name | Watcha Doing with My Comments |
| Project type | Personal toy project / web game |
| Default deployment | Static-data-based web app |
| Recommended repository | Personal GitHub private repository |
| Recommended local path | Windows Desktop subfolder |
| Recommended repo name | `watcha-doing-with-my-comments` |
| Preferred environment | Next.js + TypeScript |
| Core principle | Static pre-collected JSON game data instead of real-time crawling |
| Public service status | Private or limited personal sharing recommended for MVP |

## 1. Project Overview

`Watcha Doing with My Comments` is a quiz game based on public Watcha Pedia one-line comments or comment data manually saved by the user.

At game start, the user chooses the number of questions. The app shows a one-line comment, the user enters the movie title, and after submission the answer is judged. The card flips and reveals the movie poster, title, year, user rating, director, and related answer information.

The main fun is not generic movie trivia. The core play is reverse-tracing a movie from a specific person's reaction sentence.

## 2. Verified Background Facts

### 2.1 Observed Watcha Pedia Data Shape

Browser DevTools Network inspection confirmed an internal response shape for a Watcha Pedia user's movie comment list.

Observed URL shape:

```text
https://pedia.watcha.com/api/users/{userCode}/contents/movies/comments?order=recent
```

Observed response shape:

```json
{
  "result": {
    "next_uri": "/api/users/{userCode}/contents/movie/comments?order=recent&page=2&size=9",
    "result": [
      {
        "text": "패션쇼를 하고싶었던거지",
        "content": {
          "title": "레베카",
          "year": 2020,
          "poster": {
            "small": "...",
            "medium": "...",
            "large": "...",
            "xlarge": "..."
          },
          "director_names": ["벤 휘틀리"]
        },
        "user_content_action": {
          "rating": 6
        },
        "spoiler": false,
        "improper": false
      }
    ]
  }
}
```

Game fields can be derived as follows:

| Game data | Source field |
| --- | --- |
| Comment | `text` |
| Movie title | `content.title` |
| Release year | `content.year` |
| Poster | `content.poster.large` or `content.poster.medium` |
| Directors | `content.director_names` |
| User rating | `user_content_action.rating` |
| Spoiler flag | `spoiler` |
| Improper flag | `improper` |
| Next page | `result.next_uri` |

### 2.2 Direct Fetch Limitation

Calling the API directly from the browser console produced a 403 response:

```json
{
  "code": "not_allowed_client",
  "msg": "Not allowed",
  "detail": null,
  "type": "Hop::NotAllowedClient"
}
```

Therefore, the MVP must not rely on real-time Watcha API calls.

### 2.3 robots.txt Review

`https://pedia.watcha.com/robots.txt` includes:

```text
User-agent: *
Disallow: /api
```

Project policy:

- Do not implement real-time automatic crawling of `/api` in the MVP.
- Use JSON files manually obtained and prepared by the user.
- Prioritize private repository and personal use.
- Do not implement authentication bypass, header spoofing, bot-detection bypass, or cookie-based automation.

## 3. Feasibility

Technical feasibility is high because the observed response contains all fields needed for gameplay once the user has a JSON file.

Operational feasibility is high because a static JSON-based app has minimal hosting cost and can run on Vercel or similar static web hosting.

Policy risk is medium. Watcha's `/api` path is disallowed for crawling in robots.txt. The MVP lowers risk by using this flow:

```text
User checks data in their own browser
-> saves JSON file
-> runs local normalization script
-> game uses only local normalized JSON
```

## 4. Product Goals

### 4.1 MVP Goals

- Load a static JSON file and generate a quiz.
- Show one-line comments as cards.
- Let the user enter a movie title.
- Accept reasonable typos and whitespace variations.
- Reveal answer information with a flipped card.
- Show a final score screen.

### 4.2 Non-Goals

The MVP does not include:

- Watcha login
- Real-time Watcha API calls
- Automatic crawling
- Header spoofing or blocking bypass
- Public user search
- Public leaderboard
- User account system
- Comments/community features
- Commercialization

## 5. Recommended Tech Stack

Frontend:

- Next.js App Router
- React
- TypeScript
- TailwindCSS

UI and interaction:

- Optional shadcn/ui
- Optional Framer Motion for card flip animation
- lucide-react for icons

Data validation:

- Zod

Answer matching:

- Direct string normalization + Levenshtein distance
- Or a small library such as `fast-levenshtein`
- Or `fuse.js`

Testing:

- Vitest
- React Testing Library
- Optional Playwright or Cypress

Deployment:

- Vercel

## 6. Local Development and Git Requirements

Recommended local folder:

```text
Desktop/watcha-doing-with-my-comments
```

Recommended GitHub repository:

- Private repository
- Name: `watcha-doing-with-my-comments`
- Initial README is allowed

Simple branch strategy:

```text
main
└─ feature/*
```

Rules:

- `main` should always be runnable.
- Use small feature commits.
- Use feature branches before larger changes.

Recommended commit messages:

```text
feat: add quiz card
fix: normalize Korean title matching
chore: configure eslint
refactor: split quiz state logic
test: add fuzzy matching cases
docs: update SWRS
```

## 7. Repository Structure Requirements

Recommended structure:

```text
watcha-doing-with-my-comments/
├─ README.md
├─ docs/
│  ├─ SWRS.md
│  ├─ DATA_POLICY.md
│  └─ DEVELOPMENT_PLAN.md
│
├─ src/
│  ├─ app/
│  │  ├─ page.tsx
│  │  ├─ layout.tsx
│  │  └─ globals.css
│  │
│  ├─ components/
│  │  ├─ quiz/
│  │  │  ├─ QuizCard.tsx
│  │  │  ├─ AnswerInput.tsx
│  │  │  ├─ AnswerReveal.tsx
│  │  │  └─ ScoreBoard.tsx
│  │  │
│  │  └─ ui/
│  │
│  ├─ features/
│  │  └─ quiz/
│  │     ├─ quiz-engine.ts
│  │     ├─ answer-matcher.ts
│  │     └─ quiz-types.ts
│  │
│  ├─ lib/
│  │  ├─ normalize-title.ts
│  │  ├─ shuffle.ts
│  │  └─ rating.ts
│  │
│  ├─ data/
│  │  ├─ users/
│  │  │  └─ starter-comments.json
│  │  └─ manifest.json
│  │
│  └─ types/
│     └─ watcha.ts
│
├─ scripts/
│  └─ normalize-watcha-comments.ts
│
├─ data-raw/
│  └─ .gitkeep
│
├─ tests/
│  ├─ answer-matcher.test.ts
│  ├─ normalize-watcha-comments.test.ts
│  └─ quiz-engine.test.ts
│
├─ package.json
├─ tsconfig.json
├─ eslint.config.js
├─ .prettierrc
├─ .gitignore
└─ .env.example
```

## 8. Data Policy

The game must not fetch live data from external services during gameplay. It must use normalized JSON files inside the project.

Allowed in Git:

- User-created starter data
- The user's own comment data
- Data from friends who consented to sharing
- Fake test data

Not allowed in Git:

- Cookies
- Session tokens
- Authorization headers
- Original request headers containing personal information
- Bulk comments collected from other people without consent
- Data from private profiles

Raw data handling:

- `data-raw/` is not committed by default.
- Raw HAR, cookie, and environment files are ignored.

## 9. Data Model

Raw Watcha-like comment:

```ts
interface WatchaRawComment {
  code?: string;
  text?: string;
  spoiler?: boolean;
  improper?: boolean;
  created_at?: string;
  content?: {
    code?: string;
    content_type?: string;
    title?: string;
    year?: number;
    poster?: {
      small?: string;
      medium?: string;
      large?: string;
      xlarge?: string;
      hd?: string;
    };
    director_names?: string[];
    ratings_avg?: number;
  };
  user_content_action?: {
    rating?: number;
  };
}
```

Normalized quiz item:

```ts
interface QuizItem {
  id: string;
  source: "watcha" | "manual";
  comment: string;
  answerTitle: string;
  aliases: string[];
  year: number | null;
  posterUrl: string | null;
  directorNames: string[];
  ratingRaw: number | null;
  ratingStars: number | null;
  createdAt: string | null;
  spoiler: boolean;
  improper: boolean;
}
```

## 10. Functional Requirements

### FR-001. Home Screen

The user can start a game from the home screen.

Required elements:

- Service name
- Short description
- Dataset selection
- Question-count selection
- Difficulty selection
- Start button

### FR-002. Dataset Selection

The user can select one normalized JSON dataset included in the project. MVP may include only `starter-comments` or one personal dataset.

### FR-003. Question Count

Options:

- 5 questions
- 10 questions
- 20 questions
- All

If the requested count exceeds the dataset size, limit it to the full dataset size.

### FR-004. Quiz Generation

At game start, shuffle the selected dataset and select the requested number of items.

### FR-005. Quiz Card Display

Each question is shown as a card. The front face shows the one-line comment. Depending on difficulty, hints may include rating, creation date, director, or release year.

### FR-006. Answer Input

The user can type a movie title and submit with a button or Enter key.

### FR-007. Answer Normalization

Answer judging must not use exact raw string matching only. It must normalize:

- Leading/trailing whitespace
- Whitespace removal or compression
- Case differences
- Korean/English parentheses
- Selected special characters
- Punctuation such as colons, commas, and periods

### FR-008. Similarity Judging

Recommended criteria:

| Condition | Result |
| --- | --- |
| normalized input === normalized answer | Correct |
| Levenshtein similarity >= 0.9 | Correct |
| Levenshtein similarity >= 0.8 | Near-correct / optional user confirmation |
| Otherwise | Incorrect |

MVP may treat only `>= 0.9` as correct.

### FR-009. Aliases

Each movie can have aliases. Answer judging must compare against `answerTitle` and all aliases.

Example:

```json
{
  "answerTitle": "비틀쥬스 비틀쥬스",
  "aliases": ["비틀주스 비틀주스", "Beetlejuice Beetlejuice"]
}
```

### FR-010. Answer Reveal

After submission, the card flips and reveals:

- Correct title
- Release year
- Poster
- User rating
- Director
- Correct/incorrect indicator

### FR-011. Next Question

After answer reveal, the user can move to the next question. The final question moves to the result screen.

### FR-012. Result Screen

The result screen shows:

- Total questions
- Correct count
- Accuracy
- Optional elapsed time
- Incorrect-answer list
- Retry button

## 11. Data Normalization Requirements

The normalization script must support:

1. A single Watcha API response JSON file
2. An array of multiple page response JSON objects
3. An array already cut down to `result.result`

Output:

- `QuizItem[]`

Default filters:

- Exclude empty `text`
- Exclude missing `content.title`
- Exclude `spoiler === true`
- Exclude `improper === true`
- Deduplicate by `content.code + text`

Options:

- CLI option to include spoilers
- Optional minimum comment length filter

Rating conversion:

```text
ratingStars = ratingRaw / 2
```

Examples:

```text
6 -> 3.0
8 -> 4.0
10 -> 5.0
```

## 12. Non-Functional Requirements

### NFR-001. Performance

- Initial load target under 3 seconds.
- Smooth operation with 500 dataset items.
- Lazy-load images.

### NFR-002. Stability

- Bad data must not crash the whole app.
- Missing poster URL should show a placeholder.
- Long comments should wrap within the card.

### NFR-003. Accessibility

- Inputs need labels.
- Buttons need focus styles.
- Keyboard-only flow should work.
- Do not distinguish correct/incorrect by color alone.

### NFR-004. Privacy

- Do not store cookies, tokens, or session data.
- Do not store original request headers.
- Prefer private repo.
- Before public deployment, confirm whether other people's data is included.

### NFR-005. External Requests

During MVP gameplay, the app must not request Watcha API endpoints.

Exception:

- Poster images may use Watcha CDN URLs, but placeholder or proxy strategies should be considered.

## 13. Implementation Plan

### Phase 0. Documentation and Repo Preparation

Outputs:

- `README.md`
- `docs/SWRS.md`
- `.gitignore`

Completion criteria:

- Repository is connected to a private GitHub repository.
- Documents are committed.

### Phase 1. Next.js Project Creation

Goals:

- Create Next.js + TypeScript project.
- Configure TailwindCSS.
- Configure ESLint/Prettier.

Completion criteria:

- `npm run dev` or equivalent runs.
- Basic home screen renders.

### Phase 2. Starter Data Connection

Goals:

- Create `src/data/users/starter-comments.json`.
- Define `QuizItem` type.
- Write data loading function.

Completion criteria:

- Home screen recognizes starter dataset.
- Dataset count can be shown.

### Phase 3. Quiz Engine

Goals:

- Shuffle questions.
- Limit question count.
- Manage current question index.
- Record correct/incorrect answers.

Completion criteria:

- Quiz can proceed in console or simple UI.
- Unit tests pass.

### Phase 4. Answer Matching

Goals:

- Normalize strings.
- Calculate similarity.
- Support aliases.

Completion examples:

```text
레베카 == 레베카
비틀쥬스비틀쥬스 == 비틀쥬스 비틀쥬스
스파이더맨 노웨이홈 ~= 스파이더맨: 노 웨이 홈
```

### Phase 5. Quiz UI

Goals:

- Card UI
- Answer input
- Submit button
- Answer reveal
- Next button

Completion criteria:

- A 10-question game can be completed end to end.

### Phase 6. Card Flip and Result Screen

Goals:

- Card flip animation
- Poster reveal
- Final result screen
- Incorrect-answer list

Completion criteria:

- Game experience feels complete.

### Phase 7. Data Normalization Script

Goals:

- Convert locally saved Watcha-like API response JSON into `QuizItem[]`.
- Read from `data-raw/`.
- Write to `src/data/users/`.

Constraint:

- The script reads local files only.
- It does not call Watcha API.

### Phase 8. Deployment Preparation

Goals:

- Polish README.
- Deploy to Vercel.
- Review private/public status.

Completion criteria:

- Game runs at deployment URL.
- No automatic external Watcha API calls.

## 14. Test Requirements

Unit test targets:

- `normalizeTitle()`
- `calculateSimilarity()`
- `isCorrectAnswer()`
- `shuffleQuizItems()`
- `normalizeWatchaComments()`

Example cases:

```text
input: " 레베카 "
answer: "레베카"
result: true

input: "비틀쥬스비틀쥬스"
answer: "비틀쥬스 비틀쥬스"
result: true

input: "스파이더맨 노웨이홈"
answer: "스파이더맨: 노 웨이 홈"
result: true or near-correct

input: "오펜하이머"
answer: "레베카"
result: false
```

## 15. UI Direction

Tone:

- Movie-record-app feeling
- Card-based
- More like a viewing note than a loud arcade game

Design keywords:

- Card
- Poster
- Comment
- Minimal
- Mobile-first
- Optional dark cinema-room mood

Home sketch:

```text
Watcha Doing with My Comments

내가 쓴 한줄평만 보고
영화를 맞춰보세요.

[데이터셋 선택]
[문제 수 선택]
[게임 시작]
```

Question sketch:

```text
3 / 10

┌─────────────────────────┐
│                         │
│ "진짜 지옥철이 있었다니" │
│                         │
└─────────────────────────┘

[영화 제목 입력]
[제출]
```

Reveal sketch:

```text
정답!

비틀쥬스 비틀쥬스 (2024)
감독: 팀 버튼
내 평점: 3.0

[다음 문제]
```

Result sketch:

```text
10문제 중 7개 정답
정답률 70%

[틀린 문제 보기]
[다시 하기]
```

## 16. Security and Policy Constraints

Forbidden:

- Automatic collectors that call Watcha API
- Requests using authentication headers or cookies
- Bypassing `not_allowed_client`
- Automatic crawling of `/api` paths disallowed by robots.txt
- Browser-session extraction or reuse
- Collection of other people's private data

Allowed:

- Local JSON normalization
- User-prepared JSON upload or paste
- Starter-data-based game
- Static game based on normalized datasets

## 17. Codex Work Rules

Codex must use this document as the source of truth.

Work method:

- Do not build a large feature all at once.
- Work phase by phase.
- Run lint/test/build after feature work.
- If a command fails, explain the cause and fix it.
- If unclear, update documentation before implementation.

Forbidden for Codex:

- Do not add external API calling features arbitrarily.
- Do not hardcode cookies, auth info, or headers.
- Do not write tests against real Watcha servers.
- Do not add excessive packages.
- Do not add an unrequested backend server.

## 18. Initial Prompt for Coding Agents

```text
You are the software engineer for this repository.

The project name is "Watcha Doing with My Comments".
This is a personal web game where users guess movie titles from Watcha Pedia comment data.

First read docs/SWRS.md and work from those requirements.

Important constraints:
- Do not implement direct Watcha API calls.
- Do not implement crawling, authentication bypass, cookie use, or header spoofing.
- MVP must use local JSON datasets.
- The data normalization script must only read and transform local files.

First target:
- Create a Next.js + TypeScript + Tailwind project structure.
- Follow the folder structure in docs/SWRS.md.
- Create starter QuizItem JSON.
- Let the home screen select question count and start a starter-data quiz.
- Split answer matching into separately testable functions.

After work, these commands should pass:
- lint
- test, if configured
- build

Explain work in small units and summarize changed files.
```

## 19. MVP Completion Criteria

MVP is complete when:

- Code is organized in a private GitHub repository.
- It runs locally after `npm install`.
- A game can start with starter JSON.
- The user can choose question count.
- One-line comments appear as cards.
- The user can type and submit movie titles.
- Correct/incorrect judgment works.
- Answer reveal shows poster and title.
- Final result screen exists.
- The app does not call Watcha API in real time.
- No raw cookies, headers, or tokens are in the repository.

## 20. Final Recommended Direction

This project should be designed as:

```text
Personal browser data check
-> JSON file save
-> local normalization script
-> normalized JSON used as game data
-> Next.js static web app gameplay
```

It is not a "service that uses the Watcha API". It is a personal movie quiz powered by a dataset the user already has.
