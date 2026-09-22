// Main game configuration
const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 400,
    backgroundColor: '#000000',
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Initialize Phaser game
const game = new Phaser.Game(gameConfig);

// Game constants
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 12;
const PADDLE_SPEED = 400; // Increased for better feel with physics
const BALL_SPEED_X = 300;
const BALL_SPEED_Y = 200;
const WINNING_SCORE = 5;

// Game state
let gameState = {
    score: { user: 0, computer: 0 },
    isPlaying: false,
    gameOver: false
};

// Phaser scene functions
function preload() {
    // No external assets needed for now - we'll draw with graphics
    // This is where we would load sprite sheets for future improvements
}

function create() {
    // Draw center line
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x555555);
    graphics.setDash([10, 10]);
    graphics.moveTo(400, 0);
    graphics.lineTo(400, 400);
    graphics.strokePath();
    
    // Create score text
    this.scoreTextUser = this.add.text(100, 20, '0', {
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#ffffff',
        shadow: { offsetX: 0, offsetY: 0, color: '#000000', blur: 5, stroke: true, fill: true }
    }).setOrigin(0.5);
    
    this.scoreTextComputer = this.add.text(700, 20, '0', {
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#ffffff',
        shadow: { offsetX: 0, offsetY: 0, color: '#000000', blur: 5, stroke: true, fill: true }
    }).setOrigin(0.5);
    
    // Create instructions text
    this.instructionsText = this.add.text(400, 380, 'Mueve el mouse arriba y abajo para controlar tu pala', {
        fontSize: '1.2rem',
        color: '#ffffff',
        align: 'center',
        shadow: { offsetX: 0, offsetY: 0, color: '#000000', blur: 3, stroke: true, fill: true }
    }).setOrigin(0.5);
    
    // Create start button
    this.startButton = this.add.text(400, 200, 'Iniciar Juego', {
        fontSize: '1.5rem',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: '#ffffff',
        padding: { x: 20, y: 10 },
        border: { width: 2, color: '#ffffff' },
        borderRadius: 5
    }).setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => this.startButton.setStyle({ backgroundColor: 'rgba(255,255,255,0.2)' }))
    .on('pointerout', () => this.startButton.setStyle({ backgroundColor: 'rgba(0,0,0,0.7)' }))
    .on('pointerdown', () => startGame.call(this));
    
    // Create game over container (initially hidden)
    this.gameOverContainer = this.add.container(400, 200);
    this.gameOverContainer.visible = false;
    
    const gameOverBg = this.add.graphics();
    gameOverBg.fillStyle(0x000000, 0.8);
    gameOverBg.fillRoundedRect(-150, -100, 300, 200, 10);
    this.gameOverContainer.add(gameOverBg);
    
    this.gameOverText = this.add.text(0, -50, '¡Fin del Juego!', {
        fontSize: '1.8rem',
        color: '#ffffff',
        align: 'center'
    }).setOrigin(0.5);
    this.gameOverContainer.add(this.gameOverText);
    
    this.finalMessageText = this.add.text(0, 0, '', {
        fontSize: '1.2rem',
        color: '#ffffff',
        align: 'center'
    }).setOrigin(0.5);
    this.gameOverContainer.add(this.finalMessageText);
    
    this.restartButton = this.add.text(0, 40, 'Jugar de Nuevo', {
        fontSize: '1.2rem',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: '#ffffff',
        padding: { x: 15, y: 8 },
        border: { width: 2, color: '#ffffff' },
        borderRadius: 5
    }).setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => this.restartButton.setStyle({ backgroundColor: 'rgba(255,255,255,0.2)' }))
    .on('pointerout', () => this.restartButton.setStyle({ backgroundColor: 'rgba(0,0,0,0.7)' }))
    .on('pointerdown', () => startGame.call(this));
    this.gameOverContainer.add(this.restartButton);
    
    // Create game objects
    createGameObjects.call(this);
    
    // Set up input
    this.input.on('pointermove', moveUserPaddle, this);
}

function update(time, delta) {
    if (!gameState.isPlaying || gameState.gameOver) return;
    
    // Update computer paddle AI
    updateComputerPaddle.call(this, delta);
    
    // Check for scoring
    checkScoring.call(this);
}

// Create game objects (paddles, ball)
function createGameObjects() {
    // Create user paddle (wizard) - left side
    this.userPaddle = this.add.container(20, 200);
    this.userPaddle.setSize(PADDLE_WIDTH, PADDLE_HEIGHT);
    drawUserWizard.call(this, this.userPaddle);
    
    // Create computer paddle (wizard) - right side
    this.computerPaddle = this.add.container(780, 200);
    this.computerPaddle.setSize(PADDLE_WIDTH, PADDLE_HEIGHT);
    drawComputerWizard.call(this, this.computerPaddle);
    
    // Create ball
    this.ball = this.add.circle(400, 200, BALL_SIZE / 2, 0xffff00);
    this.physics.add.existing(this.ball);
    this.ball.body.setCollideWorldBounds(true, 1, 1, 1);
    
    // Add collision detection between ball and paddles
    this.physics.add.collider(this.ball, this.userPaddle, handlePaddleCollision, null, this);
    this.physics.add.collider(this.ball, this.computerPaddle, handlePaddleCollision, null, this);
}

