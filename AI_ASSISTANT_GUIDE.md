# AI Assistant Guide: Node.js Minigame Template

This document provides comprehensive instructions for AI coding assistants (Cursor, GitHub Copilot, Amazon Q, etc.) to help developers create compatible console-based minigames for the Game Jam board game system.

## System Overview

This is a **4-player board game system** where Node.js minigames run as **console applications** and must return results in a specific format via stdout. The host system automatically calculates prizes (coins/stars) based on player rankings.

## Critical Requirements

### 1. Result Output Format

**MUST output exactly this format to stdout:**

```javascript
console.log("RESULT:", JSON.stringify({
  scores: [p1_score, p2_score, p3_score, p4_score],  // Array of 4 integers
  winner: winner_index,  // Integer 0-3 (index of highest score)
  meta: {}  // Optional: any additional metadata
}));
```

**Example:**
```javascript
const result = {
  scores: [100, 80, 60, 40],
  winner: 0,  // Player 1 (index 0) has highest score
  meta: { mode: "jam", seed: 123 }
};

console.log("RESULT:", JSON.stringify(result));
```

**Why:** The host system (`host/server.js`) parses stdout looking for a line starting with `"RESULT:"`. This is the ONLY way results are communicated back to the host.

### 2. Command-Line Arguments

Your script MUST accept these arguments:

```javascript
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const idx = args.indexOf(name);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : defaultValue;
};

const players = parseInt(getArg("--players", "4"), 10);  // Always 4 in board game
const seed = parseInt(getArg("--seed", "123"), 10);      // Random seed for reproducibility
const mode = getArg("--mode", "jam");                     // Game mode
```

**Why:** The host system calls your game with these arguments via subprocess.

### 3. Player Input Handling

**Node.js games typically use `readline` for input:**

```javascript
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on("line", (input) => {
  // Process player input
  // Each line represents an action from a player
});
```

**Note:** Since Node.js games run in console, you may need to:
- Use timers for time-based games
- Use readline for turn-based input
- Simulate 4-player gameplay (e.g., run sequentially or use different input methods)

### 4. Console Environment

**Key facts:**
- Games run as Node.js subprocess
- No GUI - pure console/terminal application
- Timeout: Typically 120 seconds maximum execution time
- Working directory: Game's directory in repository
- stdin/stdout are available for I/O

**Available:**
- All Node.js built-in modules
- npm packages (install via `package.json`)
- Standard input/output streams

### 5. Manifest.json Format

```json
{
  "id": "mg-[unique-game-id]",
  "name": "Your Game Name",
  "type": "node",
  "players": 1,
  "entry": "main.js"
}
```

**Important:**
- `id` must be unique and start with `mg-`
- `type` must be `"node"`
- `entry` is the JavaScript file to execute (usually `main.js`)

## Example Game Structure

```javascript
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("Node.js Game - Press Enter to score points!");
console.log(`Players: ${players}, Seed: ${seed}, Mode: ${mode}`);

rl.on("line", (input) => {
  // Award points to current player
  scores[currentPlayer] += 10;
  console.log(`Player ${currentPlayer + 1} scored! Total: ${scores[currentPlayer]}`);
  
  // Rotate to next player
  currentPlayer = (currentPlayer + 1) % players;
  
  // Check win condition (example: first to 100)
  if (scores[currentPlayer] >= 100) {
    finishGame();
  }
});

function finishGame() {
  rl.close();
  
  const winner = scores.indexOf(Math.max(...scores));
  const result = {
    scores,
    winner,
    meta: { mode, seed }
  };
  
  console.log("\nRESULT:", JSON.stringify(result));
  process.exit(0);
}

// Timeout fallback
setTimeout(() => {
  finishGame();
}, 30000);  // 30 second timeout
```

## Common Patterns

### Score-Attack Game
```javascript
let scores = [0, 0, 0, 0];
const startTime = Date.now();
const duration = 5000;  // 5 seconds

rl.on("line", () => {
  const elapsed = Date.now() - startTime;
  if (elapsed >= duration) {
    finishGame();
    return;
  }
  
  // Award point to current player
  scores[currentPlayer]++;
  currentPlayer = (currentPlayer + 1) % 4;
});
```

### Turn-Based Game
```javascript
let currentPlayer = 0;
let scores = [0, 0, 0, 0];

rl.on("line", (input) => {
  // Parse input (e.g., "action", "skip", etc.)
  if (input.trim() === "action") {
    scores[currentPlayer] += 10;
  }
  
  currentPlayer = (currentPlayer + 1) % 4;
  console.log(`Player ${currentPlayer + 1}'s turn`);
});
```

### Time-Based Game
```javascript
const startTime = Date.now();
const duration = 10000;  // 10 seconds

setInterval(() => {
  const elapsed = Date.now() - startTime;
  const remaining = Math.ceil((duration - elapsed) / 1000);
  process.stdout.write(`\rTime remaining: ${remaining}s  `);
  
  if (elapsed >= duration) {
    finishGame();
  }
}, 100);
```

## Testing Locally

**Before deploying, test locally:**

```bash
# Test with default arguments
node main.js

# Test with specific arguments
node main.js --players 4 --seed 42 --mode jam

# Verify output contains "RESULT:" line
node main.js | grep "RESULT:"

# Test with input
echo -e "action\naction\naction" | node main.js
```

## Integration with Host

**How the host runs your game:**

1. Host calls: `node /path/to/main.js --players 4 --seed [random] --mode jam`
2. Your game runs and processes input/output
3. Game outputs `"RESULT:"` line to stdout
4. Host parses stdout and extracts result JSON
5. Host calculates prizes and updates scoreboard

**See `host/server.js` for implementation details.**

## Common Mistakes to Avoid

1. **❌ Forgetting to output "RESULT:"** - Host won't receive results
2. **❌ Wrong scores array length** - Must be exactly 4 elements
3. **❌ Not parsing command-line arguments** - Game will fail when called by host
4. **❌ Not closing readline interface** - Process may hang
5. **❌ Not handling process.exit()** - Game may not terminate
6. **❌ Using Math.random() without seed** - Games won't be reproducible
7. **❌ Not handling timeout** - Game may run indefinitely

## Integration Checklist

- [ ] Script accepts `--players`, `--seed`, `--mode` arguments
- [ ] Game supports 4 players (even if simulated)
- [ ] Game outputs `"RESULT:"` line with JSON to stdout
- [ ] Result JSON has `scores` array with exactly 4 integers
- [ ] Result JSON has `winner` integer (0-3)
- [ ] `manifest.json` has correct `id`, `type: "node"`, and `entry`
- [ ] Game completes within reasonable time (120 seconds)
- [ ] readline interface is properly closed
- [ ] Random number generation uses provided seed
- [ ] `package.json` lists any required dependencies

## Additional Resources

- See `package.json` for dependency management
- Check `host/server.js` to see how games are executed
- Review `minigames/docs/SCORING_SYSTEM.md` for prize calculation details
