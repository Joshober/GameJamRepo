"""
Create stick figure sprites matching the image style
Simple blue stick figure with gun
"""
import pygame

def create_stick_figure_sprite(color=(100, 150, 255), size=(64, 64), facing_right=True, is_running=False):
    """
    Create a simple stick figure sprite
    color: RGB tuple for the stick figure color
    size: (width, height) tuple
    facing_right: True for right-facing, False for left-facing
    is_running: True for running pose (bent legs), False for standing
    """
    surface = pygame.Surface(size, pygame.SRCALPHA)
    width, height = size
    
    # Draw stick figure
    center_x = width // 2
    head_y = 10
    body_start_y = 25
    body_end_y = height - 20
    
    # Head (circle with fill)
    head_radius = 7
    pygame.draw.circle(surface, color, (center_x, head_y), head_radius)
    pygame.draw.circle(surface, (255, 255, 255), (center_x, head_y), head_radius, 2)
    # Eyes
    eye_offset = 2
    pygame.draw.circle(surface, (255, 255, 255), (center_x - eye_offset, head_y - 1), 1)
    pygame.draw.circle(surface, (255, 255, 255), (center_x + eye_offset, head_y - 1), 1)
    
    # Body (line from head to waist)
    waist_y = body_start_y + (body_end_y - body_start_y) // 2
    pygame.draw.line(surface, color, (center_x, head_y + head_radius), (center_x, waist_y), 4)
    
    # Arms (holding gun) - more detailed
    arm_y = body_start_y + 8
    gun_color = (80, 80, 90)
    if facing_right:
        # Right arm (holding gun forward)
        gun_length = 28
        gun_end_x = center_x + gun_length
        gun_end_y = arm_y - 8
        # Arm
        pygame.draw.line(surface, color, (center_x, arm_y), (gun_end_x - 3, gun_end_y), 3)
        # Gun (more detailed)
        pygame.draw.line(surface, gun_color, (center_x + 8, arm_y - 2), (gun_end_x, gun_end_y), 4)
        pygame.draw.circle(surface, (60, 60, 70), (gun_end_x, gun_end_y), 3)  # Gun tip
        # Left arm (back, bent)
        pygame.draw.line(surface, color, (center_x, arm_y), (center_x - 10, arm_y + 5), 3)
    else:
        # Left arm (holding gun forward)
        gun_length = 28
        gun_end_x = center_x - gun_length
        gun_end_y = arm_y - 8
        # Arm
        pygame.draw.line(surface, color, (center_x, arm_y), (gun_end_x + 3, gun_end_y), 3)
        # Gun (more detailed)
        pygame.draw.line(surface, gun_color, (center_x - 8, arm_y - 2), (gun_end_x, gun_end_y), 4)
        pygame.draw.circle(surface, (60, 60, 70), (gun_end_x, gun_end_y), 3)  # Gun tip
        # Right arm (back, bent)
        pygame.draw.line(surface, color, (center_x, arm_y), (center_x + 10, arm_y + 5), 3)
    
    # Legs (more detailed with feet)
    leg_thickness = 3
    if is_running:
        # Running pose - legs bent and dynamic
        if facing_right:
            # Right leg forward (bent)
            pygame.draw.line(surface, color, (center_x, waist_y), (center_x + 6, waist_y + 15), leg_thickness)
            pygame.draw.line(surface, color, (center_x + 6, waist_y + 15), (center_x + 10, body_end_y - 3), leg_thickness)
            # Foot
            pygame.draw.ellipse(surface, color, (center_x + 8, body_end_y - 2, 6, 3))
            # Left leg back (straight)
            pygame.draw.line(surface, color, (center_x, waist_y), (center_x - 8, body_end_y), leg_thickness)
            # Foot
            pygame.draw.ellipse(surface, color, (center_x - 10, body_end_y - 1, 6, 3))
        else:
            # Left leg forward (bent)
            pygame.draw.line(surface, color, (center_x, waist_y), (center_x - 6, waist_y + 15), leg_thickness)
            pygame.draw.line(surface, color, (center_x - 6, waist_y + 15), (center_x - 10, body_end_y - 3), leg_thickness)
            # Foot
            pygame.draw.ellipse(surface, color, (center_x - 14, body_end_y - 2, 6, 3))
            # Right leg back (straight)
            pygame.draw.line(surface, color, (center_x, waist_y), (center_x + 8, body_end_y), leg_thickness)
            # Foot
            pygame.draw.ellipse(surface, color, (center_x + 8, body_end_y - 1, 6, 3))
    else:
        # Standing pose - straight legs with feet
        # Left leg
        pygame.draw.line(surface, color, (center_x, waist_y), (center_x - 6, body_end_y), leg_thickness)
        pygame.draw.ellipse(surface, color, (center_x - 8, body_end_y - 1, 6, 3))
        # Right leg
        pygame.draw.line(surface, color, (center_x, waist_y), (center_x + 6, body_end_y), leg_thickness)
        pygame.draw.ellipse(surface, color, (center_x + 4, body_end_y - 1, 6, 3))
    
    return surface

def create_player_sprites():
    """Create all player sprite variations"""
    # Player colors: blue, orange, and two more colors
    colors = [
        (100, 150, 255),  # Blue (Player 1)
        (255, 150, 100),  # Orange (Player 2)
        (150, 255, 100),  # Green (Player 3)
        (255, 100, 255),  # Magenta (Player 4)
    ]
    
    sprites = {}
    for i, color in enumerate(colors):
        # Right standing
        sprites[f'player{i+1}_right_standing'] = create_stick_figure_sprite(
            color, (64, 64), facing_right=True, is_running=False
        )
        # Left standing
        sprites[f'player{i+1}_left_standing'] = create_stick_figure_sprite(
            color, (64, 64), facing_right=False, is_running=False
        )
        # Right running
        sprites[f'player{i+1}_right_running'] = create_stick_figure_sprite(
            color, (64, 64), facing_right=True, is_running=True
        )
        # Left running
        sprites[f'player{i+1}_left_running'] = create_stick_figure_sprite(
            color, (64, 64), facing_right=False, is_running=True
        )
    
    return sprites

# Cache sprites
_player_sprites_cache = None

def get_player_sprites():
    """Get cached player sprites"""
    global _player_sprites_cache
    if _player_sprites_cache is None:
        _player_sprites_cache = create_player_sprites()
    return _player_sprites_cache
