if (window.skyboundHotReload) window.skyboundHotReload();
var hotReloadState = window.skyboundState;
var hotReloadController = new AbortController();
var animationFrameId;

var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");
var heightValue = document.getElementById("heightValue");
var bestValue = document.getElementById("bestValue");
var timerValue = document.getElementById("timerValue");
var centerMessage = document.getElementById("centerMessage");
var centerTitle = centerMessage.querySelector("h1");
var centerSubtitle = centerMessage.querySelector("p");
var completeMessage = document.getElementById("completeMessage");
var completeCopy = document.getElementById("completeCopy");
var startNameInput = document.getElementById("startName");
var leaderboardElement = document.getElementById("leaderboard");

var W = 960;
var H = 600;
var world = { width: 960, height: 5000 };
var keys = {};
var state = "ready";
var cameraY = 0;
var cameraTargetY = 0;
var best = Number(localStorage.getItem("skybound-best") || 0);
var runStartedAt = 0;
var clearRecorded = false;
var attempts = JSON.parse(localStorage.getItem("skybound-attempts") || localStorage.getItem("skybound-leaderboard") || "[]");
var pendingAttempts = JSON.parse(localStorage.getItem("skybound-pending-attempts") || "[]");
pendingAttempts = pendingAttempts.map((attempt) => ({ ...attempt, created_at: attempt.created_at || new Date().toISOString() }));
localStorage.setItem("skybound-pending-attempts", JSON.stringify(pendingAttempts));
var submissionInProgress = false;
var submissionRetryTimer = 0;
var leaderboard = attempts.filter((entry) => entry.result === "clear");
var leaderboardApiUrl = (window.SKYBOUND_LEADERBOARD_API || "").replace(/\/$/, "");
var supabaseUrl = (window.SKYBOUND_SUPABASE_URL || "").replace(/\/$/, "");
var supabaseAnonKey = window.SKYBOUND_SUPABASE_ANON_KEY || "";
var supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);
var supabaseEndpoint = `${supabaseUrl}/rest/v1/leaderboard`;
var localServer = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
var sharedLeaderboard = supabaseEnabled || Boolean(leaderboardApiUrl) || localServer;
var leaderboardEndpoint = `${leaderboardApiUrl}/api/leaderboard`;
if (localServer && !leaderboardApiUrl) leaderboardEndpoint = "/api/leaderboard";
var savedPlayerName = localStorage.getItem("skybound-player-name") || "";
var physicsHz = 75;

var player = { x: 480, y: 522, w: 22, h: 30, vx: 0, vy: 0, grounded: true, coyote: 0, spawnX: 480, spawnY: 522 };
var platforms = [
  { x: 380, y: 552, w: 200, h: 18 }, { x: 160, y: 465, w: 155, h: 16 }, { x: 570, y: 385, w: 170, h: 16 },
  { x: 355, y: 300, w: 135, h: 16 }, { x: 115, y: 218, w: 170, h: 16 }, { x: 450, y: 135, w: 155, h: 16 },
  { x: 700, y: 52, w: 150, h: 16 }, { x: 500, y: -45, w: 120, h: 16 }, { x: 270, y: -140, w: 160, h: 16 },

  
  { x: 40, y: -235, w: 150, h: 16 }, { x: 300, y: -330, w: 170, h: 16 }, { x: 610, y: -430, w: 185, h: 16 },
  { x: 400, y: -535, w: 150, h: 16 }, { x: 130, y: -645, w: 175, h: 16 }, { x: 430, y: -760, w: 175, h: 16 },
  { x: 720, y: -875, w: 170, h: 16 }, { x: 535, y: -990, w: 135, h: 16 }, { x: 250, y: -1100, w: 180, h: 16 },
  { x: 80, y: -1210, w: 135, h: 16 }, { x: 335, y: -1325, w: 180, h: 16 }, { x: 630, y: -1440, w: 190, h: 16 },
  { x: 460, y: -1560, w: 140, h: 16 }, { x: 205, y: -1680, w: 155, h: 16 }, { x: 500, y: -1800, w: 200, h: 16 }
];
var barrierX = 380;
var barrierY = -1240;
var barrierWidth = 140;
var barrierHeight = 120;
var barrierGapWidth = 50;
var barrierSectionWidth = (barrierWidth - barrierGapWidth) / 2;

