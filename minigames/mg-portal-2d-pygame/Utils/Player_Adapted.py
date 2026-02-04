"""
Adapted Player class for 4-player local gameplay
Based on original Player.py but adapted for minigame system
"""
import sys
import pygame
import os
import math
from Utils import GlobalVariables
from Utils.Portal_gun import Pgun, Portal

class Player():
    def __init__(self, x, y, player_num=1, controllingCube=False):
        self.x = x
        self.y = y
        self.player_num = player_num  # 1-4
        self.background_x = GlobalVariables.Width
        self.background_y = GlobalVariables.Height
        self.size_x = GlobalVariables.Player_size_X
        self.size_y = GlobalVariables.Player_size_Y
        self.isJump = False
        self.isJumping = False
        self.canJump = True
        self.hitPlatform = False
        from Utils.GameScale import JUMP_STRENGTH, GRAVITY_SCALE
        self.jump_count = JUMP_STRENGTH
        self.count = JUMP_STRENGTH
        self.runningCount = 0
        self.gravity = GRAVITY_SCALE
        self.velocity = 0  # Vertical velocity
        self.velocity_x = 0  # Horizontal velocity for momentum
        self.running = False
        self.runningAnim = False
        self.allowAnim = False
        self.leftSide = False
        self.image = None
        self.cube = None
        self.completed = False
        self.pGun = Pgun(player_num - 1)  # 0-3 for portal gun (Player 1-4)
        self.warpCooldown = 0
        self.name = f"Player {player_num}"
        self.controllingCube = controllingCube
        self.cubeState = "1" if controllingCube else "0"
        
        # Use professional character sprites
        from Utils.CharacterSprites import get_player_sprites
        sprites = get_player_sprites()
        
        self.rightStandingImage = sprites[f'player{player_num}_right_standing']
        self.leftStandingImage = sprites[f'player{player_num}_left_standing']
        self.rightRunningImage = sprites[f'player{player_num}_right_running']
        self.leftRunningImage = sprites[f'player{player_num}_left_running']
        
        self.image = self.rightStandingImage
        
        # Control keys for this player
        self.control_keys = self._get_control_keys()

    def _get_control_keys(self):
        """Get control keys for this player"""
        controls = {
            1: {'left': pygame.K_a, 'right': pygame.K_d, 'jump': pygame.K_SPACE, 'action': pygame.K_SPACE, 'interact': pygame.K_e},
            2: {'left': pygame.K_LEFT, 'right': pygame.K_RIGHT, 'jump': pygame.K_UP, 'action': pygame.K_RETURN, 'interact': pygame.K_RETURN},
            3: {'left': pygame.K_j, 'right': pygame.K_l, 'jump': pygame.K_i, 'action': pygame.K_u, 'interact': pygame.K_u},
            4: {'left': pygame.K_f, 'right': pygame.K_h, 'jump': pygame.K_t, 'action': pygame.K_r, 'interact': pygame.K_r}
        }
        return controls.get(self.player_num, controls[1])

    def draw(self, screen):
        if self.cube:
            self.cube.rect.center = self.rect().center
        screen.blit(self.image, (self.x, self.y))
        from Utils.GameScale import UI_FONT_SMALL
        name_text = GlobalVariables.font(UI_FONT_SMALL).render(self.name, True, GlobalVariables.Text_NameColor)
        screen.blit(name_text, (self.x, self.y - 30))
        self.pGun.draw(screen)

    def rect(self):
        return pygame.Rect(self.x, self.y, self.size_x, self.size_y)

    def update(self, platforms, dt):
        self.set_gravity(platforms, dt)
        if self.isJump:
            self.check_collision(platforms, 0, 1)
        else:
            self.check_collision(platforms, 0, -1)
        
        # Enforce boundary limits after all movement
        from Utils.GameScale import PLATFORM_THICKNESS
        wall_thickness = PLATFORM_THICKNESS
        min_x = wall_thickness
        max_x = self.background_x - self.size_x - wall_thickness
        min_y = wall_thickness
        max_y = self.background_y - self.size_y - wall_thickness
        self.x = max(min_x, min(self.x, max_x))
        self.y = max(min_y, min(self.y, max_y))

        self.pGun.hitbox_rect.center = self.rect().center
        # Update portal gun (aim_direction will be set by keyboardInput)
        # Always update aim direction, defaulting to player facing direction
        aim_dir = getattr(self, '_aim_direction', None)
        if aim_dir is None:
            # Default to player facing direction
            aim_dir = 180 if self.leftSide else 0
        else:
            # If aim direction exists but player turned, update base direction if not aiming up/down
            # Check if current aim is a base direction (0 or 180)
            if aim_dir == 0 or aim_dir == 180:
                # Update to match current facing direction
                aim_dir = 180 if self.leftSide else 0
            # If aiming up/down, keep the angle but ensure it's correct for current facing
            elif aim_dir in [45, 135]:  # Down-right or Down-left
                aim_dir = 135 if self.leftSide else 45
            elif aim_dir in [225, 315]:  # Up-left or Up-right
                aim_dir = 225 if self.leftSide else 315
        
        # Update the stored aim direction
        self._aim_direction = aim_dir
        # Update portal gun (only platforms and aim direction needed)
        self.pGun.update(platforms, aim_dir)

        if self.warpCooldown > 0:
            self.warpCooldown -= 1

        if self.cubeState == "10":
            self.cubeState = "0"
            self.controllingCube = False

        if self.cubeState == "11":
            self.cubeState = "1"
            self.controllingCube = True

    def move(self, input_state, platforms, dt):
        """Move player based on input state dict"""
        from Utils.GameScale import BASE_SCALE
        
        left_key = self.control_keys['left']
        right_key = self.control_keys['right']
        jump_key = self.control_keys['jump']
        
        # Check if keys are pressed (input_state is a dict with 'left', 'right', 'up', 'down', 'action')
        moving_left = input_state.get('left', False)
        moving_right = input_state.get('right', False)
        jumping = input_state.get('up', False) or input_state.get('action', False)
        
        # Track facing direction for gun rotation
        was_facing_left = self.leftSide
        
        # Scale movement speed to match character size (reduced for better control)
        movement_speed = 0.25 * BASE_SCALE  # Reduced movement speed for better control
        
        if moving_right:
            # Boundary check with wall thickness
            from Utils.GameScale import PLATFORM_THICKNESS
            wall_thickness = PLATFORM_THICKNESS
            max_x = self.background_x - self.size_x - wall_thickness
            if self.x < max_x:
                # Scaled movement speed for smaller characters
                self.velocity_x = movement_speed * dt
                # Check collision before moving
                test_x = self.x + self.velocity_x
                test_rect = pygame.Rect(test_x, self.y, self.size_x, self.size_y)
                can_move = True
                for platform in platforms:
                    if platform.active and (not platform.collision == 2 or self.cube != None):
                        if test_rect.colliderect(platform.rect):
                            can_move = False
                            self.velocity_x = 0
                            break
                
                if can_move:
                    self.x += self.velocity_x
                    # Clamp to boundary
                    if self.x > max_x:
                        self.x = max_x
                        self.velocity_x = 0
                else:
                    # Adjust position to be just before the wall
                    self.x = min(self.x, max_x)
                    for platform in platforms:
                        if platform.active and platform.rect.colliderect(test_rect):
                            if platform.rect.left > self.x:
                                self.x = platform.rect.left - self.size_x
                            break
                
                self.check_collision(platforms, 1, 0)
                self.running = True
                self.leftSide = False
                if self.allowAnim:
                    self.runningAnim = True
                else:
                    self.runningAnim = False
                self.runningCount += 1
            else:
                self.velocity_x = 0
        elif moving_left:
            # Boundary check with wall thickness
            from Utils.GameScale import PLATFORM_THICKNESS
            wall_thickness = PLATFORM_THICKNESS
            min_x = wall_thickness
            if self.x > min_x:
                # Scaled movement speed for smaller characters
                self.velocity_x = -movement_speed * dt
                # Check collision before moving
                test_x = self.x + self.velocity_x
                test_rect = pygame.Rect(test_x, self.y, self.size_x, self.size_y)
                can_move = True
                for platform in platforms:
                    if platform.active and (not platform.collision == 2 or self.cube != None):
                        if test_rect.colliderect(platform.rect):
                            can_move = False
                            self.velocity_x = 0
                            break
                
                if can_move:
                    self.x += self.velocity_x
                    # Clamp to boundary
                    if self.x < min_x:
                        self.x = min_x
                        self.velocity_x = 0
                else:
                    # Adjust position to be just before the wall
                    self.x = max(self.x, min_x)
                    for platform in platforms:
                        if platform.active and platform.rect.colliderect(test_rect):
                            if platform.rect.right < self.x + self.size_x:
                                self.x = platform.rect.right
                            break
                
                self.running = True
                self.leftSide = True
                if self.allowAnim:
                    self.runningAnim = True
                else:
                    self.runningAnim = False
                self.check_collision(platforms, -1, 0)
                self.runningCount += 1
            else:
                self.velocity_x = 0
        else:
            # Decay horizontal velocity when not moving (friction)
            self.velocity_x *= 0.9
            if abs(self.velocity_x) < 0.01:
                self.velocity_x = 0
        
        # Update gun direction when player turns (always follows player direction)
        if was_facing_left != self.leftSide:
            # Player turned, update gun base direction
            if hasattr(self, '_aim_direction'):
                current_aim = self._aim_direction
                # If aiming straight (0 or 180), update to new facing direction
                if current_aim == 0 or current_aim == 180:
                    self._aim_direction = 180 if self.leftSide else 0
                # If aiming diagonally, adjust for new facing direction
                elif current_aim == 45:  # Down-right
                    self._aim_direction = 135 if self.leftSide else 45  # Down-left or Down-right
                elif current_aim == 135:  # Down-left
                    self._aim_direction = 135 if self.leftSide else 45
                elif current_aim == 225:  # Up-left
                    self._aim_direction = 225 if self.leftSide else 315  # Up-left or Up-right
                elif current_aim == 315:  # Up-right
                    self._aim_direction = 225 if self.leftSide else 315
                
        if jumping and self.canJump:
            from Utils.GameScale import BASE_SCALE
            self.isJump = True
            self.isJumping = True
            self.canJump = False
            self.count = self.jump_count
            # Scaled jump velocity for smaller characters
            jump_velocity = 6 * BASE_SCALE * dt * 0.05
            self.velocity = jump_velocity
            self.check_collision(platforms, 0, 1)
            
        if self.runningCount >= 5 and self.running and self.runningAnim:
            if self.leftSide:
                self.image = self.leftRunningImage
            else:
                self.image = self.rightRunningImage
            self.runningCount = 0
            self.allowAnim = False
        elif self.runningCount >= 5 and self.running and not self.runningAnim:
            if self.leftSide:
                self.image = self.leftStandingImage
            else:
                self.image = self.rightStandingImage
            self.runningCount = 0
            self.allowAnim = True
            
        if not moving_left and not moving_right:
            if self.leftSide:
                self.image = self.leftStandingImage
            else:
                self.image = self.rightStandingImage
            self.running = False
            self.allowAnim = False
            self.runningAnim = False
            self.runningCount = 0

    def jump(self, dt):
        if self.count >= -self.jump_count:
            if self.count >= 0 and self.isJump:
                add_y = 1
                self.actually_jump(add_y)
            if self.count < 0:
                self.isJump = False
                add_y = -1
                self.actually_jump(add_y)
        else:
            self.isJumping = False
            self.isJump = False
            self.count = self.jump_count
    
    def actually_jump(self, add_y):
        if self.y - self.count**2 * 0.1 * add_y > 0:
            self.y -= self.count**2 * 0.1 * add_y
        else:
            self.count = 0
        self.count -= 1

    def set_gravity(self, platforms, dt):
        if not self.isJump and not self.isJumping:
            self.velocity += self.gravity
            count = 0
            on_platform = False
            for platform in platforms:
                if self.rect().colliderect(platform.rect) and platform.active and (not platform.collision == 2 or self.cube != None):
                    on_platform = True
                    # Reset horizontal velocity when landing
                    if abs(self.velocity_x) > 0.1:
                        self.velocity_x *= 0.5  # Friction on landing
                    break
            
            if not on_platform:
                # Apply horizontal velocity when in air (momentum)
                if abs(self.velocity_x) > 0.01:
                    from Utils.GameScale import PLATFORM_THICKNESS
                    wall_thickness = PLATFORM_THICKNESS
                    old_x = self.x
                    self.x += self.velocity_x
                    # Clamp to boundaries
                    min_x = wall_thickness
                    max_x = self.background_x - self.size_x - wall_thickness
                    if self.x < min_x:
                        self.x = min_x
                        self.velocity_x = 0
                    elif self.x > max_x:
                        self.x = max_x
                        self.velocity_x = 0
                    # Slight air resistance
                    self.velocity_x *= 0.98
                
                for platform in platforms:
                    if not self.rect().colliderect(platform.rect) or not platform.active or (platform.collision == 2 and self.cube == None):
                        if self.hitPlatform == True:
                            self.y += self.velocity * 0.02 * dt
                        else:
                            if count <= 3:
                                self.y += self.velocity * 0.05 * dt
                                count+= 1
                    else:
                        break
        elif not self.isJump and self.isJumping:
            self.velocity += self.gravity
            on_platform = False
            for platform in platforms:
                if self.rect().colliderect(platform.rect) and platform.active and (not platform.collision == 2 or self.cube != None):
                    on_platform = True
                    break
            if not on_platform:
                self.y += self.velocity * 0.05 * dt
                # Apply horizontal velocity when falling (momentum)
                if abs(self.velocity_x) > 0.01:
                    from Utils.GameScale import PLATFORM_THICKNESS
                    wall_thickness = PLATFORM_THICKNESS
                    self.x += self.velocity_x
                    # Clamp to boundaries
                    min_x = wall_thickness
                    max_x = self.background_x - self.size_x - wall_thickness
                    if self.x < min_x:
                        self.x = min_x
                        self.velocity_x = 0
                    elif self.x > max_x:
                        self.x = max_x
                        self.velocity_x = 0
                    # Slight air resistance
                    self.velocity_x *= 0.98
        # Clamp Y position to map boundaries
        from Utils.GameScale import PLATFORM_THICKNESS
        wall_thickness = PLATFORM_THICKNESS
        min_y = wall_thickness  # Top boundary (ceiling)
        max_y = self.background_y - self.size_y - wall_thickness  # Bottom boundary (floor)
        if self.y > max_y:
            self.y = max_y
            self.velocity = 0
        if self.y < min_y:
            self.y = min_y
            self.velocity = 0

    def check_collision(self, platforms, x, y):
        """Improved collision detection that prevents going through walls"""
        rect = self.rect()
        for platformObj in platforms:
            if not platformObj.active:
                continue
            if platformObj.collision == 2 and self.cube == None:
                continue  # Skip cube-only platforms
            
            platform = platformObj.rect
            if rect.colliderect(platform):
                # Horizontal collision (moving right)
                if x > 0:
                    # Check if we're moving into the platform from the left
                    if self.x < platform.left:
                        self.x = platform.left - self.size_x
                        self.velocity_x = 0
                        break
                # Horizontal collision (moving left)
                elif x < 0:
                    # Check if we're moving into the platform from the right
                    if self.x + self.size_x > platform.right:
                        self.x = platform.right
                        self.velocity_x = 0
                        break
                # Vertical collision (moving up/jumping)
                elif y < 0:
                    # Check if we're moving into the platform from below
                    if self.y + self.size_y > platform.top:
                        self.y = platform.top - self.size_y
                        self.velocity = 0
                        self.isJump = False
                        self.canJump = True
                        self.hitPlatform = False
                        break
                # Vertical collision (moving down/falling)
                elif y > 0:
                    # Check if we're moving into the platform from above
                    if self.y < platform.bottom:
                        self.y = platform.bottom
                        self.velocity = 0
                        self.count = 0
                        self.isJump = False
                        self.isJumping = False
                        self.canJump = True
                        self.hitPlatform = True
                        break
                
                # Additional check for landing on top of platform
                if y > 0 and rect.left >= platform.left - self.size_x and rect.right <= platform.right + self.size_x:
                    if rect.top - platform.bottom + 2 > platform.top and rect.top < platform.bottom + 1:
                        self.y = platform.bottom
                        self.count = 0
                        self.isJump = False
                        self.isJumping = False
                        self.canJump = True
                        self.hitPlatform = True
                        break

    def interactButton(self, input_state, button) -> bool:
        """Check if player interacts with button"""
        if input_state.get('action', False) and self.rect().colliderect(button.rect):
            if button.activate():
                self.cubeState = "11"
                self.controllingCube = True
                return True
        return False
    
    def keyboardInput(self, input_state, cube=None, platforms=None):
        """Handle keyboard input for shooting and cube interaction"""
        # Base aim direction is always the player's facing direction
        base_angle = 180 if self.leftSide else 0  # Left or Right
        
        # Get current aim direction or default to facing direction
        current_aim = getattr(self, '_aim_direction', base_angle)
        
        # Check for aim up/down buttons (raise/lower gun)
        aim_angle = base_angle  # Start with facing direction
        
        if input_state.get('aim_up', False):
            # Raise gun upward
            if self.leftSide:
                aim_angle = 225  # Up-left
            else:
                aim_angle = 315  # Up-right
        elif input_state.get('aim_down', False):
            # Lower gun downward
            if self.leftSide:
                aim_angle = 135  # Down-left
            else:
                aim_angle = 45   # Down-right
        else:
            # No aim buttons - gun faces player direction
            aim_angle = base_angle
        
        # Store aim direction for portal gun update (always update, not just on action)
        self._aim_direction = aim_angle
        
        # Action button shoots portal
        if input_state.get('action', False):
            # Set portal gun angle and shoot
            self.pGun.angle = aim_angle
            self.pGun.is_shooting()
        
        # Handle cube pickup/throw (using action + direction)
        if cube and not self.cube:
            player_rect = self.rect()
            if player_rect.colliderect(cube.rect):
                # Can pick up cube with action button
                if input_state.get('action', False):
                    self.cubeState = "11"
                    self.controllingCube = True
                    cube.runPhysics = False
                    self.cube = cube
                    # Position cube near player
                    cube.rect.centerx = player_rect.centerx
                    cube.rect.centery = player_rect.top - 20
                    cube.x = cube.rect.x
                    cube.y = cube.rect.y
        elif self.cube and input_state.get('action', False):
            # Throw cube in aim direction
            self.cube.runPhysics = True
            self.cube.speed = 3  # Increased throw speed
            aim_angle = 0
            if input_state.get('left', False):
                aim_angle = math.pi
            elif input_state.get('right', False):
                aim_angle = 0
            elif input_state.get('up', False):
                aim_angle = -math.pi/2
            elif input_state.get('down', False):
                aim_angle = math.pi/2
            else:
                # Default throw in facing direction
                aim_angle = math.pi if self.leftSide else 0
            self.cube.angle = aim_angle + math.pi/2
            self.cube = None
            self.controllingCube = False
            self.cubeState = "0"

    def portalWarp(self, portals):
        """Teleport through portals with momentum preservation"""
        import math
        touchingPortal = False
        for portal in portals:
            if portal and self.rect().colliderect(portal.rect):
                touchingPortal = True
                if self.warpCooldown > 0:
                    return
                # Determine which team this portal belongs to
                # Team 1: Player 0 (Blue) and Player 1 (Orange)
                # Team 2: Player 2 (Red) and Player 3 (Yellow)
                portal_team = 0 if portal.playerNum < 2 else 1
                
                # Find another portal from the same team
                other_portal = None
                for p in portals:
                    if p and p != portal:
                        p_team = 0 if p.playerNum < 2 else 1
                        if p_team == portal_team:  # Same team
                            other_portal = p
                            break
                
                if other_portal:
                    # Store velocity before warping
                    entry_velocity_x = self.velocity_x
                    entry_velocity_y = self.velocity
                    
                    # Calculate entry angle (direction player is moving relative to portal)
                    entry_angle = portal.angle  # Portal's orientation
                    exit_angle = other_portal.angle  # Exit portal's orientation
                    
                    # Transform velocity based on portal angles
                    # Convert entry velocity to portal-relative coordinates
                    # Then transform to exit portal coordinates
                    angle_diff = (exit_angle - entry_angle) % 360
                    
                    # Calculate velocity magnitude
                    velocity_magnitude = math.sqrt(entry_velocity_x**2 + entry_velocity_y**2)
                    
                    # Transform velocity direction based on portal angles
                    if entry_angle == 0:  # Entering from left portal
                        if exit_angle == 0:  # Exiting to left
                            new_velocity_x = -velocity_magnitude if velocity_magnitude > 0.1 else entry_velocity_x
                            new_velocity_y = 0
                        elif exit_angle == 180:  # Exiting to right
                            new_velocity_x = velocity_magnitude if velocity_magnitude > 0.1 else -entry_velocity_x
                            new_velocity_y = 0
                        elif exit_angle == 90:  # Exiting downward
                            new_velocity_x = 0
                            new_velocity_y = velocity_magnitude if velocity_magnitude > 0.1 else abs(entry_velocity_y)
                        elif exit_angle == 270:  # Exiting upward
                            new_velocity_x = 0
                            new_velocity_y = -velocity_magnitude if velocity_magnitude > 0.1 else -abs(entry_velocity_y)
                    elif entry_angle == 180:  # Entering from right portal
                        if exit_angle == 0:  # Exiting to left
                            new_velocity_x = -velocity_magnitude if velocity_magnitude > 0.1 else -entry_velocity_x
                            new_velocity_y = 0
                        elif exit_angle == 180:  # Exiting to right
                            new_velocity_x = velocity_magnitude if velocity_magnitude > 0.1 else entry_velocity_x
                            new_velocity_y = 0
                        elif exit_angle == 90:  # Exiting downward
                            new_velocity_x = 0
                            new_velocity_y = velocity_magnitude if velocity_magnitude > 0.1 else abs(entry_velocity_y)
                        elif exit_angle == 270:  # Exiting upward
                            new_velocity_x = 0
                            new_velocity_y = -velocity_magnitude if velocity_magnitude > 0.1 else -abs(entry_velocity_y)
                    elif entry_angle == 90:  # Entering from bottom portal
                        if exit_angle == 0:  # Exiting to left
                            new_velocity_x = -velocity_magnitude if velocity_magnitude > 0.1 else -abs(entry_velocity_x)
                            new_velocity_y = 0
                        elif exit_angle == 180:  # Exiting to right
                            new_velocity_x = velocity_magnitude if velocity_magnitude > 0.1 else abs(entry_velocity_x)
                            new_velocity_y = 0
                        elif exit_angle == 90:  # Exiting downward
                            new_velocity_x = 0
                            new_velocity_y = velocity_magnitude if velocity_magnitude > 0.1 else entry_velocity_y
                        elif exit_angle == 270:  # Exiting upward
                            new_velocity_x = 0
                            new_velocity_y = -velocity_magnitude if velocity_magnitude > 0.1 else -entry_velocity_y
                    elif entry_angle == 270:  # Entering from top portal
                        if exit_angle == 0:  # Exiting to left
                            new_velocity_x = -velocity_magnitude if velocity_magnitude > 0.1 else -abs(entry_velocity_x)
                            new_velocity_y = 0
                        elif exit_angle == 180:  # Exiting to right
                            new_velocity_x = velocity_magnitude if velocity_magnitude > 0.1 else abs(entry_velocity_x)
                            new_velocity_y = 0
                        elif exit_angle == 90:  # Exiting downward
                            new_velocity_x = 0
                            new_velocity_y = velocity_magnitude if velocity_magnitude > 0.1 else abs(entry_velocity_y)
                        elif exit_angle == 270:  # Exiting upward
                            new_velocity_x = 0
                            new_velocity_y = -velocity_magnitude if velocity_magnitude > 0.1 else -entry_velocity_y
                    else:
                        # Default: preserve velocity direction
                        new_velocity_x = entry_velocity_x
                        new_velocity_y = entry_velocity_y
                    
                    # Position player at exit portal - place further away to prevent immediate re-collision
                    exit_offset = 20  # Distance to place player from portal edge
                    if other_portal.angle == 0:  # left (portal on left wall, exit to right)
                        self.x = other_portal.rect.right + exit_offset
                        self.y = other_portal.rect.centery - (GlobalVariables.Player_size_Y / 2)
                        # Push player away from portal
                        self.velocity_x = max(abs(new_velocity_x), 1.0) if abs(new_velocity_x) > 0.1 else 1.0
                    elif other_portal.angle == 180:  # right (portal on right wall, exit to left)
                        self.x = other_portal.rect.left - self.size_x - exit_offset
                        self.y = other_portal.rect.centery - (GlobalVariables.Player_size_Y / 2)
                        # Push player away from portal
                        self.velocity_x = -max(abs(new_velocity_x), 1.0) if abs(new_velocity_x) > 0.1 else -1.0
                    elif other_portal.angle == 90:  # bottom (portal on floor, exit upward)
                        self.x = other_portal.rect.centerx - (GlobalVariables.Player_size_X / 2)
                        self.y = other_portal.rect.top - self.size_y - exit_offset
                        # Push player upward
                        self.velocity = -max(abs(new_velocity_y), 2.0) if abs(new_velocity_y) > 0.1 else -2.0
                    elif other_portal.angle == 270:  # top (portal on ceiling, exit downward)
                        self.x = other_portal.rect.centerx - (GlobalVariables.Player_size_X / 2)
                        self.y = other_portal.rect.bottom + exit_offset
                        # Push player downward
                        self.velocity = max(abs(new_velocity_y), 2.0) if abs(new_velocity_y) > 0.1 else 2.0
                    
                    # Clamp player position to map boundaries
                    from Utils.GameScale import PLATFORM_THICKNESS
                    wall_thickness = PLATFORM_THICKNESS
                    min_x = wall_thickness
                    max_x = self.background_x - self.size_x - wall_thickness
                    min_y = wall_thickness
                    max_y = self.background_y - self.size_y - wall_thickness
                    self.x = max(min_x, min(self.x, max_x))
                    self.y = max(min_y, min(self.y, max_y))
                    
                    # Apply preserved momentum with boost
                    if other_portal.angle in [0, 180]:  # Horizontal exit
                        self.velocity_x = new_velocity_x * 1.5 if abs(new_velocity_x) > 0.1 else self.velocity_x
                    else:  # Vertical exit
                        self.velocity = new_velocity_y * 1.5 if abs(new_velocity_y) > 0.1 else self.velocity
                    
                    # If exiting upward, allow jump
                    if other_portal.angle == 270:
                        self.canJump = True
                    else:
                        self.canJump = False
                    
                    # Longer cooldown to prevent immediate re-teleportation
                    self.warpCooldown = 120
                    return
        if not touchingPortal:
            self.warpCooldown = 0

    def drawHitbox(self, screen):
        pygame.draw.rect(screen, (255, 0, 0), self.rect(), 2, 1)
        pygame.draw.circle(screen, (255, 0, 0), self.rect().center, 5)
