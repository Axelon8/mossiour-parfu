const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const overlay = document.querySelector("#overlay");
const statusEl = document.querySelector("#status");
const startButton = document.querySelector("#startButton");
const restartButton = document.querySelector("#restartButton");
const flapButton = document.querySelector("#flapButton");

const state = {
  mode: "ready",
  frames: 0,
  score: 0,
  best: Number(localStorage.getItem("raccoonCatBest") || 0),
  gravity: 0.03,
  lift: -2.3,
  hoverFrames: 10,
  speed: 0.5,
  pipeGap: 188,
  pipes: [],
  clouds: [
    { x: 42, y: 92, s: 1.1 },
    { x: 238, y: 150, s: 0.82 },
    { x: 348, y: 64, s: 0.96 }
  ],
  cat: {
    x: 102,
    y: 280,
    r: 24,
    vy: 0,
    hoverTimer: 0,
    canHover: false,
    tilt: 0
  }
};

bestEl.textContent = state.best;

function reset() {
  state.mode = "ready";
  state.frames = 0;
  state.score = 0;
  state.speed = 0.5;
  state.pipes = [];
  state.cat.y = 280;
  state.cat.vy = 0;
  state.cat.hoverTimer = 0;
  state.cat.canHover = false;
  state.cat.tilt = 0;
  scoreEl.textContent = "0";
  showOverlay("Mossiour Parfu", "Start game");
}

function start() {
  if (state.mode === "playing") return;
  state.mode = "playing";
  overlay.classList.add("hidden");
  if (state.pipes.length === 0) addPipe();
  flap();
}

function gameOver() {
  state.mode = "ended";
  state.best = Math.max(state.best, state.score);
  localStorage.setItem("raccoonCatBest", String(state.best));
  bestEl.textContent = state.best;
  showOverlay("Game over", "Try again");
}

function showOverlay(status, buttonText) {
  statusEl.textContent = status;
  startButton.textContent = buttonText;
  overlay.classList.remove("hidden");
}

function flap() {
  if (state.mode === "ready") {
    start();
    return;
  }
  if (state.mode === "ended") {
    reset();
    start();
    return;
  }
  state.cat.vy = state.lift;
  state.cat.hoverTimer = 0;
  state.cat.canHover = true;
}

function addPipe() {
  const margin = 92;
  const gapY = margin + Math.random() * (canvas.height - margin * 2 - state.pipeGap);
  state.pipes.push({
    x: canvas.width + 24,
    top: gapY,
    bottom: gapY + state.pipeGap,
    width: 68,
    scored: false
  });
}

function update() {
  state.frames += 1;

  for (const cloud of state.clouds) {
    cloud.x -= 0.25 * cloud.s;
    if (cloud.x < -92) cloud.x = canvas.width + 72;
  }

  if (state.mode !== "playing") {
    state.cat.y = 280 + Math.sin(state.frames / 22) * 8;
    state.cat.tilt = Math.sin(state.frames / 26) * 0.12;
    return;
  }

  if (state.cat.canHover && state.cat.vy >= -0.05 && state.cat.hoverTimer < state.hoverFrames) {
    state.cat.hoverTimer += 1;
    state.cat.vy = 0;
  } else {
    if (state.cat.hoverTimer >= state.hoverFrames) state.cat.canHover = false;
    state.cat.vy += state.gravity;
  }
  state.cat.y += state.cat.vy;
  state.cat.tilt = Math.max(-0.58, Math.min(0.82, state.cat.vy / 10));

  const lastPipe = state.pipes[state.pipes.length - 1];
  if (!lastPipe || lastPipe.x < canvas.width - 238) addPipe();

  for (const pipe of state.pipes) {
    pipe.x -= state.speed;
    if (!pipe.scored && pipe.x + pipe.width < state.cat.x - state.cat.r) {
      pipe.scored = true;
      state.score += 1;
      state.speed = 0.5;
      scoreEl.textContent = state.score;
    }
  }

  state.pipes = state.pipes.filter((pipe) => pipe.x > -pipe.width - 12);

  if (state.cat.y - state.cat.r < 0 || state.cat.y + state.cat.r > canvas.height - 58) {
    gameOver();
    return;
  }

  for (const pipe of state.pipes) {
    const inX = state.cat.x + state.cat.r * 0.78 > pipe.x && state.cat.x - state.cat.r * 0.78 < pipe.x + pipe.width;
    const inPipe = state.cat.y - state.cat.r * 0.78 < pipe.top || state.cat.y + state.cat.r * 0.78 > pipe.bottom;
    if (inX && inPipe) {
      gameOver();
      return;
    }
  }
}

