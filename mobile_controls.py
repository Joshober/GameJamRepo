"""
Mobile control helper for pygame games.
Reads control events from shared state file created by runner.
"""
import json
import os

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
    Returns: {up: bool, down: bool, left: bool, right: bool, action: bool}
    """
    controls = get_mobile_controls()
    player_controls = controls.get(str(player_num), {})
    
    return {
        'up': player_controls.get('up', False),
        'down': player_controls.get('down', False),
        'left': player_controls.get('left', False),
        'right': player_controls.get('right', False),
        'action': player_controls.get('action', False)
    }
