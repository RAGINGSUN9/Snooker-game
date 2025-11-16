// Game constants
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 500;
const BALL_RADIUS = 10;
const POCKET_RADIUS = 25;
const FRICTION = 0.98;
const MIN_VELOCITY = 0.1;

// Ball colors and values
const BALL_COLORS = {
    white: '#FFFFFF',
    red: '#DC143C',
    yellow: '#FFD700',
    green: '#228B22',
    brown: '#8B4513',
    blue: '#0000FF',
    pink: '#FF69B4',
    black: '#000000'
};

const BALL_VALUES = {
    red: 1,
    yellow: 2,
    green: 3,
    brown: 4,
    blue: 5,
    pink: 6,
    black: 7
};

// Table dimensions
const TABLE_MARGIN = 50;
const TABLE_WIDTH = CANVAS_WIDTH - TABLE_MARGIN * 2;
const TABLE_HEIGHT = CANVAS_HEIGHT - TABLE_MARGIN * 2;

// Pocket positions (6 pockets)
const POCKETS = [
    { x: TABLE_MARGIN, y: TABLE_MARGIN }, // Top-left
    { x: CANVAS_WIDTH / 2, y: TABLE_MARGIN }, // Top-center
    { x: CANVAS_WIDTH - TABLE_MARGIN, y: TABLE_MARGIN }, // Top-right
    { x: TABLE_MARGIN, y: CANVAS_HEIGHT - TABLE_MARGIN }, // Bottom-left
    { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - TABLE_MARGIN }, // Bottom-center
    { x: CANVAS_WIDTH - TABLE_MARGIN, y: CANVAS_HEIGHT - TABLE_MARGIN } // Bottom-right
];

