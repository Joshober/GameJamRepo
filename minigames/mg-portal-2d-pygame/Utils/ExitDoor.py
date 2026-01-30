import sys
import pygame
import os
from Utils import GlobalVariables
from Utils.GameScale import DOOR_WIDTH, DOOR_HEIGHT
from Utils.LevelAssets import get_glass_tube, create_glass_tube_surface

class ExitDoor():

    def __init__(self, x, y):
        self.x = x
        self.opened_x = self.x
        self.closed_x = self.x
        self.y = y
        # Use glass tube instead of door
        # Tube width should be similar to door width, height matches door height
        tube_width = DOOR_WIDTH
        tube_height = DOOR_HEIGHT
        
        # Closed tube (with liquid - blocked)
        self.closed_tube = get_glass_tube(tube_width, tube_height)
        if self.closed_tube is None:
            self.closed_tube = create_glass_tube_surface(tube_width, tube_height)
        
        # Open tube (liquid drained - accessible)
        # Create a version with less/no liquid to show it's open
        self.opened_tube = self._create_open_tube(tube_width, tube_height)
        
        self.image = self.closed_tube
        self.opened = False

    def _create_open_tube(self, width, height):
        """Create an open/accessible version of the tube with drained liquid"""
        surface = pygame.Surface((width, height), pygame.SRCALPHA)
        
        # Glass outline (grey)
        pygame.draw.rect(surface, (200, 200, 200), (0, 0, width, height), 3)
        
        # Grey base
        pygame.draw.rect(surface, (150, 150, 150), (0, height - 15, width, 15))
        
        # Grey cap
        pygame.draw.rect(surface, (150, 150, 150), (0, 0, width, 10))
        
        # Minimal liquid at bottom (drained) - just a small amount
        liquid_height = 15  # Much less liquid when open
        liquid_surface = pygame.Surface((width - 6, liquid_height), pygame.SRCALPHA)
        liquid_surface.fill((100, 150, 255, 150))  # Slightly more transparent
        surface.blit(liquid_surface, (3, height - liquid_height - 10))
        
        # Glass highlights
        pygame.draw.line(surface, (255, 255, 255, 150), (5, 5), (5, height - 5), 2)
        pygame.draw.line(surface, (255, 255, 255, 100), (width - 5, 5), (width - 5, height - 5), 1)
        
        # Add a visual indicator that it's open (maybe a glow or different highlight)
        pygame.draw.rect(surface, (100, 255, 100, 50), (2, 2, width - 4, height - 4), 2)
        
        return surface

    def update(self, screen):
        return screen.blit(self.image, (self.x, self.y))
    
    def door_status(self, button):
        # Handle levels without a button (button can be None)
        if button is None:
            # If no button, door is always open (for levels like level 1)
            self.image = self.opened_tube
            self.opened = True
            self.x = self.opened_x
        elif button.Active:
            self.image = self.opened_tube
            self.opened = True
            self.x = self.opened_x
        else:
            self.image = self.closed_tube
            self.opened = False
            self.x = self.closed_x
    
    def try_exit(self, player, pressed_keys):
        if self.opened:
            # Player can exit when they're at the tube (similar to door logic)
            exit_left = self.x
            exit_right = self.x + DOOR_WIDTH
            if (player.x > exit_left and player.x < exit_right) or (player.x + player.size_x > exit_left and player.x + player.size_x < exit_right):
                if player.y > self.y:
                    print("Player tried to exit!!!!!!!!!!")
                    return True

        return False