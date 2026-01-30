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
    pygame.display.set_caption("Coin Collector - Demo Game")
    
    # Set up virtual display for Docker
    import os
    if 'DISPLAY' not in os.environ:
        os.environ['DISPLAY'] = ':99'

    font = pygame.font.SysFont(None, 36)
    small_font = pygame.font.SysFont(None, 24)
    
    # Game state
    start_time = time.time()
    duration = 10.0  # 10 second game
    scores = [0, 0, 0, 0]  # Coins collected by each player
    
    # Player positions (4 players, each in their lane)
    player_positions = [80, 180, 280, 380]  # X positions for each player
    player_y = 300  # Starting Y position
    player_colors = [(255, 100, 100), (100, 100, 255), (100, 255, 100), (255, 255, 100)]
    
    # Coins to collect (random positions)
    coins = []
    for i in range(20):
        coins.append({
            'x': random.randint(50, 590),
            'y': random.randint(50, 250),
            'collected': False,
            'value': random.choice([1, 2, 3])
        })
    
    clock = pygame.time.Clock()
    running = True

    # Demo Game: Coin Collector
    # Players move around and collect coins. Most coins wins!
    while running:
        elapsed = time.time() - start_time
        if elapsed >= duration:
            running = False

        keys = pygame.key.get_pressed()
        
        # Handle player movement and coin collection
        for p in range(1, 5):
            input_state = get_player_input(p, keys)
            
            # Get mobile controller input (if available)
            if MOBILE_CONTROLS_AVAILABLE:
                mobile_input = get_player_mobile_input(p)
                input_state['up'] = input_state['up'] or mobile_input['up']
                input_state['down'] = input_state['down'] or mobile_input['down']
                input_state['left'] = input_state['left'] or mobile_input['left']
                input_state['right'] = input_state['right'] or mobile_input['right']
            
            # Simple movement (players stay in their lanes but can move up/down)
            player_idx = p - 1
            if input_state['up'] and player_y > 50:
                player_y -= 2
            if input_state['down'] and player_y < 300:
                player_y += 2
            
            # Check coin collection (simple radius check)
            player_x = player_positions[player_idx]
            for coin in coins:
                if not coin['collected']:
                    dist = ((player_x - coin['x'])**2 + (player_y - coin['y'])**2)**0.5
                    if dist < 30:  # Collection radius
                        coin['collected'] = True
                        scores[player_idx] += coin['value']

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        # Render
        screen.fill((30, 30, 40))
        
        # Draw coins
        for coin in coins:
            if not coin['collected']:
                color = (255, 215, 0) if coin['value'] == 3 else (200, 200, 200)
                pygame.draw.circle(screen, color, (coin['x'], coin['y']), 10)
        
        # Draw players
        for p in range(4):
            pygame.draw.circle(screen, player_colors[p], (player_positions[p], player_y), 15)
            # Draw score
            score_text = small_font.render(f"P{p+1}: {scores[p]}", True, player_colors[p])
            screen.blit(score_text, (player_positions[p] - 20, player_y - 30))
        
        # Draw timer
        time_left = max(0, duration - elapsed)
        timer_text = font.render(f"Time: {time_left:.1f}s", True, (255, 255, 255))
        screen.blit(timer_text, (20, 20))
        
        # Draw instructions
        inst_text = small_font.render("Move UP/DOWN to collect coins!", True, (200, 200, 200))
        screen.blit(inst_text, (20, 60))
        
        pygame.display.flip()
        clock.tick(60)

    pygame.quit()

    # Return scores for all 4 players
    result = {
        "scores": scores,
        "winner": scores.index(max(scores)) if max(scores) > 0 else 0,
        "meta": {"mode": args.mode, "total_coins": sum(scores)}
    }
    print("RESULT:", json.dumps(result))

if __name__ == "__main__":
    main()
