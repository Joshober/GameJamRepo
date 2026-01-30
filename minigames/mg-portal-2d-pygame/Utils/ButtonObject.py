import pygame
from Utils.GameScale import BUTTON_SIZE

class ButtonObject:
    # Constructor
    # x y: coordinates
    # type: what can interact with it
    #       0 = Both player and cube
    #       1 = Only cube
    #       2 = Only player
    def __init__(self, x, y, type) -> None:
        self.x = x
        self.y = y
        self.type = type
        self.Active = False

    # Draws button
    def draw(self, screen):
        button_height = int(BUTTON_SIZE * 0.375)  # 15 at base scale
        button_width = BUTTON_SIZE
        pressed_height = int(BUTTON_SIZE * 0.125)  # 5 at base scale
        if self.Active:
            pygame.draw.rect(screen, (0, 255, 0), pygame.Rect(self.x, self.y + button_height - pressed_height, button_width, pressed_height))
        else:
            pygame.draw.rect(screen, (255, 0, 0), pygame.Rect(self.x, self.y, button_width, button_height))

    # TODO - Add check for player and button type
    def checkActive(self, objList, playerList):
        button_height = int(BUTTON_SIZE * 0.375)
        hitbox = pygame.Rect(self.x, self.y, BUTTON_SIZE, button_height)
        for obj in objList:
            if hitbox.colliderect(obj.rect) and not self.type == 2:
                self.Active = True
                return
            
        for player in playerList:    
            if hitbox.colliderect(player.rect()) and not self.type == 1:
                self.Active = True
                return
        
        self.Active = False
    
    def activate(self):
        """Activate the button"""
        self.Active = True
        return True
    
    @property
    def rect(self):
        """Return button rect for collision checking"""
        button_height = int(BUTTON_SIZE * 0.375)
        return pygame.Rect(self.x, self.y, BUTTON_SIZE, button_height)
            
