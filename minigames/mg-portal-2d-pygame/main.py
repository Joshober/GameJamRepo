"""
Portal 2D - Full adaptation for minigame system
Based on https://github.com/studkid/Portal-2D
Adapted for 4-player local gameplay
"""
import argparse
import json
import time
import pygame
import sys
import os

# Import mobile controls helper (if available)
try:
    from mobile_controls import get_player_mobile_input
    MOBILE_CONTROLS_AVAILABLE = True
except ImportError:
    MOBILE_CONTROLS_AVAILABLE = False
    def get_player_mobile_input(player_num):
        return {'up': False, 'down': False, 'left': False, 'right': False, 'action': False}

# Import game components
from Utils import GlobalVariables
from Utils.Player_Adapted import Player
from Utils.Platform import Platform
from Utils.ExitDoor import ExitDoor
from Utils.ButtonObject import ButtonObject
from Utils.Portal_gun import Portal
from Utils.ProfessionalLevel import LevelDesign
from Utils.TwoPortalLevels import TwoPortalLevels
from Utils.ProfessionalUI import ProfessionalUI
from Utils.GameScreens import GameScreens
from Utils.LevelAssets import get_background_texture, tile_texture

# Standard 4-player control mapping
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
    input_state = {
        'up': keys[ctrl.get('up', 0)],
        'down': keys[ctrl.get('down', 0)],
        'left': keys[ctrl.get('left', 0)],
        'right': keys[ctrl.get('right', 0)],
        'action': keys[ctrl.get('action', 0)],
        'aim_up': False,
        'aim_down': False
    }
    
    # Add aim up/down buttons for each player
    if player_num == 1:
        input_state['aim_up'] = keys[pygame.K_q]
        input_state['aim_down'] = keys[pygame.K_e]
    elif player_num == 2:
        input_state['aim_up'] = keys[pygame.K_RSHIFT]
        input_state['aim_down'] = keys[pygame.K_RCTRL]
    elif player_num == 3:
        input_state['aim_up'] = keys[pygame.K_o]
        input_state['aim_down'] = keys[pygame.K_p]
    else:  # player_num == 4
        input_state['aim_up'] = keys[pygame.K_y]
        input_state['aim_down'] = keys[pygame.K_u]
    
    # Merge mobile controls if available
    if MOBILE_CONTROLS_AVAILABLE:
        mobile_input = get_player_mobile_input(player_num)
        input_state['up'] = input_state['up'] or mobile_input['up']
        input_state['down'] = input_state['down'] or mobile_input['down']
        input_state['left'] = input_state['left'] or mobile_input['left']
        input_state['right'] = input_state['right'] or mobile_input['right']
        input_state['action'] = input_state['action'] or mobile_input['action']
        input_state['aim_up'] = input_state['aim_up'] or mobile_input.get('aim_up', False)
        input_state['aim_down'] = input_state['aim_down'] or mobile_input.get('aim_down', False)
    
    return input_state

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--players", type=int, default=4)
    parser.add_argument("--seed", type=int, default=123)
    parser.add_argument("--mode", type=str, default="jam")
    args = parser.parse_args()

    pygame.init()
    screen = pygame.display.set_mode((GlobalVariables.Width, GlobalVariables.Height))
    pygame.display.set_caption("Portal 2D")
    
    clock = pygame.time.Clock()
    font = GlobalVariables.font(36)
    
    # Level definitions - will be loaded after level selection
    level_functions = [
        ('The Gap', LevelDesign.create_level_1),
        ('Button and Door', LevelDesign.create_level_2),
        ('Multi-Level', LevelDesign.create_level_3),
        ('The Maze', LevelDesign.create_level_4),
        ('The Challenge', LevelDesign.create_level_5),
    ]
    level_names = [level[0] for level in level_functions]
    
    # Initialize with default level (will be changed by level select)
    selected_level_index = 0
    level_data = level_functions[selected_level_index][1]()
    platforms = level_data['platforms']
    button = level_data['button']
    door = level_data['door']
    background_color = level_data['background_color']
    start_positions = level_data['start_positions']
    
    # Create 4 players at start positions
    players = []
    for i in range(4):
        players.append(Player(start_positions[i][0], start_positions[i][1], player_num=i+1))
    
    # Create portal cube
    cube = None
    try:
        from Utils.PhysObj import CubeObj
        cube_x, cube_y = level_data['cube_position']
        cube = CubeObj(cube_x, cube_y, 0.0999, 0.2)
        cube.runPhysics = True
        cube.rect.x = cube_x
        cube.rect.y = cube_y
    except Exception as e:
        print(f"Could not create cube: {e}")
        cube = None
    
    # Initialize professional UI and screens
    ui = ProfessionalUI(screen, font)
    small_font = pygame.font.SysFont("Consolas", 20)
    screens = GameScreens(screen, font, small_font)
    
    # Load background texture if available
    background_texture = get_background_texture()
    background_surface = None
    if background_texture:
        # Create tiled background surface
        background_surface = tile_texture(background_texture, GlobalVariables.Width, GlobalVariables.Height)
    
    # Game states: 'instructions', 'ready', 'level_select', 'playing', 'finished'
    game_state = 'instructions'
    ready_players = set()
    ready_start_time = None
    selected_level_index = 0
    
    # Game state
    start_time = None
    game_duration = 120  # 2 minutes max
    scores = [0, 0, 0, 0]
    finish_times = [None, None, None, None]
    game_finished = False
    
    # Track which players have finished
    finished_players = set()
    
    # Team tracking
    # Team 1: Players 0, 1 (Blue, Orange)
    # Team 2: Players 2, 3 (Red, Yellow)
    team_finished = {0: set(), 1: set()}  # Team 0 and Team 1
    team_scores = {0: 0, 1: 0}
    
    running = True
    
    while running:
        dt = clock.tick(GlobalVariables.FPS)
        keys = pygame.key.get_pressed()
        
        # Handle events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
                
                # Handle state transitions
                if game_state == 'instructions':
                    if event.key == pygame.K_SPACE:
                        game_state = 'ready'
                        ready_start_time = time.time()
                
                elif game_state == 'ready':
                    # Ready up keys: Space, Enter, U, R
                    if event.key == pygame.K_SPACE and 0 not in ready_players:
                        ready_players.add(0)
                    elif event.key == pygame.K_RETURN and 1 not in ready_players:
                        ready_players.add(1)
                    elif event.key == pygame.K_u and 2 not in ready_players:
                        ready_players.add(2)
                    elif event.key == pygame.K_r and 3 not in ready_players:
                        ready_players.add(3)
                
                elif game_state == 'level_select':
                    # Level selection controls
                    if event.key == pygame.K_UP:
                        selected_level_index = (selected_level_index - 1) % len(level_functions)
                    elif event.key == pygame.K_DOWN:
                        selected_level_index = (selected_level_index + 1) % len(level_functions)
                    elif event.key == pygame.K_SPACE:
                        # Confirm level selection and load level
                        level_data = level_functions[selected_level_index][1]()
                        platforms = level_data['platforms']
                        button = level_data['button']
                        door = level_data['door']
                        background_color = level_data['background_color']
                        start_positions = level_data['start_positions']
                        
                        # Reposition players for new level and reset state
                        for i, player in enumerate(players):
                            player.x = start_positions[i][0]
                            player.y = start_positions[i][1]
                            # Reset player state
                            player.warpCooldown = 0
                            player.velocity = 0
                            player.velocity_x = 0
                            player.isJump = False
                            player.isJumping = False
                            player.canJump = True
                            player.completed = False
                            # Clear portals
                            if player.pGun.sprite:
                                try:
                                    player.pGun.sprite.kill()
                                except:
                                    pass
                                player.pGun.sprite = None
                        
                        # Recreate cube for new level
                        try:
                            from Utils.PhysObj import CubeObj
                            cube_x, cube_y = level_data['cube_position']
                            cube = CubeObj(cube_x, cube_y, 0.0999, 0.2)
                            cube.runPhysics = True
                            cube.rect.x = cube_x
                            cube.rect.y = cube_y
                            cube.x = cube_x
                            cube.y = cube_y
                        except Exception as e:
                            cube = None
                        
                        # Reset game state
                        finished_players = set()
                        team_finished = {0: set(), 1: set()}
                        team_scores = {0: 0, 1: 0}
                        finish_times = [None, None, None, None]
                        game_finished = False
                        
                        # Start the game
                        game_state = 'playing'
                        start_time = time.time()
        
        # State machine
        if game_state == 'instructions':
            screens.draw_instructions_screen()
            pygame.display.flip()
            continue
        
        elif game_state == 'ready':
            screens.draw_ready_screen(ready_players)
            
            # Check if all players are ready
            if len(ready_players) == 4:
                # Wait a moment then go to level select
                if ready_start_time and time.time() - ready_start_time > 1.5:
                    game_state = 'level_select'
                    ready_start_time = None
            else:
                ready_start_time = time.time()  # Reset timer if someone unreadies
            
            pygame.display.flip()
            continue
        
        elif game_state == 'level_select':
            screens.draw_level_select_screen(selected_level_index, level_names)
            pygame.display.flip()
            continue
        
        elif game_state == 'playing':
            # Normal game loop
            elapsed = time.time() - start_time if start_time else 0
            
            if elapsed >= game_duration:
                game_state = 'finished'
                game_finished = True
        
        # Game logic (only during playing state)
        if game_state == 'playing':
            elapsed = time.time() - start_time if start_time else 0
            
            # Update door status
            door.door_status(button)
            
            # Check if button is pressed (by players or cubes)
            if button is not None:
                cube_list = [cube] if cube else []
                button.checkActive(cube_list, players)  # Check if players or cube are on button
            
            # Update all players
            all_portals = []
            # First pass: collect all existing portals
            for player in players:
                if player.pGun.sprite and isinstance(player.pGun.sprite, Portal):
                    all_portals.append(player.pGun.sprite)
            
            # Update all players with portal/player references
            for player in players:
                input_state = get_player_input(player.player_num, keys)
                
                # Move player (this updates leftSide based on movement)
                player.move(input_state, platforms, dt)
                player.jump(dt)
                
                # Handle portal shooting and cube interaction (updates aim direction)
                player.keyboardInput(input_state, cube, platforms)
                
                # Update cube position if player is holding it
                if player.cube and player.controllingCube:
                    player_rect = player.rect()
                    player.cube.rect.centerx = player_rect.centerx
                    player.cube.rect.centery = player_rect.top - 20
                    player.cube.x = player.cube.rect.x
                    player.cube.y = player.cube.rect.y
                
                # Store references for portal replacement logic
                player._all_portals = all_portals
                player._all_players = players
                
                # Update player (this updates gun rotation based on aim direction)
                player.update(platforms, dt)
                
                # Re-collect portals after update (new portals may have been created)
                if player.pGun.sprite and isinstance(player.pGun.sprite, Portal):
                    if player.pGun.sprite not in all_portals:
                        all_portals.append(player.pGun.sprite)
            
            # Handle portal teleportation
            # Portal-style: Any portal links to any other portal (need at least 2)
            if len(all_portals) >= 2:
                # Teleport players through portals (any portal to any other)
                for player in players:
                    portals_list = [p for p in all_portals if p]
                    if len(portals_list) >= 2:
                        player.portalWarp(portals_list)
                
                # Teleport cube through portals
                if cube:
                    portals_list = [p for p in all_portals if p]
                    if len(portals_list) >= 2:
                        cube.portalWarp(portals_list)
            
            # Check if players reached the goal
            if door.opened:
                for i, player in enumerate(players):
                    if i not in finished_players:
                        if door.try_exit(player, keys):
                            finish_times[i] = elapsed
                            finished_players.add(i)
                            
                            # Determine which team this player belongs to
                            team_num = 0 if i < 2 else 1
                            team_finished[team_num].add(i)
                            
                            # Award team points
                            team_scores[team_num] += 50
                            
                            # Check if a team has won (both players finished)
                            if len(team_finished[team_num]) == 2:
                                # Team won!
                                game_finished = True
                                team_scores[team_num] += 100  # Bonus for team win
            
            # Draw game background
            if background_surface:
                screen.blit(background_surface, (0, 0))
            else:
                screen.fill(background_color)
            
            # Draw platforms (with professional styling)
            for platform in platforms:
                platform.draw(screen)
            
            # Draw portal cube
            if cube:
                # Update cube physics (only if not being held by a player)
                cube_held = False
                for player in players:
                    if player.cube == cube and player.controllingCube:
                        cube_held = True
                        break
                
                if cube.runPhysics and not cube_held:
                    cube.move(dt)
                    cube.bounce(GlobalVariables.Width, GlobalVariables.Height, platforms)
                    
                    # Check for player-cube collision (pushing when not held)
                    for player in players:
                        if player.cube != cube:  # Don't push if this player is holding it
                            player_rect = player.rect()
                            if player_rect.colliderect(cube.rect):
                                # Push cube away from player
                                dx = cube.rect.centerx - player_rect.centerx
                                dy = cube.rect.centery - player_rect.centery
                                distance = (dx**2 + dy**2)**0.5
                                if distance > 0:
                                    # Normalize and push
                                    push_force = 0.5
                                    cube.rect.x += (dx / distance) * push_force * dt
                                    cube.rect.y += (dy / distance) * push_force * dt
                                    # Update cube position
                                    cube.x = cube.rect.x
                                    cube.y = cube.rect.y
                
                # Draw cube
                screen.blit(cube.image, cube.rect)
            
            # Draw button
            if button is not None:
                button.draw(screen)
            
            # Draw door
            door.update(screen)
            
            # Draw portals
            for player in players:
                if player.pGun.sprite:
                    player.pGun.draw(screen)
            
            # Draw players
            for player in players:
                player.draw(screen)
            
            # Draw professional UI with team scores
            ui.draw_hud(players, elapsed, game_duration, finished_players, team_scores)
            
            # Draw victory screen if game finished
            if game_finished and len(finished_players) > 0:
                sorted_finishes = sorted(
                    [(i, t) for i, t in enumerate(finish_times) if t is not None],
                    key=lambda x: x[1]
                )
                ui.draw_victory_screen(sorted_finishes, players)
        
        # Always flip display
        pygame.display.flip()
        
        # End game if first player finished and some time passed
        if game_state == 'playing' and game_finished:
            elapsed = time.time() - start_time if start_time else 0
            finished_times_list = [t for t in finish_times if t is not None]
            if finished_times_list and elapsed - min(finished_times_list) > 3:
                game_state = 'finished'
                running = False

    pygame.quit()

    # Calculate final scores based on teams
    final_scores = [0, 0, 0, 0]
    
    # Determine winning team
    winning_team = None
    if len(team_finished[0]) == 2:
        winning_team = 0
    elif len(team_finished[1]) == 2:
        winning_team = 1
    
    # Assign scores based on team performance
    for i in range(4):
        team_num = 0 if i < 2 else 1
        
        if i in finished_players:
            # Finished players get base points
            final_scores[i] = 50
            # If their team won, bonus points
            if winning_team == team_num:
                final_scores[i] += 50
        else:
            # Non-finished players get points based on team score
            final_scores[i] = team_scores[team_num] // 2
    
    # Winner is the winning team (or team with most points)
    if winning_team is not None:
        winner = winning_team
    else:
        winner = 0 if team_scores[0] >= team_scores[1] else 1
    
    # Return scores for all 4 players
    result = {
        "scores": final_scores,
        "winner": winner,
        "team_scores": team_scores,
        "meta": {"mode": args.mode, "finished": len(finished_players), "team_game": True}
    }
    print("RESULT:", json.dumps(result))

if __name__ == "__main__":
    main()
