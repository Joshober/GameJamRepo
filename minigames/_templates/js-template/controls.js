// Standard 4-player control mapping for all minigames
// Player 1: WASD + Space
// Player 2: Arrow keys + Enter
// Player 3: IJKL + U
// Player 4: TFGH + R

const CONTROLS = {
  // Player 1 (WASD)
  p1: {
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    action: 'Space',
    keys: {
      'KeyW': 'up',
      'KeyS': 'down',
      'KeyA': 'left',
      'KeyD': 'right',
      'Space': 'action'
    }
  },
  // Player 2 (Arrow keys)
  p2: {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    action: 'Enter',
    keys: {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'Enter': 'action'
    }
  },
  // Player 3 (IJKL)
  p3: {
    up: 'KeyI',
    down: 'KeyK',
    left: 'KeyJ',
    right: 'KeyL',
    action: 'KeyU',
    keys: {
      'KeyI': 'up',
      'KeyK': 'down',
      'KeyJ': 'left',
      'KeyL': 'right',
      'KeyU': 'action'
    }
  },
  // Player 4 (TFGH)
  p4: {
    up: 'KeyT',
    down: 'KeyG',
    left: 'KeyF',
    right: 'KeyH',
    action: 'KeyR',
    keys: {
      'KeyT': 'up',
      'KeyG': 'down',
      'KeyF': 'left',
      'KeyH': 'right',
      'KeyR': 'action'
    }
  }
};

// Helper class to track player input
class PlayerControls {
  constructor() {
    this.keys = {};
    this.pressed = {};
    this.mobilePressed = {}; // Track mobile controller input
    
    // Initialize all player keys
    for (let p = 1; p <= 4; p++) {
      const player = CONTROLS[`p${p}`];
      for (const keyCode in player.keys) {
        this.keys[keyCode] = p;
        this.pressed[keyCode] = false;
      }
      // Initialize mobile control tracking
      this.mobilePressed[p] = {
        up: false,
        down: false,
        left: false,
        right: false,
        action: false
      };
    }
    
    window.addEventListener('keydown', (e) => {
      if (this.keys[e.code]) {
        this.pressed[e.code] = true;
      }
    });
    
    window.addEventListener('keyup', (e) => {
      if (this.keys[e.code]) {
        this.pressed[e.code] = false;
      }
    });
    
    // Listen for mobile control events from parent window
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'MOBILE_CONTROL') {
        const { player, button, pressed } = e.data;
        if (player >= 1 && player <= 4 && this.mobilePressed[player]) {
          this.mobilePressed[player][button] = pressed;
        }
      }
    });
  }
  
  // Check if a player's button is currently pressed
  isPressed(playerNum, button) {
    // Check keyboard input
    const player = CONTROLS[`p${playerNum}`];
    if (player) {
      const keyCode = player[button];
      if (this.pressed[keyCode]) return true;
    }
    // Check mobile controller input
    if (this.mobilePressed[playerNum] && this.mobilePressed[playerNum][button]) {
      return true;
    }
    return false;
  }
  
  // Check if a player's button was just pressed (for one-time actions)
  wasPressed(playerNum, button) {
    // This would need a more sophisticated system for "just pressed"
    // For now, use isPressed
    return this.isPressed(playerNum, button);
  }
  
  // Get all currently pressed buttons for a player
  getPlayerState(playerNum) {
    const player = CONTROLS[`p${playerNum}`];
    if (!player) return {};
    return {
      up: this.isPressed(playerNum, 'up'),
      down: this.isPressed(playerNum, 'down'),
      left: this.isPressed(playerNum, 'left'),
      right: this.isPressed(playerNum, 'right'),
      action: this.isPressed(playerNum, 'action')
    };
  }
}

// Create global instance
const playerControls = new PlayerControls();
