import pygame
from settings import *
from pytmx.util_pygame import load_pygame
from helpful import *
import random

class Plant(pygame.sprite.Sprite):
    def __init__(self, plant_type, pos, groups):
        super().__init__(groups)
        self.plant_type = plant_type
        self.age = 0
        self.max_age = 4
        self.growth_timer = 0  # Timer for 1-minute intervals
        self.fully_grown = False
        
        # Load plant images
        self.frames = []
        for i in range(self.max_age + 1):
            img = pygame.image.load(f'./graphics/fruit/{plant_type}/{i}.png').convert_alpha()
            self.frames.append(img)
        
        self.image = self.frames[self.age]
        self.rect = self.image.get_rect(topleft=pos)
        self.z = LAYERS['ground plant']

class WaterTile(pygame.sprite.Sprite):
    def __init__(self, pos, groups):
        super().__init__(groups)
        # Load water images and randomly choose one
        water_frames = importFolder('./graphics/soil_water')
        self.image = random.choice(water_frames)
        self.rect = self.image.get_rect(topleft=pos)
        self.z = LAYERS['soil water']

class SoilTile(pygame.sprite.Sprite):
    def __init__(self,pos,surf,groups):
        super().__init__(groups)
        self.image = surf
        self.rect = self.image.get_rect(topleft = pos)
        self.z = LAYERS['soil']