function drawCloud(x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.beginPath();
  ctx.arc(0, 18, 20, 0, Math.PI * 2);
  ctx.arc(22, 8, 24, 0, Math.PI * 2);
  ctx.arc(50, 18, 18, 0, Math.PI * 2);
  ctx.rect(-2, 18, 56, 20);
  ctx.fill();
  ctx.restore();
}

function drawPipe(pipe) {
  const roof = 18;
  const body = "#5f6f5f";
  const dark = "#435244";
  const cap = "#a9b168";

  ctx.fillStyle = body;
  ctx.fillRect(pipe.x, 0, pipe.width, pipe.top - roof);
  ctx.fillRect(pipe.x, pipe.bottom + roof, pipe.width, canvas.height - pipe.bottom);

  ctx.fillStyle = dark;
  ctx.fillRect(pipe.x + pipe.width - 13, 0, 13, pipe.top - roof);
  ctx.fillRect(pipe.x + pipe.width - 13, pipe.bottom + roof, 13, canvas.height - pipe.bottom);

  ctx.fillStyle = cap;
  ctx.fillRect(pipe.x - 8, pipe.top - roof, pipe.width + 16, roof);
  ctx.fillRect(pipe.x - 8, pipe.bottom, pipe.width + 16, roof);

  ctx.fillStyle = "#3b473b";
  ctx.fillRect(pipe.x - 8, pipe.top - roof, pipe.width + 16, 4);
  ctx.fillRect(pipe.x - 8, pipe.bottom + roof - 4, pipe.width + 16, 4);
}

function drawCat() {
  const c = state.cat;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.tilt);

  const fur = "#8e8b80";
  const dark = "#252b31";
  const stripe = "#4f5558";
  const light = "#d6d0bf";
  const nose = "#2c2020";

  ctx.lineWidth = 3;
  ctx.strokeStyle = dark;

  ctx.fillStyle = stripe;
  ctx.beginPath();
  ctx.ellipse(-27, 16, 24, 11, 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? light : dark;
    ctx.beginPath();
    ctx.ellipse(-34 + i * 12, 16, 5, 10, 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.arc(0, 0, c.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.moveTo(-18, -15);
  ctx.lineTo(-10, -38);
  ctx.lineTo(0, -17);
  ctx.moveTo(11, -17);
  ctx.lineTo(23, -37);
  ctx.lineTo(25, -12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(0, 8, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(-9, -1, 8, 11, -0.16, 0, Math.PI * 2);
  ctx.ellipse(9, -1, 8, 11, 0.16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f5df65";
  ctx.beginPath();
  ctx.arc(-8, 0, 3.5, 0, Math.PI * 2);
  ctx.arc(8, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = nose;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(-4, 13);
  ctx.lineTo(4, 13);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(37,43,49,0.72)";
  ctx.lineWidth = 1.5;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 7, 15);
    ctx.lineTo(side * 22, 12);
    ctx.moveTo(side * 7, 19);
    ctx.lineTo(side * 22, 21);
    ctx.stroke();
  }

  ctx.fillStyle = "#d8a863";
  ctx.beginPath();
  ctx.ellipse(22, 18, 10, 7, -0.58, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.stroke();

  ctx.restore();
}

function drawGround() {
  ctx.fillStyle = "#7cb46f";
  ctx.fillRect(0, canvas.height - 58, canvas.width, 58);
  ctx.fillStyle = "#416c48";
  ctx.fillRect(0, canvas.height - 58, canvas.width, 5);

  ctx.fillStyle = "rgba(255,255,255,0.22)";
  for (let x = -20 + (state.frames % 28); x < canvas.width; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, canvas.height - 30);
    ctx.lineTo(x + 11, canvas.height - 42);
    ctx.lineTo(x + 22, canvas.height - 30);
    ctx.fill();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#84d1ff");
  sky.addColorStop(0.62, "#d8f5ff");
  sky.addColorStop(1, "#ffe5a3");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,177,61,0.7)";
  ctx.beginPath();
  ctx.arc(348, 84, 34, 0, Math.PI * 2);
  ctx.fill();

  for (const cloud of state.clouds) drawCloud(cloud.x, cloud.y, cloud.s);
  for (const pipe of state.pipes) drawPipe(pipe);
  drawGround();
  drawCat();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

startButton.addEventListener("click", flap);
restartButton.addEventListener("click", () => {
  reset();
  start();
});
flapButton.addEventListener("click", flap);
canvas.addEventListener("pointerdown", flap);
window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    flap();
  }
});

reset();
loop();
