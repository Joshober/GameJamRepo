# JavaScript Template - Development Guide

This template provides a starting point for creating browser-based JavaScript minigames for the Game Jam board game system.

## Quick Start

1. Copy this template to a new directory: `cp -r minigames/_templates/js-template minigames/your-game-name`
2. Update `manifest.json` with your game's unique ID and name
3. Implement your game logic in `game.js`
4. Test locally, then deploy

---

## AI Assistant Instructions

### For Cursor AI

**Context Setup:**
- This is a browser-based JavaScript minigame template for a 4-player board game system
- The game runs in an iframe and communicates with the parent window via `postMessage`
- Must send results in format: `{type: "RESULT", payload: {gameId, scores: [p1, p2, p3, p4], winner}}`
- Supports 4 players via the `playerControls` API

**Key Files:**
- `index.html` - Main HTML file (loaded in iframe)
- `game.js` - Game logic implementation
- `controls.js` - Player controls API (provided by host)
- `manifest.json` - Game metadata (id, name, type, players, entry)

**Requirements:**
- Must be a single-page HTML application
- Must use `playerControls` API for input (loaded from host)
- Must send results via `window.parent.postMessage()`
- Game runs in an iframe, so no direct DOM access to parent
- Must handle 4 players simultaneously

**Common Patterns:**
```javascript
// Get player input
const p1 = playerControls.getPlayerState(1);
const p2 = playerControls.getPlayerState(2);
const p3 = playerControls.getPlayerState(3);
const p4 = playerControls.getPlayerState(4);

// Check if button pressed
if (p1.action) {
  // Handle action
}

// Send results
window.parent.postMessage({
  type: "RESULT",
  payload: {
    gameId: "mg-XXX",
    scores: [p1_score, p2_score, p3_score, p4_score],
    winner: scores.indexOf(Math.max(...scores))
  }
}, "*");
```

**Player Controls API:**
- `playerControls.getPlayerState(playerNum)` - Get all button states for a player (1-4)
- `playerControls.isPressed(playerNum, button)` - Check if specific button is pressed
- Available buttons: `'up'`, `'down'`, `'left'`, `'right'`, `'action'`

### For Amazon Q

**Project Context:**
You are working on a browser-based JavaScript minigame template for a multiplayer board game system. The template:
- Runs in an iframe within the host application
- Communicates via `postMessage` API
- Supports 4-player local multiplayer
- Uses `playerControls` API for input handling

**Key Constraints:**
1. **Communication Protocol**: Must send results via:
   ```javascript
   window.parent.postMessage({
     type: "RESULT",
     payload: {
       gameId: string,      // Game ID from manifest
       scores: [int, int, int, int],  // Array of 4 scores
       winner: int           // Optional: index of winner
     }
   }, "*");
   ```

2. **Player Controls**: Use `playerControls` API:
   - `playerControls.getPlayerState(playerNum)` returns object with `{up, down, left, right, action}`
   - `playerControls.isPressed(playerNum, button)` returns boolean
   - Player numbers: 1, 2, 3, 4

3. **Game ID**: Get from URL params: `const gameId = new URLSearchParams(location.search).get("gameId")`

4. **Finish Button**: Must have element with `id="finish"` that triggers result submission

**Implementation Guidelines:**
- Use `requestAnimationFrame` for game loop
- Handle window resize if needed
- Ensure game is responsive (iframe size varies)
- Test in iframe context (not standalone)
- Use relative units (%, vw, vh) for responsive design

