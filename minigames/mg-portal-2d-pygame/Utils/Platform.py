import pygame
from Utils.LevelAssets import get_platform_texture, tile_texture

# Cache platform texture
_platform_texture_cache = None

def _get_platform_texture():
    """Get cached platform texture"""
    global _platform_texture_cache
    if _platform_texture_cache is None:
        _platform_texture_cache = get_platform_texture()
    return _platform_texture_cache

class Platform():
    # Constructor
    # x, y, width, length for Rect constructor
    # isPortable: determines if platform can have a portal
    # collision: determines what can collide with the platform
    #       0 = Both player and cube collide
    #       1 = Only player collide, cube passes through
    #       2 = Only cube collides, player passes through
    # active: determins if the platform should be rendered/collided with
    def __init__(self, x, y, width, length, isPortable, collision):
        self.surface = pygame.Surface((width, length))
        self.rect = self.surface.get_rect()
        self.rect.x = x
        self.rect.y = y
        self.isPortable = isPortable
        self.collision = collision
        self.active = True

    # Draws wall with professional styling
    def draw(self, screen):
        if not self.active:
            return

        # Recreate surface each frame for dynamic effects
        self.surface = pygame.Surface((self.rect.width, self.rect.height))
        
        if self.collision == 1:
            # Red barrier (player only)
            self.surface.fill((200, 50, 50))
            self.surface.set_alpha(180)
            # Add warning pattern
            for i in range(0, self.rect.width, 20):
                pygame.draw.line(self.surface, (255, 100, 100), (i, 0), (i, self.rect.height), 2)
        elif self.collision == 2:
            # Blue barrier (cube only)
            self.surface.fill((50, 150, 200))
            self.surface.set_alpha(180)
        elif self.isPortable:
            # Portal-able surface - try to use texture first
            texture = _get_platform_texture()
            if texture:
                # Tile the texture across the platform
                tiled = tile_texture(texture, self.rect.width, self.rect.height)
                if tiled:
                    self.surface = tiled
                else:
                    # Fallback to programmatic
                    self._draw_portable_fallback()
            else:
                # Fallback to programmatic
                self._draw_portable_fallback()
        else:
            # Solid non-portal surface (dark)
            self.surface.fill((40, 40, 45))
            # Add subtle detail
            pygame.draw.rect(self.surface, (60, 60, 65), (0, 0, self.rect.width, self.rect.height), 1)

        screen.blit(self.surface, (self.rect.x, self.rect.y))
    
    def _draw_portable_fallback(self):
        """Fallback drawing for portal-able surfaces when no texture is available"""
        # Portal-able surface (grey with subtle texture)
        self.surface.fill((120, 120, 130))
        # Add subtle texture lines
        for i in range(0, self.rect.width, 10):
            pygame.draw.line(self.surface, (100, 100, 110), (i, 0), (i, self.rect.height), 1)
        # Highlight edges
        pygame.draw.rect(self.surface, (140, 140, 150), (0, 0, self.rect.width, self.rect.height), 2)