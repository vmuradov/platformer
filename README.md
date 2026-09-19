# Skybound

Skybound is a small momentum-based vertical platformer. Use `A` and `D` to steer, `W` or `Space` to jump, and `S` to brake in the air.

## Run in a browser

Open `index.html`, or serve the folder with any static web server.

## Shared leaderboard

The leaderboard is stored in `leaderboard.json` and served by the included Node server. Run:

```text
npm run web
```

Then open `http://localhost:3000`. Everyone using the same hosted server sees the same top-ten clear times. The server must be deployed somewhere that supports a persistent filesystem, or `leaderboard.json` will reset when the service restarts. GitHub Pages alone cannot save leaderboard submissions because it only serves static files.

## Publish the game on GitHub Pages

The repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

1. Push the project to a GitHub repository on the `main` branch.
2. In the repository, open **Settings > Pages** and set **Source** to **GitHub Actions**.
3. Open the **Actions** tab and wait for **Deploy Skybound to GitHub Pages** to finish.
4. Open the Pages URL shown in the deployment summary.

GitHub Pages will host the game itself. For a shared leaderboard, keep the Node server on a separate host and set `window.SKYBOUND_LEADERBOARD_API` in `index.html` to that server's URL; GitHub Pages cannot execute `server.cjs` or modify `leaderboard.json`.

## Desktop build

Install Node.js, then run:

```text
npm install
npm start
```

Create a Windows installer with:

```text
npm run package
```

The generated installer in `dist/` can be uploaded to Steam as a Windows depot. Steamworks integration, achievements, cloud saves, and platform-specific input can be added to `main.cjs` or the game loop as the production scope grows.