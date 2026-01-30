# AI Assistant Guide: JavaScript Minigame Template

This document provides comprehensive instructions for AI coding assistants (Cursor, GitHub Copilot, Amazon Q, etc.) to help developers create compatible browser-based minigames for the Game Jam board game system.

## System Overview

This is a **4-player board game system** where JavaScript minigames run in **browser iframes** and communicate with the host via `postMessage`. The host system automatically calculates prizes (coins/stars) based on player rankings.

## Critical Requirements

### 1. Result Communication Format

**MUST send result via postMessage to parent window:**

```javascript
window.parent.postMessage({
  type: "RESULT",
  payload: {
    gameId: "mg-your-game-id",  // From URL parameter or manifest
    scores: [p1_score, p2_score, p3_score, p4_score],  // Array of 4 integers
    winner: winner_index  // Integer 0-3 (index of highest score)
  }
}, "*");
```

**Example:**
```javascript
const result = {
  gameId: "mg-001",
  scores: [100, 80, 60, 40],
  winner: 0  // Player 1 (index 0) has highest score
};

window.parent.postMessage({
  type: "RESULT",
  payload: result
}, "*");
```

**Why:** The host listens for WebSocket messages with `type: "RESULT"` and automatically calculates prizes based on the scores array.

### 2. Game ID from URL

**Get game ID from URL parameter:**

```javascript
const params = new URLSearchParams(location.search);
const gameId = params.get("gameId") || "mg-XXX";
```

**Why:** The host loads your game in an iframe with `?gameId=mg-your-game-id` parameter.

### 3. Player Controls API

**Use the `playerControls` API (provided by `controls.js`):**

```javascript
// Check if a specific button is pressed
if (playerControls.isPressed(1, 'action')) {
  // Player 1 pressed action button
}

// Get all button states for a player
const p1State = playerControls.getPlayerState(1);
// Returns: { up: false, down: false, left: false, right: false, action: true }

// Get all players' states
const p1 = playerControls.getPlayerState(1);
const p2 = playerControls.getPlayerState(2);
const p3 = playerControls.getPlayerState(3);
const p4 = playerControls.getPlayerState(4);
```

**Standard 4-player controls:**
- **Player 1**: W/A/S/D + Space
- **Player 2**: Arrow Keys + Enter
- **Player 3**: I/J/K/L + U
- **Player 4**: T/F/G/H + R

### 4. Browser Environment

**Key facts:**
- Game runs in an iframe within the host page
- Full access to DOM, Canvas, WebGL, etc.
- No CORS restrictions (same origin)
- Can use any JavaScript libraries (load via CDN or bundle)
- Screen size: Typically 640x360 or 1280x720 (check parent container)

**Available APIs:**
- Standard browser APIs (Canvas, WebGL, Audio, etc.)
- `playerControls` object (from `controls.js`)
- `window.parent.postMessage()` for communication

### 5. Manifest.json Format

```json
{
  "id": "mg-[unique-game-id]",
  "name": "Your Game Name",
  "type": "js",
  "players": 1,
  "entry": "index.html"
}
```

**Important:**
- `id` must be unique and start with `mg-`
- `type` must be `"js"`
- `entry` is the HTML file to load (usually `index.html`)

## Example Game Structure

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Game</title>
  <script src="controls.js"></script>
</head>
<body>
  <canvas id="gameCanvas" width="640" height="360"></canvas>
  <button id="finish">Finish Game</button>
  
  <script>
    const params = new URLSearchParams(location.search);
    const gameId = params.get("gameId") || "mg-XXX";
    
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    
    let scores = [0, 0, 0, 0];
    
    function gameLoop() {
      // Clear canvas
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Check player inputs
      const p1 = playerControls.getPlayerState(1);
      const p2 = playerControls.getPlayerState(2);
      const p3 = playerControls.getPlayerState(3);
      const p4 = playerControls.getPlayerState(4);
      
      // Game logic
      if (p1.action) scores[0]++;
      if (p2.action) scores[1]++;
      if (p3.action) scores[2]++;
      if (p4.action) scores[3]++;
      
      // Render
      ctx.fillStyle = "#fff";
      ctx.font = "24px Arial";
      ctx.fillText(`P1: ${scores[0]} P2: ${scores[1]} P3: ${scores[2]} P4: ${scores[3]}`, 20, 30);
      
      requestAnimationFrame(gameLoop);
    }
    
    document.getElementById("finish").onclick = () => {
      const winner = scores.indexOf(Math.max(...scores));
      
      window.parent.postMessage({
        type: "RESULT",
        payload: {
          gameId,
          scores,
          winner
        }
      }, "*");
    };
    
    gameLoop();
  </script>
