"""
Level assets and visual elements to match the Portal 2D style
"""
import pygame
import os
import sys

# Get assets directory
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
assets_dir = os.path.join(base_dir, 'Assets')

# Asset subdirectories
platforms_dir = os.path.join(assets_dir, 'platforms')
blocks_dir = os.path.join(assets_dir, 'blocks')
props_dir = os.path.join(assets_dir, 'props')
backgrounds_dir = os.path.join(assets_dir, 'backgrounds')
portals_dir = os.path.join(assets_dir, 'portals')

def load_image(name, scale=None, subdir=None):
    """Load and optionally scale an image
    Args:
        name: Filename to load
        scale: Optional (width, height) tuple to scale the image
        subdir: Optional subdirectory within Assets folder
    """
    if subdir:
        path = os.path.join(assets_dir, subdir, name)
    else:
        path = os.path.join(assets_dir, name)
    if os.path.exists(path):
        try:
            img = pygame.image.load(path).convert_alpha()
            if scale:
                img = pygame.transform.scale(img, scale)
            return img
        except Exception as e:
            print(f"Warning: Could not load image {path}: {e}")
            return None
    return None

# Load existing assets
companion_cube_img = load_image('CompanionCube_Asset.png')
cube_spawner_img = load_image('Cube_Spawner.png')
exit_door_closed = load_image('ExitDoor_Closed.png', (75, 150))
exit_door_open = load_image('ExitDoor_Open.png', (150, 150))

def create_broken_block_surface(size=40):
    """Create a broken/damaged block texture"""
    surface = pygame.Surface((size, size))
    # Base dark brown-red color
    surface.fill((80, 50, 40))
    # Add grid pattern (broken window effect)
    for i in range(0, size, 4):
        pygame.draw.line(surface, (40, 30, 25), (i, 0), (i, size), 1)
        pygame.draw.line(surface, (40, 30, 25), (0, i), (size, i), 1)
    # Add white outline
    pygame.draw.rect(surface, (200, 200, 200), (0, 0, size, size), 2)
    # Add some random dark spots
    for _ in range(3):
        x = pygame.time.get_ticks() % size
        y = (pygame.time.get_ticks() * 7) % size
        pygame.draw.circle(surface, (30, 20, 15), (x, y), 3)
    return surface

