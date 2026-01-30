# Running the JavaScript Demo Game in Docker

This template includes a complete demo game "Coin Collector" that can be run in Docker with a simple HTTP server.

## Quick Start

### Build the Docker image:
```bash
docker build -t js-demo .
```

### Run the game server:
```bash
docker run -p 8080:8080 --rm js-demo
```

### Access the game:
Open your browser to: `http://localhost:8080/index.html?gameId=mg-demo`

## What the Demo Game Does

**Coin Collector** is a 4-player competitive game:
- Players press ACTION to start
- Players move up/down in their lanes using arrow keys
- Coins appear randomly on the screen
- Players collect coins by moving over them
- Coins have different values (1, 2, or 3 points)
- After 10 seconds, the player with the most points wins
- Results are automatically sent to the parent window

## Controls

- **Player 1**: W/A/S/D + Space
- **Player 2**: Arrow Keys + Enter
- **Player 3**: I/J/K/L + U
- **Player 4**: T/F/G/H + R

## Integration

The game communicates with the host via `postMessage`:
```javascript
window.parent.postMessage({
  type: "RESULT",
  payload: {
    gameId: "mg-demo",
    scores: [15, 12, 8, 5],
    winner: 0
  }
}, "*");
```

## Testing Locally (without Docker)

You can test locally using any HTTP server:
```bash
# Python
python -m http.server 8080

# Node.js
npx http-server -p 8080

# Then open: http://localhost:8080/index.html?gameId=mg-demo
```
