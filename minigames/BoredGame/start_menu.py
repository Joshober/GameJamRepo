import pygame
from settings import *

class StartMenu:
    def __init__(self, screen):
        self.screen = screen
        
        # Load custom fonts
        try:
            self.font_medium = pygame.font.Font('./header_font.otf', 48)
            self.font_small = pygame.font.Font('./body_font.ttf', 36)
        except:
            self.font_medium = pygame.font.Font(None, 48)
            self.font_small = pygame.font.Font(None, 36)
        
        # Load animation frames
        self.gif_frames = []
        self.frame_index = 0
        self.frame_timer = 0
        self.frame_delay = 30
        try:
            frame0 = pygame.image.load('./graphics/overlay/frame0000.png').convert_alpha()
            frame1 = pygame.image.load('./graphics/overlay/frame0001.png').convert_alpha()
            # Scale to 175%
            w0, h0 = frame0.get_size()
            w1, h1 = frame1.get_size()
            frame0 = pygame.transform.scale(frame0, (int(w0 * 1.75), int(h0 * 1.75)))
            frame1 = pygame.transform.scale(frame1, (int(w1 * 1.75), int(h1 * 1.75)))
            self.gif_frames = [frame0, frame1]
        except:
            self.gif_frames = None
        
        self.num_players = 1
        self.selected_characters = [0, 0, 0, 0]
        self.active = True
        
    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_UP and self.num_players < 4:
                self.num_players += 1
            elif event.key == pygame.K_DOWN and self.num_players > 1:
                self.num_players -= 1
            elif event.key == pygame.K_RETURN:
                self.active = False
                return True
        return False
    
    def draw(self):
        self.screen.fill((50, 50, 50))
        
        screen_width = self.screen.get_width()
        screen_height = self.screen.get_height()
        
        # Animate title frames
        title_bottom = 0
        if self.gif_frames:
            self.frame_timer += 1
            if self.frame_timer >= self.frame_delay:
                self.frame_timer = 0
                self.frame_index = (self.frame_index + 1) % len(self.gif_frames)
            
            title_image = self.gif_frames[self.frame_index]
            title_rect = title_image.get_rect(center=(screen_width // 2, screen_height // 4))
            self.screen.blit(title_image, title_rect)
            title_bottom = title_rect.bottom + 50
        
        # Player selection
        player_text = self.font_medium.render(f"Players {self.num_players}", True, (255, 255, 255))
        player_rect = player_text.get_rect(center=(screen_width // 2, title_bottom + 50))
        self.screen.blit(player_text, player_rect)
        
        # Instructions
        up_text = self.font_small.render("UP or DOWN Change players", True, (200, 200, 200))
        up_rect = up_text.get_rect(center=(screen_width // 2, player_rect.bottom + 50))
        self.screen.blit(up_text, up_rect)
        
        start_text = self.font_small.render("ENTER Start Game", True, (200, 200, 200))
        start_rect = start_text.get_rect(center=(screen_width // 2, up_rect.bottom + 40))
        self.screen.blit(start_text, start_rect)
        
        pygame.display.flip()
