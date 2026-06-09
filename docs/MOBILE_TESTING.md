# Mobile Testing

Use GitHub Pages for phone-accessible testing.

## Test URL

After `main` is pushed and the GitHub Pages workflow finishes, open:

```text
https://yechan73.github.io/WatchaDoingWithMyComments/
```

If this is the first Pages deployment for the repository, check GitHub repository
settings:

```text
Settings -> Pages -> Build and deployment -> Source: GitHub Actions
```

## What Gets Tested

The deploy workflow runs:

```bash
npm test
npm run lint
npm run build
```

For GitHub Pages only, the build uses:

```text
GITHUB_PAGES=true
```

That enables static export and the repository base path
`/WatchaDoingWithMyComments`.

## Mobile QA Checklist

- Home screen loads on mobile data and Wi-Fi.
- Dataset dropdown includes `Sample comments` and `Yechan comments`.
- Dataset help button opens and closes the help dialog.
- A 5-question quiz can start, submit answers, reveal answers, and reach results.
- Long comments and long titles do not overlap controls.
- The app does not ask for login and does not call Watcha API endpoints.

## Notes

The `Yechan comments` dataset was generated from local rendered HTML. Poster URLs
have query strings removed so signed CDN query values are not committed.
