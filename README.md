# Pygame Template - Development Guide

This template provides a starting point for creating Pygame-based minigames for the Game Jam board game system.

## Quick Start

1. Copy this template to a new directory: `cp -r minigames/_templates/pygame-template minigames/your-game-name`
2. Update `manifest.json` with your game's unique ID and name
3. Implement your game logic in `main.py`
4. Test locally, then deploy

---

## AI Assistant Instructions

### For Cursor AI

**Context Setup:**
- This is a Pygame minigame template for a 4-player board game system
- The game must output JSON results in format: `{"scores": [p1, p2, p3, p4], "winner": index, "meta": {...}}`
- Supports 4 players with standard keyboard controls (WASD, Arrows, IJKL, TFGH)
- Optional mobile controller support via `mobile_controls.py`

**Key Files:**
- `main.py` - Main game entry point (must have `main()` function)
- `manifest.json` - Game metadata (id, name, type, players, entry)
- `mobile_controls.py` - Optional mobile controller integration

**Requirements:**
- Must accept CLI args: `--players`, `--seed`, `--mode`
- Must print final result as: `print("RESULT:", json.dumps(result))`
- Screen size: 640x360 (can be changed, but keep reasonable)
- Game duration: Typically 30-120 seconds
- Must handle 4 players simultaneously

**Common Patterns:**
```python
# Get player input
input_state = get_player_input(player_num, keys)

# Merge mobile controls (if available)
if MOBILE_CONTROLS_AVAILABLE:
    mobile_input = get_player_mobile_input(player_num)
    input_state['action'] = input_state['action'] or mobile_input['action']

# Return results
result = {
    "scores": [p1_score, p2_score, p3_score, p4_score],
    "winner": scores.index(max(scores)),
    "meta": {"mode": args.mode}
}
print("RESULT:", json.dumps(result))
```

### For Amazon Q

**Project Context:**
You are working on a Pygame-based minigame template for a multiplayer board game system. The template supports:
- 4-player local multiplayer
- Standard keyboard controls (WASD, Arrow keys, IJKL, TFGH)
- Optional mobile controller support
- JSON-based result reporting

**Key Constraints:**
1. **Output Format**: Must print results as `print("RESULT:", json.dumps(result))` where result contains:
   - `scores`: Array of 4 integers (one per player)
   - `winner`: Integer index of winning player
   - `meta`: Object with game metadata

2. **CLI Arguments**: Must accept:
   - `--players <int>`: Number of players (default: 4)
   - `--seed <int>`: Random seed (default: 123)
   - `--mode <string>`: Game mode (default: "jam")

3. **Player Controls**:
   - Player 1: WASD + Space
   - Player 2: Arrow keys + Enter
   - Player 3: IJKL + U
   - Player 4: TFGH + R

4. **Mobile Support**: Optional `mobile_controls.py` provides `get_player_mobile_input(player_num)` function

**Implementation Guidelines:**
- Use `get_player_input(player_num, keys)` to get keyboard input
- Merge mobile input if `MOBILE_CONTROLS_AVAILABLE` is True
- Game loop should run for a fixed duration (typically 30-120 seconds)
- Update `manifest.json` with unique game ID and name

---

## Docker Instructions

### Building the Docker Image

The game runs in a Docker container with a virtual display (Xvfb) for headless operation.

**Base Image:** `python:3.11-slim`

**Required System Dependencies:**
- `xvfb` - Virtual framebuffer for headless display
- `libsdl2-*` - Pygame dependencies
- `libgl1` - OpenGL support

**Dockerfile Structure:**
```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    libsdl2-2.0-0 \
    libsdl2-image-2.0-0 \
    libsdl2-mixer-2.0-0 \
    libsdl2-ttf-2.0-0 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Start Xvfb then run game
CMD ["bash", "-lc", "Xvfb :99 -screen 0 1280x720x24 & python main.py --players 4 --seed 123 --mode jam"]
```

**Environment Variables:**
- `DISPLAY=:99` - Virtual display (set automatically by Xvfb)

