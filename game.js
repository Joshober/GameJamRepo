const params = new URLSearchParams(location.search);
const gameId = params.get("gameId") || "mg-XXX";

// Demo Game: Coin Collector
// Players move around and collect coins. Most coins wins!

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game state
let scores = [0, 0, 0, 0];
let startTime = null;
let gameDuration = 10000; // 10 seconds
let gameRunning = false;

// Player positions (4 players, each in their lane)
const playerPositions = [80, 180, 280, 380];
let playerY = 250;
const playerColors = ['#ff6464', '#6464ff', '#64ff64', '#ffff64'];

// Coins to collect
let coins = [];
function initCoins() {
  coins = [];
  for (let i = 0; i < 20; i++) {
    coins.push({
      x: Math.random() * 540 + 50,
      y: Math.random() * 200 + 50,
      collected: false,
      value: Math.random() < 0.3 ? 3 : (Math.random() < 0.6 ? 2 : 1)
    });
  }
}

function draw() {
  // Clear canvas
  ctx.fillStyle = '#1e1e28';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  if (!gameRunning) {
    // Draw start screen
    ctx.fillStyle = '#ffffff';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Coin Collector', canvas.width / 2, 150);
    ctx.font = '24px Arial';
    ctx.fillText('Press ACTION to start!', canvas.width / 2, 200);
    ctx.fillText('Move UP/DOWN to collect coins', canvas.width / 2, 240);
    return;
  }
  
  const elapsed = Date.now() - startTime;
  const timeLeft = Math.max(0, gameDuration - elapsed);
  
  // Draw coins
  coins.forEach(coin => {
    if (!coin['collected']) {
      ctx.fillStyle = coin.value === 3 ? '#ffd700' : '#c8c8c8';
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  
  // Draw players
  for (let p = 0; p < 4; p++) {
    ctx.fillStyle = playerColors[p];
    ctx.beginPath();
    ctx.arc(playerPositions[p], playerY, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw score
    ctx.fillStyle = playerColors[p];
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`P${p+1}: ${scores[p]}`, playerPositions[p] - 20, playerY - 30);
  }
  
  // Draw timer
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Time: ${(timeLeft / 1000).toFixed(1)}s`, 20, 30);
  
  // Check game end
  if (timeLeft <= 0) {
    finishGame();
  }
}

function gameLoop() {
  if (!gameRunning) {
    // Check if any player presses action to start
    for (let p = 1; p <= 4; p++) {
      if (playerControls.isPressed(p, 'action')) {
        startGame();
        break;
      }
    }
    draw();
    requestAnimationFrame(gameLoop);
    return;
  }
  
  // Handle player movement
  for (let p = 1; p <= 4; p++) {
    const state = playerControls.getPlayerState(p);
    const playerIdx = p - 1;
    
    if (state.up && playerY > 50) {
      playerY -= 3;
    }
    if (state.down && playerY < 300) {
      playerY += 3;
    }
    
    // Check coin collection
    const playerX = playerPositions[playerIdx];
    coins.forEach(coin => {
      if (!coin['collected']) {
        const dist = Math.sqrt((playerX - coin.x) ** 2 + (playerY - coin.y) ** 2);
        if (dist < 30) {
          coin['collected'] = true;
          scores[playerIdx] += coin.value;
        }
      }
    });
  }
  
  draw();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  gameRunning = true;
  startTime = Date.now();
  initCoins();
  scores = [0, 0, 0, 0];
}

function finishGame() {
  gameRunning = false;
  
  const winner = scores.indexOf(Math.max(...scores));
  
  // Send result to host
  window.parent.postMessage({
    type: "RESULT",
    payload: {
      gameId,
      scores,
      winner
    }
  }, "*");
}

// Start game loop
gameLoop();
