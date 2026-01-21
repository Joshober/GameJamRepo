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

// Example: score-attack game - press Enter as many times as possible in 5 seconds
console.log("Node.js Template - Score Attack");
console.log("Press Enter as many times as you can in 5 seconds!");

let points = 0;
const startTime = Date.now();
const duration = 5000; // 5 seconds

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const checkTime = () => {
  const elapsed = Date.now() - startTime;
  if (elapsed >= duration) {
    rl.close();
    finish();
  }
};

rl.on("line", () => {
  points++;
  process.stdout.write(`\rPoints: ${points}  `);
  checkTime();
});

// Timeout fallback
setTimeout(() => {
  rl.close();
  finish();
}, duration);

function finish() {
  // Convert score-attack into Mario-Party-ish scoring for 4 players
  // In Option 1, you can run it once per player and compare, OR keep it single-player.
  // For now, return points for P1 and 0 for others.
  const result = {
    scores: [points, 0, 0, 0],
    winner: 0,
    meta: { mode, seed, points }
  };
  console.log("\nRESULT:", JSON.stringify(result));
  process.exit(0);
}