**Testing Locally with Docker:**
```bash
# Build image
docker build -t your-game-name .

# Run container
docker run --rm your-game-name

# Run with custom args
docker run --rm your-game-name python main.py --players 2 --seed 456 --mode test
```

**Integration with Runner:**
The game is executed by the `runner` service which:
1. Starts Xvfb virtual display
2. Runs the game with provided arguments
3. Captures stdout for JSON result parsing
4. Returns scores to the host system

---

## Testing Instructions

### Minimum Testing Requirements

#### 1. Local Testing (No Docker)

**Prerequisites:**
- Python 3.11+
- Pygame 2.5.2+
- Display available (or use Xvfb)

**Basic Test:**
```bash
cd minigames/your-game-name
python main.py --players 4 --seed 123 --mode test
```

**Expected Output:**
- Game window opens
- Game runs for specified duration
- Console prints: `RESULT: {"scores": [...], "winner": X, "meta": {...}}`
- Window closes cleanly

**Test Cases:**
1. **4-Player Input Test**: Verify all 4 players can provide input simultaneously
2. **Result Format Test**: Verify JSON output matches expected format
3. **Seed Consistency Test**: Run with same seed twice, verify deterministic behavior
4. **Duration Test**: Verify game ends at correct time
5. **Winner Calculation Test**: Verify winner is correctly identified from scores

#### 2. Docker Testing

**Build and Run:**
```bash
# From project root
cd runner
docker build -t game-runner .
cd ../minigames/your-game-name
docker build -t your-game-name .

# Test with runner
docker run --rm your-game-name python main.py --players 4 --seed 123 --mode jam
```

**Verify:**
- Container starts without errors
- Game completes and outputs JSON result
- No display errors (Xvfb handles headless operation)

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
    "meta": {"mode": "jam"}
  }
}
```

#### 4. Mobile Controls Testing (Optional)

If implementing mobile controls:
```bash
# Test mobile input simulation
python -c "from mobile_controls import get_player_mobile_input; print(get_player_mobile_input(1))"
```

**Test Scenarios:**
- Mobile input overrides keyboard input
- Mobile input merges correctly with keyboard
- All 4 players can use mobile controls simultaneously

### Test Checklist

- [ ] Game runs locally without errors
- [ ] All 4 players can provide input
- [ ] Result JSON is valid and properly formatted
- [ ] Winner is correctly calculated
- [ ] Game duration is respected
- [ ] Seed produces deterministic results
- [ ] Docker build succeeds
- [ ] Docker run completes successfully
- [ ] No display errors in headless mode
- [ ] Mobile controls work (if implemented)
- [ ] Integration with runner service works

---

## File Structure

```
pygame-template/
├── main.py                 # Main game entry point
├── manifest.json           # Game metadata
├── mobile_controls.py      # Optional mobile controller support
├── README.md              # This file
└── requirements.txt       # Python dependencies (if needed)
```

## Manifest.json Format

```json
{
  "id": "mg-XXX",           // Unique game ID (change this!)
  "name": "Your Game Name", // Display name
  "type": "pygame",         // Must be "pygame"
  "players": 4,             // Number of players (1-4)
  "entry": "main.py"        // Entry point file
}
```

## Common Issues

**Issue: Display not found**
- **Solution**: Use Xvfb for headless operation: `xvfb-run -a python main.py`

**Issue: Result not parsed**
- **Solution**: Ensure output is exactly: `print("RESULT:", json.dumps(result))`

**Issue: Mobile controls not working**
- **Solution**: Check `mobile_controls.py` exists and `MOBILE_CONTROLS_AVAILABLE` is True

**Issue: Game runs too long**
- **Solution**: Implement time-based game loop with duration check

---

## Next Steps

1. Copy this template: `cp -r minigames/_templates/pygame-template minigames/your-game-name`
2. Update `manifest.json` with your game details
3. Implement your game logic in `main.py`
4. Test locally
5. Test with Docker
6. Submit for integration
