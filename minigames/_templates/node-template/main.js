import { createInterface } from "readline";

// Simple argparse-like parsing
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const idx = args.indexOf(name);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : defaultValue;
};

const players = parseInt(getArg("--players", "4"), 10);
const seed = parseInt(getArg("--seed", "123"), 10);
const mode = getArg("--mode", "jam");

// Simple seeded random
let rngSeed = seed;
function random() {
  rngSeed = (rngSeed * 9301 + 49297) % 233280;
  return rngSeed / 233280;
}

// Demo Game: Number Guessing Challenge
// Each player takes turns guessing a number. Closest guess wins points!

console.log("=".repeat(50));
console.log("Number Guessing Challenge - Demo Game");
console.log("=".repeat(50));
console.log(`Players: ${players}, Seed: ${seed}, Mode: ${mode}\n`);

let scores = [0, 0, 0, 0];
let currentRound = 0;
const totalRounds = 3;
let currentPlayer = 0;
let targetNumber = 0;
let roundStarted = false;

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function startRound() {
  if (currentRound >= totalRounds) {
    finishGame();
    return;
  }
  
  currentRound++;
  targetNumber = Math.floor(random() * 100) + 1; // 1-100
  currentPlayer = 0;
  roundStarted = true;
  
  console.log(`\n--- Round ${currentRound} of ${totalRounds} ---`);
  console.log(`Target number: ??? (1-100)`);
  console.log(`Player ${currentPlayer + 1}'s turn! Guess a number (1-100):`);
}

function processGuess(input) {
  const guess = parseInt(input.trim(), 10);
  
  if (isNaN(guess) || guess < 1 || guess > 100) {
    console.log("Invalid! Please enter a number between 1 and 100:");
    return;
  }
  
  const distance = Math.abs(guess - targetNumber);
  let points = 0;
  
  if (distance === 0) {
    points = 10; // Exact guess!
    console.log(`🎯 EXACT! Player ${currentPlayer + 1} gets 10 points!`);
  } else if (distance <= 5) {
    points = 5; // Very close
    console.log(`🔥 Very close! Player ${currentPlayer + 1} gets 5 points! (${distance} away)`);
  } else if (distance <= 10) {
    points = 3; // Close
    console.log(`✨ Close! Player ${currentPlayer + 1} gets 3 points! (${distance} away)`);
  } else if (distance <= 20) {
    points = 1; // Not bad
    console.log(`👍 Not bad! Player ${currentPlayer + 1} gets 1 point! (${distance} away)`);
  } else {
    points = 0;
    console.log(`😅 Too far! Player ${currentPlayer + 1} gets 0 points! (${distance} away)`);
  }
  
  scores[currentPlayer] += points;
  console.log(`Current scores: P1:${scores[0]} P2:${scores[1]} P3:${scores[2]} P4:${scores[3]}`);
  console.log(`The target was: ${targetNumber}\n`);
  
  // Move to next player
  currentPlayer = (currentPlayer + 1) % players;
  
  if (currentPlayer === 0) {
    // All players have guessed, start next round
    setTimeout(() => {
      startRound();
    }, 1000);
  } else {
    console.log(`Player ${currentPlayer + 1}'s turn! Guess a number (1-100):`);
  }
}

rl.on("line", (input) => {
  if (!roundStarted) {
    startRound();
    return;
  }
  
  processGuess(input);
});

// Start the game
console.log("Welcome! Each player will guess a number. Closest to the target wins points!");
console.log("Press Enter to start the first round...\n");

// Timeout fallback (30 seconds total)
setTimeout(() => {
  if (roundStarted) {
    console.log("\n⏰ Time's up! Finishing game...");
    finishGame();
  }
}, 30000);

function finishGame() {
  rl.close();
  
  console.log("\n" + "=".repeat(50));
  console.log("Final Scores:");
  console.log("=".repeat(50));
  scores.forEach((score, idx) => {
    console.log(`Player ${idx + 1}: ${score} points`);
  });
  
  const winner = scores.indexOf(Math.max(...scores));
  console.log(`\n🏆 Winner: Player ${winner + 1}!\n`);
  
  const result = {
    scores,
    winner,
    meta: { mode, seed, rounds: currentRound }
  };
  
  console.log("RESULT:", JSON.stringify(result));
  process.exit(0);
}