// Draw user wizard using graphics
function drawUserWizard(container) {
    // Clear any existing graphics
    container.removeAll(true);
    
    const width = PADDLE_WIDTH;
    const height = PADDLE_HEIGHT;
    const hatHeight = height * 0.3;
    const robeHeight = height * 0.7;
    
    // Draw hat (triangle) - centered
    const hat = this.add.polygon(0, 0, [
        0, 0,                    // Top point (will be offset)
        width/2, -hatHeight,     // Top center
        width, 0                 // Bottom right
    ], 0x800080); // Purple
    hat.setOrigin(0.5, 1); // Origin at bottom center
    hat.y = -hatHeight/2; // Adjust position
    container.add(hat);
    
    // Draw hat brim
    const brim = this.add.rectangle(0, 0, width, height*0.05, 0x4B0082);
    brim.setOrigin(0.5);
    brim.y = hatHeight/2 - height*0.025;
    container.add(brim);
    
    // Draw robe
    const robe = this.add.rectangle(0, 0, width, robeHeight - height*0.05, 0x0000FF);
    robe.setOrigin(0.5);
    robe.y = hatHeight/2 + (robeHeight - height*0.05)/2;
    container.add(robe);
    
    // Draw belt
    const belt = this.add.rectangle(0, 0, width, height*0.05, 0xFFFF00);
    belt.setOrigin(0.5);
    belt.y = hatHeight/2 + (robeHeight - height*0.05)*0.4;
    container.add(belt);
    
    // Draw wand (on right side)
    const wand = this.add.rectangle(0, 0, width*0.2, height*0.4, 0xFFFFFF);
    wand.setOrigin(0.5);
    wand.x = width*0.3;
    wand.y = hatHeight/2 + height*0.05 + height*0.2;
    container.add(wand);
    
    const wandTip = this.add.rectangle(0, 0, width*0.2, height*0.03, 0xFFD700);
    wandTip.setOrigin(0.5);
    wandTip.x = width*0.3;
    wandTip.y = hatHeight/2 + height*0.05 + height*0.2 - height*0.015;
    container.add(wandTip);
}

// Draw computer wizard using graphics
function drawComputerWizard(container) {
    // Clear any existing graphics
    container.removeAll(true);
    
    const width = PADDLE_WIDTH;
    const height = PADDLE_HEIGHT;
    const hatHeight = height * 0.3;
    const robeHeight = height * 0.7;
    
    // Draw hat (triangle) - centered
    const hat = this.add.polygon(0, 0, [
        0, 0,                    // Top point
        width/2, -hatHeight,     // Top center
        width, 0                 // Bottom right
    ], 0x000000); // Black
    hat.setOrigin(0.5, 1); // Origin at bottom center
    hat.y = -hatHeight/2; // Adjust position
    container.add(hat);
    
    // Draw hat brim
    const brim = this.add.rectangle(0, 0, width, height*0.05, 0x2F2F2F);
    brim.setOrigin(0.5);
    brim.y = hatHeight/2 - height*0.025;
    container.add(brim);
    
    // Draw robe
    const robe = this.add.rectangle(0, 0, width, robeHeight - height*0.05, 0xFF0000);
    robe.setOrigin(0.5);
    robe.y = hatHeight/2 + (robeHeight - height*0.05)/2;
    container.add(robe);
    
    // Draw belt
    const belt = this.add.rectangle(0, 0, width, height*0.05, 0xFFFFFF);
    belt.setOrigin(0.5);
    belt.y = hatHeight/2 + (robeHeight - height*0.05)*0.4;
    container.add(belt);
    
    // Draw crystal ball (on left side)
    const crystalBall = this.add.circle(0, 0, width*0.2, 0x00FFFF);
    crystalBall.setOrigin(0.5);
    crystalBall.x = -width*0.3;
    crystalBall.y = hatHeight/2 + height*0.05 + height*0.3;
    container.add(crystalBall);
    
    // Crystal ball outline
    const outline = this.add.circle(0, 0, width*0.2, 0xFFFFFF);
    outline.setOrigin(0.5);
    outline.x = -width*0.3;
    outline.y = hatHeight/2 + height*0.05 + height*0.3;
    outline.setStrokeStyle(1, 0xFFFFFF);
    container.add(outline);
    
    // Draw magic sparkles
    for (let i = 0; i < 3; i++) {
        const sparkX = -width*0.2 + Math.random() * width*0.4;
        const sparkY = hatHeight/2 + height*0.05 + height*0.1 + Math.random() * height*0.4;
        const spark = this.add.circle(0, 0, 2, 0xFFFF00);
        spark.setOrigin(0.5);
        spark.x = sparkX;
        spark.y = sparkY;
        container.add(spark);
    }
}