def create_mechanical_bridge_surface(width, height):
    """Create a mechanical bridge with pistons"""
    surface = pygame.Surface((width, height))
    # Bridge platform (grey)
    surface.fill((150, 150, 150))
    # Add some detail lines
    pygame.draw.line(surface, (120, 120, 120), (0, height//2), (width, height//2), 2)
    # Draw pistons/arms below (light grey)
    piston_color = (180, 180, 180)
    piston_width = 15
    num_pistons = 4
    spacing = width // (num_pistons + 1)
    for i in range(1, num_pistons + 1):
        x = i * spacing
        # Draw piston arm
        pygame.draw.rect(surface, piston_color, (x - piston_width//2, height - 20, piston_width, 20))
        # Draw connection point
        pygame.draw.circle(surface, (200, 200, 200), (x, height - 10), 5)
    return surface

def create_checkered_flag_surface(size=60):
    """Create a checkered flag/arrow"""
    surface = pygame.Surface((size, size), pygame.SRCALPHA)
    # White arrow shape
    points = [(0, size//2), (size*0.7, 0), (size*0.7, size//3), (size, size//2), 
              (size*0.7, size*2//3), (size*0.7, size)]
    pygame.draw.polygon(surface, (255, 255, 255), points)
    # Add checkered pattern
    check_size = 8
    for y in range(0, size, check_size):
        for x in range(0, int(size*0.7), check_size):
            if (x // check_size + y // check_size) % 2 == 0:
                pygame.draw.rect(surface, (0, 0, 0), (x, y, check_size, check_size))
    return surface

def create_glass_tube_surface(width=40, height=120):
    """Create a glass tube with blue liquid"""
    surface = pygame.Surface((width, height), pygame.SRCALPHA)
    # Glass outline
    pygame.draw.rect(surface, (200, 200, 200), (0, 0, width, height), 3)
    # Blue liquid inside
    liquid_height = height - 20
    pygame.draw.rect(surface, (100, 150, 255, 180), (3, height - liquid_height - 10, width - 6, liquid_height))
    # Glass highlights
    pygame.draw.line(surface, (255, 255, 255, 100), (5, 5), (5, height - 5), 2)
    return surface

def create_wall_bar_surface(is_yellow=True, width=10, height=60):
    """Create a yellow or blue bar for walls"""
    surface = pygame.Surface((width, height))
    color = (255, 255, 0) if is_yellow else (100, 150, 255)
    surface.fill(color)
    # Add highlight
    pygame.draw.line(surface, (255, 255, 200) if is_yellow else (150, 200, 255), 
                    (2, 0), (2, height), 2)
    return surface

# Cache surfaces
_broken_block_cache = {}
_mechanical_bridge_cache = {}
_checkered_flag_cache = None
_glass_tube_cache = None
_wall_bar_cache = {}

def get_broken_block(size=40):
    """Get or create broken block surface
    Tries to load from Assets/blocks/ first, falls back to programmatic generation
    """
    if size not in _broken_block_cache:
        # Try to load sprite file first
        sprite = load_image(f'broken_block_{size}.png', subdir='blocks')
        if sprite:
            _broken_block_cache[size] = sprite
        else:
            # Fall back to programmatic generation
            _broken_block_cache[size] = create_broken_block_surface(size)
    return _broken_block_cache[size]

def get_mechanical_bridge(width, height):
    """Get or create mechanical bridge
    Tries to load from Assets/props/ first, falls back to programmatic generation
    """
    key = (width, height)
    if key not in _mechanical_bridge_cache:
        # Try to load sprite file first
        sprite = load_image('mechanical_bridge.png', subdir='props')
        if sprite:
            # Scale to match requested dimensions
            scaled = pygame.transform.scale(sprite, (width, height))
            _mechanical_bridge_cache[key] = scaled
        else:
            # Fall back to programmatic generation
            _mechanical_bridge_cache[key] = create_mechanical_bridge_surface(width, height)
    return _mechanical_bridge_cache[key]

def get_checkered_flag(size=60):
    """Get or create checkered flag
    Tries to load from Assets/props/ first, falls back to programmatic generation
    """
    global _checkered_flag_cache
    if _checkered_flag_cache is None:
        # Try to load sprite file first
        sprite = load_image('checkered_flag.png', scale=(size, size), subdir='props')
        if sprite:
            _checkered_flag_cache = sprite
        else:
            # Fall back to programmatic generation
            _checkered_flag_cache = create_checkered_flag_surface(size)
    return _checkered_flag_cache

def get_glass_tube(width=40, height=120):
    """Get or create glass tube
    Tries to load from Assets/props/ first, falls back to programmatic generation
    """
    global _glass_tube_cache
    if _glass_tube_cache is None:
        # Try to load sprite file first
        sprite = load_image('glass_tube.png', scale=(width, height), subdir='props')
        if sprite:
            _glass_tube_cache = sprite
        else:
            # Fall back to programmatic generation
            _glass_tube_cache = create_glass_tube_surface(width, height)
    return _glass_tube_cache

def get_wall_bar(is_yellow=True, width=10, height=60):
    """Get or create wall bar
    Tries to load from Assets/props/ first, falls back to programmatic generation
    """
    key = (is_yellow, width, height)
    if key not in _wall_bar_cache:
        # Try to load sprite file first
        color_name = 'yellow' if is_yellow else 'blue'
        sprite = load_image(f'wall_bar_{color_name}.png', scale=(width, height), subdir='props')
        if sprite:
            _wall_bar_cache[key] = sprite
        else:
            # Fall back to programmatic generation
            _wall_bar_cache[key] = create_wall_bar_surface(is_yellow, width, height)
    return _wall_bar_cache[key]

def get_platform_texture():
    """Get platform texture for tiling
    Returns a texture surface that can be tiled across platforms
    """
    # Try to load platform texture
    texture = load_image('platform_grey.png', subdir='platforms')
    if texture:
        return texture
    # Fall back: create a simple grey texture
    texture = pygame.Surface((64, 64))
    texture.fill((120, 120, 130))
    # Add subtle texture lines
    for i in range(0, 64, 10):
        pygame.draw.line(texture, (100, 100, 110), (i, 0), (i, 64), 1)
    # Highlight edges
    pygame.draw.rect(texture, (140, 140, 150), (0, 0, 64, 64), 2)
    return texture

def get_background_texture():
    """Get background texture
    Returns a background surface that can be tiled
    """
    # Try to load background texture
    texture = load_image('background_main.png', subdir='backgrounds')
    if texture:
        return texture
    # Fall back: return None (use solid color)
    return None

def tile_texture(texture, width, height):
    """Tile a texture across a surface of given dimensions
    Helper function for tiling textures (used by platforms and backgrounds)
    """
    if texture is None:
        return None
    surface = pygame.Surface((width, height))
    tex_width, tex_height = texture.get_size()
    # Tile the texture
    for y in range(0, height, tex_height):
        for x in range(0, width, tex_width):
            # Calculate how much of the texture to blit
            blit_width = min(tex_width, width - x)
            blit_height = min(tex_height, height - y)
            if blit_width > 0 and blit_height > 0:
                # If we need a partial tile, create a subsurface
                if blit_width < tex_width or blit_height < tex_height:
                    partial = texture.subsurface((0, 0, blit_width, blit_height))
                    surface.blit(partial, (x, y))
                else:
                    surface.blit(texture, (x, y))
    return surface
