# Mobile Controller Support for Pygame Games

Pygame games can now receive input from mobile controllers!

## How It Works

1. Players scan the QR code and connect their phones as controllers
2. Mobile control events are forwarded to the runner service
3. The runner writes control state to a shared file (`/tmp/pygame_controls.json`)
4. Your pygame game reads from this file using the `mobile_controls` helper

## Using Mobile Controls in Your Game

The template includes `mobile_controls.py` which provides:

```python
from mobile_controls import get_player_mobile_input

# In your game loop:
mobile_input = get_player_mobile_input(player_num)
if mobile_input['action']:
    # Player pressed action button on mobile
    pass
```

## Example

The template's `main.py` already shows how to merge keyboard and mobile input:

```python
# Get keyboard input
input_state = get_player_input(p, keys)

# Get mobile controller input (if available)
if MOBILE_CONTROLS_AVAILABLE:
    mobile_input = get_player_mobile_input(p)
    # Merge mobile controls with keyboard
    input_state['action'] = input_state['action'] or mobile_input['action']
```

## Control Buttons

Mobile controllers send these button names:
- `up`, `down`, `left`, `right` - Directional buttons
- `action` - Action button

These map to the same controls as keyboard:
- Player 1: WASD + Space
- Player 2: Arrow Keys + Enter  
- Player 3: IJKL + U
- Player 4: TFGH + R
