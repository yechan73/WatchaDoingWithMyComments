# Data Policy

This project uses local/static JSON datasets. It must not implement real-time Watcha API crawling or authentication bypass.

## Allowed Data

- Fake sample data created for tests or demos
- The user's own comment data
- Data from friends who explicitly consented to sharing
- Normalized quiz data without cookies, headers, tokens, or private profile information

## Disallowed Data

- Cookies
- Session tokens
- Authorization headers
- Raw request headers containing personal information
- HAR files committed to Git
- Data gathered from private profiles
- Bulk comment data collected from other people without consent

## Raw Data Handling

- Store raw local JSON only under `data-raw/`.
- Do not commit raw JSON by default.
- Do not commit `.har`, `.cookie`, `.env`, or `.env.local` files.
- Normalization scripts may read local files only.
- Normalization scripts must not call Watcha API or external crawling targets.

## Runtime Rule

During MVP gameplay, the app must use bundled normalized JSON data. It must not send live requests to Watcha `/api` endpoints.

Poster CDN URLs are allowed for MVP display, but placeholders or a future proxy/cache strategy should be considered before broader sharing.
