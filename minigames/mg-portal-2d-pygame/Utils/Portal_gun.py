import pygame
import math
import os
import sys
from Utils.Game_settings import *
from Utils.GameScale import (
    PORTAL_GUN_WIDTH, PORTAL_GUN_HEIGHT,
    PORTAL_WIDTH, PORTAL_HEIGHT,
    BULLET_WIDTH, BULLET_HEIGHT,
    scale_surface
)

# Get the directory of this file and find assets
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
assets_dir = os.path.join(base_dir, 'Assets')

# Load base portal gun sprite and colorize for each team
def colorize_sprite(surface, target_color):
    """Colorize a sprite with a specific color by replacing non-transparent pixels"""
    colored = surface.copy()
    # Create a color overlay
    overlay = pygame.Surface(colored.get_size(), pygame.SRCALPHA)
    overlay.fill(target_color)
    # Blend the overlay with the original, preserving transparency
    colored.blit(overlay, (0, 0), special_flags=pygame.BLEND_RGBA_MULT)
    return colored

def replace_color_in_sprite(surface, source_color, target_color, threshold=50):
    """Replace blue color in portal sprite with target color (red/yellow), preserving shape and details"""
    result = surface.copy()
    sr, sg, sb = source_color
    tr, tg, tb = target_color
    
    for x in range(result.get_width()):
        for y in range(result.get_height()):
            pixel = result.get_at((x, y))
            if pixel[3] == 0:  # Skip transparent pixels
                continue
            r, g, b, a = pixel
            
            # Only replace pixels that are clearly blue (not borders, outlines, or other colors)
            # Check: blue must be the dominant color component
            blue_dominant = (b > max(r, g) + 30)  # Blue is significantly higher
            
            # Check if it's in the blue color range
            color_dist = ((r - sr)**2 + (g - sg)**2 + (b - sb)**2)**0.5
            
            # Only replace if it's clearly a blue pixel
            if blue_dominant and color_dist < threshold:
                # Simple, clean replacement: map blue intensity to target color intensity
                # Use the blue channel as a brightness guide
                blue_intensity = b / 255.0
                
                # Scale target color by blue intensity to preserve shading
                new_r = int(tr * blue_intensity)
                new_g = int(tg * blue_intensity)
                new_b = int(tb * blue_intensity)
                
                # Ensure we don't go below a minimum brightness to avoid too-dark colors
                min_brightness = 50
                current_brightness = (new_r + new_g + new_b) / 3.0
                if current_brightness < min_brightness and blue_intensity > 0.3:
                    # Boost brightness for visible areas
                    brightness_boost = min_brightness / current_brightness if current_brightness > 0 else 1.0
                    new_r = min(255, int(new_r * brightness_boost))
                    new_g = min(255, int(new_g * brightness_boost))
                    new_b = min(255, int(new_b * brightness_boost))
                
                result.set_at((x, y), (new_r, new_g, new_b, a))
    
    return result

# Load base sprites
try:
    base_gun_blue = pygame.image.load(os.path.join(assets_dir, "8bitPortalGun_Sprite_Blue.png")).convert_alpha()
    base_gun_orange = pygame.image.load(os.path.join(assets_dir, "8bitPortalGun_Sprite_Orange.png")).convert_alpha()
except:
    # Fallback: create simple colored rectangles if assets don't exist
    base_gun_blue = pygame.Surface((64, 42), pygame.SRCALPHA)
    base_gun_blue.fill((100, 150, 255))
    base_gun_orange = pygame.Surface((64, 42), pygame.SRCALPHA)
    base_gun_orange.fill((255, 150, 100))

# Team colors: Blue, Orange, Red, Yellow
team_colors = [
    (100, 150, 255),  # Blue (Player 1 - Team 1)
    (255, 150, 100),  # Orange (Player 2 - Team 1)
    (255, 50, 50),    # Red (Player 3 - Team 2)
    (255, 255, 100),  # Yellow (Player 4 - Team 2)
]

