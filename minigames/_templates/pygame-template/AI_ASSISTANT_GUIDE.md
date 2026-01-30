# AI Assistant Guide: Pygame Minigame Template

This document provides comprehensive instructions for AI coding assistants (Cursor, GitHub Copilot, Amazon Q, etc.) to help developers create compatible minigames for the Game Jam board game system.

## System Overview

This is a **4-player board game system** where minigames are executed in **Docker containers** and must return results in a specific JSON format. The host system automatically calculates prizes (coins/stars) based on player rankings.

## Critical Requirements

### 1. Result Output Format

**MUST output exactly this format to stdout:**

```python
print("RESULT:", json.dumps({
    "scores": [p1_score, p2_score, p3_score, p4_score],  # Array of 4 integers
    "winner": winner_index,  # Integer 0-3 (index of highest score)
    "meta": {}  # Optional: any additional metadata
}))
```

**Example:**
```python
result = {
    "scores": [100, 80, 60, 40],
    "winner": 0,  # Player 1 (index 0) has highest score
    "meta": {"mode": "jam", "time_elapsed": 5.0}
}
print("RESULT:", json.dumps(result))
```

**Why:** The Docker runner (`runner/runner.py`) parses stdout looking for a line starting with `"RESULT:"`. This is the ONLY way results are communicated back to the host.

### 2. Command-Line Arguments

Your `main()` function MUST accept these arguments:

```python
parser = argparse.ArgumentParser()
parser.add_argument("--players", type=int, default=4)  # Always 4 in board game
parser.add_argument("--seed", type=int, default=123)    # Random seed for reproducibility
parser.add_argument("--mode", type=str, default="jam")  # Game mode
args = parser.parse_args()
```

**Why:** The host system calls your game with these arguments via Docker.

### 3. Player Controls

**Standard 4-player keyboard controls:**
- **Player 1**: W/A/S/D + Space
- **Player 2**: Arrow Keys + Enter
- **Player 3**: I/J/K/L + U
- **Player 4**: T/F/G/H + R

**Mobile controller support (optional):**
- Mobile controllers send input via HTTP POST to `/control` endpoint
- Control state is written to `/tmp/pygame_controls.json`
- Use `mobile_controls.py` helper to read mobile input

**Example control handling:**
```python
keys = pygame.key.get_pressed()
input_state = get_player_input(player_num, keys)

# Optional: Merge with mobile controls
if MOBILE_CONTROLS_AVAILABLE:
    mobile_input = get_player_mobile_input(player_num)
    input_state['action'] = input_state['action'] or mobile_input['action']
```

### 4. Docker Container Environment

**Key facts:**
- Games run in a Python 3.11 Docker container
- Virtual display (Xvfb) is available for headless rendering
- Screen resolution: 1280x720 (but games typically use 640x360)
- Display: `:99` (set via `DISPLAY=:99`)
- Timeout: 120 seconds maximum execution time
- Working directory: Game's directory in `/repo/minigames/mg-[game-name]/`

**Dependencies available:**
- pygame (installed via requirements.txt)
- Standard Python libraries
- Xvfb for virtual display

### 5. Manifest.json Format

```json
{
  "id": "mg-[unique-game-id]",
  "name": "Your Game Name",
  "type": "pygame",
  "players": 1,
  "entry": "main.py"
}
```

**Important:**
- `id` must be unique and start with `mg-`
- `type` must be `"pygame"`
- `entry` is the Python file to execute (usually `main.py`)

## Example Game Structure

```python
import argparse
import json
import pygame
import time

def main():
    # 1. Parse arguments (REQUIRED)
    parser = argparse.ArgumentParser()
    parser.add_argument("--players", type=int, default=4)
    parser.add_argument("--seed", type=int, default=123)
    parser.add_argument("--mode", type=str, default="jam")
    args = parser.parse_args()
    
    # 2. Initialize pygame
    pygame.init()
    screen = pygame.display.set_mode((640, 360))
    pygame.display.set_caption("My Game")
    
    # 3. Game loop
    running = True
    scores = [0, 0, 0, 0]  # 4 players
    
    while running:
        # Handle events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
        
        # Get player inputs
        keys = pygame.key.get_pressed()
        # ... game logic ...
        
        # Render
        screen.fill((0, 0, 0))
        # ... draw game ...
        pygame.display.flip()
    
    pygame.quit()
    
    # 4. Output result (REQUIRED)
    result = {
        "scores": scores,  # [p1, p2, p3, p4]
        "winner": scores.index(max(scores)),
        "meta": {"mode": args.mode}
    }
    print("RESULT:", json.dumps(result))

if __name__ == "__main__":
    main()
```

## Common Patterns

### Score-Attack Game
```python
# Players compete to get highest score in time limit
start_time = time.time()
duration = 5.0  # 5 seconds
scores = [0, 0, 0, 0]

while time.time() - start_time < duration:
    keys = pygame.key.get_pressed()
    for p in range(1, 5):
        if get_player_input(p, keys)['action']:
            scores[p-1] += 1
```

### Race Game
```python
# First player to reach goal wins
positions = [0, 0, 0, 0]
goal = 100

while max(positions) < goal:
    keys = pygame.key.get_pressed()
    for p in range(1, 5):
        input_state = get_player_input(p, keys)
        if input_state['up']:
            positions[p-1] += 1
```

### Cooperative Game
```python
# All players work together
team_score = 0
# ... game logic ...
# Distribute score evenly or based on contribution
scores = [team_score // 4] * 4
```

## Testing Locally

**Before deploying to Docker, test locally:**

```bash
# Test with default arguments
python main.py

# Test with specific seed
python main.py --players 4 --seed 42 --mode jam

# Verify output contains "RESULT:" line
python main.py | grep "RESULT:"
```

## Docker Testing

**To test in Docker (if runner is set up):**

```bash
# Build runner image
docker build -t game-runner runner/

# Run your game
docker run --rm -v $(pwd):/repo game-runner \
  python /repo/minigames/mg-your-game/main.py --players 4 --seed 123
```

## Common Mistakes to Avoid

1. **❌ Forgetting to print "RESULT:"** - Host won't receive results
2. **❌ Wrong scores array length** - Must be exactly 4 elements
3. **❌ Not parsing command-line arguments** - Game will fail when called by host
4. **❌ Using hardcoded player count** - Always support 4 players
5. **❌ Not handling pygame.QUIT** - Game may hang
6. **❌ Using wrong control keys** - Must use standard mapping
7. **❌ Not setting random seed** - Games won't be reproducible

## Integration Checklist

- [ ] `main()` function accepts `--players`, `--seed`, `--mode` arguments
- [ ] Game supports 4 players with standard keyboard controls
- [ ] Game outputs `"RESULT:"` line with JSON to stdout
- [ ] Result JSON has `scores` array with exactly 4 integers
- [ ] Result JSON has `winner` integer (0-3)
- [ ] `manifest.json` has correct `id`, `type`, and `entry`
- [ ] Game completes within 120 seconds
- [ ] Game handles pygame.QUIT event
- [ ] Random number generation uses provided seed

## Additional Resources

- See `CONTROLS.md` for detailed control mappings
- See `README_MOBILE.md` for mobile controller integration
- Check `runner/runner.py` to understand how games are executed
- Review `minigames/docs/SCORING_SYSTEM.md` for prize calculation details
