"""
Generate Portal-style texture assets programmatically
Creates PNG files that match the Portal aesthetic
"""
import pygame
import os

# Initialize pygame for image generation
pygame.init()

# Get assets directory
base_dir = os.path.dirname(os.path.abspath(__file__))
assets_dir = os.path.join(base_dir, 'Assets')

def ensure_dir(path):
    """Ensure directory exists"""
    os.makedirs(path, exist_ok=True)

def save_surface(surface, path):
    """Save a pygame surface as PNG"""
    pygame.image.save(surface, path)
    print(f"Created: {path}")

def create_platform_texture():
    """Create a grey platform texture tile"""
    from Utils.GameScale import TEXTURE_PLATFORM_SIZE
    size = TEXTURE_PLATFORM_SIZE
    surface = pygame.Surface((size, size))
    
    # Base grey color
    surface.fill((120, 120, 130))
    
    # Add subtle texture lines (horizontal)
    for i in range(0, size, 8):
        pygame.draw.line(surface, (100, 100, 110), (0, i), (size, i), 1)
    
    # Add vertical detail lines
    for i in range(0, size, 16):
        pygame.draw.line(surface, (110, 110, 120), (i, 0), (i, size), 1)
    
    # Add edge highlights
    pygame.draw.rect(surface, (140, 140, 150), (0, 0, size, size), 2)
    
    # Add subtle corner highlights
    pygame.draw.line(surface, (160, 160, 170), (2, 2), (8, 2), 1)
    pygame.draw.line(surface, (160, 160, 170), (2, 2), (2, 8), 1)
    pygame.draw.line(surface, (160, 160, 170), (size-2, 2), (size-8, 2), 1)
    pygame.draw.line(surface, (160, 160, 170), (size-2, 2), (size-2, 8), 1)
    
    return surface