# Create colored portal gun sprites for each player (scaled)
pGunSprites = []
for i, color in enumerate(team_colors):
    if i < 2:
        # Use blue/orange base for team 1
        base = base_gun_blue if i == 0 else base_gun_orange
        colored = base
    else:
        # For red/yellow (team 2), use grayscale conversion then tint
        # This avoids brown artifacts from color blending
        base = base_gun_blue.copy()
        # Convert to grayscale first
        gray = pygame.Surface(base.get_size(), pygame.SRCALPHA)
        for x in range(base.get_width()):
            for y in range(base.get_height()):
                pixel = base.get_at((x, y))
                if pixel[3] == 0:
                    continue
                # Convert to grayscale
                gray_val = int(0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2])
                gray.set_at((x, y), (gray_val, gray_val, gray_val, pixel[3]))
        
        # Now tint the grayscale with target color
        tr, tg, tb = color
        for x in range(gray.get_width()):
            for y in range(gray.get_height()):
                pixel = gray.get_at((x, y))
                if pixel[3] == 0:
                    continue
                # Use grayscale value as intensity
                intensity = pixel[0] / 255.0
                # Apply target color with intensity
                new_r = int(tr * intensity)
                new_g = int(tg * intensity)
                new_b = int(tb * intensity)
                gray.set_at((x, y), (new_r, new_g, new_b, pixel[3]))
        
        colored = gray
    # Scale to proper size
    scaled = scale_surface(colored, (PORTAL_GUN_WIDTH, PORTAL_GUN_HEIGHT))
    pGunSprites.append(scaled)

# Portal sprites - same color scheme
try:
    base_portal_blue = pygame.image.load(os.path.join(assets_dir, "8bitPortal_Sprite_Blue.png")).convert_alpha()
    base_portal_orange = pygame.image.load(os.path.join(assets_dir, "8bitPortal_Sprite_Orange.png")).convert_alpha()
except:
    base_portal_blue = pygame.Surface((58, 114), pygame.SRCALPHA)
    pygame.draw.circle(base_portal_blue, (100, 150, 255), (29, 57), 25)
    base_portal_orange = pygame.Surface((58, 114), pygame.SRCALPHA)
    pygame.draw.circle(base_portal_orange, (255, 150, 100), (29, 57), 25)

portalSprites = []
for i, color in enumerate(team_colors):
    if i < 2:
        # Use blue/orange base sprites for team 1
        base = base_portal_blue if i == 0 else base_portal_orange
        colored = base
    else:
        # For red/yellow (team 2), use the blue portal sprite and do a clean color replacement
        # Use a simple approach: convert blue to grayscale, then tint with target color
        base = base_portal_blue.copy()
        # Create a grayscale version first
        gray = pygame.Surface(base.get_size(), pygame.SRCALPHA)
        for x in range(base.get_width()):
            for y in range(base.get_height()):
                pixel = base.get_at((x, y))
                if pixel[3] == 0:
                    continue
                # Convert to grayscale
                gray_val = int(0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2])
                gray.set_at((x, y), (gray_val, gray_val, gray_val, pixel[3]))
        
        # Now tint the grayscale with target color
        tr, tg, tb = color
        for x in range(gray.get_width()):
            for y in range(gray.get_height()):
                pixel = gray.get_at((x, y))
                if pixel[3] == 0:
                    continue
                # Use grayscale value as intensity
                intensity = pixel[0] / 255.0
                # Apply target color with intensity
                new_r = int(tr * intensity)
                new_g = int(tg * intensity)
                new_b = int(tb * intensity)
                gray.set_at((x, y), (new_r, new_g, new_b, pixel[3]))
        
        colored = gray
    # Scale to proper size
    scaled = scale_surface(colored, (PORTAL_WIDTH, PORTAL_HEIGHT))
    portalSprites.append(scaled)

# Bullet sprites
try:
    base_bullet_blue = pygame.image.load(os.path.join(assets_dir, "LazerBlast_Blue.png")).convert_alpha()
    base_bullet_orange = pygame.image.load(os.path.join(assets_dir, "LazerBlast_Orange.png")).convert_alpha()
except:
    base_bullet_blue = pygame.Surface((50, 18), pygame.SRCALPHA)
    pygame.draw.ellipse(base_bullet_blue, (100, 150, 255), (0, 0, 50, 18))
    base_bullet_orange = pygame.Surface((50, 18), pygame.SRCALPHA)
    pygame.draw.ellipse(base_bullet_orange, (255, 150, 100), (0, 0, 50, 18))

bulletSprites = []
for i, color in enumerate(team_colors):
    if i < 2:
        # Use blue/orange base sprites for team 1
        base = base_bullet_blue if i == 0 else base_bullet_orange
        colored = base
    else:
        # For red/yellow (team 2), create programmatically for better color accuracy
        colored = pygame.Surface((50, 18), pygame.SRCALPHA)
        # Draw bullet ellipse with target color
        pygame.draw.ellipse(colored, color, (0, 0, 50, 18))
        # Add highlight
        lighter_color = tuple(min(255, c + 40) for c in color)
        pygame.draw.ellipse(colored, lighter_color, (5, 3, 40, 12))
    # Scale to proper size
    scaled = scale_surface(colored, (BULLET_WIDTH, BULLET_HEIGHT))
    bulletSprites.append(scaled)