var obstacles = [
  { x: 175, y: 450, w: 54, h: 16, type: "spikes" },
  { x: 520, y: 119, w: 46, h: 16, type: "spikes" },
  { x: 735, y: 36, w: 58, h: 16, type: "spikes" },
  { x: 720, y: -890, w: 35, h: 16, type: "spikes" },
  { x: 850, y: -890, w: 35, h: 16, type: "spikes" },
  { x: 325, y: -1115, w: 35, h: 16, type: "spikes" },

  { x: 420, y: -785, w: 25, h: 75, type: "barrier" },
  { x: 725, y: -1480, w: 20, h: 20, type: "barrier" },
  { x: 460, y: -1700, w: 20, h: 20, type: "barrier" },
  { x: 350, y: -1775, w: 20, h: 20, type: "barrier" },
];

if (hotReloadState) {
  Object.assign(player, hotReloadState.player);
  state = hotReloadState.state;
  cameraY = hotReloadState.cameraY;
  cameraTargetY = hotReloadState.cameraTargetY;
  best = hotReloadState.best;
  runStartedAt = hotReloadState.runStartedAt;
  clearRecorded = hotReloadState.clearRecorded;
}

window.skyboundHotReload = function () {
  window.skyboundState = {
    player: { ...player }, state, cameraY, cameraTargetY, best
    , runStartedAt, clearRecorded
  };
  hotReloadController.abort();
  cancelAnimationFrame(animationFrameId);
};

bestValue.textContent = String(best).padStart(4, "0");
startNameInput.value = savedPlayerName;

function renderLeaderboard() {
  leaderboardElement.replaceChildren();
  leaderboard.filter((entry) => entry.result === "clear").slice(0, 10).forEach((entry, index) => {
    var row = document.createElement("li");
    row.innerHTML = `<span class="leaderboard-rank">${String(index + 1).padStart(2, "0")}</span><span class="leaderboard-name"></span><strong>${formatTime(entry.time)}</strong>`;
    row.querySelector(".leaderboard-name").textContent = entry.name;
    leaderboardElement.appendChild(row);
  });
  if (!leaderboard.length) {
    var emptyRow = document.createElement("li");
    emptyRow.className = "leaderboard-empty";
    emptyRow.textContent = "No cleared runs yet";
    leaderboardElement.appendChild(emptyRow);
  }
}

async function loadLeaderboard() {
  try {
    var requestUrl = supabaseEnabled
      ? `${supabaseEndpoint}?select=name,time,result&result=eq.clear&order=time.asc&limit=10`
      : sharedLeaderboard ? leaderboardEndpoint : "leaderboard.json";
    var requestOptions = supabaseEnabled
      ? { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }, cache: "no-store" }
      : { cache: "no-store" };
    var response = await fetch(requestUrl, requestOptions);
    if (!response.ok) return;
    var remoteEntries = await response.json();
    var normalizedRemoteEntries = remoteEntries
      .filter((entry) => entry.result === "clear")
      .sort((first, second) => first.time - second.time)
      .slice(0, 10);
    leaderboard = sharedLeaderboard
      ? normalizedRemoteEntries
      : [...leaderboard, ...normalizedRemoteEntries].sort((first, second) => first.time - second.time).slice(0, 10);
    renderLeaderboard();
  } catch {
    // GitHub Pages may not expose the optional seed file in local file mode.
  }
}

function formatTime(milliseconds) {
  var seconds = milliseconds / 1000;
  return `${seconds.toFixed(2)}s`;
}

function normalizePlayerName() {
  return startNameInput.value.trim().toUpperCase().slice(0, 12);
}

function beginRun() {
  var name = normalizePlayerName();
  if (!name) {
    centerSubtitle.textContent = "Enter your name before the climb.";
    startNameInput.focus();
    return;
  }
  startNameInput.value = name;
  localStorage.setItem("skybound-player-name", name);
  reset();
}