def create_broken_block(size=None):
    """Create a broken/damaged block texture"""
    from Utils.GameScale import TEXTURE_BLOCK_BASE
    if size is None:
        size = TEXTURE_BLOCK_BASE
    surface = pygame.Surface((size, size))
    
    # Base dark brown-red color
    surface.fill((80, 50, 40))
    
    # Add grid pattern (broken window effect)
    grid_color = (40, 30, 25)
    for i in range(0, size, 4):
        pygame.draw.line(surface, grid_color, (i, 0), (i, size), 1)
        pygame.draw.line(surface, grid_color, (0, i), (size, i), 1)
    
    # Add some darker spots for damage
    import random
    random.seed(42)  # For consistency
    for _ in range(5):
        x = random.randint(2, size - 3)
        y = random.randint(2, size - 3)
        pygame.draw.circle(surface, (30, 20, 15), (x, y), 2)
    
    # Add white outline
    pygame.draw.rect(surface, (200, 200, 200), (0, 0, size, size), 2)
    
    # Add crack lines
    crack_color = (50, 30, 20)
    pygame.draw.line(surface, crack_color, (size//4, size//4), (size*3//4, size*3//4), 1)
    pygame.draw.line(surface, crack_color, (size//2, 0), (size//2, size//2), 1)
    
    return surface

def create_mechanical_bridge(width=200, height=60):
    """Create a mechanical bridge with pistons"""
    surface = pygame.Surface((width, height))
    
    # Bridge platform (grey)
    surface.fill((150, 150, 150))
    
    # Add detail lines on platform
    pygame.draw.line(surface, (120, 120, 120), (0, height//2), (width, height//2), 2)
    for i in range(0, width, 20):
        pygame.draw.line(surface, (130, 130, 130), (i, 0), (i, height//2), 1)
    
    # Draw pistons/arms below (light grey)
    piston_color = (180, 180, 180)
    piston_width = 15
    num_pistons = 4
    spacing = width // (num_pistons + 1)
    
    for i in range(1, num_pistons + 1):
        x = i * spacing
        # Draw piston arm (vertical)
        pygame.draw.rect(surface, piston_color, (x - piston_width//2, height - 25, piston_width, 25))
        # Draw connection point at top
        pygame.draw.circle(surface, (200, 200, 200), (x, height - 25), 6)
        # Draw connection point at bottom
        pygame.draw.circle(surface, (200, 200, 200), (x, height - 5), 4)
        # Add piston detail lines
        pygame.draw.line(surface, (160, 160, 160), (x - piston_width//2, height - 15), 
                        (x + piston_width//2, height - 15), 1)
    
    return surface

def create_glass_tube(width=40, height=120):
    """Create a glass tube with blue liquid"""
    surface = pygame.Surface((width, height), pygame.SRCALPHA)
    
    # Glass outline (grey)
    pygame.draw.rect(surface, (200, 200, 200), (0, 0, width, height), 3)
    
    # Grey base
    pygame.draw.rect(surface, (150, 150, 150), (0, height - 15, width, 15))
    
    # Grey cap
    pygame.draw.rect(surface, (150, 150, 150), (0, 0, width, 10))
    
    # Blue liquid inside (semi-transparent)
    liquid_height = height - 30
    liquid_surface = pygame.Surface((width - 6, liquid_height), pygame.SRCALPHA)
    liquid_surface.fill((100, 150, 255, 200))
    surface.blit(liquid_surface, (3, 10))
    
    # Glass highlights
    pygame.draw.line(surface, (255, 255, 255, 150), (5, 5), (5, height - 5), 2)
    pygame.draw.line(surface, (255, 255, 255, 100), (width - 5, 5), (width - 5, height - 5), 1)
    
    # Liquid surface (top of liquid)
    pygame.draw.line(surface, (150, 200, 255, 255), (3, 10), (width - 3, 10), 2)
    
    return surface

def create_background_texture():
    """Create a muted beige background texture"""
    size = 256
    surface = pygame.Surface((size, size))
    
    # Base muted beige color
    surface.fill((245, 245, 220))  # Beige
    
    # Add very subtle pattern
    for y in range(0, size, 32):
        for x in range(0, size, 32):
            # Very subtle grid
            pygame.draw.rect(surface, (240, 240, 215), (x, y, 32, 32), 1)
    
    # Add faint room outline pattern (very subtle)
    outline_color = (230, 230, 210)
    # Draw faint rectangles suggesting room outlines
    pygame.draw.rect(surface, outline_color, (32, 32, 96, 64), 1)
    pygame.draw.rect(surface, outline_color, (128, 96, 96, 96), 1)
    
    return surface

def main():
    """Generate all texture assets"""
    print("Generating Portal-style texture assets...")
    
    # Ensure directories exist
    ensure_dir(os.path.join(assets_dir, 'platforms'))
    ensure_dir(os.path.join(assets_dir, 'blocks'))
    ensure_dir(os.path.join(assets_dir, 'props'))
    ensure_dir(os.path.join(assets_dir, 'backgrounds'))
    
    # Generate platform texture
    platform = create_platform_texture()
    save_surface(platform, os.path.join(assets_dir, 'platforms', 'platform_grey.png'))
    
    # Generate broken blocks (multiple sizes, scaled)
    from Utils.GameScale import TEXTURE_BLOCK_BASE, BASE_SCALE
    base_sizes = [40, 60, 80]
    for base_size in base_sizes:
        scaled_size = int(base_size * BASE_SCALE)
        block = create_broken_block(scaled_size)
        save_surface(block, os.path.join(assets_dir, 'blocks', f'broken_block_{base_size}.png'))
    
    # Generate mechanical bridge
    bridge = create_mechanical_bridge(200, 60)
    save_surface(bridge, os.path.join(assets_dir, 'props', 'mechanical_bridge.png'))
    
    # Generate glass tube
    tube = create_glass_tube(40, 120)
    save_surface(tube, os.path.join(assets_dir, 'props', 'glass_tube.png'))
    
    # Generate background texture
    bg = create_background_texture()
    save_surface(bg, os.path.join(assets_dir, 'backgrounds', 'background_main.png'))
    
    print("\nAll assets generated successfully!")
    print("The game will now use these texture files instead of programmatic generation.")

if __name__ == "__main__":
    main()