**File Structure:**
- `index.html` - Entry point, loads controls.js and game.js
- `game.js` - Your game logic
- `controls.js` - Player controls API (provided by host, don't modify)
- `manifest.json` - Game metadata

---

## Docker Instructions

### Building the Docker Image

JavaScript games run in a simple web server container (nginx or similar).

**Base Image Options:**
- `nginx:alpine` - Lightweight, production-ready
- `node:alpine` - If you need Node.js for build steps
- `httpd:alpine` - Apache alternative

**Dockerfile Structure (nginx):**
```dockerfile
FROM nginx:alpine

# Copy game files
COPY index.html /usr/share/nginx/html/
COPY game.js /usr/share/nginx/html/
COPY controls.js /usr/share/nginx/html/
COPY manifest.json /usr/share/nginx/html/

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

**Dockerfile Structure (Node.js with build):**
```dockerfile
FROM node:alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Testing Locally with Docker:**
```bash
# Build image
docker build -t your-game-name .

# Run container
docker run -p 8080:80 your-game-name

# Access at http://localhost:8080
```

**Integration with Host:**
The game is loaded by the host application in an iframe:
```html
<iframe src="http://game-server:80/?gameId=mg-XXX"></iframe>
```

The host provides `controls.js` which injects the `playerControls` API.

---

## Testing Instructions

### Minimum Testing Requirements

#### 1. Local Testing (Standalone)

**Prerequisites:**
- Web server (nginx, Apache, or Python's http.server)
- Modern browser

**Basic Test:**
```bash
cd minigames/your-game-name

# Using Python
python -m http.server 8000

# Using Node.js
npx http-server -p 8000

# Access at http://localhost:8000
```

**Expected Behavior:**
- Page loads without errors
- Game displays correctly
- Player controls work (if testing with mock controls.js)
- Finish button triggers result message

**Test with Mock Controls:**
Create a mock `controls.js` for standalone testing:
```javascript
// Mock playerControls for testing
window.playerControls = {
  getPlayerState: (num) => ({
    up: false, down: false, left: false, right: false, action: false
  }),
  isPressed: (num, button) => false
};

// Mock keyboard input
document.addEventListener('keydown', (e) => {
  const keyMap = {
    'w': () => window.playerControls.getPlayerState(1).up = true,
    'a': () => window.playerControls.getPlayerState(1).left = true,
    's': () => window.playerControls.getPlayerState(1).down = true,
    'd': () => window.playerControls.getPlayerState(1).right = true,
    ' ': () => window.playerControls.getPlayerState(1).action = true,
  };
  if (keyMap[e.key.toLowerCase()]) keyMap[e.key.toLowerCase()]();
});
```

#### 2. Iframe Testing

**Test in iframe context:**
```html
<!-- test-iframe.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Game Test</title>
</head>
<body>
  <iframe src="http://localhost:8000/?gameId=mg-XXX" width="1280" height="720"></iframe>
  <script>
    window.addEventListener('message', (e) => {
      console.log('Game result:', e.data);
    });
  </script>
</body>
</html>
```

**Verify:**
- Game loads in iframe
- No CORS errors
- postMessage works correctly
- Result message received by parent

#### 3. Docker Testing

**Build and Run:**
```bash
# Build image
docker build -t your-game-name .

# Run container
docker run -p 8080:80 your-game-name

# Test in browser
open http://localhost:8080
```

**Verify:**
- Container starts without errors
- Game loads correctly
- No 404 errors for assets
- Game is playable

#### 4. Integration Testing

**With Host Application:**
1. Deploy game to game server
2. Update host's game registry with your game ID
3. Load game in host application
4. Test with 4 players
5. Verify results are received correctly

**Test Scenarios:**
- All 4 players can provide input
- Game completes and sends results
- Results are correctly formatted
- Winner is correctly identified
- Game handles edge cases (timeout, errors)

### Test Checklist

- [ ] Game loads in standalone mode
- [ ] Game loads in iframe
- [ ] Player controls API works
- [ ] All 4 players can provide input
- [ ] Result message is sent correctly
- [ ] Result format is valid JSON
- [ ] Winner is correctly calculated
- [ ] Game is responsive (works at different sizes)
- [ ] No console errors
- [ ] Docker build succeeds
- [ ] Docker run serves game correctly
- [ ] Integration with host works

---

## File Structure

```
js-template/
├── index.html      # Main HTML file
├── game.js         # Game logic
├── controls.js      # Player controls API (provided by host)
├── manifest.json   # Game metadata
└── README.md       # This file
```

## Manifest.json Format

```json
{
  "id": "mg-XXX",           // Unique game ID (change this!)
  "name": "Your Game Name", // Display name
  "type": "js",             // Must be "js"
  "players": 4,             // Number of players (1-4)
  "entry": "index.html"     // Entry point file
}
```

## Player Controls API

The `playerControls` object is provided by the host application via `controls.js`.

**Methods:**
- `getPlayerState(playerNum)` - Returns object with button states:
  ```javascript
  {
    up: boolean,
    down: boolean,
    left: boolean,
    right: boolean,
    action: boolean
  }
  ```
- `isPressed(playerNum, button)` - Returns boolean for specific button
  - `button`: `'up'`, `'down'`, `'left'`, `'right'`, `'action'`

**Example Usage:**
```javascript
// Get all inputs for player 1
const p1 = playerControls.getPlayerState(1);
if (p1.action) {
  // Player 1 pressed action button
}

// Check specific button
if (playerControls.isPressed(2, 'up')) {
  // Player 2 pressed up
}
```

## Communication Protocol

**Sending Results:**
```javascript
window.parent.postMessage({
  type: "RESULT",
  payload: {
    gameId: "mg-XXX",
    scores: [10, 8, 12, 5],  // Array of 4 scores
    winner: 2                // Optional: index of winner
  }
}, "*");
```

**Receiving Messages (optional):**
```javascript
window.addEventListener('message', (e) => {
  if (e.data.type === 'START') {
    // Game started
  } else if (e.data.type === 'STOP') {
    // Game stopped
  }
});
```

## Common Issues

**Issue: playerControls is undefined**
- **Solution**: Ensure `controls.js` is loaded before `game.js` in HTML

**Issue: postMessage not received**
- **Solution**: Check iframe src includes `gameId` param, verify parent window is listening

**Issue: CORS errors**
- **Solution**: Ensure game server allows iframe embedding (no X-Frame-Options: DENY)

**Issue: Game not responsive**
- **Solution**: Use CSS relative units (%, vw, vh) and responsive design patterns

**Issue: Controls not working**
- **Solution**: Verify `playerControls` API is loaded, check browser console for errors

---

## Next Steps

1. Copy this template: `cp -r minigames/_templates/js-template minigames/your-game-name`
2. Update `manifest.json` with your game details
3. Implement your game logic in `game.js`
4. Test locally (standalone and iframe)
5. Test with Docker
6. Deploy and integrate with host
