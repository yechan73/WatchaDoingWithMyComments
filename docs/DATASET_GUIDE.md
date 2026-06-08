# Dataset Guide

This project uses local JSON datasets. It should not crawl Watcha, bypass browser
restrictions, reuse cookies, copy authorization headers, or call Watcha APIs from
the app.

The safe MVP flow is:

```text
Open your own Watcha Pedia page in a normal browser
-> inspect the already loaded comment data
-> save a local JSON file under data-raw/
-> run the local normalization script
-> register or load the normalized dataset in the app
```

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
7. Copy only the response body JSON.
8. Save it as a local file such as:

```text
data-raw/my-comments.json
```

Do not save request headers, cookies, session tokens, HAR files, or any browser
authentication data into the repository.

## Normalize The File

Run:

```bash
npm run normalize:data -- --input data-raw/my-comments.json --output src/data/users/my-comments.json
```

Optional flags:

```bash
--include-spoilers
--min-comment-length 10
```

The script supports:

- A single Watcha-like response object.
- An array of page response objects.
- An array already cut down to raw comment objects.

## Use The Dataset In The App

After writing a JSON file under `src/data/users/`, restart the dev server or
rebuild the app. The home screen reads local dataset files and shows them in the
dataset dropdown.

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
