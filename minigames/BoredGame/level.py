from typing import Iterable, Union
import pygame
from pygame.sprite import AbstractGroup
from settings import *
from player import Player
from overlay import Overlay
from sprites import Ordinary,waterSprite,natFlower,Tree,Interactions
from pytmx.util_pygame import load_pygame
from helpful import *
from transition import Transition
from soil import SoilLayer

class Level:
    def __init__(self):


        # Gets the display
        self.displaySurface = pygame.display.get_surface()

        # Sprite Groups
        self.allSprites = Camera()
         # Tree Sprites
        self.treeSprites = pygame.sprite.Group()
        # Collision Sprites
        self.collisionSprites = pygame.sprite.Group()
       
        # Iteraction sprites
        self.interactionSprites = pygame.sprite.Group()

        
        self.soilLayer = SoilLayer(self.allSprites)

        self.setup()
        self.overlay = Overlay(self.player)
        self.transition = Transition(self.resetDay,self.player)
        self.near_merchant = False
        self.merchant_sprite = None
        

    def run(self,dt):
        self.displaySurface.fill('black')
        self.allSprites.newDraw(self.player)
        
        # Check for victory and freeze gameplay
        if not self.overlay.victory_active:
            # Update sprites with camera offset only for player
            for sprite in self.allSprites:
                if isinstance(sprite, Player):
                    sprite.update(dt, self.allSprites.offset)
                else:
                    sprite.update(dt)
            
            # Update plant growth
            self.soilLayer.updatePlants(dt)

        # Check bed interaction (disabled)
        if False:
            for interaction in self.interactionSprites:
                if interaction.name == 'Bed' and interaction.rect.colliderect(self.player.rect.inflate(64, 64)):
                    if not self.overlay.save_prompt:
                        self.overlay.save_prompt = True
                elif interaction.name == 'Bed':
                    self.overlay.save_prompt = False
        
        # Check merchant interaction
        if not self.overlay.victory_active:
            merchant_sprite = None
            for interaction in self.interactionSprites:
                if interaction.name == 'Trader' and interaction.rect.colliderect(self.player.rect.inflate(128, 128)):
                    # Player is near merchant, can open menu with E
                    self.near_merchant = True
                    self.merchant_sprite = interaction
                    break
            else:
                self.near_merchant = False
                self.merchant_sprite = None
                if self.overlay.merchant_open:
                    self.overlay.merchant_open = False

        # Draw hover indicator only for farming tools (shows where action will occur)
        # Still show hover for visual feedback, but action happens on button press
        if self.player.selectedTool in ['hoe', 'axe', 'water'] or hasattr(self.player, 'selectedSeed'):
            mouse_pos = pygame.mouse.get_pos()
            world_mouse_pos = (mouse_pos[0] + self.allSprites.offset.x, 
                              mouse_pos[1] + self.allSprites.offset.y)
            # Update hitLocation based on hover (for button press targeting)
            if self.player.isWithinReach(world_mouse_pos):
                self.player.hitLocation = world_mouse_pos
            self.soilLayer.drawHover(self.displaySurface, world_mouse_pos, self.allSprites.offset, self.player.rect.center)
        
        # Draw coin indicator above merchant when near
        if self.near_merchant and self.merchant_sprite:
            merchant_screen_x = self.merchant_sprite.rect.centerx - self.allSprites.offset.x
            merchant_screen_y = self.merchant_sprite.rect.top - self.allSprites.offset.y - 40
            coin_icon = self.overlay.coin_icon
            coin_rect = coin_icon.get_rect(center=(merchant_screen_x, merchant_screen_y))
            self.displaySurface.blit(coin_icon, coin_rect)
        
        # Draw emote above player
        if self.overlay.current_emote:
            player_screen_x = self.player.rect.centerx - self.allSprites.offset.x
            player_screen_y = self.player.rect.top - self.allSprites.offset.y - 10
            
            # Draw emote_back first
            back_rect = self.overlay.emote_back.get_rect(center=(player_screen_x, player_screen_y))
            self.displaySurface.blit(self.overlay.emote_back, back_rect)
            
            # Extract 50x50 emote from scaled sheet, then scale up 25% (multiply by 1.25)
            emote_surf = pygame.Surface((50, 50), pygame.SRCALPHA)
            scaled_x = self.overlay.current_emote[0] // 2
            scaled_y = self.overlay.current_emote[1] // 2
            emote_surf.blit(self.overlay.emote_sheet, (0, 0), (scaled_x, scaled_y, 50, 50))
            # Scale up 25%
            emote_scaled = pygame.transform.scale(emote_surf, (int(50 * 1.25), int(50 * 1.25)))
            emote_rect = emote_scaled.get_rect(center=(player_screen_x, player_screen_y))
            self.displaySurface.blit(emote_scaled, emote_rect)

        self.overlay.updateDisplay(self.allSprites.offset)
        if self.player.sleep:
            self.transition.play()
            

    def setup(self):

        
        # Loads the map data created using tiled
        mapData = load_pygame('./map/map.tmx')
        


        #taking the data from the map from the house furniture bottom
        for mapLayer in ['HouseFloor','HouseFurnitureBottom']:
            for x, y, surface in mapData.get_layer_by_name(mapLayer).tiles():
                # Creating a genric sprite
                # multiply by tile size so that you convert correctly from tiled
                Ordinary((x * TILE_SIZE,y * TILE_SIZE), surface, self.allSprites,LAYERS['house bottom'])
        # data for the house
        for mapLayer in ['HouseWalls','HouseFurnitureTop']:
            for x, y, surface in mapData.get_layer_by_name(mapLayer).tiles():
                # Creating a genric sprite
                # multiply by tile size so that you convert correctly from tiled
                Ordinary((x * TILE_SIZE,y * TILE_SIZE), surface, self.allSprites,LAYERS['main'])
        # Fence Sprite : Main Layer
        for x,y, surface in mapData.get_layer_by_name("Fence").tiles():
            Ordinary((x * TILE_SIZE,y * TILE_SIZE), surface, [self.allSprites, self.collisionSprites],LAYERS['main'])

        # Water Sprite : Water Layer
        waterFrames = importFolder('./graphics/water')
        for x,y, surface in mapData.get_layer_by_name("Water").tiles():
            waterSprite((x * TILE_SIZE, y * TILE_SIZE), waterFrames,self.allSprites)


        # Natrual Flowers : Main Layer
        for flower in mapData.get_layer_by_name("Decoration"):
            # Dont need to multiply as these are not tiles and therefore have pixel measurements
            natFlower((flower.x, flower.y),flower.image,[self.allSprites,self.collisionSprites])


        # Trees : Main Layer (filter out trees too close to edges and walkway area)
        for tree in mapData.get_layer_by_name("Trees"):
            # Skip trees too close to edges (within 200px of any edge)
            # Skip trees in the walkway-enclosed area (approximate bounds)
            map_width = mapData.width * TILE_SIZE
            map_height = mapData.height * TILE_SIZE
            
            # Edge filtering: 200px margin from all edges
            if (tree.x < 200 or tree.x > map_width - 200 or 
                tree.y < 200 or tree.y > map_height - 200):
                continue
            
            # Walkway area filtering (approximate center area enclosed by walkway)
            # Adjust these bounds based on your map's walkway layout
            # This is a rough approximation - adjust as needed
            walkway_left = 400
            walkway_right = 1200
            walkway_top = 300
            walkway_bottom = 900
            
            if (tree.x > walkway_left and tree.x < walkway_right and
                tree.y > walkway_top and tree.y < walkway_bottom):
                continue
            
            # Create tree if it passes all filters
            Tree((tree.x, tree.y),tree.image,[self.allSprites,self.collisionSprites,self.treeSprites], tree.name,self.addToInventory)

        # Collision Tiles from Tiled / Base Level Collision
        for x,y, surface in mapData.get_layer_by_name("Collision").tiles():
            Ordinary((x * TILE_SIZE,y * TILE_SIZE), pygame.Surface((TILE_SIZE,TILE_SIZE)), self.collisionSprites)

        # Player starts
        for playerItems in mapData.get_layer_by_name("Player"):
            # Sets spawn point
            if playerItems.name == "Start":
                self.player = Player((playerItems.x,playerItems.y), self.allSprites, self.collisionSprites, self.treeSprites, self.interactionSprites, self.soilLayer, 1)
            # Creates the interaction location for the bed
            if playerItems.name == 'Bed':
                Interactions((playerItems.x,playerItems.y), (playerItems.width, playerItems.height), self.interactionSprites, 'Bed')
            # Creates the interaction location for the trader/merchant
            if playerItems.name == 'Trader':
                Interactions((playerItems.x,playerItems.y), (playerItems.width, playerItems.height), self.interactionSprites, 'Trader')
                


        # Creating the ground sprite
        Ordinary(
            pos = (0,0),
            surface = pygame.image.load('./graphics/ground/ground.png').convert_alpha(),
            groups= self.allSprites,
            z = LAYERS['ground']
        )

    def addToInventory(self,item):
        self.player.itemInventory[item] += 1

    def resetDay(self):


        # Reset apples
        for tree in self.treeSprites:
            for apple in tree.appleSprites.sprites():
                apple.kill()
            tree.createApples()

    
