# Standard 4-Player Control Scheme

All minigames use this standardized control mapping for consistency:

## Player 1
- **Movement**: W (up), S (down), A (left), D (right)
- **Action**: Space

## Player 2
- **Movement**: Arrow Keys (↑ ↓ ← →)
- **Action**: Enter

## Player 3
- **Movement**: I (up), K (down), J (left), L (right)
- **Action**: U

## Player 4
- **Movement**: T (up), G (down), F (left), H (right)
- **Action**: R

## Usage in Games

### JavaScript Games
Include `controls.js` and use the global `playerControls` object:

```javascript
// Check if player 1's action button is pressed
if (playerControls.isPressed(1, 'action')) {
  // Do something
}

// Get all inputs for a player
const p1 = playerControls.getPlayerState(1);
if (p1.up) { /* player moving up */ }
if (p1.action) { /* player pressing action */ }
```

### Pygame Games
Use the `CONTROLS` dictionary and `get_player_input()` helper:

```python
keys = pygame.key.get_pressed()
p1_input = get_player_input(1, keys)
if p1_input['action']:
    # Do something
```