// Update computer paddle AI (simple tracking)
function updateComputerPaddle(delta) {
    if (!this.ball || !this.computerPaddle) return;
    
    const paddleCenterY = this.computerPaddle.y;
    const ballY = this.ball.y;
    
    // Simple AI: move towards ball with some delay
    if (paddleCenterY < ballY - 10) {
        this.computerPaddle.y += PADDLE_SPEED * delta / 1000;
    } else if (paddleCenterY > ballY + 10) {
        this.computerPaddle.y -= PADDLE_SPEED * delta / 1000;
    }
    
    // Keep within bounds
    if (this.computerPaddle.y < PADDLE_HEIGHT/2) {
        this.computerPaddle.y = PADDLE_HEIGHT/2;
    }
    if (this.computerPaddle.y > 400 - PADDLE_HEIGHT/2) {
        this.computerPaddle.y = 400 - PADDLE_HEIGHT/2;
    }
}

// Move user paddle based on mouse
function moveUserPaddle(pointer) {
    if (!gameState.isPlaying || gameState.gameOver) return;
    
    // Constrain paddle to vertical movement only within bounds
    const targetY = pointer.y;
    const minY = PADDLE_HEIGHT/2;
    const maxY = 400 - PADDLE_HEIGHT/2;
    
    if (targetY > minY && targetY < maxY) {
        this.userPaddle.y = targetY;
    }
}

// Handle ball hitting paddle
function handlePaddleCollision(ball, paddle) {
    // Add some spin based on where it hit the paddle
    const hitPosition = (ball.y - paddle.y) / paddle.height;
    // Adjust vertical velocity based on hit position (-0.5 to 0.5 range)
    const spin = (hitPosition - 0.5) * 8; 
    
    // Reverse horizontal direction and add spin
    ball.body.velocity.x = -ball.body.velocity.x;
    ball.body.velocity.y += spin;
    
    // Optional: Increase speed slightly over time
    const speed = Math.sqrt(ball.body.velocity.x**2 + ball.body.velocity.y**2);
    if (speed < 500) { // Cap maximum speed
        ball.body.velocity.x *= 1.02;
        ball.body.velocity.y *= 1.02;
    }
}

// Check for scoring
function checkScoring() {
    if (!this.ball) return;
    
    // Check if ball went off screen left (computer scores)
    if (this.ball.x < 0) {
        gameState.score.computer++;
        this.scoreTextComputer.text = gameState.score.computer;
        resetBall.call(this);
        
        if (gameState.score.computer >= WINNING_SCORE) {
            endGame.call(this, 'computer');
        }
    }
    // Check if ball went off screen right (user scores)
    else if (this.ball.x > 800) {
        gameState.score.user++;
        this.scoreTextUser.text = gameState.score.user;
        resetBall.call(this);
        
        if (gameState.score.user >= WINNING_SCORE) {
            endGame.call(this, 'user');
        }
    }
}

// Reset ball to center with random direction
function resetBall() {
    this.ball.setPosition(400, 200);
    
    // Randomize direction
    const angle = Phaser.Math.Between(-45, 45); // -45 to 45 degrees
    const speed = 300;
    
    this.ball.body.velocity.x = speed * Math.cos(Phaser.Math.DegToRad(angle));
    this.ball.body.velocity.y = speed * Math.sin(Phaser.Math.DegToRad(angle));
    
    // Randomly choose initial horizontal direction
    if (Math.random() > 0.5) {
        this.ball.body.velocity.x = -Math.abs(this.ball.body.velocity.x);
    } else {
        this.ball.body.velocity.x = Math.abs(this.ball.body.velocity.x);
    }
}

// Start game function
function startGame() {
    // Reset game state
    gameState.score = { user: 0, computer: 0 };
    this.scoreTextUser.text = '0';
    this.scoreTextComputer.text = '0';
    gameState.isPlaying = true;
    gameState.gameOver = false;
    
    // Hide UI elements
    this.startButton.visible = false;
    this.instructionsText.visible = false;
    this.gameOverContainer.visible = false;
    
    // Reset paddle positions
    this.userPaddle.y = 200;
    this.computerPaddle.y = 200;
    
    // Reset ball
    resetBall.call(this);
}

// End game function
function endGame(winner) {
    gameState.isPlaying = false;
    gameState.gameOver = true;
    
    // Show game over UI
    this.gameOverContainer.visible = true;
    
    if (winner === 'user') {
        this.finalMessageText.text = '¡Felicidades! Has ganado.';
    } else {
        this.finalMessageText.text = 'Lo siento, la máquina ha ganado.';
    }
}