const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let score = 0;
let attempts = 0;

let aim = "center";

// BALL
let ball = {
  x: 350,
  y: 400,
  radius: 8,
  vx: 0,
  vy: 0,
  moving: false
};

// GOALKEEPER (human style)
let keeper = {
  x: 350,
  y: 120,
  direction: "center"
};

const goal = {
  x: 200,
  y: 80,
  width: 300,
  height: 120
};

// AIM CONTROL
function setAim(direction) {
  aim = direction;
}

// SHOOT BALL
function shoot() {
  if (ball.moving) return;

  attempts++;
  updateUI();

  let power = 7;

  if (aim === "left") ball.vx = -2;
  else if (aim === "right") ball.vx = 2;
  else ball.vx = 0;

  ball.vy = -power;
  ball.moving = true;

  keeperAI();
}

// GOALKEEPER AI
function keeperAI() {
  let options = ["left", "center", "right"];
  keeper.direction = options[Math.floor(Math.random() * options.length)];

  if (keeper.direction === "left") keeper.x = 260;
  else if (keeper.direction === "center") keeper.x = 350;
  else keeper.x = 440;
}

// GAME LOOP
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawField();
  drawGoal();
  drawKeeper();
  drawBall();

  if (ball.moving) {
    ball.x += ball.vx;
    ball.y += ball.vy;

    checkGoal();
  }

  requestAnimationFrame(update);
}

// FIELD
function drawField() {
  ctx.fillStyle = "#1f7a1f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// GOAL (REALISTIC + CENTERED)
function drawGoal() {
  const { x, y, width, height } = goal;

  ctx.strokeStyle = "white";
  ctx.lineWidth = 4;

  // posts
  ctx.strokeRect(x, y, width, height);

  // net lines
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.3)";

  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * (width / 10), y);
    ctx.lineTo(x + i * (width / 10), y + height);
    ctx.stroke();
  }

  for (let j = 0; j < 6; j++) {
    ctx.beginPath();
    ctx.moveTo(x, y + j * (height / 6));
    ctx.lineTo(x + width, y + j * (height / 6));
    ctx.stroke();
  }
}

// GOALKEEPER (HUMAN FIGURE)
function drawKeeper() {
  const x = keeper.x;
  const y = keeper.y;

  // body
  ctx.fillStyle = "#1565c0";
  ctx.fillRect(x - 15, y, 30, 50);

  // head
  ctx.beginPath();
  ctx.fillStyle = "#ffcc99";
  ctx.arc(x, y - 10, 10, 0, Math.PI * 2);
  ctx.fill();

  // arms
  ctx.strokeStyle = "#ffcc99";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(x - 15, y + 10);
  ctx.lineTo(x - 35, y + 30);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 15, y + 10);
  ctx.lineTo(x + 35, y + 30);
  ctx.stroke();

  // legs
  ctx.beginPath();
  ctx.moveTo(x - 10, y + 50);
  ctx.lineTo(x - 15, y + 80);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 10, y + 50);
  ctx.lineTo(x + 15, y + 80);
  ctx.stroke();
}

// BALL
function drawBall() {
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

// CHECK GOAL
function checkGoal() {
  let inGoal =
    ball.x > goal.x &&
    ball.x < goal.x + goal.width &&
    ball.y < goal.y + goal.height;

  let saved = Math.abs(ball.x - keeper.x) < 40;

  if (ball.y <= goal.y + goal.height) {
    if (inGoal && !saved) {
      score++;
      alert("GOAL ⚽🔥");
    } else {
      alert("SAVE ❌");
    }

    resetBall();
    updateUI();
  }
}

// RESET
function resetBall() {
  ball.x = 350;
  ball.y = 400;
  ball.vx = 0;
  ball.vy = 0;
  ball.moving = false;
}

// UI
function updateUI() {
  document.getElementById("score").innerText = score;
  document.getElementById("attempts").innerText = attempts;
}

// START
update();