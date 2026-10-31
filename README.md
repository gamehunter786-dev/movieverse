# CineVerse

A responsive movie-discovery website made with plain HTML, CSS and JavaScript, ready for GitHub Pages.

## Files
- `index.html` — page structure
- `style.css` — responsive visual design and animations
- `script.js` — movie catalogue, search, category filters, surprise pick, watchlist and prototype sign-in
- `README.md` — setup notes

## Run locally
Open `index.html` in a browser. For best results use VS Code with Live Server.

## Publish on GitHub Pages
1. Create a GitHub repository.
2. Upload `index.html`, `style.css`, and `script.js` to the repository root.
3. In **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/(root)`, then save.

## Important security and database note
This starter includes a **local-only prototype** for signup/login and watchlists using `localStorage`. It is not real secure authentication or a cloud database: user records are stored in the browser, are not shared between devices, and must not be used with real/reused passwords. To make accounts and watchlists real across devices, connect Firebase Authentication and Firestore, set secure Firestore rules, and replace the local auth/watchlist code with Firebase SDK calls. Never put service-account secrets in frontend files.

The catalogue and movie poster images are sample discovery data loaded from TMDB image URLs. This starter does not stream or host movies and does not include copyrighted film playback. If images fail to load, the styled fallback remains visible.
