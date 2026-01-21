import argparse
import json
import random
import time

import pygame

# Import mobile controls helper (if available)
try:
    from mobile_controls import get_player_mobile_input
    MOBILE_CONTROLS_AVAILABLE = True
except ImportError:
    MOBILE_CONTROLS_AVAILABLE = False
    def get_player_mobile_input(player_num):
        return {'up': False, 'down': False, 'left': False, 'right': False, 'action': False}

# Standard 4-player control mapping
# Player 1: WASD + Space
# Player 2: Arrow keys + Enter
# Player 3: IJKL + U
# Player 4: TFGH + R
CONTROLS = {
    1: {
        'up': pygame.K_w,
        'down': pygame.K_s,
        'left': pygame.K_a,
        'right': pygame.K_d,
        'action': pygame.K_SPACE
    },
    2: {
        'up': pygame.K_UP,
        'down': pygame.K_DOWN,
        'left': pygame.K_LEFT,
        'right': pygame.K_RIGHT,
        'action': pygame.K_RETURN
    },
    3: {
        'up': pygame.K_i,
        'down': pygame.K_k,
        'left': pygame.K_j,
        'right': pygame.K_l,
        'action': pygame.K_u
    },
    4: {
        'up': pygame.K_t,
        'down': pygame.K_g,
        'left': pygame.K_f,
        'right': pygame.K_h,
        'action': pygame.K_r
    }
}

def get_player_input(player_num, keys):
    """Get input state for a player"""
    ctrl = CONTROLS.get(player_num, {})
    return {
        'up': keys[ctrl.get('up', 0)],
        'down': keys[ctrl.get('down', 0)],
        'left': keys[ctrl.get('left', 0)],
        'right': keys[ctrl.get('right', 0)],
        'action': keys[ctrl.get('action', 0)]
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--players", type=int, default=4)
    parser.add_argument("--seed", type=int, default=123)
    parser.add_argument("--mode", type=str, default="jam")
    args = parser.parse_args()

    random.seed(args.seed)

    pygame.init()
    screen = pygame.display.set_mode((640, 360))
    pygame.display.set_caption("Pygame Template")

    font = pygame.font.SysFont(None, 36)
    start = time.time()
    points = [0, 0, 0, 0]  # Points for each player
    running = True

    # Example: 4-player score-attack - press action button as many times as possible in 5 seconds
    while running:
        now = time.time()
        if now - start >= 5.0:
            running = False

        keys = pygame.key.get_pressed()
        
        # Check all 4 players' action buttons (keyboard + mobile)
        for p in range(1, 5):
            # Get keyboard input
            input_state = get_player_input(p, keys)
            
            # Get mobile controller input (if available)
            if MOBILE_CONTROLS_AVAILABLE:
                mobile_input = get_player_mobile_input(p)
                # Merge mobile controls with keyboard (mobile takes precedence for action)
                input_state['up'] = input_state['up'] or mobile_input['up']
                input_state['down'] = input_state['down'] or mobile_input['down']
                input_state['left'] = input_state['left'] or mobile_input['left']
                input_state['right'] = input_state['right'] or mobile_input['right']
                input_state['action'] = input_state['action'] or mobile_input['action']
            
            if input_state['action']:
                points[p-1] += 1

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        screen.fill((20,20,20))
        txt = font.render(f"P1:{points[0]} P2:{points[1]} P3:{points[2]} P4:{points[3]}", True, (240,240,240))
        screen.blit(txt, (20, 20))
        pygame.display.flip()

    pygame.quit()

    # Return scores for all 4 players
    result = {
        "scores": points,
        "winner": points.index(max(points)),
        "meta": {"mode": args.mode}
    }
    print("RESULT:", json.dumps(result))

if __name__ == "__main__":
    main()
