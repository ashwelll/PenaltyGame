// ==========================================================================
// GAME SETUP & CONFIGURATION
// ==========================================================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Score / UI Elements
const scoreEl = document.getElementById("score");
const attemptsEl = document.getElementById("attempts");
const accuracyEl = document.getElementById("accuracy");
const powerFill = document.getElementById("powerFill");
const difficultySelect = document.getElementById("difficultySelect");

// Game Variables
let score = 0;
let attempts = 0;
let currentAim = 'center'; // 'left', 'center', 'right'
let power = 0;
let powerDirection = 1;
let isPowerCharging = false;
let gameState = 'ready'; // 'ready', 'shooting', 'result'
let feedbackMessage = "";
let feedbackColor = "#fff";

// Game Object State Properties
let ball = { x: 350, y: 390, radius: 18, startRadius: 18, targetRadius: 8, angle: 0 };
let keeper = { x: 350, y: 140, width: 45, height: 60, targetX: 350 };
let targetPos = { x: 350, y: 120 };
let particles = [];

// Image generation using Base64 SVG Strings for Instant Assets
const ballPatternImg = new Image();
// Simple high-contrast geometric pattern mimicking panels of a real football
ballPatternImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23fff"/><path d="M20 0 L40 10 L30 35 L10 35 L0 10 Z" fill="none" stroke="%23111" stroke-width="2"/><circle cx="20" cy="20" r="6" fill="%23111"/><path d="M20 6 L20 0 M34 15 L40 10 M30 29 L35 35 M10 29 L5 35 M6 15 L0 10" stroke="%23111" stroke-width="3"/></svg>';

const glovesImg = new Image();
glovesImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="%23ffdd00" stroke="%23000" stroke-width="1"><path d="M12 2a3 3 0 0 0-3 3v5H8V7a2 2 0 0 0-4 0v7a6 6 0 0 0 6 6h4a6 6 0 0 0 6-6V9a3 3 0 0 0-3-3h-1V5a3 3 0 0 0-3-3z"/></svg>';

// Ensure visual updating on setup UI
function updateAimButtons() {
    document.querySelectorAll('.controls button').forEach(btn => btn.classList.remove('active-aim'));
    if (currentAim === 'left') document.querySelector("button[onclick*='left']").classList.add('active-aim');
    if (currentAim === 'center') document.querySelector("button[onclick*='center']").classList.add('active-aim');
    if (currentAim === 'right') document.querySelector("button[onclick*='right']").classList.add('active-aim');
}
updateAimButtons();

// ==========================================================================
// CORE DRAWING FUNCTIONS (REALISTIC VISUALS)
// ==========================================================================

function drawField() {
    // 1. Realistic 3D grass perspective using striped gradients
    let fieldGrad = ctx.createLinearGradient(0, 100, 0, 450);
    fieldGrad.addColorStop(0, '#143817');  // Deep dark green far away
    fieldGrad.addColorStop(0.4, '#1b4d20');
    fieldGrad.addColorStop(1, '#23692c');   // Vibrant lush green close up
    ctx.fillStyle = fieldGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mowed lawn patterns (Horizontal stripes)
    for (let i = 100; i < canvas.height; i += 30) {
        ctx.fillStyle = (Math.floor(i / 30) % 2 === 0) ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)';
        ctx.fillRect(0, i, canvas.width, 30);
    }

    // 2. Penalty box lines with realistic perspective fading
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 3;
    
    // Penalty area box outline
    ctx.beginPath();
    ctx.moveTo(120, 150);
    ctx.lineTo(580, 150);
    ctx.lineTo(650, 450);
    ctx.lineTo(50, 450);
    ctx.stroke();

    // Penalty spot mark
    ctx.beginPath();
    ctx.arc(350, 310, 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fill();
    ctx.closePath();
}