</body>
</html>
```

## Common Patterns

### Score-Attack Game
```javascript
let scores = [0, 0, 0, 0];
const startTime = Date.now();
const duration = 5000;  // 5 seconds

function gameLoop() {
  const elapsed = Date.now() - startTime;
  
  if (elapsed >= duration) {
    finishGame();
    return;
  }
  
  // Check inputs
  for (let p = 1; p <= 4; p++) {
    if (playerControls.isPressed(p, 'action')) {
      scores[p - 1]++;
    }
  }
  
  requestAnimationFrame(gameLoop);
}
```

### Race Game
```javascript
let positions = [0, 0, 0, 0];
const goal = 100;

function gameLoop() {
  for (let p = 1; p <= 4; p++) {
    const state = playerControls.getPlayerState(p);
    if (state.up) {
      positions[p - 1] += 2;
    }
  }
  
  if (Math.max(...positions) >= goal) {
    finishGame();
    return;
  }
  
  requestAnimationFrame(gameLoop);
}
```

### Turn-Based Game
```javascript
let currentPlayer = 0;
let scores = [0, 0, 0, 0];

function processTurn() {
  const playerNum = currentPlayer + 1;
  const state = playerControls.getPlayerState(playerNum);
  
  if (state.action) {
    // Process player's action
    scores[currentPlayer] += 10;
    
    // Move to next player
    currentPlayer = (currentPlayer + 1) % 4;
  }
}
```

## Testing Locally

**To test your game locally:**

1. **Open `index.html` directly in browser:**
   ```bash
   # Add gameId parameter manually
   open "index.html?gameId=mg-test"
   ```

2. **Use a local server:**
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx http-server
   
   # Then open: http://localhost:8000/index.html?gameId=mg-test
   ```

3. **Mock playerControls for testing:**
   ```javascript
   // Add to your HTML for local testing
   if (typeof playerControls === 'undefined') {
     window.playerControls = {
       isPressed: (player, button) => false,
       getPlayerState: (player) => ({
         up: false, down: false, left: false, right: false, action: false
       })
     };
   }
   ```

## Integration with Host

**How the host loads your game:**

1. Host creates an iframe: `<iframe src="/minigames/mg-your-game/index.html?gameId=mg-your-game"></iframe>`
2. Your game loads and runs
3. When finished, you send `postMessage` with results
4. Host receives message via WebSocket and calculates prizes
5. Host updates scoreboard and continues board game

## Common Mistakes to Avoid

1. **❌ Not sending postMessage** - Host won't receive results
2. **❌ Wrong message format** - Must have `type: "RESULT"` and `payload` object
3. **❌ Wrong scores array length** - Must be exactly 4 elements
4. **❌ Not using playerControls API** - Keyboard events won't work correctly
5. **❌ Hardcoding game ID** - Must read from URL parameter
6. **❌ Not handling missing controls.js** - Game will crash if file missing
7. **❌ Using window.addEventListener for keyboard** - Use playerControls instead

## Integration Checklist

- [ ] Game reads `gameId` from URL parameter
- [ ] Game uses `playerControls` API for input
- [ ] Game sends result via `window.parent.postMessage()`
- [ ] Result message has `type: "RESULT"`
- [ ] Result payload has `gameId`, `scores` (4 elements), and `winner`
- [ ] `manifest.json` has correct `id`, `type: "js"`, and `entry: "index.html"`
- [ ] Game works in iframe (no fullscreen requests, etc.)
- [ ] All assets load correctly (images, sounds, etc.)

## Additional Resources

- See `controls.js` for playerControls API implementation
- Check `host/server.js` to see how games are loaded
- Review `minigames/docs/SCORING_SYSTEM.md` for prize calculation details
