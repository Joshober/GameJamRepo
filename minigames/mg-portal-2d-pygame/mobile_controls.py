"""
Mobile control helper for pygame games.
Reads control events from shared state file created by runner.
"""
import json
import os
import platform

# Use Windows temp path on Windows, /tmp on Linux/Mac
if platform.system() == "Windows":
    CONTROL_FILE = os.path.join(os.environ.get("TEMP", "C:\\tmp"), "pygame_controls.json")
else:
    CONTROL_FILE = "/tmp/pygame_controls.json"

def get_mobile_controls():
    """
    Get current mobile control state for all players.
    Returns: {player: {button: pressed}}
    """
    if not os.path.exists(CONTROL_FILE):
        return {}
    
    try:
        with open(CONTROL_FILE, "r") as f:
            return json.load(f)
    except:
        return {}

def get_player_mobile_input(player_num):
    """
    Get mobile input state for a specific player.
    Returns: {up: bool, down: bool, left: bool, right: bool, action: bool, aim_up: bool, aim_down: bool}
    """
    controls = get_mobile_controls()
    player_controls = controls.get(str(player_num), {})
    
    return {
        'up': player_controls.get('up', False),
        'down': player_controls.get('down', False),
        'left': player_controls.get('left', False),
        'right': player_controls.get('right', False),
        'action': player_controls.get('action', False),
        'aim_up': player_controls.get('aim_up', False),
        'aim_down': player_controls.get('aim_down', False)
    }
