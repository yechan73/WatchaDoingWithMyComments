# Dataset Guide

This project uses local JSON datasets. It should not crawl Watcha, bypass browser
restrictions, reuse cookies, copy authorization headers, or call Watcha APIs from
the app.

The safe import flow is:

```text
Open /import in this app
-> copy the Watcha helper
-> open your own Watcha Pedia page in a logged-in browser
-> run the helper on Watcha Pedia
-> upload the downloaded JSON in /import
-> play immediately, or register the JSON as a local dataset
```

## Import Page Method

Open `/import` in this app.

1. Copy the bookmarklet or console script.
2. Open your own Watcha Pedia comments page while logged in.
3. Run the helper in that Watcha Pedia page.
4. The helper downloads `{userId}-watcha-comments.json`.
5. Upload that JSON in `/import` to start a game immediately.

The helper runs inside your browser on `pedia.watcha.com`. It does not send your
data back to this app or to another server. It only creates a local JSON download
that you can review.

## Manual Browser Method

Use this only for your own data, or data from someone who explicitly agreed to
share it with you.

1. Open Watcha Pedia in your browser and sign in normally if needed.
2. Go to the page where your movie comments are visible.
3. Open browser developer tools.
4. Open the Network tab.
5. Refresh the page or scroll enough for the comments you want to appear.
6. Look for a JSON response that contains comment objects with fields such as
   `text`, `content.title`, `content.year`, `content.poster`,
   `content.director_names`, and `user_content_action.rating`.
7. Copy only the response body JSON. The file should start with `{` or `[`, not
   with HTML tags such as `<ul>`, `<li>`, or `<html>`.
8. Save it as a local file such as:

```text
data-raw/my-comments.json
```

Do not save request headers, cookies, session tokens, HAR files, or any browser
authentication data into the repository.

Do not copy from the Elements panel when you can get JSON from Network.
Rendered page markup is HTML, and JSON is the preferred input.

If you already have a local rendered HTML snippet, the script can parse it only
when explicitly requested:

```bash
npm run import:watcha -- --source VRZv4O9DPqr6y --input data-raw/my-comments.html
```

HTML parsing is a fallback for local files only. It does not call Watcha and it
does not preserve query strings from image URLs.

## Import The File

The helper output can be registered as a local dataset:

```bash
npm run import:watcha -- --source VRZv4O9DPqr6y --input data-raw/VRZv4O9DPqr6y-watcha-comments.json --input-format json
```

For your Watcha Pedia comments URL:

```bash
npm run import:watcha -- --source https://pedia.watcha.com/ko/users/VRZv4O9DPqr6y/comments --input data-raw/my-comments.html
```

For a user id:

```bash
npm run import:watcha -- --source VRZv4O9DPqr6y --input data-raw/my-comments.html
```

For a local Watcha-like JSON response:

```bash
npm run import:watcha -- --source VRZv4O9DPqr6y --input data-raw/my-comments.json --input-format json
```

Optional flags:

```bash
--output src/data/users/my-comments.json
--label "My Watcha comments"
--include-spoilers
--min-comment-length 10
--no-manifest
```

The import script writes a normalized `QuizItem[]` JSON file under
`src/data/users/` by default and updates `src/data/manifest.json` with a useful
label, description, item count, and path.

The underlying normalizer supports:

- A single Watcha-like response object.
- An array of page response objects.
- An array already cut down to raw comment objects.

## Use The Dataset In The App

After importing, restart the dev server or rebuild the app. The home screen
reads local dataset files and shows them in the dataset dropdown.

If you want a nicer label or description, add an entry to
`src/data/manifest.json`:

```json
{
  "id": "my-comments",
  "label": "My comments",
  "description": "My local Watcha comment dataset",
  "path": "src/data/users/my-comments.json"
}
```

## Hard Rules

- Do not automate requests to Watcha API endpoints.
- Do not copy cookies, authorization headers, or full HAR files.
- Do not use other people's private data.
- Do not commit raw files from `data-raw/`.
- Review normalized datasets before sharing or deploying publicly.
