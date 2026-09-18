const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const fs = require("fs");

let window;

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
  
  // Hot reload on file changes
  fs.watch(__dirname, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith(".js") || filename.endsWith(".css") || filename.endsWith(".html"))) {
      window?.reload();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });