# Running the Pygame Demo Game in Docker

This template includes a complete demo game "Coin Collector" that can be run in Docker.

## Quick Start

### Build the Docker image:
```bash
docker build -t pygame-demo .
```

### Run the game:
```bash
docker run --rm pygame-demo
```

The game will run for 10 seconds and output the result in JSON format.

### Run with custom arguments:
```bash
docker run --rm pygame-demo python main.py --players 4 --seed 42 --mode jam
```

## What the Demo Game Does

**Coin Collector** is a 4-player competitive game:
- Players move up/down in their lanes
- Coins appear randomly on the screen
- Players collect coins by moving over them
- Coins have different values (1, 2, or 3 points)
- After 10 seconds, the player with the most points wins

## Controls

- **Player 1**: W/S (up/down) - WASD layout
- **Player 2**: Arrow Up/Down
- **Player 3**: I/K (up/down) - IJKL layout  
- **Player 4**: T/G (up/down) - TFGH layout

## Output Format

The game outputs results in this format:
```json
RESULT: {"scores": [15, 12, 8, 5], "winner": 0, "meta": {"mode": "jam", "total_coins": 40}}
```

This format is compatible with the board game host system.

## Testing Locally (without Docker)

You can also test locally:
```bash
# Install dependencies
pip install -r requirements.txt

# Run the game
python main.py --players 4 --seed 123 --mode jam
```

Note: You may need to set up a display or use Xvfb for headless operation.
