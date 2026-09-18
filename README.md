# Skybound

Skybound is a small momentum-based vertical platformer. Use `A` and `D` to steer, `W` or `Space` to jump, and `S` to brake in the air.

## Run in a browser

Open `index.html`, or serve the folder with any static web server.

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