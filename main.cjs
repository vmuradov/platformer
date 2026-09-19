const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

let window;
let reloadTimer;
const watchedFiles = ["index.html", "styles.css", "game.js"];

function watchSourceFiles() {
  const watchers = watchedFiles.map((fileName) => {
    const filePath = path.join(__dirname, fileName);
    return fs.watch(filePath, () => {
      clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => {
        if (!window || window.isDestroyed()) return;
        if (fileName === "styles.css") {
          window.webContents.executeJavaScript("window.dispatchEvent(new CustomEvent('skybound-style-change'))");
          return;
        }
        if (fileName === "game.js") {
          window.webContents.executeJavaScript("window.dispatchEvent(new CustomEvent('skybound-game-change'))");
          return;
        }
        window.reload();
      }, 100);
    });
  });

  return () => watchers.forEach((watcher) => watcher.close());
}

function createWindow() {
  window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: "#cbd8d1",
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true }
  });
  window.loadFile(path.join(__dirname, "index.html"));
  const stopWatching = watchSourceFiles();
  window.on("closed", () => {
    stopWatching();
    window = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });