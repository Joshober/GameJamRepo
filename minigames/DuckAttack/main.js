const readline = require("readline");

// Parse command-line arguments
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const idx = args.indexOf(name);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : defaultValue;
};

const players = parseInt(getArg("--players", "4"), 10);
const seed = parseInt(getArg("--seed", "123"), 10);
const mode = getArg("--mode", "jam");

// Seeded random number generator
let rngSeed = seed;
function random() {
  rngSeed = (rngSeed * 9301 + 49297) % 233280;
  return rngSeed / 233280;
}

// Game state
let scores = [0, 0, 0, 0];
let currentPlayer = 0;
let ducks = [];
let gameRunning = true;
const gameDuration = 60000; // 60 seconds
const startTime = Date.now();

// Duck object
class Duck {
  constructor() {
    this.id = Math.floor(random() * 1000);
    this.position = Math.floor(random() * 10) + 1; // Position 1-10
    this.speed = Math.floor(random() * 3) + 1; // Speed 1-3
    this.points = this.speed * 10; // Faster ducks worth more points
    this.alive = true;
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("🦆 DUCK SHOOTING GALLERY 🦆");
console.log("Shoot the ducks by typing their position number!");
console.log(`Players: ${players}, Seed: ${seed}, Mode: ${mode}`);
console.log("Controls: Type duck position (1-10) + Enter to shoot");
console.log("Game duration: 60 seconds\n");

// Spawn initial ducks
function spawnDuck() {
  if (ducks.length < 5 && random() < 0.3) {
    ducks.push(new Duck());
  }
}

// Display game state
function displayGame() {
  if (!gameRunning) return;
  
  const elapsed = Date.now() - startTime;
  const remaining = Math.ceil((gameDuration - elapsed) / 1000);
  
  console.clear();
  console.log("🦆 DUCK SHOOTING GALLERY 🦆");
  console.log(`Time remaining: ${remaining}s`);
  console.log(`Current player: Player ${currentPlayer + 1}`);
  console.log("");
  
  // Display scores
  console.log("SCORES:");
  for (let i = 0; i < 4; i++) {
    console.log(`Player ${i + 1}: ${scores[i]} points`);
  }
  console.log("");
  
  // Display ducks
  if (ducks.length === 0) {
    console.log("No ducks in sight... waiting for ducks to appear...");
  } else {
    console.log("DUCKS:");
    ducks.forEach(duck => {
      if (duck.alive) {
        const speedIndicator = "🏃".repeat(duck.speed);
        console.log(`Position ${duck.position}: 🦆 ${speedIndicator} (${duck.points} pts)`);
      }
    });
  }
  
  console.log("\nType duck position (1-10) to shoot, or 'pass' to skip turn:");
}

// Handle player input
rl.on("line", (input) => {
  if (!gameRunning) return;
  
  const command = input.trim().toLowerCase();
  
  if (command === "pass") {
    console.log(`Player ${currentPlayer + 1} passed their turn.`);
    nextPlayer();
    return;
  }
  
  const position = parseInt(command, 10);
  if (isNaN(position) || position < 1 || position > 10) {
    console.log("Invalid input! Type a number 1-10 or 'pass'");
    return;
  }
  
  // Check if there's a duck at that position
  let hit = false;
  for (let i = 0; i < ducks.length; i++) {
    if (ducks[i].alive && ducks[i].position === position) {
      scores[currentPlayer] += ducks[i].points;
      console.log(`💥 Player ${currentPlayer + 1} shot a duck! +${ducks[i].points} points!`);
      ducks[i].alive = false;
      hit = true;
      break;
    }
  }
  
  if (!hit) {
    console.log(`💨 Player ${currentPlayer + 1} missed! No duck at position ${position}`);
  }
  
  // Remove dead ducks
  ducks = ducks.filter(duck => duck.alive);
  
  nextPlayer();
});

function nextPlayer() {
  currentPlayer = (currentPlayer + 1) % players;
  setTimeout(() => {
    if (gameRunning) displayGame();
  }, 1000);
}

function finishGame() {
  gameRunning = false;
  rl.close();
  
  const winner = scores.indexOf(Math.max(...scores));
  const result = {
    scores,
    winner,
    meta: { mode, seed, duration: gameDuration }
  };
  
  console.log("\n🎯 GAME OVER! 🎯");
  console.log("Final Scores:");
  for (let i = 0; i < 4; i++) {
    console.log(`Player ${i + 1}: ${scores[i]} points ${i === winner ? '👑' : ''}`);
  }
  console.log(`\nWinner: Player ${winner + 1}!`);
  
  console.log("\nRESULT:", JSON.stringify(result));
  process.exit(0);
}

// Game loop
const gameInterval = setInterval(() => {
  const elapsed = Date.now() - startTime;
  
  if (elapsed >= gameDuration) {
    clearInterval(gameInterval);
    finishGame();
    return;
  }
  
  // Spawn new ducks
  spawnDuck();
  
  // Move existing ducks
  ducks.forEach(duck => {
    if (random() < 0.4) {
      duck.position = Math.floor(random() * 10) + 1;
    }
  });
}, 2000);

// Initial display
displayGame();

// Timeout fallback
setTimeout(() => {
  if (gameRunning) {
    finishGame();
  }
}, gameDuration + 5000);