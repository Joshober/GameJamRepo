import argparse
import json
import random
import time

import pygame

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
    points = 0
    running = True

    # Score-attack: press SPACE as many times as you can in 5 seconds
    while running:
        now = time.time()
        if now - start >= 5.0:
            running = False

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
                points += 1

        screen.fill((20,20,20))
        txt = font.render(f"SPACE spam: {points}", True, (240,240,240))
        screen.blit(txt, (20, 20))
        pygame.display.flip()

    pygame.quit()

    # Convert score-attack into Mario-Party-ish scoring for 4 players
    # In Option 1, you can run it once per player and compare, OR keep it single-player.
    # For now, return points for P1 and 0 for others.
    result = {"scores": [points, 0, 0, 0], "winner": 0, "meta": {"mode": args.mode}}
    print("RESULT:", json.dumps(result))

if __name__ == "__main__":
    main()
