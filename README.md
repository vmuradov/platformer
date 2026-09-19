# Skybound

Skybound is a small momentum-based vertical platformer. Use `A` and `D` to steer, `W` or `Space` to jump, and `S` to brake in the air.

## Run in a browser

Open `index.html`, or serve the folder with any static web server.

## Shared leaderboard

The hosted game uses Supabase to save and load the shared leaderboard. The public Supabase URL and publishable key are configured in `index.html`; the publishable key is safe to expose in a browser app when the table has appropriate RLS policies.

For local development, the included Node server also supports the leaderboard file. Run:

```text
npm run web
```

Then open `http://localhost:3000`. Local scores are written to `leaderboard.json`; hosted scores are saved in Supabase.

## Publish the game on GitHub Pages

The repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

1. Push the project to a GitHub repository on the `main` branch.
2. In the repository, open **Settings > Pages** and set **Source** to **GitHub Actions**.
3. Open the **Actions** tab and wait for **Deploy Skybound to GitHub Pages** to finish.
4. Open the Pages URL shown in the deployment summary.

GitHub Pages hosts the game itself and cannot execute `server.cjs` or modify `leaderboard.json`. Supabase provides the persistent shared leaderboard for the Pages deployment.

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