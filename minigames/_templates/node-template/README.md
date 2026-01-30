# Node.js Template - Development Guide

This template provides a starting point for creating Node.js-based minigames for the Game Jam board game system.

## Quick Start

1. Copy this template to a new directory: `cp -r minigames/_templates/node-template minigames/your-game-name`
2. Update `manifest.json` with your game's unique ID and name
3. Install dependencies: `npm install`
4. Implement your game logic in `main.js`
5. Test locally, then deploy

---

## AI Assistant Instructions

### For Cursor AI

**Context Setup:**
- This is a Node.js console-based minigame template for a 4-player board game system
- The game runs in a terminal/console environment
- Must output JSON results to stdout in format: `{"scores": [p1, p2, p3, p4], "winner": index, "meta": {...}}`
- Supports CLI arguments: `--players`, `--seed`, `--mode`

**Key Files:**
- `main.js` - Main game entry point (must be executable)
- `package.json` - Node.js dependencies and metadata
- `manifest.json` - Game metadata (id, name, type, players, entry)

**Requirements:**
- Must accept CLI args: `--players`, `--seed`, `--mode`
- Must output final result as: `console.log("RESULT:", JSON.stringify(result))`
- Must handle stdin for player input (if needed)
- Must exit with code 0 on success
- Can be single-player or multi-player (typically single-player for console games)

**Common Patterns:**
```javascript
// Parse CLI arguments
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

// Read input from stdin
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  // Handle player input
});

// Output results
const result = {
  scores: [p1_score, p2_score, p3_score, p4_score],
  winner: scores.indexOf(Math.max(...scores)),
  meta: { mode, seed }
};
console.log("RESULT:", JSON.stringify(result));
process.exit(0);
```

### For Amazon Q

**Project Context:**
You are working on a Node.js console-based minigame template for a multiplayer board game system. The template:
- Runs in a terminal/console environment
- Accepts CLI arguments for configuration
- Reads player input from stdin (if needed)
- Outputs JSON results to stdout
- Supports seeded random number generation

**Key Constraints:**
1. **Output Format**: Must output results as:
   ```javascript
   console.log("RESULT:", JSON.stringify({
     scores: [int, int, int, int],  // Array of 4 scores
     winner: int,                    // Index of winner
     meta: { mode: string, ... }     // Game metadata
   }));
   ```

2. **CLI Arguments**: Must accept:
   - `--players <int>`: Number of players (default: 4)
   - `--seed <int>`: Random seed (default: 123)
   - `--mode <string>`: Game mode (default: "jam")

3. **Input Handling**: Use Node.js `readline` interface for stdin:
   ```javascript
   const readline = require('readline');
   const rl = readline.createInterface({
     input: process.stdin,
     output: process.stdout
   });
   ```

4. **Seeded Random**: Implement seeded RNG for deterministic gameplay:
   ```javascript
   let rngSeed = seed;
   function random() {
     rngSeed = (rngSeed * 9301 + 49297) % 233280;
     return rngSeed / 233280;
   }
   ```

5. **Exit Code**: Must exit with code 0 on success, non-zero on error

**Implementation Guidelines:**
- Parse CLI arguments manually (no external dependencies)
- Handle stdin gracefully (may be piped or redirected)
- Implement timeout/duration for game loop
- Ensure deterministic behavior with seed
- Handle errors gracefully (try/catch, proper exit codes)

**File Structure:**
- `main.js` - Entry point, must be executable
- `package.json` - Dependencies (if any)
- `manifest.json` - Game metadata

---

## Docker Instructions

### Building the Docker Image

Node.js games run in a Node.js container with minimal dependencies.

**Base Image:** `node:alpine` (lightweight) or `node:slim` (more compatible)

**Dockerfile Structure:**
```dockerfile
FROM node:alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (if any)
RUN npm install --production

# Copy game files
COPY main.js .
COPY manifest.json .

# Make main.js executable
RUN chmod +x main.js

# Run game
CMD ["node", "main.js", "--players", "4", "--seed", "123", "--mode", "jam"]
```

**Dockerfile with Build Step (if needed):**
```dockerfile
FROM node:alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build  # If you have a build step

FROM node:alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY manifest.json .

CMD ["node", "dist/main.js", "--players", "4", "--seed", "123", "--mode", "jam"]
```

**Testing Locally with Docker:**
```bash
# Build image
docker build -t your-game-name .

# Run container
docker run --rm your-game-name

# Run with custom args
docker run --rm your-game-name node main.js --players 2 --seed 456 --mode test

# Run with stdin input
echo "test input" | docker run -i --rm your-game-name
```

**Integration with Runner:**
The game is executed by the `runner` service which:
1. Runs the game in a container
2. Passes CLI arguments
3. Captures stdout for JSON result parsing
4. Returns scores to the host system

**Environment Variables:**
- `NODE_ENV=production` - Set by default in production
- Custom env vars can be added as needed

---

## Testing Instructions

### Minimum Testing Requirements

#### 1. Local Testing (No Docker)

**Prerequisites:**
- Node.js 18+ (or as specified in package.json)
- npm or yarn

**Basic Test:**
```bash
cd minigames/your-game-name
npm install  # If you have dependencies
node main.js --players 4 --seed 123 --mode test
```