#portal gun  
class Pgun( pygame.sprite.GroupSingle ):
    def __init__( self, player_num ):
        super().__init__()
        # player_num is 0-3 (Player 1-4)
        self.playerNum = player_num
        self.pos = pygame.math.Vector2( PGUN_START_X, PGUN_START_Y ) #sets position when you first load the game
        # Use player-specific colored sprite (already scaled)
        self.image = pGunSprites[self.playerNum]
        self.base_pgun_image = self.image
        self.hitbox_rect = self.base_pgun_image.get_rect( center = self.pos )
        self.rect = self.hitbox_rect.copy()
        self.shoot_cooldown = 0
        self.angle = 0
        self.gun_barrel_offset = pygame.math.Vector2( 0, 0 ) #sets how far away the portal gun is away from the player
        self.portalPos = (0,0)
        self.portalRot = 0
      
#locks aims the pgun based on keyboard direction (adapted for minigame system)
    def pgun_rotation( self, aim_direction=None ):
        # If aim_direction is provided (keyboard input), use it
        # Otherwise keep current angle
        if aim_direction is not None:
            self.angle = aim_direction
        
        # Rotate the gun image (pygame rotates counter-clockwise, so negate)
        # Also adjust for sprite orientation (0 degrees = pointing right)
        self.image = pygame.transform.rotate( self.base_pgun_image, -self.angle )
        self.rect = self.image.get_rect( center = self.hitbox_rect.center )

#sets a delay when you shoot
    def is_shooting( self ): 
        if self.shoot_cooldown == 0:
            self.shoot_cooldown = SHOOT_COOLDOWN
            # Calculate bullet spawn position from gun barrel
            # Convert angle to radians for calculations
            angle_rad = math.radians(self.angle)
            # Gun barrel is at the front of the gun (offset forward)
            barrel_offset_x = math.cos(angle_rad) * 30  # 30 pixels forward
            barrel_offset_y = -math.sin(angle_rad) * 30  # Negative because pygame y increases downward
            spawn_bullet_pos = (
                self.rect.centerx + barrel_offset_x,
                self.rect.centery + barrel_offset_y
            )
            self.sprite = Bullet( spawn_bullet_pos[0], spawn_bullet_pos[1], self.angle, self.playerNum )
         
#moves hitbox
    def move( self ):
        self.pos += pygame.math.Vector2( self.velocity_x, self.velocity_y )
        self.hitbox_rect.center = self.pos
        self.rect.center = self.hitbox_rect.center

    def update( self, platforms, aim_direction=None ):
        self.rect.center = self.hitbox_rect.center
        self.pgun_rotation(aim_direction)

        if self.shoot_cooldown > 0:
            self.shoot_cooldown -= 1

        if type(self.sprite) is Bullet:
            collided = self.sprite.update(platforms)
            if collided:
                self.spawnPortal(self.sprite.rect.center, collided)
        elif self.sprite:
            self.sprite.update()

    def spawnPortal(self, center, platform, all_existing_portals=None):
        """Spawn a portal, replacing any existing portal at the same location"""
        top = abs(center[1] - platform.rect.top)
        bottom = abs(center[1] - platform.rect.bottom)
        left = abs(center[0] - platform.rect.left)
        right = abs(center[0] - platform.rect.right)
        collide = min(min(top, bottom), min(left, right))
        pos = (0, 0)
        angle = 0

        # Position portals flush with the surface they hit
        # Use appropriate dimension based on portal orientation
        portal_half_height = PORTAL_HEIGHT // 2
        portal_half_width = PORTAL_WIDTH // 2
        if collide == top:
            # Portal on top surface (ceiling) - center vertically on the top edge
            pos = (center[0], platform.rect.top + portal_half_height)
            angle = 270
        elif collide == bottom:
            # Portal on bottom surface (floor) - center vertically on the bottom edge
            pos = (center[0], platform.rect.bottom - portal_half_height)
            angle = 90
        elif collide == left:
            # Portal on left surface (wall) - center horizontally on the left edge
            pos = (platform.rect.left + portal_half_width, center[1])
            angle = 0
        elif collide == right:
            # Portal on right surface (wall) - center horizontally on the right edge
            pos = (platform.rect.right - portal_half_width, center[1])
            angle = 180

        # Check if there's already a portal at this position (within 50 pixels)
        # If so, remove it (Portal game mechanic: shooting replaces existing portal)
        if all_existing_portals:
            portals_to_remove = []
            for portal in all_existing_portals:
                if portal:
                    try:
                        distance = ((portal.rect.centerx - pos[0])**2 + (portal.rect.centery - pos[1])**2)**0.5
                        if distance < 50:  # Same location threshold
                            portals_to_remove.append(portal)
                    except:
                        pass
            
            # Remove portals at this location
            for portal in portals_to_remove:
                # Clear from player's gun if it's their portal
                if hasattr(self, '_all_players') and self._all_players:
                    for player in self._all_players:
                        if hasattr(player, 'pGun') and player.pGun.sprite == portal:
                            player.pGun.sprite = None
                # Remove from all_portals list
                if portal in all_existing_portals:
                    all_existing_portals.remove(portal)
                # Kill the portal sprite
                try:
                    portal.kill()
                except:
                    pass

        self.portalPos = pos
        self.portalRot = angle
        # Create portal with player-specific color (0-3 for Player 1-4)
        self.sprite = Portal(pos[0], pos[1], angle, self.playerNum)

    def draw(self, screen):
        super().draw(screen)
        screen.blit(self.image, self.rect)

    def drawHitbox(self, screen):
        pygame.draw.rect(screen, (255, 0, 0), self.rect, 2, 1)
        pygame.draw.circle(screen, (255, 0, 0), self.rect.center, 5)
        if self.sprite:
            self.sprite.drawHitbox(screen)