class SoilLayer:
    def __init__(self,allSprites):


        # sprite groups
        self.allSprites = allSprites
        self.soilSprites = pygame.sprite.Group()
        self.waterSprites = pygame.sprite.Group()
        self.plantSprites = pygame.sprite.Group()


        # Soil Images
        self.soilSurf = pygame.image.load('./graphics/soil/o.png')

        self.soilSurfaces = importDictFolder('./graphics/soil/')
        
        # Hover indicator
        try:
            self.hover_surf_green = pygame.image.load('./graphics/environment/interaction_green.png').convert_alpha()
            self.hover_surf_red = pygame.image.load('./graphics/environment/interaction_red.png').convert_alpha()
        except pygame.error:
            # Fallback to programmatic surfaces if images don't exist
            self.hover_surf_green = pygame.Surface((TILE_SIZE, TILE_SIZE))
            self.hover_surf_green.set_alpha(100)
            self.hover_surf_green.fill((0, 255, 0))
            self.hover_surf_red = pygame.Surface((TILE_SIZE, TILE_SIZE))
            self.hover_surf_red.set_alpha(100)
            self.hover_surf_red.fill((255, 0, 0))
        # Create grid
        self.createSoilGrid()

        # Create hitboxes
        self.createHitbox()

        # Soil Requirements
        # Is Farmable?

        # Is Watered?

        # Contains Plant?

    def createSoilGrid(self):
        groundImage = pygame.image.load('./graphics/world/ground.png')
        hLength = groundImage.get_width() // TILE_SIZE
        vLength = groundImage.get_height() // TILE_SIZE
        
        self.grid = [  [[] for col in range(hLength)  ] for row in range(vLength) ]
        try:
            for x, y, surface in load_pygame('./map/map.tmx').get_layer_by_name('Farmable').tiles():
                self.grid[y][x].append('F')
        except Exception as e:
            print(f"Warning: Could not load tilemap: {e}")
            # Create a basic farmable area as fallback
            for row in range(5, 15):
                for col in range(5, 25):
                    if row < vLength and col < hLength:
                        self.grid[row][col].append('F')
        


    def createHitbox(self):
        self.hitBoxes = []
        for rowNum,row in enumerate(self.grid):
            for tileNum,tile in enumerate(row):
                if 'F' in tile:
                    x = tileNum * TILE_SIZE
                    y = rowNum * TILE_SIZE
                    hitbox = pygame.Rect(x, y, TILE_SIZE, TILE_SIZE)
                    self.hitBoxes.append(hitbox)

    def getHit(self,hitLocation):
        for rect in self.hitBoxes:
            if rect.collidepoint(hitLocation):
                x = rect.x // TILE_SIZE
                y = rect.y // TILE_SIZE

                if 'F' in self.grid[y][x] and 'X' not in self.grid[y][x]:
                    self.grid[y][x].append('X')
                    self.createSoilTiles()
                    return True  # Successfully tilled
        return False  # No tile was tilled

    def removeHit(self,hitLocation):
        for rect in self.hitBoxes:
            if rect.collidepoint(hitLocation):
                x = rect.x // TILE_SIZE
                y = rect.y // TILE_SIZE
                
                # Only untill if soil is tilled but has no plants
                if 'X' in self.grid[y][x] and 'P' not in self.grid[y][x]:
                    self.grid[y][x].remove('X')
                    # Remove water sprites if present
                    if 'W' in self.grid[y][x]:
                        self.grid[y][x].remove('W')
                        # Remove water sprite
                        for sprite in self.waterSprites:
                            if sprite.rect.topleft == (rect.x, rect.y):
                                sprite.kill()
                    # Update soil tiles display
                    self.createSoilTiles()

    def createSoilTiles(self):
        # Remove all existing soil sprites from both groups
        for sprite in self.soilSprites:
            sprite.kill()
        self.soilSprites.empty()
        
        for rowNum,row in enumerate(self.grid):
            for tileNum,tile in enumerate(row):
                if 'X' in tile:
                    x = tileNum * TILE_SIZE
                    y = rowNum * TILE_SIZE
                    SoilTile((x,y), self.soilSurf,[self.allSprites,self.soilSprites])

    def plantSeed(self, hitLocation, seedType):
        """Plant a seed on tilled soil. Returns True if successful."""
        for rect in self.hitBoxes:
            if rect.collidepoint(hitLocation):
                x = rect.x // TILE_SIZE
                y = rect.y // TILE_SIZE
                
                # Check if soil is tilled ('X') and doesn't already have a plant ('P')
                if 'X' in self.grid[y][x] and 'P' not in self.grid[y][x]:
                    self.grid[y][x].append('P')  # Mark as planted
                    # Create plant sprite
                    Plant(seedType, (rect.x, rect.y), [self.allSprites, self.plantSprites])
                    return True
        return False

    def untillSoil(self, hitLocation):
        """Convert tilled soil back to untilled soil. Only works if no plants are present."""
        for rect in self.hitBoxes:
            if rect.collidepoint(hitLocation):
                x = rect.x // TILE_SIZE
                y = rect.y // TILE_SIZE
                
                # Only untill if soil is tilled but has no plants
                if 'X' in self.grid[y][x] and 'P' not in self.grid[y][x]:
                    self.grid[y][x].remove('X')
                    # Remove water sprites if present
                    if 'W' in self.grid[y][x]:
                        self.grid[y][x].remove('W')
                        # Remove water sprite
                        for sprite in self.waterSprites:
                            if sprite.rect.topleft == (rect.x, rect.y):
                                sprite.kill()
                    # Update soil tiles display
                    self.createSoilTiles()

    def waterSoil(self, hitLocation):
        """Water tilled soil (with or without plants)."""
        for rect in self.hitBoxes:
            if rect.collidepoint(hitLocation):
                x = rect.x // TILE_SIZE
                y = rect.y // TILE_SIZE
                
                # Water soil if it's tilled (regardless of plants)
                if 'X' in self.grid[y][x]:
                    # Add watered marker if not already watered
                    if 'W' not in self.grid[y][x]:
                        self.grid[y][x].append('W')
                        # Create water tile sprite
                        WaterTile((rect.x, rect.y), [self.allSprites, self.waterSprites])

    def updatePlants(self, dt):
        """Update plant growth over time - 22.5 second intervals for 1.5 minute total."""
        for plant in self.plantSprites:
            if not plant.fully_grown:
                plant.growth_timer += dt
                # 22.5 seconds per growth stage (90 seconds total / 4 stages)
                if plant.growth_timer >= 22.5:
                    plant.age += 1
                    plant.growth_timer = 0
                    
                    if plant.age >= plant.max_age:
                        plant.age = plant.max_age
                        plant.fully_grown = True
                    
                    # Update plant image
                    plant.image = plant.frames[plant.age]

    def harvestPlant(self, hitLocation):
        """Harvest a fully grown plant. Returns plant type if successful."""
        for rect in self.hitBoxes:
            if rect.collidepoint(hitLocation):
                x = rect.x // TILE_SIZE
                y = rect.y // TILE_SIZE
                
                # Check if there's a plant here
                if 'P' in self.grid[y][x]:
                    # Find the plant sprite at this location
                    for plant in self.plantSprites:
                        if plant.rect.topleft == (rect.x, rect.y) and plant.fully_grown:
                            plant_type = plant.plant_type
                            # Remove plant from grid and sprite
                            self.grid[y][x].remove('P')
                            plant.kill()
                            return plant_type
        return None

    def getHoveredTile(self, mousePos):
        """Get the tile position under mouse cursor."""
        for rect in self.hitBoxes:
            if rect.collidepoint(mousePos):
                return rect
        return None

    def drawHover(self, screen, mousePos, camera_offset, player_pos=None):
        """Draw hover indicator on farmable tile with distance check."""
        hovered_rect = self.getHoveredTile(mousePos)
        if hovered_rect:
            # Check if player position is provided and if tile is within reach
            within_reach = True
            if player_pos:
                player_center = pygame.math.Vector2(player_pos)
                tile_center = pygame.math.Vector2(hovered_rect.center)
                distance = player_center.distance_to(tile_center)
                within_reach = distance <= TILE_SIZE * 1.5
            
            # Adjust for camera offset
            draw_rect = hovered_rect.copy()
            draw_rect.x -= camera_offset.x
            draw_rect.y -= camera_offset.y
            
            # Create sprite for hover indicator at interaction layer
            hover_surf = self.hover_surf_green if within_reach else self.hover_surf_red
            hover_sprite = pygame.sprite.Sprite()
            hover_sprite.image = hover_surf
            hover_sprite.rect = hovered_rect
            hover_sprite.z = LAYERS['interaction']
            
            # Draw using screen coordinates
            screen.blit(hover_surf, draw_rect)




