"""
Centralized scaling system for professional game appearance
All game elements scale proportionally based on a base scale factor
"""
import pygame

# Base scale factor - adjust this to scale the entire game
# 1.0 = original size, 1.5 = 50% larger, etc.
BASE_SCALE = 0.65  # Smaller scale for better visual appearance and more level space

# Base sizes (at scale 1.0)
BASE_PLAYER_WIDTH = 64
BASE_PLAYER_HEIGHT = 64
BASE_PLATFORM_THICKNESS = 20
BASE_CUBE_SIZE = 48
BASE_PORTAL_GUN_WIDTH = 64
BASE_PORTAL_GUN_HEIGHT = 42
BASE_PORTAL_WIDTH = 58
BASE_PORTAL_HEIGHT = 114
BASE_BULLET_WIDTH = 50
BASE_BULLET_HEIGHT = 18
BASE_BUTTON_SIZE = 40
BASE_DOOR_WIDTH = 75
BASE_DOOR_HEIGHT = 150

# Scaled sizes (applied scale factor)
PLAYER_WIDTH = int(BASE_PLAYER_WIDTH * BASE_SCALE)
PLAYER_HEIGHT = int(BASE_PLAYER_HEIGHT * BASE_SCALE)
PLATFORM_THICKNESS = int(BASE_PLATFORM_THICKNESS * BASE_SCALE)
CUBE_SIZE = int(BASE_CUBE_SIZE * BASE_SCALE)
PORTAL_GUN_WIDTH = int(BASE_PORTAL_GUN_WIDTH * BASE_SCALE)
PORTAL_GUN_HEIGHT = int(BASE_PORTAL_GUN_HEIGHT * BASE_SCALE)
PORTAL_WIDTH = int(BASE_PORTAL_WIDTH * BASE_SCALE)
PORTAL_HEIGHT = int(BASE_PORTAL_HEIGHT * BASE_SCALE)
BULLET_WIDTH = int(BASE_BULLET_WIDTH * BASE_SCALE)
BULLET_HEIGHT = int(BASE_BULLET_HEIGHT * BASE_SCALE)
BUTTON_SIZE = int(BASE_BUTTON_SIZE * BASE_SCALE)
DOOR_WIDTH = int(BASE_DOOR_WIDTH * BASE_SCALE)
DOOR_HEIGHT = int(BASE_DOOR_HEIGHT * BASE_SCALE)

# Texture sizes (these should be larger for better quality)
TEXTURE_PLATFORM_SIZE = int(64 * BASE_SCALE)  # Platform texture tile size
TEXTURE_BLOCK_BASE = int(40 * BASE_SCALE)  # Base broken block size

# UI scaling
UI_FONT_BASE = 24  # Base font size
UI_FONT_SMALL = int(UI_FONT_BASE * BASE_SCALE * 0.6)
UI_FONT_MEDIUM = int(UI_FONT_BASE * BASE_SCALE * 0.8)
UI_FONT_LARGE = int(UI_FONT_BASE * BASE_SCALE)
UI_FONT_TITLE = int(UI_FONT_BASE * BASE_SCALE * 1.5)

# Physics scaling (adjust movement/jump for larger scale)
PHYSICS_SCALE = BASE_SCALE  # Scale physics to match visual scale
JUMP_STRENGTH = 14 * BASE_SCALE  # Jump height scales with size
GRAVITY_SCALE = 0.5 * BASE_SCALE  # Gravity scales with size

def scale_surface(surface, target_size=None, scale_factor=None):
    """Scale a surface by either target size or scale factor"""
    if target_size:
        return pygame.transform.scale(surface, target_size)
    elif scale_factor:
        w, h = surface.get_size()
        return pygame.transform.scale(surface, (int(w * scale_factor), int(h * scale_factor)))
    return surface

def get_scaled_size(base_size, scale_factor=BASE_SCALE):
    """Get scaled size from base size"""
    return int(base_size * scale_factor)