function drawGoal() {
    let goalLeft = 180;
    let goalRight = 520;
    let crossbarY = 90;
    let groundY = 150;

    // 1. Realistic Goal Net mesh texturing
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1;
    
    // Vertical Netting strings
    for (let x = goalLeft; x <= goalRight; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, crossbarY);
        // angled slightly outwards towards the backend anchors
        ctx.lineTo(x + (x - 350) * 0.1, groundY - 10); 
        ctx.stroke();
    }
    // Horizontal Netting strings
    for (let y = crossbarY; y <= groundY - 10; y += 8) {
        ctx.beginPath();
        ctx.moveTo(goalLeft - 3, y);
        ctx.lineTo(goalRight + 3, y);
        ctx.stroke();
    }

    // 2. Realistic 3D Goal Posts (Metallic tubular rendering using gradients)
    let postWidth = 10;
    
    // Left Post Gradient
    let leftPostGrad = ctx.createLinearGradient(goalLeft - postWidth, 0, goalLeft, 0);
    leftPostGrad.addColorStop(0, '#999');
    leftPostGrad.addColorStop(0.3, '#fff');
    leftPostGrad.addColorStop(0.7, '#ddd');
    leftPostGrad.addColorStop(1, '#666');

    // Right Post Gradient
    let rightPostGrad = ctx.createLinearGradient(goalRight, 0, goalRight + postWidth, 0);
    rightPostGrad.addColorStop(0, '#666');
    rightPostGrad.addColorStop(0.3, '#fff');
    rightPostGrad.addColorStop(0.7, '#ddd');
    rightPostGrad.addColorStop(1, '#999');

    // Crossbar Gradient
    let crossbarGrad = ctx.createLinearGradient(0, crossbarY - postWidth, 0, crossbarY);
    crossbarGrad.addColorStop(0, '#baa');
    crossbarGrad.addColorStop(0.3, '#fff');
    crossbarGrad.addColorStop(1, '#777');

    // Render Posts shadows on grass
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(goalLeft - postWidth, groundY - 4, postWidth, 8);
    ctx.fillRect(goalRight, groundY - 4, postWidth, 8);

    // Render Left Post
    ctx.fillStyle = leftPostGrad;
    ctx.fillRect(goalLeft - postWidth, crossbarY - postWidth, postWidth, groundY - crossbarY + postWidth);
    
    // Render Right Post
    ctx.fillStyle = rightPostGrad;
    ctx.fillRect(goalRight, crossbarY - postWidth, postWidth, groundY - crossbarY + postWidth);

    // Render Crossbar
    ctx.fillStyle = crossbarGrad;
    ctx.fillRect(goalLeft - postWidth, crossbarY - postWidth, (goalRight - goalLeft) + (postWidth * 2), postWidth);
}