#sets up shooting the bullet and the bullet movement
class Bullet( pygame.sprite.Sprite ):
    def __init__( self, x, y, angle , playerNum):
        super().__init__()
        # bulletSprites are already scaled, just rotate
        self.image = pygame.transform.rotate(bulletSprites[playerNum], -angle)
        self.rect = self.image.get_rect()
        self.x = x
        self.y = y
        self.rect.center = ( x, y )
        self.speed = BULLET_SPEED
        # Convert angle from degrees to radians for proper physics
        angle_rad = math.radians(angle)
        # Calculate velocity components (x increases right, y increases down in pygame)
        self.x_vel = math.cos(angle_rad) * self.speed
        self.y_vel = -math.sin(angle_rad) * self.speed  # Negative because pygame y increases downward 
        self.bullet_lifetime = BULLET_LIFETIME
        self.spawn_time = pygame.time.get_ticks() #gets the time that the bullet was created
        self.bullet_offset = pygame.math.Vector2( 0, 0 )

    def bullet_movement( self, platforms ) -> bool:  
        self.x += self.x_vel
        self.y += self.y_vel

        self.rect.x = int( self.x )
        self.rect.y = int( self.y )

        if pygame.time.get_ticks() - self.spawn_time > self.bullet_lifetime: #despawn bullet if it goes to far
            self.kill() 
        
        # Check collision with platforms
        for platform in platforms:
            if not platform.active:
                continue
            if self.rect.colliderect( platform.rect ):
                if platform.isPortable:
                    # Portal can be created on this surface
                    return platform
                else:
                    # Non-portable surface - bullet is destroyed
                    self.kill()
                    return None
            
        return None

    def update( self, platform ) -> bool:
        return self.bullet_movement(platform)
    
    def drawHitbox(self, screen):
        pygame.draw.rect(screen, (255, 0, 0), self.rect, 2, 1)
        pygame.draw.circle(screen, (255, 0, 0), self.rect.center, 5)
        
class Portal( pygame.sprite.Sprite ):
    def __init__( self, x, y, angle, playerNum ):
        super().__init__()
        # portalSprites are already scaled, just rotate
        self.image = pygame.transform.rotate(portalSprites[playerNum], angle)
        self.playerNum = playerNum
        self.rect = self.image.get_rect()
        self.rect.center = ( x, y )
        self.x = x
        self.y = y
        self.angle = angle
        self.spawn_time = pygame.time.get_ticks()
        self.spawned_portals = SPAWNED_PORTALS
        self.spawned_portals = 0
        self.p_shoot = False

    def drawHitbox(self, screen):
        pygame.draw.rect(screen, (255, 0, 0), self.rect, 2, 1)
        pygame.draw.circle(screen, (255, 0, 0), self.rect.center, 5)