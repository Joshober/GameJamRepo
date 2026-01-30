// Standard 4-player control mapping for all minigames
// Player 1: WASD + Space (disparar)
// Player 2: Flechas + Enter (disparar)
// Player 3: IJKL + U (disparar)
// Player 4: TFGH + R (disparar)

const CONTROLS = {
  p1: {
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    action: 'Space',
    keys: { 'KeyW': 'up', 'KeyS': 'down', 'KeyA': 'left', 'KeyD': 'right', 'Space': 'action' }
  },
  p2: {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    action: 'Enter',
    keys: { 'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right', 'Enter': 'action' }
  },
  p3: {
    up: 'KeyI',
    down: 'KeyK',
    left: 'KeyJ',
    right: 'KeyL',
    action: 'KeyU',
    keys: { 'KeyI': 'up', 'KeyK': 'down', 'KeyJ': 'left', 'KeyL': 'right', 'KeyU': 'action' }
  },
  p4: {
    up: 'KeyT',
    down: 'KeyG',
    left: 'KeyF',
    right: 'KeyH',
    action: 'KeyR',
    keys: { 'KeyT': 'up', 'KeyG': 'down', 'KeyF': 'left', 'KeyH': 'right', 'KeyR': 'action' }
  }
};

class PlayerControls {
  constructor() {
    this.keys = {};
    this.pressed = {};
    this.mobilePressed = {};
    for (let p = 1; p <= 4; p++) {
      const player = CONTROLS[`p${p}`];
      for (const keyCode in player.keys) {
        this.keys[keyCode] = p;
        this.pressed[keyCode] = false;
      }
      this.mobilePressed[p] = { up: false, down: false, left: false, right: false, action: false };
    }
    window.addEventListener('keydown', (e) => { if (this.keys[e.code]) this.pressed[e.code] = true; });
    window.addEventListener('keyup', (e) => { if (this.keys[e.code]) this.pressed[e.code] = false; });
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'MOBILE_CONTROL') {
        const { player, button, pressed } = e.data;
        if (player >= 1 && player <= 4 && this.mobilePressed[player])
          this.mobilePressed[player][button] = pressed;
      }
    });
  }

  isPressed(playerNum, button) {
    const player = CONTROLS[`p${playerNum}`];
    if (player && this.pressed[player[button]]) return true;
    if (this.mobilePressed[playerNum] && this.mobilePressed[playerNum][button]) return true;
    return false;
  }

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

  /** Actualizar estado desde móvil/WebSocket (control remoto) */
  setMobileState(playerNum, state) {
    if (playerNum < 1 || playerNum > 4 || !this.mobilePressed[playerNum]) return;
    this.mobilePressed[playerNum] = {
      up: !!state.up,
      down: !!state.down,
      left: !!state.left,
      right: !!state.right,
      action: !!state.action
    };
  }
}

const playerControls = new PlayerControls();