class Ball {
    constructor(x, y, color, value = 0) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = BALL_RADIUS;
        this.color = color;
        this.value = value;
        this.potted = false;
        this.processed = false;
        this.number = value === 1 ? 'red' : (value > 1 ? Object.keys(BALL_VALUES).find(k => BALL_VALUES[k] === value) : 'white');
    }

    update() {
        if (this.potted) return;

        this.x += this.vx;
        this.y += this.vy;

        // Apply friction
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // Stop if velocity is too low
        if (Math.abs(this.vx) < MIN_VELOCITY) this.vx = 0;
        if (Math.abs(this.vy) < MIN_VELOCITY) this.vy = 0;

        // Boundary collision
        if (this.x - this.radius < TABLE_MARGIN) {
            this.x = TABLE_MARGIN + this.radius;
            this.vx *= -0.8;
        }
        if (this.x + this.radius > CANVAS_WIDTH - TABLE_MARGIN) {
            this.x = CANVAS_WIDTH - TABLE_MARGIN - this.radius;
            this.vx *= -0.8;
        }
        if (this.y - this.radius < TABLE_MARGIN) {
            this.y = TABLE_MARGIN + this.radius;
            this.vy *= -0.8;
        }
        if (this.y + this.radius > CANVAS_HEIGHT - TABLE_MARGIN) {
            this.y = CANVAS_HEIGHT - TABLE_MARGIN - this.radius;
            this.vy *= -0.8;
        }

        // Check pocket collision
        for (let pocket of POCKETS) {
            const dx = this.x - pocket.x;
            const dy = this.y - pocket.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < POCKET_RADIUS) {
                this.potted = true;
                this.vx = 0;
                this.vy = 0;
                break;
            }
        }
    }

    draw(ctx) {
        if (this.potted) return;

        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw number/value for colored balls
        if (this.value > 0 && this.color !== BALL_COLORS.white) {
            ctx.fillStyle = this.color === BALL_COLORS.black ? '#FFF' : '#000';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.value.toString(), this.x, this.y);
        }
        ctx.restore();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        this.balls = [];
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.breakScore = 0;
        this.isAiming = false;
        this.aimStartX = 0;
        this.aimStartY = 0;
        this.aimEndX = 0;
        this.aimEndY = 0;
        this.power = 0;
        this.isShooting = false;
        this.expectingRed = true; // Start by expecting red ball
        this.foul = false;

        this.initBalls();
        this.setupEventListeners();
        this.updateUI();
        this.gameLoop();
    }

    initBalls() {
        this.balls = [];

        // White ball (cue ball)
        const whiteBall = new Ball(CANVAS_WIDTH * 0.25, CANVAS_HEIGHT / 2, BALL_COLORS.white, 0);
        this.balls.push(whiteBall);
        this.cueBall = whiteBall;

        // Red balls triangle (15 reds)
        const redStartX = CANVAS_WIDTH * 0.75;
        const redStartY = CANVAS_HEIGHT / 2;
        const spacing = BALL_RADIUS * 2.1;
        
        let redIndex = 0;
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col <= row; col++) {
                if (redIndex < 15) {
                    const x = redStartX + (col - row / 2) * spacing;
                    const y = redStartY - (row * spacing * 0.866);
                    this.balls.push(new Ball(x, y, BALL_COLORS.red, BALL_VALUES.red));
                    redIndex++;
                }
            }
        }

        // Colored balls
        const colorPositions = [
            { x: redStartX + spacing * 2.5, y: redStartY, color: 'yellow', value: 2 },
            { x: redStartX + spacing * 3.5, y: redStartY - spacing * 0.866, color: 'green', value: 3 },
            { x: redStartX + spacing * 3.5, y: redStartY + spacing * 0.866, color: 'brown', value: 4 },
            { x: redStartX + spacing * 4.5, y: redStartY, color: 'blue', value: 5 },
            { x: redStartX + spacing * 5.5, y: redStartY, color: 'pink', value: 6 },
            { x: redStartX + spacing * 6.5, y: redStartY, color: 'black', value: 7 }
        ];

        colorPositions.forEach(pos => {
            this.balls.push(new Ball(pos.x, pos.y, BALL_COLORS[pos.color], pos.value));
        });
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
    }

    handleMouseDown(e) {
        if (this.isShooting || this.areBallsMoving()) return;
        if (this.cueBall.potted) return;

        const rect = this.canvas.getBoundingClientRect();
        this.aimStartX = e.clientX - rect.left;
        this.aimStartY = e.clientY - rect.top;
        this.isAiming = true;
    }

    handleMouseMove(e) {
        if (!this.isAiming) return;

        const rect = this.canvas.getBoundingClientRect();
        this.aimEndX = e.clientX - rect.left;
        this.aimEndY = e.clientY - rect.top;

        const dx = this.aimEndX - this.cueBall.x;
        const dy = this.aimEndY - this.cueBall.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.power = Math.min(distance / 5, 100);
        this.updatePowerMeter();
    }

    handleMouseUp(e) {
        if (!this.isAiming || this.isShooting) return;
        this.isAiming = false;

        if (this.power > 5) {
            this.shoot();
        }
    }

    shoot() {
        if (this.cueBall.potted || this.areBallsMoving()) return;

        this.isShooting = true;
        const dx = this.aimEndX - this.cueBall.x;
        const dy = this.aimEndY - this.cueBall.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const force = this.power * 0.3;
            this.cueBall.vx = (dx / distance) * force;
            this.cueBall.vy = (dy / distance) * force;
        }

        this.power = 0;
        this.updatePowerMeter();
    }

    areBallsMoving() {
        return this.balls.some(ball => 
            !ball.potted && (Math.abs(ball.vx) > MIN_VELOCITY || Math.abs(ball.vy) > MIN_VELOCITY)
        );
    }

    checkCollisions() {
        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                const ball1 = this.balls[i];
                const ball2 = this.balls[j];

                if (ball1.potted || ball2.potted) continue;

                const dx = ball2.x - ball1.x;
                const dy = ball2.y - ball1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < ball1.radius + ball2.radius) {
                    // Collision detected
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);

                    // Rotate velocities
                    const vx1 = ball1.vx * cos + ball1.vy * sin;
                    const vy1 = ball1.vy * cos - ball1.vx * sin;
                    const vx2 = ball2.vx * cos + ball2.vy * sin;
                    const vy2 = ball2.vy * cos - ball2.vx * sin;

                    // Swap velocities (elastic collision)
                    const finalVx1 = vx2;
                    const finalVx2 = vx1;

                    // Rotate back
                    ball1.vx = finalVx1 * cos - vy1 * sin;
                    ball1.vy = vy1 * cos + finalVx1 * sin;
                    ball2.vx = finalVx2 * cos - vy2 * sin;
                    ball2.vy = vy2 * cos + finalVx2 * sin;

                    // Separate balls
                    const overlap = ball1.radius + ball2.radius - distance;
                    const separationX = (dx / distance) * overlap * 0.5;
                    const separationY = (dy / distance) * overlap * 0.5;
                    ball1.x -= separationX;
                    ball1.y -= separationY;
                    ball2.x += separationX;
                    ball2.y += separationY;
                }
            }
        }
    }

    processPottedBalls() {
        if (!this.areBallsMoving()) {
            const newlyPotted = this.balls.filter(ball => ball.potted && !ball.processed);
            const cueBallPotted = this.cueBall.potted && !this.cueBall.processed;
            
            if (cueBallPotted) {
                // Reposition cue ball to D area
                this.cueBall.potted = false;
                this.cueBall.x = CANVAS_WIDTH * 0.25;
                this.cueBall.y = CANVAS_HEIGHT / 2;
                this.cueBall.vx = 0;
                this.cueBall.vy = 0;
                this.cueBall.processed = true;
                this.foul = true;
            }
            
            if (newlyPotted.length > 0 || cueBallPotted) {
                let score = 0;
                let validShot = true;
                const pottedNonCue = newlyPotted.filter(ball => ball !== this.cueBall);

                for (let ball of pottedNonCue) {
                    if (this.expectingRed && ball.value === BALL_VALUES.red) {
                        score += ball.value;
                        this.breakScore += ball.value;
                    } else if (!this.expectingRed && ball.value > 1) {
                        // Check if it's the expected color
                        const expectedColor = this.getExpectedColor();
                        if (expectedColor && ball.value === expectedColor) {
                            score += ball.value;
                            this.breakScore += ball.value;
                        } else {
                            validShot = false;
                            this.foul = true;
                        }
                    } else {
                        validShot = false;
                        this.foul = true;
                    }
                    ball.processed = true;
                }

                if (validShot && !this.foul && pottedNonCue.length > 0) {
                    this.scores[this.currentPlayer] += score;
                    // Switch between red and color
                    if (this.expectingRed) {
                        this.expectingRed = false;
                    } else {
                        this.expectingRed = true;
                    }
                } else if (this.foul || pottedNonCue.length === 0) {
                    // Foul or no valid balls potted - switch player
                    this.switchPlayer();
                }
            } else if (!this.areBallsMoving() && this.isShooting) {
                // No balls potted, switch player
                this.switchPlayer();
            }

            if (!this.areBallsMoving()) {
                this.isShooting = false;
                this.foul = false;
            }
        }
    }

    getExpectedColor() {
        // After potting a red, expect the lowest available color
        // In real snooker, you nominate a color, but for simplicity we use lowest available
        const pottedColors = this.balls
            .filter(ball => ball.potted && ball.value > 1)
            .map(ball => ball.value);
        
        const availableColors = [2, 3, 4, 5, 6, 7].filter(v => !pottedColors.includes(v));
        return availableColors.length > 0 ? availableColors[0] : null;
    }

    canShoot() {
        // Check if there are any reds left
        const redsLeft = this.balls.some(ball => !ball.potted && ball.value === BALL_VALUES.red);
        if (redsLeft) {
            return this.expectingRed;
        } else {
            // All reds are potted, expect colors in order
            return !this.expectingRed;
        }
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.breakScore = 0;
        this.expectingRed = true;
        this.updateUI();
    }

    updateUI() {
        document.getElementById('player1-score').textContent = this.scores[1];
        document.getElementById('player2-score').textContent = this.scores[2];
        document.getElementById('current-player').textContent = `Player ${this.currentPlayer}'s Turn`;
        document.getElementById('break-score').textContent = `Break: ${this.breakScore}`;
    }

    updatePowerMeter() {
        const meter = document.getElementById('power-meter');
        meter.style.width = this.power + '%';
        document.getElementById('power-value').textContent = Math.round(this.power) + '%';
    }

    resetGame() {
        this.initBalls();
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.breakScore = 0;
        this.expectingRed = true;
        this.foul = false;
        this.isShooting = false;
        // Reset processed flags
        this.balls.forEach(ball => ball.processed = false);
        this.updateUI();
    }

    drawTable() {
        const ctx = this.ctx;

        // Table surface
        ctx.fillStyle = '#0d5d1a';
        ctx.fillRect(TABLE_MARGIN, TABLE_MARGIN, TABLE_WIDTH, TABLE_HEIGHT);

        // Table border
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 8;
        ctx.strokeRect(TABLE_MARGIN, TABLE_MARGIN, TABLE_WIDTH, TABLE_HEIGHT);

        // Draw pockets
        ctx.fillStyle = '#000';
        POCKETS.forEach(pocket => {
            ctx.beginPath();
            ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            // Inner shadow
            ctx.beginPath();
            ctx.arc(pocket.x, pocket.y, POCKET_RADIUS * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = '#1a1a1a';
            ctx.fill();
            ctx.fillStyle = '#000';
        });

        // D (semi-circle)
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(CANVAS_WIDTH * 0.25, CANVAS_HEIGHT / 2, 73, 0, Math.PI);
        ctx.stroke();
    }

    drawAimingLine() {
        if (!this.isAiming || this.isShooting || this.cueBall.potted) return;

        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(this.cueBall.x, this.cueBall.y);
        ctx.lineTo(this.aimEndX, this.aimEndY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    gameLoop() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        this.drawTable();

        // Update balls
        this.balls.forEach(ball => ball.update());
        this.checkCollisions();
        this.processPottedBalls();

        // Draw balls
        this.balls.forEach(ball => ball.draw(this.ctx));

        // Draw aiming line
        this.drawAimingLine();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new Game();
});