**Expected Output:**
- Game runs without errors
- Game completes within reasonable time
- Console prints: `RESULT: {"scores": [...], "winner": X, "meta": {...}}`
- Process exits with code 0

**Test Cases:**
1. **Argument Parsing Test**: Verify all CLI args are parsed correctly
2. **Seed Consistency Test**: Run with same seed twice, verify deterministic behavior
3. **Result Format Test**: Verify JSON output matches expected format
4. **Input Handling Test**: Test stdin input (if game uses it)
5. **Error Handling Test**: Test with invalid args, verify graceful failure
6. **Duration Test**: Verify game completes within expected time

#### 2. Docker Testing

**Build and Run:**
```bash
# From project root
cd minigames/your-game-name

# Build image
docker build -t your-game-name .

# Run container
docker run --rm your-game-name

# Test with custom args
docker run --rm your-game-name node main.js --players 2 --seed 456 --mode test
```

**Verify:**
- Container builds without errors
- Container runs and completes successfully
- Output is correctly formatted JSON
- No stderr errors (or expected errors only)

#### 3. Integration Testing

**With Runner Service:**
```bash
# Start runner service
cd runner
docker-compose up runner

# In another terminal, test game execution
curl -X POST http://localhost:5001/run \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": "mg-XXX",
    "args": ["--players", "4", "--seed", "123", "--mode", "jam"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "result": {
    "scores": [10, 8, 12, 5],
    "winner": 2,
    "meta": {"mode": "jam", "seed": 123}
  }
}
```

#### 4. Input Testing (if applicable)

**Test stdin input:**
```bash
# Test with piped input
echo -e "input1\ninput2\ninput3" | node main.js --players 1 --seed 123

# Test with interactive input
node main.js --players 1 --seed 123
# Then type input and press Enter
```

**Test Scenarios:**
- Single line input
- Multi-line input
- Empty input
- Timeout handling (if input required but not provided)

### Test Checklist

- [ ] Game runs locally without errors
- [ ] CLI arguments are parsed correctly
- [ ] Result JSON is valid and properly formatted
- [ ] Winner is correctly calculated
- [ ] Seed produces deterministic results
- [ ] Game completes within expected duration
- [ ] Stdin input works (if applicable)
- [ ] Error handling works (invalid args, etc.)
- [ ] Docker build succeeds
- [ ] Docker run completes successfully
- [ ] Output is correctly captured
- [ ] Integration with runner service works

---

## File Structure

```
node-template/
├── main.js         # Main game entry point
├── package.json    # Node.js dependencies
├── manifest.json   # Game metadata
└── README.md       # This file
```

## Manifest.json Format

```json
{
  "id": "mg-XXX",           // Unique game ID (change this!)
  "name": "Your Game Name", // Display name
  "type": "node",           // Must be "node"
  "players": 1,             // Number of players (typically 1 for console games)
  "entry": "main.js"        // Entry point file
}
```

## Package.json Format

```json
{
  "name": "your-game-name",
  "version": "1.0.0",
  "description": "Your game description",
  "main": "main.js",
  "scripts": {
    "start": "node main.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    // Add your dependencies here
  }
}
```

## CLI Argument Parsing

The template includes a simple argument parser. Example usage:

```javascript
const args = process.argv.slice(2);

const getArg = (name, defaultValue) => {
  const idx = args.indexOf(name);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : defaultValue;
};

const players = parseInt(getArg("--players", "4"), 10);
const seed = parseInt(getArg("--seed", "123"), 10);
const mode = getArg("--mode", "jam");
```

## Seeded Random Number Generator

For deterministic gameplay:

```javascript
let rngSeed = seed;

function random() {
  rngSeed = (rngSeed * 9301 + 49297) % 233280;
  return rngSeed / 233280;
}

// Usage
const value = Math.floor(random() * 100);  // 0-99
```

## Reading Input from Stdin

```javascript
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  // Handle input
  console.log(`Received: ${input}`);
  
  // Close when done
  if (input === 'quit') {
    rl.close();
  }
});

// Timeout fallback
setTimeout(() => {
  rl.close();
  finish();
}, 5000);
```

## Common Issues

**Issue: Result not parsed**
- **Solution**: Ensure output is exactly: `console.log("RESULT:", JSON.stringify(result))`

**Issue: Arguments not parsed**
- **Solution**: Check argument format: `--players 4` (space, not equals)

**Issue: Process hangs**
- **Solution**: Ensure readline interface is closed, or implement timeout

**Issue: Non-deterministic behavior**
- **Solution**: Use seeded RNG, avoid `Math.random()`, ensure seed is used consistently

**Issue: Docker build fails**
- **Solution**: Check Node.js version compatibility, verify package.json syntax

**Issue: No output in Docker**
- **Solution**: Ensure stdout is not buffered, use `console.log` not `process.stdout.write` (or flush buffer)

---

## Next Steps

1. Copy this template: `cp -r minigames/_templates/node-template minigames/your-game-name`
2. Update `manifest.json` with your game details
3. Update `package.json` if you need dependencies
4. Implement your game logic in `main.js`
5. Test locally
6. Test with Docker
7. Submit for integration
