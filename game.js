const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const heightValue = document.getElementById("heightValue");
const bestValue = document.getElementById("bestValue");
const centerMessage = document.getElementById("centerMessage");
const centerTitle = centerMessage.querySelector("h1");
const centerSubtitle = centerMessage.querySelector("p");
const completeMessage = document.getElementById("completeMessage");
const completeCopy = document.getElementById("completeCopy");

const W = 960;
const H = 600;
const world = { width: 960, height: 5000 };
const keys = {};
let state = "ready";
let cameraY = 0;
let cameraTargetY = 0;
let best = Number(localStorage.getItem("skybound-best") || 0);

const player = { x: 480, y: 522, w: 22, h: 30, vx: 0, vy: 0, grounded: true, coyote: 0, spawnX: 480, spawnY: 522 };
const platforms = [
  { x: 380, y: 552, w: 200, h: 18 }, { x: 160, y: 465, w: 155, h: 16 }, { x: 570, y: 385, w: 170, h: 16 },
  { x: 355, y: 300, w: 135, h: 16 }, { x: 115, y: 218, w: 170, h: 16 }, { x: 450, y: 135, w: 155, h: 16 },
  { x: 700, y: 52, w: 150, h: 16 }, { x: 500, y: -45, w: 120, h: 16 }, { x: 270, y: -140, w: 160, h: 16 },
  { x: 40, y: -235, w: 150, h: 16 }, { x: 300, y: -330, w: 170, h: 16 }, { x: 610, y: -430, w: 185, h: 16 },
  { x: 400, y: -535, w: 150, h: 16 }, { x: 130, y: -645, w: 175, h: 16 }, { x: 430, y: -760, w: 175, h: 16 },
  { x: 720, y: -875, w: 170, h: 16 }, { x: 535, y: -990, w: 135, h: 16 }, { x: 250, y: -1100, w: 180, h: 16 },
  { x: 80, y: -1210, w: 135, h: 16 }, { x: 335, y: -1325, w: 180, h: 16 }, { x: 630, y: -1440, w: 190, h: 16 },
  { x: 460, y: -1560, w: 140, h: 16 }, { x: 205, y: -1680, w: 155, h: 16 }, { x: 500, y: -1800, w: 200, h: 16 }
];
const obstacles = [
  { x: 175, y: 450, w: 54, h: 16, type: "spikes" },
  { x: 386, y: 284, w: 46, h: 16, type: "spikes" },
  { x: 195, y: 202, w: 64, h: 16, type: "spikes" },
  { x: 520, y: 119, w: 46, h: 16, type: "spikes" },
  { x: 735, y: 36, w: 58, h: 16, type: "spikes" },
  { x: 370, y: 335, w: 150, h: 12, type: "barrier" },
  { x: 190, y: -185, w: 150, h: 12, type: "barrier" },
  { x: 470, y: -485, w: 130, h: 12, type: "barrier" },
  // { x: 380, y: -1240, w: 140, h: 12, type: "barrier" }
];

bestValue.textContent = String(best).padStart(4, "0");

function reset() {
  player.x = player.spawnX; player.y = player.spawnY; player.vx = 0; player.vy = 0; player.grounded = true;
  cameraY = 0; cameraTargetY = 0; state = "playing"; centerMessage.classList.add("hidden"); completeMessage.classList.add("hidden");
  centerTitle.textContent = "Keep going up.";
  centerSubtitle.textContent = "Every landing is a new beginning.";
}

function failRun() {
  state = "dead";
  player.x = player.spawnX; player.y = player.spawnY; player.vx = 0; player.vy = 0; player.grounded = true;
  centerTitle.textContent = "The climb stops here.";
  centerSubtitle.textContent = "Press R to reset your run, or try again below.";
  centerMessage.classList.remove("hidden");
}

function jump() {
  if (state === "ready" || state === "dead" || state === "complete") { reset(); return; }
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
  if (!player.grounded) player.coyote = Math.max(0, player.coyote - 1 / 60);
  cameraTargetY = Math.min(0, Math.max(-world.height + H, player.y - H * 0.42));
  cameraY += (cameraTargetY - cameraY) * 0.12;
  const altitude = Math.max(0, Math.floor((510 - player.y) / 10));
  heightValue.textContent = String(altitude).padStart(4, "0");
  if (altitude > best) { best = altitude; bestValue.textContent = String(best).padStart(4, "0"); localStorage.setItem("skybound-best", best); }
  if (player.y > cameraY + H + 90) failRun();
  if (player.y < -1870) { state = "complete"; completeMessage.classList.remove("hidden"); completeCopy.textContent = `You climbed ${String(altitude).padStart(4, "0")} metres above the ordinary.`; }
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

function loop() { update(); draw(); requestAnimationFrame(loop); }

window.addEventListener("keydown", (event) => {
  keys[event.key] = true;
  if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) event.preventDefault();
  if (event.key.toLowerCase() === "r" && !event.repeat) { event.preventDefault(); reset(); return; }
  if ((event.key === " " || event.key === "w" || event.key === "W" || event.key === "ArrowUp") && !event.repeat) jump();
  if (event.key === "Escape") { state = state === "playing" ? "paused" : state === "paused" ? "playing" : state; }
});
window.addEventListener("keyup", (event) => { keys[event.key] = false; });
document.getElementById("startButton").addEventListener("click", reset);
document.getElementById("againButton").addEventListener("click", reset);
document.getElementById("resetButton").addEventListener("click", reset);
loop();