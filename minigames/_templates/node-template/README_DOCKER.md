# Running the Node.js Demo Game in Docker

This template includes a complete demo game "Number Guessing Challenge" that can be run in Docker.

## Quick Start

### Build the Docker image:
```bash
docker build -t node-demo .
```

### Run the game:
```bash
docker run -it --rm node-demo
```

The game will prompt for input. Type numbers and press Enter.

### Run with custom arguments:
```bash
docker run -it --rm node-demo node main.js --players 4 --seed 42 --mode jam
```

## What the Demo Game Does

**Number Guessing Challenge** is a 4-player turn-based game:
- 3 rounds of gameplay
- Each round, a random target number (1-100) is chosen
- Players take turns guessing the number
- Points awarded based on how close the guess is:
  - Exact guess: 10 points
  - Within 5: 5 points
  - Within 10: 3 points
  - Within 20: 1 point
  - Beyond 20: 0 points
- After 3 rounds, the player with the most points wins

## How to Play

1. Game starts automatically
2. When prompted, enter a number between 1-100
3. Press Enter to submit your guess
4. Game shows how close you were and awards points
5. Next player's turn
6. After all players guess, next round begins
7. After 3 rounds, final scores are shown

## Output Format

The game outputs results in this format:
```json
RESULT: {"scores": [15, 12, 8, 5], "winner": 0, "meta": {"mode": "jam", "seed": 123, "rounds": 3}}
```

This format is compatible with the board game host system.

## Testing Locally (without Docker)

You can also test locally:
```bash
# Install dependencies (if any)
npm install

# Run the game
node main.js --players 4 --seed 123 --mode jam
```

## Interactive Input

The game uses `readline` for interactive input. When running in Docker with `-it` flags, you can type numbers and press Enter to play.

For automated testing, you can pipe input:
```bash
echo -e "50\n60\n70\n80" | docker run -i --rm node-demo
```
