const canvas = document.querySelector('.game');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = 1000;
canvas.height = 600;

// Load images
const playerImg = new Image();
playerImg.src = 'player.png';

const enemyImg = new Image();
enemyImg.src = 'enemy.png';

const backgroundImg = new Image();
backgroundImg.src = 'background.png';

// Player class
class Player {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 5;
    }

    draw() {
        ctx.drawImage(playerImg, this.x, this.y, this.width, this.height);
    }

    move(direction) {
        if (direction === 'left' && this.x > 0) {
            this.x -= this.speed;
        } else if (direction === 'right' && this.x + this.width < canvas.width) {
            this.x += this.speed;
        }
    }
}

// Enemy class
class Enemy {
    constructor(x, y, width, height, speed) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
    }

    draw() {
        ctx.drawImage(enemyImg, this.x, this.y, this.width, this.height);
    }

    move() {
        this.y += this.speed;
    }
}

// Projectile class
class Projectile {
    constructor(x, y, width, height, speed) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
    }

    draw() {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    move() {
        this.y -= this.speed;
    }
}

// Game variables
let score = 0;
let bestScore = localStorage.getItem('bestScore') ? parseInt(localStorage.getItem('bestScore')) : 0;
let gameOver = false;
let player = new Player(canvas.width / 2 - 25, canvas.height - 80, 50, 50);
let enemies = [];
let projectiles = [];
let keys = {};
let gameInterval; // Holds the interval for enemy spawning
let shootInterval; // Interval for rapid shooting
let shootingSpeed = 6; // Speed of the bullet
let rapidFireRate = 100; // Shooting interval (in milliseconds)
let shootNow = false; // Variable to handle single shot vs rapid fire
let speedIncreaseThreshold = 100; // Threshold for speed increase
let firstSpeedIncrease = 1.32; // 32% speed increase for the first threshold
let subsequentSpeedIncrease = 1.15; // 15% speed increase for subsequent thresholds

// Spawn enemies at regular intervals
function spawnEnemies() {
    const enemyCount = 7;
    const enemyWidth = 50;
    const enemyHeight = 50;
    const spacing = (canvas.width - (enemyCount * enemyWidth)) / (enemyCount + 1);

    for (let i = 0; i < enemyCount; i++) {
        const x = (i + 1) * spacing + i * enemyWidth;
        const y = 50;
        enemies.push(new Enemy(x, y, enemyWidth, enemyHeight, 0.5)); // Initial speed is 0.5
    }
}

// Update score
function updateScoreDisplay() {
    const scoreDisplay = document.getElementById('score-display');
    scoreDisplay.textContent = `Score: ${score}`;
}

// Update best score
function updateBestScore() {
    const bestScoreDisplay = document.getElementById('best-score');
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('bestScore', bestScore);
    }
    bestScoreDisplay.textContent = `Best Score: ${bestScore}`;
}

// Draw score
function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, canvas.width + 20, 30);
}

// Check if the score is a multiple of 100 and increase speed gradually
function checkScoreForSpeedIncrease() {
    if (score > 0 && score % speedIncreaseThreshold === 0) {
        // Increase speed by 32% for the first 100 points
        if (score === speedIncreaseThreshold) {
            enemies.forEach(enemy => {
                enemy.speed *= firstSpeedIncrease;
            });
        } else if (score > speedIncreaseThreshold) {
            // Increase speed by 15% for every subsequent 100 points
            enemies.forEach(enemy => {
                enemy.speed *= subsequentSpeedIncrease;
            });
        }
        // Increase the threshold for the next increase
        speedIncreaseThreshold += 100;
    }
}