async function flushPendingAttempts() {
  if (!sharedLeaderboard || submissionInProgress || !pendingAttempts.length) return;
  submissionInProgress = true;
  try {
    while (pendingAttempts.length) {
      var attempt = pendingAttempts[0];
      var requestUrl = supabaseEnabled ? supabaseEndpoint : leaderboardEndpoint;
      var requestOptions = {
        method: "POST",
        headers: supabaseEnabled
          ? { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}`, "Content-Type": "application/json", Prefer: "return=representation" }
          : { "Content-Type": "application/json" },
        body: JSON.stringify(attempt)
      };
      var response = await fetch(requestUrl, requestOptions);
      var responseText = await response.text();
      var responseData = responseText ? JSON.parse(responseText) : null;
      if (!response.ok) {
        var serverMessage = responseData && (responseData.message || responseData.hint || responseData.details || responseData.error);
        var submissionError = new Error(`Leaderboard submission failed (${response.status}): ${serverMessage || responseText || "No response body"}`);
        submissionError.permanent = response.status >= 400 && response.status < 500;
        throw submissionError;
      }
      var entries = responseData;
      pendingAttempts.shift();
      localStorage.setItem("skybound-pending-attempts", JSON.stringify(pendingAttempts));
      if (supabaseEnabled) {
        loadLeaderboard();
      } else {
        leaderboard = entries.filter((entry) => entry.result === "clear");
        renderLeaderboard();
      }
    }
  } catch (error) {
    if (error.permanent) {
      console.error("Leaderboard submission was rejected by the server:", error);
    } else {
      console.warn("Leaderboard submission will be retried:", error);
      clearTimeout(submissionRetryTimer);
      submissionRetryTimer = setTimeout(flushPendingAttempts, 15000);
    }
  } finally {
    submissionInProgress = false;
  }
}

function recordAttempt(result) {
  if (clearRecorded || !runStartedAt) return;
  clearRecorded = true;
  var name = normalizePlayerName() || "YOU";
  var attempt = { name, time: Math.round(performance.now() - runStartedAt), result, created_at: new Date().toISOString() };
  attempts.push(attempt);
  localStorage.setItem("skybound-attempts", JSON.stringify(attempts));
  pendingAttempts.push(attempt);
  localStorage.setItem("skybound-pending-attempts", JSON.stringify(pendingAttempts));
  if (result === "clear") {
    leaderboard.push(attempt);
    leaderboard.sort((first, second) => first.time - second.time);
    leaderboard = leaderboard.slice(0, 10);
  }
  renderLeaderboard();
  flushPendingAttempts();
}

renderLeaderboard();
loadLeaderboard();
flushPendingAttempts();
window.addEventListener("online", flushPendingAttempts, { signal: hotReloadController.signal });
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") flushPendingAttempts();
}, { signal: hotReloadController.signal });

function reset() {
  player.spawnX = safeCheckpointX(platforms[0]);
  player.spawnY = platforms[0].y - player.h;
  player.x = player.spawnX; player.y = player.spawnY; player.vx = 0; player.vy = 0; player.grounded = true;
  cameraY = 0; cameraTargetY = 0; state = "playing"; centerMessage.classList.add("hidden"); completeMessage.classList.add("hidden");
  runStartedAt = performance.now();
  timerValue.textContent = "00.00s";
  clearRecorded = false;
  centerTitle.textContent = "Keep going up.";
  centerSubtitle.textContent = "Every landing is a new beginning.";
}

function failRun() {
  recordAttempt("failed");
  player.spawnX = safeCheckpointX(platforms[0]);
  player.spawnY = platforms[0].y - player.h;
  heightValue.textContent = "0000";
  state = "dead";
  player.x = player.spawnX; player.y = player.spawnY; player.vx = 0; player.vy = 0; player.grounded = true;
  centerTitle.textContent = "The climb stops here.";
  centerSubtitle.textContent = "Press R to reset your run, or try again below.";
  centerMessage.classList.remove("hidden");
}

function jump() {
  if (state === "ready" || state === "dead" || state === "complete") { beginRun(); return; }
  if (player.grounded || player.coyote > 0) { player.vy = -13.5; player.grounded = false; player.coyote = 0; }
}

function overlapsObstacle(x, y, obstacle) {
  return x + player.w > obstacle.x && x < obstacle.x + obstacle.w && y + player.h > obstacle.y && y < obstacle.y + obstacle.h;
}

function safeCheckpointX(platform) {
  const candidates = [
    platform.x + platform.w / 2 - player.w / 2,
    platform.x + 10,
    platform.x + platform.w - player.w - 10
  ];
  return candidates.find((x) => !obstacles.some((obstacle) => overlapsObstacle(x, platform.y - player.h, obstacle))) ?? platform.x + 10;
}

function update() {
  if (state !== "playing") return;
  const left = keys.a || keys.ArrowLeft;
  const right = keys.d || keys.ArrowRight;
  const brake = keys.s || keys.ArrowDown;
  if (left) player.vx -= 0.55;
  if (right) player.vx += 0.55;
  player.vx *= brake ? 0.82 : 0.93;
  player.vx = Math.max(-7, Math.min(7, player.vx));
  player.vy += 0.54;
  player.vy = Math.min(player.vy, 16);
  const oldBottom = player.y + player.h;
  player.x += player.vx;
  player.y += player.vy;
  player.x = Math.max(8, Math.min(world.width - player.w - 8, player.x));
  player.grounded = false;
  for (const platform of platforms) {
    if (player.vy >= 0 && oldBottom <= platform.y && player.y + player.h >= platform.y && player.x + player.w > platform.x && player.x < platform.x + platform.w) {
      player.y = platform.y - player.h; player.vy = 0; player.grounded = true; player.coyote = 0;
      player.spawnX = safeCheckpointX(platform); player.spawnY = player.y;
      break;
    }
  }
  for (const obstacle of obstacles) {
    if (player.x + player.w > obstacle.x && player.x < obstacle.x + obstacle.w && player.y + player.h > obstacle.y && player.y < obstacle.y + obstacle.h) {
      failRun();
      return;
    }
  }
  if (!player.grounded) player.coyote = Math.max(0, player.coyote - 1 / physicsHz);
  cameraTargetY = Math.min(0, Math.max(-world.height + H, player.y - H * 0.42));
  cameraY += (cameraTargetY - cameraY) * 0.12;
  const altitude = Math.max(0, Math.floor((510 - player.y) / 10));
  heightValue.textContent = String(altitude).padStart(4, "0");
  timerValue.textContent = formatTime(performance.now() - runStartedAt);
  if (altitude > best) { best = altitude; bestValue.textContent = String(best).padStart(4, "0"); localStorage.setItem("skybound-best", best); }
  if (player.y > cameraY + H + 90) failRun();
  if (player.y < -1870) {
    recordAttempt("clear");
    state = "complete";
    completeMessage.classList.remove("hidden");
    completeCopy.textContent = `You cleared the climb in ${formatTime(performance.now() - runStartedAt)}.`;
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#dbe7df"); sky.addColorStop(.6, "#aec7bd"); sky.addColorStop(1, "#8eaca4");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = .18; ctx.strokeStyle = "#f5f5e7"; ctx.lineWidth = 1;
  for (let x = -H; x < W + H; x += 70) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - H, H); ctx.stroke(); }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 8; i++) {
    const x = (i * 147 + 30) % W; const y = ((i * 83 - cameraY * .12) % 720 + 720) % 720 - 60;
    ctx.fillStyle = "rgba(240, 246, 238, .42)"; ctx.beginPath(); ctx.arc(x, y, 2 + i % 3, 0, Math.PI * 2); ctx.fill();
  }
}

function draw() {
  drawBackground();
  ctx.save(); ctx.translate(0, -cameraY);
  for (const platform of platforms) {
    if (platform.y - cameraY > H + 30 || platform.y - cameraY < -30) continue;
    ctx.fillStyle = "rgba(24,34,37,.13)"; ctx.fillRect(platform.x + 7, platform.y + 8, platform.w, platform.h);
    ctx.fillStyle = "#213538"; ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.fillStyle = "#f06d3c"; ctx.fillRect(platform.x, platform.y, platform.w, 4);
    ctx.fillStyle = "rgba(230,238,232,.18)"; ctx.fillRect(platform.x + 12, platform.y + 8, Math.max(12, platform.w - 38), 2);
  }
  for (const obstacle of obstacles) {
    if (obstacle.y - cameraY > H + 30 || obstacle.y - cameraY < -30) continue;
    if (obstacle.type === "spikes") {
      ctx.fillStyle = "rgba(24,34,37,.2)"; ctx.fillRect(obstacle.x + 5, obstacle.y + 8, obstacle.w, 5);
      ctx.fillStyle = "#f4c34f";
      const spikeWidth = 13;
      for (let x = obstacle.x; x < obstacle.x + obstacle.w; x += spikeWidth) {
        ctx.beginPath(); ctx.moveTo(x, obstacle.y + obstacle.h); ctx.lineTo(x + spikeWidth / 2, obstacle.y); ctx.lineTo(x + spikeWidth, obstacle.y + obstacle.h); ctx.closePath(); ctx.fill();
      }
    } else {
      ctx.fillStyle = "rgba(240,109,60,.18)"; ctx.fillRect(obstacle.x - 8, obstacle.y - 5, obstacle.w + 16, obstacle.h + 10);
      ctx.fillStyle = "#f06d3c"; ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
      ctx.fillStyle = "#f4c34f"; ctx.fillRect(obstacle.x + 7, obstacle.y + 4, obstacle.w - 14, 3);
    }
  }
  ctx.save(); ctx.translate(player.x + player.w / 2, player.y + player.h / 2); ctx.rotate(player.vx * .035);
  ctx.fillStyle = "rgba(24,34,37,.14)"; ctx.fillRect(-8, 14, 24, 6);
  ctx.fillStyle = "#f06d3c"; ctx.fillRect(-11, -15, 22, 29);
  ctx.fillStyle = "#e6eee8"; ctx.fillRect(-7, -10, 14, 8);
  ctx.fillStyle = "#182225"; ctx.fillRect(-4 + (player.vx > 0 ? 2 : 0), -8, 3, 3); ctx.fillRect(4 + (player.vx > 0 ? 2 : 0), -8, 3, 3);
  ctx.fillStyle = "#182225"; ctx.fillRect(-10, 14, 7, 5); ctx.fillRect(4, 14, 7, 5); ctx.restore();
  ctx.restore();
}

var fixedStepMs = 1000 / physicsHz;
var lastFrameTime = performance.now();
var physicsAccumulator = 0;
function loop(frameTime) {
  const elapsed = Math.min(250, Math.max(0, frameTime - lastFrameTime));
  lastFrameTime = frameTime;
  physicsAccumulator += elapsed;
  while (physicsAccumulator >= fixedStepMs) {
    update();
    physicsAccumulator -= fixedStepMs;
  }
  draw();
  animationFrameId = requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  keys[event.key] = true;
  if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) event.preventDefault();
  if (event.key.toLowerCase() === "r" && !event.repeat) { event.preventDefault(); beginRun(); return; }
  if ((event.key === " " || event.key === "w" || event.key === "W" || event.key === "ArrowUp") && !event.repeat) jump();
  if (event.key === "Escape") { state = state === "playing" ? "paused" : state === "paused" ? "playing" : state; }
}, { signal: hotReloadController.signal });
window.addEventListener("keyup", (event) => { keys[event.key] = false; }, { signal: hotReloadController.signal });
document.getElementById("startButton").addEventListener("click", beginRun, { signal: hotReloadController.signal });
document.getElementById("againButton").addEventListener("click", beginRun, { signal: hotReloadController.signal });
document.getElementById("resetButton").addEventListener("click", beginRun, { signal: hotReloadController.signal });
startNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") beginRun();
}, { signal: hotReloadController.signal });
startNameInput.addEventListener("input", () => {
  startNameInput.value = startNameInput.value.toUpperCase().slice(0, 12);
}, { signal: hotReloadController.signal });
animationFrameId = requestAnimationFrame(loop);