# A new class that will handle some of the things that pygame.sprite controls
class Camera(pygame.sprite.Group):
    def __init__(self):
        super().__init__()
        self.displaySurface = pygame.display.get_surface()
        # Used for making the 3d camera effect, moving around the screen 
        self.offset = pygame.math.Vector2()

    def newDraw(self,player):
        # This is for setting the offset for the camera
        # What this does is ensure all the sprites in the game such as the ground are drawn relative to the player
        self.offset.x = player.rect.centerx - SCREEN_WIDTH / 2
        self.offset.y = player.rect.centery - SCREEN_HEIGHT / 2
        # Creates a for loop to itterate through all of the layer values
        for layers in LAYERS.values():
            # For loop to itterate through all of the sprites, sorts the sprite using the center of a sprite as the sorting key, this is so that the player will appear behind flowers/trees aka faking more 3-d
            for sprite in sorted(self.sprites(), key = lambda sprite: sprite.rect.centery):
                    # if the spirtes z value is equivalent to the current layer then get that sprites location and subtract the offset from it to move it relative to the player and then draw it
                    if sprite.z == layers:
                        offsetRect = sprite.rect.copy()
                        offsetRect.center -= self.offset
                        # Actually draw the sprite
                        self.displaySurface.blit(sprite.image, offsetRect)