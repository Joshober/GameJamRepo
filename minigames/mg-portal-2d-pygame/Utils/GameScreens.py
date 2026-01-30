"""
Game screens: Instructions, Ready Up, etc.
"""
import pygame

class GameScreens:
    """Handles all game screen states"""
    
    def __init__(self, screen, font, small_font):
        self.screen = screen
        self.font = font
        self.small_font = small_font
        self.title_font = pygame.font.SysFont("Consolas", 64, bold=True)
        self.width = screen.get_width()
        self.height = screen.get_height()
    
    def draw_instructions_screen(self):
        """Draw the instructions screen"""
        # Dark background
        self.screen.fill((20, 20, 30))
        
        # Title
        title = self.title_font.render("PORTAL 2D", True, (100, 150, 255))
        title_rect = title.get_rect(center=(self.width // 2, 100))
        self.screen.blit(title, title_rect)
        
        # Instructions box
        box_width = 900
        box_height = 450
        box_x = (self.width - box_width) // 2
        box_y = 200
        
        # Box background
        box_surface = pygame.Surface((box_width, box_height))
        box_surface.fill((30, 30, 40))
        pygame.draw.rect(box_surface, (100, 150, 255), (0, 0, box_width, box_height), 4)
        self.screen.blit(box_surface, (box_x, box_y))
        
        # Instructions text
        instructions = [
            "OBJECTIVE:",
            "Press the button to open the exit door, then reach the exit!",
            "First TEAM to get both players to the exit wins!",
            "",
            "TEAMS:",
            "Team 1: Player 1 (Blue) & Player 2 (Orange)",
            "Team 2: Player 3 (Red) & Player 4 (Yellow)",
            "",
            "CONTROLS:",
            "Player 1: WASD (W=Jump) | Space = Shoot | Q/E = Aim Up/Down",
            "Player 2: Arrows (Up=Jump) | Enter = Shoot | RShift/RCtrl = Aim",
            "Player 3: IJKL (I=Jump) | U = Shoot | O/P = Aim Up/Down",
            "Player 4: TFGH (T=Jump) | R = Shoot | Y/U = Aim Up/Down",
            "",
            "GAMEPLAY:",
            "• Gun always faces your movement direction",
            "• Use aim buttons to raise/lower gun while moving",
            "• Shoot portals on grey walls to create shortcuts",
            "• Walk through portals to teleport",
            "• First team with both players at exit wins!",
            "",
            "Press SPACE to continue..."
        ]
        
        y_offset = box_y + 30
        for i, line in enumerate(instructions):
            if line.startswith("OBJECTIVE:") or line.startswith("CONTROLS:") or line.startswith("GAMEPLAY:"):
                # Section headers
                text = self.font.render(line, True, (100, 150, 255))
            elif line == "":
                # Empty line
                y_offset += 10
                continue
            else:
                # Regular text
                text = self.small_font.render(line, True, (200, 200, 200))
            
            x_pos = box_x + 30
            self.screen.blit(text, (x_pos, y_offset))
            y_offset += 30 if line.startswith(("OBJECTIVE:", "CONTROLS:", "GAMEPLAY:")) else 25
    
    def draw_ready_screen(self, ready_players):
        """Draw the ready up screen"""
        # Dark background
        self.screen.fill((20, 20, 30))
        
        # Title
        title = self.title_font.render("READY UP", True, (100, 150, 255))
        title_rect = title.get_rect(center=(self.width // 2, 150))
        self.screen.blit(title, title_rect)
        
        # Player colors
        player_colors = [
            (100, 150, 255),  # Blue
            (255, 150, 100),  # Orange
            (150, 255, 100),  # Green
            (255, 100, 255),  # Magenta
        ]
        
        player_names = ["Player 1", "Player 2", "Player 3", "Player 4"]
        player_keys = ["SPACE", "ENTER", "U", "R"]
        
        # Ready box
        box_width = 600
        box_height = 400
        box_x = (self.width - box_width) // 2
        box_y = 250
        
        # Box background
        box_surface = pygame.Surface((box_width, box_height))
        box_surface.fill((30, 30, 40))
        pygame.draw.rect(box_surface, (100, 150, 255), (0, 0, box_width, box_height), 4)
        self.screen.blit(box_surface, (box_x, box_y))
        
        # Player status
        y_offset = box_y + 50
        for i in range(4):
            color = player_colors[i]
            x_pos = box_x + 50
            current_y = y_offset + i * 70
            
            # Player indicator
            pygame.draw.circle(self.screen, color, (x_pos, current_y), 20)
            pygame.draw.circle(self.screen, (255, 255, 255), (x_pos, current_y), 20, 2)
            
            # Player name
            name_text = self.font.render(player_names[i], True, (255, 255, 255))
            self.screen.blit(name_text, (x_pos + 40, current_y - 15))
            
            # Ready status
            if i in ready_players:
                ready_text = self.small_font.render("READY ✓", True, (100, 255, 100))
                self.screen.blit(ready_text, (x_pos + 200, current_y - 10))
            else:
                key_text = self.small_font.render(f"Press {player_keys[i]}", True, (200, 200, 200))
                self.screen.blit(key_text, (x_pos + 200, current_y - 10))
                # Blinking indicator (using pygame time for consistency)
                if int(pygame.time.get_ticks() / 500) % 2 == 0:
                    pygame.draw.circle(self.screen, (255, 255, 255), (x_pos + 350, current_y), 5)
        
        # Instructions at bottom
        if len(ready_players) < 4:
            instruction_text = self.small_font.render(
                f"Waiting for {4 - len(ready_players)} more player(s)...",
                True, (150, 150, 150)
            )
            self.screen.blit(instruction_text, (self.width // 2 - 150, box_y + box_height - 30))
        else:
            instruction_text = self.font.render(
                "All players ready! Starting game...",
                True, (100, 255, 100)
            )
            text_rect = instruction_text.get_rect(center=(self.width // 2, box_y + box_height - 30))
            self.screen.blit(instruction_text, text_rect)
    
    def draw_level_select_screen(self, selected_level, level_names):
        """Draw the level selection screen"""
        # Dark background
        self.screen.fill((20, 20, 30))
        
        # Title
        title = self.title_font.render("SELECT LEVEL", True, (100, 150, 255))
        title_rect = title.get_rect(center=(self.width // 2, 100))
        self.screen.blit(title, title_rect)
        
        # Level selection box
        box_width = 800
        box_height = 500
        box_x = (self.width - box_width) // 2
        box_y = 200
        
        # Box background
        box_surface = pygame.Surface((box_width, box_height))
        box_surface.fill((30, 30, 40))
        pygame.draw.rect(box_surface, (100, 150, 255), (0, 0, box_width, box_height), 4)
        self.screen.blit(box_surface, (box_x, box_y))
        
        # Level list
        y_offset = box_y + 50
        for i, level_name in enumerate(level_names):
            x_pos = box_x + 50
            current_y = y_offset + i * 70
            
            # Highlight selected level
            if i == selected_level:
                # Draw selection highlight
                highlight = pygame.Surface((box_width - 100, 60))
                highlight.fill((50, 100, 200))
                pygame.draw.rect(highlight, (100, 150, 255), (0, 0, box_width - 100, 60), 3)
                self.screen.blit(highlight, (x_pos, current_y - 30))
            
            # Level number
            level_num_text = self.font.render(f"Level {i+1}:", True, (200, 200, 200))
            self.screen.blit(level_num_text, (x_pos, current_y - 20))
            
            # Level name
            name_text = self.font.render(level_name, True, (255, 255, 255) if i == selected_level else (150, 150, 150))
            self.screen.blit(name_text, (x_pos + 150, current_y - 20))
            
            # Selection indicator
            if i == selected_level:
                indicator = self.small_font.render("◄ SELECTED", True, (100, 255, 100))
                self.screen.blit(indicator, (x_pos + 500, current_y - 15))
        
        # Instructions at bottom
        instruction_text = self.small_font.render(
            "Use UP/DOWN arrows to select | Press SPACE to confirm",
            True, (150, 150, 150)
        )
        text_rect = instruction_text.get_rect(center=(self.width // 2, box_y + box_height - 30))
        self.screen.blit(instruction_text, text_rect)