function drawBall() {
    ctx.save();
    
    // Ball Shadow on the Grass
    let shadowOffset = (390 - ball.y) * 0.15;
    ctx.beginPath();
    ctx.ellipse(ball.x + shadowOffset, ball.y + (ball.radius * 0.4), ball.radius, ball.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.1, 0.4 - (390 - ball.y)/500)})`;
    ctx.fill();
    ctx.closePath();

    // The actual Soccer Ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.clip(); // Keeps the pattern restricted to inside the ball circle

    // Draw pattern image with a dynamic rotation angle simulation
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.angle);
    ctx.drawImage(ballPatternImg, -ball.radius, -ball.radius, ball.radius * 2, ball.radius * 2);
    ctx.restore();

    // Shiny realistic overlay gradient over the texture
    ctx.save();
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    let ballShade = ctx.createRadialGradient(
        ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.1,
        ball.x, ball.y, ball.radius
    );
    ballShade.addColorStop(0, 'rgba(255,255,255,0.4)');
    ballShade.addColorStop(0.6, 'rgba(0,0,0,0)');
    ballShade.addColorStop(1, 'rgba(0,0,0,0.7)'); // Outer structural depth shadow
    ctx.fillStyle = ballShade;
    ctx.fill();
    ctx.closePath();
    ctx.restore();
}

function drawKeeper() {
    // Keeper Dynamic Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(keeper.x, 150, keeper.width * 0.7, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw specialized goalie jersey / figure
    let kX = keeper.x - keeper.width / 2;
    let kY = keeper.y - keeper.height / 2;

    // Jersey (Neon style for pro presence)
    let jerseyGrad = ctx.createLinearGradient(kX, kY, kX + keeper.width, kY);
    jerseyGrad.addColorStop(0, '#ff3366');
    jerseyGrad.addColorStop(0.5, '#ff6600');
    jerseyGrad.addColorStop(1, '#ff3366');
    ctx.fillStyle = jerseyGrad;
    
    // Body rectangle / rounded structure
    ctx.beginPath();
    ctx.roundRect(kX, kY + 12, keeper.width, keeper.height - 12, [8, 8, 0, 0]);
    ctx.fill();

    // Shorts/Legs base
    ctx.fillStyle = "#111";
    ctx.fillRect(kX + 4, kY + keeper.height - 5, keeper.width - 8, 8);

    // Head / Helmet
    ctx.fillStyle = "#ffddcc";
    ctx.beginPath();
    ctx.arc(keeper.x, kY + 6, 9, 0, Math.PI * 2);
    ctx.fill();

    // Draw Gloves extended outward horizontally
    ctx.drawImage(glovesImg, kX - 18, kY + 10, 20, 20); // Left glove
    ctx.drawImage(glovesImg, kX + keeper.width - 2, kY + 10, 20, 20); // Right glove
}

function drawParticles() {
    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        if (p.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function createGoalExplosion() {
    let colors = ['#00ff87', '#60efff', '#fff', '#ffbb00'];
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: ball.x,
            y: ball.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            size: Math.random() * 4 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1
        });
    }
}

function drawFeedback() {
    if (gameState === 'result' && feedbackMessage) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(0, 180, canvas.width, 70);
        
        ctx.font = "bold 26px Poppins";
        ctx.fillStyle = feedbackColor;
        ctx.textAlign = "center";
        ctx.shadowColor = feedbackColor;
        ctx.shadowBlur = 10;
        ctx.fillText(feedbackMessage, canvas.width / 2, 225);
        ctx.restore();
    }
}

// ==========================================================================
// GAMEPLAY OPERATIONS / LOGIC
// ==========================================================================

function setAim(direction) {
    if (gameState !== 'ready') return;
    currentAim = direction;
    updateAimButtons();
}

function shoot() {
    if (gameState !== 'ready') return;
    isPowerCharging = true;
    power = 0;
    powerDirection = 1;
}

// Global Event Handler tracking key triggers
window.addEventListener('mouseup', () => {
    if (isPowerCharging) {
        isPowerCharging = false;
        executeShot();
    }
});
window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && isPowerCharging) {
        isPowerCharging = false;
        executeShot();
    }
});

function executeShot() {
    gameState = 'shooting';
    attempts++;

    // Translate UI selections into accurate targets
    let variance = (100 - power) * 0.6; // lower power translates to wider tracking spread
    if (currentAim === 'left') {
        targetPos.x = 210 + (Math.random() * variance - variance / 2);
        targetPos.y = 105 + (Math.random() * 30);
    } else if (currentAim === 'right') {
        targetPos.x = 490 + (Math.random() * variance - variance / 2);
        targetPos.y = 105 + (Math.random() * 30);
    } else {
        targetPos.x = 350 + (Math.random() * (variance * 1.5) - (variance * 1.5) / 2);
        targetPos.y = 100 + (Math.random() * 25);
    }

    // AI Keeper Calculations based on difficulty setting
    let diff = difficultySelect.value;
    let keeperPick = Math.random();
    let keeperChances = { 'Easy': 0.3, 'Medium': 0.55, 'Hard': 0.8 };

    if (keeperPick < keeperChances[diff]) {
        // Keeper guesses target perfectly
        keeper.targetX = targetPos.x;
    } else {
        // Keeper completely misreads shot selection
        let options = [220, 350, 480];
        let wrongOptions = options.filter(o => Math.abs(o - targetPos.x) > 80);
        keeper.targetX = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    }
}

function updateShotPhysics() {
    if (gameState !== 'shooting') return;

    // Slide ball closer towards the targeted spatial coordinate frame
    let dx = targetPos.x - ball.x;
    let dy = targetPos.y - ball.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    let speed = 14 + (power * 0.08); // Speed scales up with shot power

    // Simulating rotation spin speed
    ball.angle += 0.25;

    if (distance > speed) {
        ball.x += (dx / distance) * speed;
        ball.y += (dy / distance) * speed;
        
        // Scale ball geometry size lower dynamically down field to look real 3D
        let travelPct = (390 - ball.y) / (390 - targetPos.y);
        ball.radius = ball.startRadius - (ball.startRadius - ball.targetRadius) * travelPct;
    } else {
        // Destination node reached, grade result parameters
        processShotResult();
    }

    // Natural Goalkeeper tracking speed scaling up
    let keeperSpeed = (difficultySelect.value === 'Hard') ? 9 : (difficultySelect.value === 'Medium') ? 6 : 4;
    if (keeper.x < keeper.targetX) keeper.x = Math.min(keeper.targetX, keeper.x + keeperSpeed);
    if (keeper.x > keeper.targetX) keeper.x = Math.max(keeper.targetX, keeper.x - keeperSpeed);
}

function processShotResult() {
    gameState = 'result';
    
    let insideGoalX = (ball.x >= 180 && ball.x <= 520);
    let insideGoalY = (ball.y >= 90 && ball.y <= 150);
    
    // Check intersection against Goalkeeper hitbox width clearance metrics
    let keeperIntersects = (Math.abs(ball.x - keeper.x) < (keeper.width / 2 + ball.radius + 10) && ball.y < 160);

    if (insideGoalX && insideGoalY && !keeperIntersects) {
        score++;
        feedbackMessage = "⚽ GOAL!!! SPECTACULAR SHOT!";
        feedbackColor = "#00ff87";
        createGoalExplosion();
    } else if (keeperIntersects) {
        feedbackMessage = "🧤 SAVED! THE KEEPER DENIES YOU!";
        feedbackColor = "#ffbb00";
    } else {
        feedbackMessage = "❌ OUT! WIDE OF THE POSTS!";
        feedbackColor = "#ff3333";
    }

    // Refresh UI Dashboard Displays
    scoreEl.innerText = score;
    attemptsEl.innerText = attempts;
    accuracyEl.innerText = Math.round((score / attempts) * 100) + "%";

    // Revert loop process automatically back online shortly
    setTimeout(() => {
        resetPitch();
    }, 2500);
}

function resetPitch() {
    ball.x = 350;
    ball.y = 390;
    ball.radius = ball.startRadius;
    ball.angle = 0;
    keeper.x = 350;
    keeper.targetX = 350;
    power = 0;
    powerFill.style.width = "0%";
    gameState = 'ready';
}

// ==========================================================================
// CORE REFRESH LOOP ENGINE
// ==========================================================================

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Charge power-bar cycling
    if (isPowerCharging) {
        power += 3 * powerDirection;
        if (power >= 100 || power <= 0) powerDirection *= -1;
        powerFill.style.width = power + "%";
    }

    // Draw Scene Components
    drawField();
    drawGoal();
    if (gameState === 'ready' || gameState === 'shooting') {
        drawKeeper();
    }
    drawBall();
    if (gameState === 'result') {
        // Draw keeper overlay over/under ball dynamically depending on saves
        drawKeeper();
    }
    drawParticles();
    drawFeedback();

    updateShotPhysics();

    requestAnimationFrame(loop);
}

// Boot game engine up
loop();