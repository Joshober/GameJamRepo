import pygame
from settings import *
from helpful import *
from timer import Timer
from random import choice

class Player(pygame.sprite.Sprite):
    def __init__(self,pos,group, collisionSprites,treeSprites,interactionSprites, soilLayer, player_id=1):
        
        # Creation of groups for the sprites
        super().__init__(group)
        
        # Player identification for multiplayer
        self.player_id = player_id


        self.importAssets()
        self.status = 'down'
        self.frameIndex = 0



        # basic setting up
        # Getting the sprite of whatever the current animation state is
        self.image = self.animations[self.status][self.frameIndex]
        # Rect for the player sprite
        self.rect = self.image.get_rect(center = pos)        
        # Location for drawing on screen or Z-Location
        self.z = LAYERS['main']




        # player location
        self.direction = pygame.math.Vector2()
        self.pos = pygame.math.Vector2(self.rect.center)
        self.speed = 230  # Increased by 15% from 200

        # collision detection
        # Hitbox for collision Detection, takes orig rectangle and shrinks it by (w,h)
        self.hitbox = self.rect.copy().inflate((-120,-70))
        self.collisionSprites = collisionSprites


        # timers
        self.timers = {
            'toolUse': Timer(350,self.useTool),
            'seedUse': Timer(350,self.useSeed),
            'toolTurn': Timer(100)  # Short delay for turning before tool use
        }
        # Track if toolTurn just finished (to activate toolUse)
        self.toolTurnJustFinished = False

        # player tools
        self.tools = ['hoe','water','hand']  # Start without axe
        self.toolNum = 0
        self.selectedTool = self.tools[self.toolNum]

        # seeds
        self.seeds = ['corn','tomato']
        self.seedNum = 0
        self.selectedSeed = self.seeds[self.seedNum]
        
        # Menu mode tracking (True = tools, False = seeds)
        self.tool_mode = True


        # Player Inventory (separate seeds from harvested crops)
        self.itemInventory = {
            'wood' : 0,
            'apple' : 0,
            'corn' : 5,
            'corn_seeds': 5,
            'tomato': 0,
            'tomato_seeds': 0,
        }
        
        # Experience and Gold
        self.experience = 0
        self.gold = 0
        self.level = 1
        self.exp_to_next_level = 100
        self.axe_unlocked = False
        self.tomato_unlocked = False

        # Tree cutting
        self.treeSprites = treeSprites
        # Sprites for interacting
        self.interactionSprites = interactionSprites
        # Soil Layer for farming
        self.soilLayer = soilLayer
        # Sleeping Status
        self.sleep = False
        # Hit location for mouse targeting
        self.hitLocation = None

    def importAssets(self):
        self.animations =  {'up': [],'down': [],'left': [],'right': [],
						   'right_idle':[],'left_idle':[],'up_idle':[],'down_idle':[],
						   'right_hoe':[],'left_hoe':[],'up_hoe':[],'down_hoe':[],
						   'right_axe':[],'left_axe':[],'up_axe':[],'down_axe':[],
						   'right_water':[],'left_water':[],'up_water':[],'down_water':[],
						   'right_hand':[],'left_hand':[],'up_hand':[],'down_hand':[]}


        for animation in self.animations.keys():
            if 'hand' in animation:
                # Use the first frame of movement animations for hand tool
                direction = animation.split('_')[0]
                path = f'./graphics/character/{direction}'
                frames = importFolder(path)
                self.animations[animation] = [frames[0]] if frames else []
            else:
                path = './graphics/character/' + animation
                self.animations[animation] = importFolder(path)
        


    def animate(self,dt):

        # determine what frame were on for the current index
        self.frameIndex += 4 * dt

        # ensure we dont go over the amount of frames we have for an animation
        if self.frameIndex >= len(self.animations[self.status]):
            self.frameIndex = 0


        self.image = self.animations[self.status][int(self.frameIndex)]
    
    def useTool(self):
        # Check if hitLocation exists and is valid
        if not self.hitLocation:
            return
            
        # Check if target is within reach before using tool
        if not self.isWithinReach(self.hitLocation):
            return  # Don't use tool if target is too far
            
        self.turnTowardTarget(self.hitLocation)
            
        if self.selectedTool == 'hand':
            # Try to harvest apples from trees first
            apple_harvested = False
            for tree in self.treeSprites:
                if tree.rect.collidepoint(self.hitLocation) and tree.alive:
                    if len(tree.appleSprites.sprites()) > 0:
                        randomApple = choice(tree.appleSprites.sprites())
                        randomApple.kill()
                        self.itemInventory['apple'] += 1
                        result = self.gainExperience(1)
                        if result == 'both_unlock':
                            pass
                        elif result == 'victory':
                            return 'victory'
                        apple_harvested = True
                        break
            
            # If no apple harvested, try to harvest plant
            if not apple_harvested:
                harvested_plant = self.soilLayer.harvestPlant(self.hitLocation)
                if harvested_plant:
                    # Random yield between 1-3 crops
                    import random
                    yield_amount = random.randint(1, 3)
                    self.itemInventory[harvested_plant] += yield_amount
                    # Give +5 experience per crop harvested
                    total_exp = yield_amount * 5
                    result = self.gainExperience(total_exp)
                    if result == 'both_unlock':
                        pass
                    elif result == 'victory':
                        return 'victory'
                    # Give gold for harvesting
                    multiplier = self.getGoldMultiplier()
                    if harvested_plant == 'corn':
                        self.gold += int(10 * multiplier)
                    elif harvested_plant == 'tomato':
                        self.gold += int(15 * multiplier)
        elif self.selectedTool == 'axe':
            for tree in self.treeSprites:
                if tree.rect.collidepoint(self.hitLocation):
                  tree.damage()
            # Remove tilled soil when using axe (only if no plants)
            self.soilLayer.removeHit(self.hitLocation)
        elif self.selectedTool == 'hoe':
            # Give +1 exp for tilling soil
            if self.soilLayer.getHit(self.hitLocation):
                result = self.gainExperience(1)
                if result == 'both_unlock':
                    # Will be handled by overlay
                    pass
                elif result == 'victory':
                    return 'victory'
        elif self.selectedTool == 'water':
            # Water plants
            self.soilLayer.waterSoil(self.hitLocation)
        
        # Clear hitLocation after use
        self.hitLocation = None
                

    
    def useSeed(self):
        # Check if hitLocation exists and is valid
        if not self.hitLocation:
            return
            
        # Check if target is within reach before planting seed
        if not self.isWithinReach(self.hitLocation):
            return  # Don't plant seed if target is too far
            
        self.turnTowardTarget(self.hitLocation)
            
        # Check if player has seeds to plant
        seed_key = self.selectedSeed + '_seeds'
        if self.itemInventory.get(seed_key, 0) > 0:
            # Plant seed on tilled soil
            if self.soilLayer.plantSeed(self.hitLocation, self.selectedSeed):
                # Consume one seed from inventory
                self.itemInventory[seed_key] -= 1
                # Give experience for planting
                result = self.gainExperience(5)  # 5 exp for planting
                if result == 'victory':
                    return 'victory'
        
        # Clear hitLocation after use
        self.hitLocation = None

    
    def getMaterialLocaiton(self):
        # Use mouse position if available, otherwise use player facing direction
        if hasattr(self, 'hitLocation'):
            # hitLocation is set by mouse click in main.py
            pass
        else:
            # Fallback to player facing direction
            self.hitLocation = self.rect.center + PLAYER_TOOL_OFFSET[self.status.split('_')[0]]
    
    def isWithinReach(self, target_pos):
        """Check if target position is within one tile of player."""
        player_center = pygame.math.Vector2(self.rect.center)
        target_vector = pygame.math.Vector2(target_pos)
        distance = player_center.distance_to(target_vector)
        # Allow interaction within 1.5 tiles (64 * 1.5 = 96 pixels) for some flexibility
        return distance <= TILE_SIZE * 1.5
    
    def gainExperience(self, amount):
        """Gain experience and check for level up."""
        self.experience += amount
        
        # Check for axe and tomato unlock at 50 exp
        if self.experience >= 50 and not self.axe_unlocked:
            self.axe_unlocked = True
            self.tools.insert(1, 'axe')  # Add axe after hoe
            self.tomato_unlocked = True
            return 'both_unlock'
        
        if self.experience >= self.exp_to_next_level:
            self.level += 1
            self.experience -= self.exp_to_next_level
            self.exp_to_next_level = 100
            
            # Check for level 3 victory
            if self.level >= 3:
                return 'victory'
        
        return None
    
    def getGoldMultiplier(self):
        """Get gold multiplier based on level (50% more per level after 1)."""
        return 1.0 + (self.level - 1) * 0.5
    
    def eatApple(self):
        """Eat an apple for experience."""
        if self.itemInventory['apple'] > 0:
            self.itemInventory['apple'] -= 1
            self.gainExperience(1)
            return True
        return False
    
    def turnTowardTarget(self, target_pos):
        """Turn player to face the target position."""
        player_center = pygame.math.Vector2(self.rect.center)
        target_vector = pygame.math.Vector2(target_pos)
        direction_vector = target_vector - player_center
        
        # Determine which direction to face based on the largest component
        if abs(direction_vector.x) > abs(direction_vector.y):
            if direction_vector.x > 0:
                self.status = 'right'
            else:
                self.status = 'left'
        else:
            if direction_vector.y > 0:
                self.status = 'down'
            else:
                self.status = 'up'
    
    def followMouseCursor(self, mouse_world_pos):
        """Continuously turn player to face mouse cursor position."""
        if not self.timers['toolUse'].active and not self.timers['seedUse'].active and self.direction.magnitude() == 0:
            self.turnTowardTarget(mouse_world_pos)

    def input(self):
        # Import mobile controls at the top if available
        try:
            from mobile_controls import get_player_mobile_input
            mobile_available = True
        except ImportError:
            mobile_available = False
            
        if not self.timers['toolUse'].active and not self.sleep:
            playerInput = pygame.key.get_pressed()
            
            # Get mobile input for all players
            mobile_input = {'up': False, 'down': False, 'left': False, 'right': False, 'action': False, 'plant': False, 'eat': False, 'use': False}
            if mobile_available:
                # Check if this player has mobile input (player numbers start from 1)
                if hasattr(self, 'player_id'):
                    mobile_input = get_player_mobile_input(self.player_id)
                else:
                    mobile_input = get_player_mobile_input(1)  # Default to player 1
            
            # check player input for up or down ('w' 's') + mobile
            if playerInput[pygame.K_w] or mobile_input['up']:
                self.direction.y = -1
                self.status = 'up'
            elif playerInput[pygame.K_s] or mobile_input['down']:
                self.direction.y = 1
                self.status = 'down'
            else:
                self.direction.y = 0

            # check player input for left or right ('a' or 'd') + mobile
            if playerInput[pygame.K_a] or mobile_input['left']:
                self.direction.x = -1
                self.status = 'left'
            elif playerInput[pygame.K_d] or mobile_input['right']:
                self.direction.x = 1
                self.status = 'right'
            else:
                self.direction.x = 0

            # If player presses space or mobile action/use button it will use the active tool
            # Note: E key merchant interaction is handled in main.py before this
            # Mobile "use" button replaces mouse click mechanics
            usePressed = playerInput[pygame.K_SPACE] or mobile_input.get('action', False) or mobile_input.get('use', False)
            if usePressed:
                # Use tool/seed at player's facing direction (replaces mouse click)
                target_pos = self.rect.center + PLAYER_TOOL_OFFSET[self.status.split('_')[0]]
                # Use hitLocation if it exists (from mouse hover), otherwise use facing direction
                if hasattr(self, 'hitLocation') and self.hitLocation and self.isWithinReach(self.hitLocation):
                    target_pos = self.hitLocation
                else:
                    # Use player facing direction
                    self.hitLocation = target_pos
                
                if self.isWithinReach(target_pos):
                    # Turn toward target first
                    if self.hitLocation:
                        self.turnTowardTarget(self.hitLocation)
                    # Start turn timer, which will activate tool timer when done
                    self.timers['toolTurn'].activate()
                    # Stops the player from moving while using a tool
                    self.direction = pygame.math.Vector2()
                    self.frameIndex = 0
                    # Determine if tool or seed based on selected item
                    if self.selectedTool in ['hoe', 'axe', 'water', 'hand']:
                        # Will activate toolUse timer after turn completes
                        pass
                    else:
                        # If seed is selected, plant it instead
                        if not self.timers['seedUse'].active:
                            self.timers['seedUse'].activate()
                            self.direction = pygame.math.Vector2()
                            self.frameIndex = 0

            # If the player presses e or mobile plant button then plant a seed (only if not near merchant)
            # Note: E key merchant interaction is handled in main.py before this
            if playerInput[pygame.K_e] or mobile_input.get('plant', False):
                # Check if target is within reach before activating seed animation
                target_pos = self.rect.center + PLAYER_TOOL_OFFSET[self.status.split('_')[0]]
                if hasattr(self, 'hitLocation') and self.hitLocation:
                    target_pos = self.hitLocation
                
                if self.isWithinReach(target_pos):
                    self.timers['seedUse'].activate()
                    self.direction = pygame.math.Vector2()
                    self.frameIndex = 0
                    # For keyboard controls, use player facing direction
                    if not hasattr(self, 'hitLocation') or self.hitLocation is None:
                        self.hitLocation = self.rect.center + PLAYER_TOOL_OFFSET[self.status.split('_')[0]]
                
            # R key or mobile eat button to eat apple
            if playerInput[pygame.K_r] or mobile_input.get('eat', False):
                self.eatApple()

            # Click buttons 1-0 to change the active inventory slot
            key_to_slot = {
                pygame.K_1: 0, pygame.K_2: 1, pygame.K_3: 2, pygame.K_4: 3, pygame.K_5: 4,
                pygame.K_6: 5, pygame.K_7: 6, pygame.K_8: 7, pygame.K_9: 8, pygame.K_0: 9
            }
            for key, slot_index in key_to_slot.items():
                if playerInput[key]:
                    # This will be handled by overlay in main.py
                    pass

            if playerInput[pygame.K_RETURN] or mobile_input.get('interact', False):
                activeInteractionSprite = pygame.sprite.spritecollide(self,self.interactionSprites,False)
                if activeInteractionSprite:
                    if activeInteractionSprite[0].name == 'Bed':
                        self.status = 'left'
                        self.sleep = True
                    elif activeInteractionSprite[0].name == 'Trader':
                        # Merchant interaction handled in main.py
                        pass

    
    
    def runTimers(self):
        # Check if toolTurn just finished (was active last frame, now inactive)
        was_tool_turn_active = self.timers['toolTurn'].active
        
        for timer in self.timers.values():
            timer.update()
        
        # After turn timer completes, activate tool timer only if hitLocation is valid
        if was_tool_turn_active and not self.timers['toolTurn'].active:
            # Timer just finished
            if not self.timers['toolUse'].active and not self.timers['seedUse'].active and self.hitLocation:
                # Check if we should use tool or plant seed
                if self.selectedTool in ['hoe', 'axe', 'water', 'hand']:
                    self.timers['toolUse'].activate()
                else:
                    # If seed is selected, plant it
                    if not self.timers['seedUse'].active:
                        self.timers['seedUse'].activate()

            
    def getStatus(self):
        # Making it so if the player isnt moving then they will play their idle
        if self.direction.magnitude() == 0:
            self.status = self.status.split('_')[0] + '_idle'

        if self.timers['toolUse'].active:
            self.status = self.status.split('_')[0] + '_' + self.selectedTool



    def move(self,dt):
        
        # Prevent diagonal movement from being faster than just up/down or left/right
        if self.direction.magnitude() > 0:
            self.direction = self.direction.normalize()


        # Horizontal movement
        self.pos.x += self.direction.x * self.speed * dt
        self.hitbox.centerx = round(self.pos.x)
        self.rect.centerx = self.hitbox.centerx
        self.collisionDetection('horizontal')


        # Vertical Movement
        self.pos.y += self.direction.y * self.speed * dt
        self.hitbox.centery = round(self.pos.y)
        self.rect.centery = self.hitbox.centery
        self.collisionDetection('vertical')


    def update(self,dt,camera_offset=None):
        if camera_offset is not None:
            mouse_screen_pos = pygame.mouse.get_pos()
            mouse_world_pos = (mouse_screen_pos[0] + camera_offset.x, mouse_screen_pos[1] + camera_offset.y)
            self.followMouseCursor(mouse_world_pos)

        self.input()
        self.getStatus()
        self.getMaterialLocaiton()
        self.runTimers()
        self.move(dt)
        self.animate(dt)
        


    def collisionDetection(self,direction):
        # Checks every sprite that is in our collisionSprites group
        for sprite in self.collisionSprites.sprites():
            # Double checks that the current sprite has a hitbox attribute
            if hasattr(sprite, 'hitbox'):
                # Checks to see if that sprite is coliding with our player hitbox
                if sprite.hitbox.colliderect(self.hitbox):
                    if direction == 'horizontal':
                        # Player was moving right durring collision
                        if self.direction.x > 0:
                            self.hitbox.right = sprite.hitbox.left
                        # Player was moving left durring the collision
                        elif self.direction.x < 0:
                            self.hitbox.left = sprite.hitbox.right
                        self.rect.centerx = self.hitbox.centerx
                        self.pos.x = self.hitbox.centerx
                    elif direction == 'vertical':
                        # Player was moving down durring collision
                        if self.direction.y > 0:
                            self.hitbox.bottom = sprite.hitbox.top
                        # Player was moving up durring the collision
                        elif self.direction.y < 0:
                            self.hitbox.top = sprite.hitbox.bottom
                        self.rect.centery = self.hitbox.centery
                        self.pos.y = self.hitbox.centery

