const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const port = Number(process.env.PORT || 3000);
const root = __dirname;
const leaderboardPath = path.join(root, "leaderboard.json");
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function readLeaderboard() {
  try {
    const entries = JSON.parse(fs.readFileSync(leaderboardPath, "utf8"));
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

function writeLeaderboard(entries) {
  fs.writeFileSync(leaderboardPath, `${JSON.stringify(entries, null, 2)}\n`);
}

function getTopClears(entries) {
  return entries
    .filter((entry) => entry.result !== "failed")
    .sort((first, second) => first.time - second.time)
    .slice(0, 10);
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  response.end(JSON.stringify(data));
}

function serveFile(request, response) {
  const requestedPath = request.url === "/" ? "/index.html" : request.url.split("?")[0];
  const filePath = path.resolve(root, `.${requestedPath}`);
  const relativePath = path.relative(root, filePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  response.writeHead(200, { "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
  if (request.url === "/api/leaderboard" && request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    });
    response.end();
    return;
  }

  if (request.url === "/api/leaderboard" && request.method === "GET") {
    sendJson(response, 200, getTopClears(readLeaderboard()));
    return;
  }

  if (request.url === "/api/leaderboard" && request.method === "POST") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; if (body.length > 2048) request.destroy(); });
    request.on("end", () => {
      try {
        const submission = JSON.parse(body);
        const name = String(submission.name || "YOU").trim().toUpperCase().slice(0, 12) || "YOU";
        const time = Math.round(Number(submission.time));
        const result = submission.result === "failed" ? "failed" : "clear";
        if (!Number.isFinite(time) || time < 1 || time > 60 * 60 * 1000) {
          sendJson(response, 400, { error: "Invalid clear time" });
          return;
        }
        const entries = [...readLeaderboard(), { name, time, result, createdAt: new Date().toISOString() }].slice(-1000);
        writeLeaderboard(entries);
        sendJson(response, 201, getTopClears(entries));
      } catch {
        sendJson(response, 400, { error: "Invalid JSON" });
      }
    });
    return;
  }

  serveFile(request, response);
});

server.listen(port, () => {
  console.log(`Skybound is running at http://localhost:${port}`);
});