// Game loop
function gameLoop() {
    if (gameOver) {
        ctx.fillStyle = 'red';
        ctx.font = '40px Arial';
        ctx.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2);
        return;
    }

    // Draw background
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    // Draw player
    player.draw();

    // Move player
    if (keys['ArrowLeft']) player.move('left');
    if (keys['ArrowRight']) player.move('right');

    // Draw and move enemies
    enemies.forEach((enemy, eIndex) => {
        enemy.draw();
        enemy.move();

        // End game if enemy hits the ground
        if (enemy.y + enemy.height >= canvas.height) {
            gameOver = true;
        }
    });

    // Draw and move projectiles
    projectiles.forEach((projectile, pIndex) => {
        projectile.draw();
        projectile.move();

        // Remove projectile if it goes off-screen
        if (projectile.y < 0) projectiles.splice(pIndex, 1);

        // Collision detection with enemies
        enemies.forEach((enemy, eIndex) => {
            if (
                projectile.x < enemy.x + enemy.width &&
                projectile.x + projectile.width > enemy.x &&
                projectile.y < enemy.y + enemy.height &&
                projectile.y + projectile.height > enemy.y
            ) {
                enemies.splice(eIndex, 1); // Remove enemy
                projectiles.splice(pIndex, 1); // Remove projectile
                score += 5; // Increment score
            }
        });
    });

    // Check if score is a multiple of 100 and increase enemy speed
    checkScoreForSpeedIncrease();

    // Draw the score
    drawScore();
    updateScoreDisplay();
    updateBestScore();

    requestAnimationFrame(gameLoop);
}

// Handle key events
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    // Shoot bullet on space key press (single shot)
    if (e.key === ' ') {
        projectiles.push(new Projectile(player.x + player.width / 2 - 2.5, player.y, 5, 10, shootingSpeed));
    }

    // Shoot bullets continuously while holding space
    if (e.key === ' ' && !shootInterval) {
        shootInterval = setInterval(() => {
            projectiles.push(new Projectile(player.x + player.width / 2 - 2.5, player.y, 5, 10, shootingSpeed));
        }, rapidFireRate); // Shoot every 100 milliseconds
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;

    // Stop shooting when spacebar is released
    if (e.key === ' ') {
        clearInterval(shootInterval); // Stop the shooting interval
        shootInterval = null;
    }
});

// Handle mouse clicks for single shot
canvas.addEventListener('click', () => {
    projectiles.push(new Projectile(player.x + player.width / 2 - 2.5, player.y, 5, 10, shootingSpeed));
});

// Handle touch events for mobile
let touchStartX = 0;
let touchEndX = 0;
let touchStartTime = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartTime = Date.now();

    // Shoot bullet on touch start (single shot)
    projectiles.push(new Projectile(player.x + player.width / 2 - 2.5, player.y, 5, 10, shootingSpeed));

    // Continuously shoot while holding (if touch duration is long enough)
    shootInterval = setInterval(() => {
        projectiles.push(new Projectile(player.x + player.width / 2 - 2.5, player.y, 5, 10, shootingSpeed));
    }, rapidFireRate); // Shoot every 100 milliseconds
});

canvas.addEventListener('touchmove', (e) => {
    touchEndX = e.touches[0].clientX;

    if (touchStartX > touchEndX) {
        player.move('left');
    } else if (touchStartX < touchEndX) {
        player.move('right');
    }
});

canvas.addEventListener('touchend', (e) => {
    clearInterval(shootInterval); // Stop continuous shooting
    shootInterval = null;
});

// Start and stop buttons
document.getElementById('startBtn').addEventListener('click', () => {
    gameOver = false;
    score = 0;
    enemies = [];
    projectiles = [];
    spawnEnemies(); // Start spawning enemies when the game starts
    gameLoop();
    gameInterval = setInterval(spawnEnemies, 3000); // Spawn enemies every 3 seconds
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'block';
});

document.getElementById('stopBtn').addEventListener('click', () => {
    gameOver = true;
    clearInterval(gameInterval); // Stop enemy spawning when the game is stopped
    document.getElementById('stopBtn').style.display = 'none';
    document.getElementById('startBtn').style.display = 'block';
});
