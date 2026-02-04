"""
Professional character sprites - detailed pixel art style
Much better than stick figures!
"""
import pygame

def create_character_sprite(color=(100, 150, 255), size=(64, 64), facing_right=True, is_running=False):
    """
    Create a detailed character sprite
    color: RGB tuple for the character color
    size: (width, height) tuple
    facing_right: True for right-facing, False for left-facing
    is_running: True for running pose, False for standing
    """
    surface = pygame.Surface(size, pygame.SRCALPHA)
    width, height = size
    
    center_x = width // 2
    
    # Character proportions
    head_y = 8
    head_radius = 8
    body_top = 18
    body_bottom = height - 12
    arm_y = 22
    waist_y = 40
    leg_start = 42
    
    # Head (filled circle with highlight)
    pygame.draw.circle(surface, color, (center_x, head_y), head_radius)
    # Head outline
    pygame.draw.circle(surface, (255, 255, 255), (center_x, head_y), head_radius, 2)
    # Eyes
    eye_y = head_y - 2
    if facing_right:
        pygame.draw.circle(surface, (255, 255, 255), (center_x - 3, eye_y), 2)
        pygame.draw.circle(surface, (255, 255, 255), (center_x + 3, eye_y), 2)
        # Eye pupils
        pygame.draw.circle(surface, (0, 0, 0), (center_x - 3, eye_y), 1)
        pygame.draw.circle(surface, (0, 0, 0), (center_x + 3, eye_y), 1)
    else:
        pygame.draw.circle(surface, (255, 255, 255), (center_x - 3, eye_y), 2)
        pygame.draw.circle(surface, (255, 255, 255), (center_x + 3, eye_y), 2)
        pygame.draw.circle(surface, (0, 0, 0), (center_x - 3, eye_y), 1)
        pygame.draw.circle(surface, (0, 0, 0), (center_x + 3, eye_y), 1)
    
    # Body (rounded rectangle)
    body_width = 14
    body_height = body_bottom - body_top
    body_rect = pygame.Rect(center_x - body_width // 2, body_top, body_width, body_height)
    pygame.draw.rect(surface, color, body_rect)
    pygame.draw.rect(surface, (255, 255, 255), body_rect, 2)
    # Body highlight
    highlight_rect = pygame.Rect(center_x - body_width // 2 + 2, body_top + 2, 4, body_height - 4)
    highlight_color = tuple(min(255, c + 40) for c in color)
    pygame.draw.rect(surface, highlight_color, highlight_rect)
    
    # Portal gun (detailed)
    gun_color = (60, 60, 70)
    gun_highlight = (100, 100, 110)
    
    if facing_right:
        # Right arm holding gun forward
        arm_length = 20
        gun_length = 22
        gun_end_x = center_x + arm_length + gun_length
        gun_end_y = arm_y - 6
        
        # Upper arm
        pygame.draw.line(surface, color, (center_x, arm_y), (center_x + 8, arm_y - 2), 4)
        # Forearm
        pygame.draw.line(surface, color, (center_x + 8, arm_y - 2), (center_x + arm_length, gun_end_y), 4)
        
        # Gun body
        gun_start_x = center_x + 10
        pygame.draw.line(surface, gun_color, (gun_start_x, arm_y - 1), (gun_end_x, gun_end_y), 5)
        pygame.draw.line(surface, gun_highlight, (gun_start_x, arm_y - 1), (gun_end_x, gun_end_y), 2)
        # Gun tip
        pygame.draw.circle(surface, (40, 40, 50), (gun_end_x, gun_end_y), 4)
        pygame.draw.circle(surface, (80, 80, 90), (gun_end_x, gun_end_y), 2)
        
        # Left arm (back)
        pygame.draw.line(surface, color, (center_x, arm_y), (center_x - 10, arm_y + 4), 4)
        # Hand
        pygame.draw.circle(surface, color, (center_x - 10, arm_y + 4), 3)
    else:
        # Left arm holding gun forward
        arm_length = 20
        gun_length = 22
        gun_end_x = center_x - arm_length - gun_length
        gun_end_y = arm_y - 6
        
        # Upper arm
        pygame.draw.line(surface, color, (center_x, arm_y), (center_x - 8, arm_y - 2), 4)
        # Forearm
        pygame.draw.line(surface, color, (center_x - 8, arm_y - 2), (center_x - arm_length, gun_end_y), 4)
        
        # Gun body
        gun_start_x = center_x - 10
        pygame.draw.line(surface, gun_color, (gun_start_x, arm_y - 1), (gun_end_x, gun_end_y), 5)
        pygame.draw.line(surface, gun_highlight, (gun_start_x, arm_y - 1), (gun_end_x, gun_end_y), 2)
        # Gun tip
        pygame.draw.circle(surface, (40, 40, 50), (gun_end_x, gun_end_y), 4)
        pygame.draw.circle(surface, (80, 80, 90), (gun_end_x, gun_end_y), 2)
        
        # Right arm (back)
        pygame.draw.line(surface, color, (center_x, arm_y), (center_x + 10, arm_y + 4), 4)
        # Hand
        pygame.draw.circle(surface, color, (center_x + 10, arm_y + 4), 3)
    
    # Legs
    leg_width = 5
    if is_running:
        # Running animation
        if facing_right:
            # Right leg forward (bent)
            pygame.draw.line(surface, color, (center_x, leg_start), (center_x + 4, leg_start + 8), leg_width)
            pygame.draw.line(surface, color, (center_x + 4, leg_start + 8), (center_x + 8, height - 6), leg_width)
            # Foot
            pygame.draw.ellipse(surface, color, (center_x + 6, height - 6, 6, 4))
            
            # Left leg back (straight)
            pygame.draw.line(surface, color, (center_x, leg_start), (center_x - 6, height - 4), leg_width)
            # Foot
            pygame.draw.ellipse(surface, color, (center_x - 8, height - 4, 6, 4))
        else:
            # Left leg forward (bent)
            pygame.draw.line(surface, color, (center_x, leg_start), (center_x - 4, leg_start + 8), leg_width)
            pygame.draw.line(surface, color, (center_x - 4, leg_start + 8), (center_x - 8, height - 6), leg_width)
            # Foot
            pygame.draw.ellipse(surface, color, (center_x - 12, height - 6, 6, 4))
            
            # Right leg back (straight)
            pygame.draw.line(surface, color, (center_x, leg_start), (center_x + 6, height - 4), leg_width)
            # Foot
            pygame.draw.ellipse(surface, color, (center_x + 4, height - 4, 6, 4))
    else:
        # Standing pose
        # Left leg
        pygame.draw.line(surface, color, (center_x - 3, leg_start), (center_x - 5, height - 4), leg_width)
        pygame.draw.ellipse(surface, color, (center_x - 8, height - 4, 6, 4))
        # Right leg
        pygame.draw.line(surface, color, (center_x + 3, leg_start), (center_x + 5, height - 4), leg_width)
        pygame.draw.ellipse(surface, color, (center_x + 4, height - 4, 6, 4))
    
    # Add some detail - belt/waist line
    pygame.draw.line(surface, (255, 255, 255), (center_x - body_width // 2, waist_y), 
                    (center_x + body_width // 2, waist_y), 1)
    
    return surface

def create_player_sprites():
    """Create all player sprite variations with professional detail"""
    from Utils.GameScale import PLAYER_WIDTH, PLAYER_HEIGHT
    
    # Team colors:
    # Team 1: Player 1 (Blue), Player 2 (Orange)
    # Team 2: Player 3 (Red), Player 4 (Yellow)
    colors = [
        (100, 150, 255),  # Bright Blue (Player 1 - Team 1)
        (255, 150, 100),  # Bright Orange (Player 2 - Team 1)
        (255, 50, 50),    # Bright Red (Player 3 - Team 2)
        (255, 255, 100),  # Bright Yellow (Player 4 - Team 2)
    ]
    
    sprite_size = (PLAYER_WIDTH, PLAYER_HEIGHT)
    sprites = {}
    for i, color in enumerate(colors):
        # Right standing
        sprites[f'player{i+1}_right_standing'] = create_character_sprite(
            color, sprite_size, facing_right=True, is_running=False
        )
        # Left standing
        sprites[f'player{i+1}_left_standing'] = create_character_sprite(
            color, sprite_size, facing_right=False, is_running=False
        )
        # Right running
        sprites[f'player{i+1}_right_running'] = create_character_sprite(
            color, sprite_size, facing_right=True, is_running=True
        )
        # Left running
        sprites[f'player{i+1}_left_running'] = create_character_sprite(
            color, sprite_size, facing_right=False, is_running=True
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
