"""
Professional UI system with polished HUD and effects
"""
import pygame
from Utils.GameScale import UI_FONT_SMALL, UI_FONT_MEDIUM, UI_FONT_LARGE, UI_FONT_TITLE

class ProfessionalUI:
    """Professional UI rendering system"""
    
    def __init__(self, screen, font):
        self.screen = screen
        self.font = font
        self.small_font = pygame.font.SysFont("Consolas", UI_FONT_SMALL)
        self.title_font = pygame.font.SysFont("Consolas", UI_FONT_TITLE, bold=True)
    
    def draw_hud(self, players, elapsed, game_duration, finished_players, team_scores=None):
        """Draw professional HUD with team information"""
        width = self.screen.get_width()
        
        # Top bar with gradient background
        hud_surface = pygame.Surface((width, 80))
        hud_surface.fill((20, 20, 30))
        # Add subtle gradient
        for i in range(80):
            alpha = int(255 * (1 - i / 80))
            pygame.draw.line(hud_surface, (30, 30, 40), (0, i), (width, i))
        self.screen.blit(hud_surface, (0, 0))
        
        # Timer
        time_left = max(0, game_duration - elapsed)
        timer_color = (255, 255, 255) if time_left > 30 else (255, 100, 100)
        timer_text = self.font.render(f"Time: {int(time_left)}s", True, timer_color)
        self.screen.blit(timer_text, (20, 15))
        
        # Team scores
        if team_scores:
            team1_score = team_scores.get(0, 0)
            team2_score = team_scores.get(1, 0)
            score_text = self.font.render(f"Team 1: {team1_score} | Team 2: {team2_score}", True, (255, 255, 255))
            self.screen.blit(score_text, (20, 50))
        
        # Player status indicators (grouped by team)
        player_colors = [
            (100, 150, 255),  # Blue (Team 1)
            (255, 150, 100),  # Orange (Team 1)
            (255, 50, 50),    # Red (Team 2)
            (255, 255, 100),  # Yellow (Team 2)
        ]
        
        team_names = ["Team 1", "Team 2"]
        
        x_offset = width - 350
        # Team 1 players
        team1_y = 15
        team_text = self.small_font.render("Team 1:", True, (150, 200, 255))
        self.screen.blit(team_text, (x_offset, team1_y))
        for i in [0, 1]:  # Players 1 and 2
            color = player_colors[i]
            y_pos = team1_y + 20 + (i * 15)
            
            # Player indicator dot
            pygame.draw.circle(self.screen, color, (x_offset, y_pos + 6), 4)
            
            # Player name
            name_text = self.small_font.render(f"P{i+1}", True, (255, 255, 255))
            self.screen.blit(name_text, (x_offset + 15, y_pos))
            
            # Finished indicator
            if i in finished_players:
                check_text = self.small_font.render("✓", True, (100, 255, 100))
                self.screen.blit(check_text, (x_offset + 50, y_pos))
        
        # Team 2 players
        team2_y = 15
        team_text = self.small_font.render("Team 2:", True, (255, 150, 150))
        self.screen.blit(team_text, (x_offset + 100, team2_y))
        for i in [2, 3]:  # Players 3 and 4
            color = player_colors[i]
            y_pos = team2_y + 20 + ((i - 2) * 15)
            
            # Player indicator dot
            pygame.draw.circle(self.screen, color, (x_offset + 100, y_pos + 6), 4)
            
            # Player name
            name_text = self.small_font.render(f"P{i+1}", True, (255, 255, 255))
            self.screen.blit(name_text, (x_offset + 115, y_pos))
            
            # Finished indicator
            if i in finished_players:
                check_text = self.small_font.render("✓", True, (100, 255, 100))
                self.screen.blit(check_text, (x_offset + 150, y_pos))
    
    def draw_instructions(self, show=True):
        """Draw control instructions"""
        if not show:
            return
        
        width = self.screen.get_width()
        height = self.screen.get_height()
        
        # Semi-transparent background
        inst_surface = pygame.Surface((400, 120))
        inst_surface.set_alpha(200)
        inst_surface.fill((0, 0, 0))
        self.screen.blit(inst_surface, (20, height - 140))
        
        # Instructions text
        lines = [
            "WASD/Arrows/IJKL/TFGH: Move | W/Up/I/T: Jump",
            "Space/Enter/U/R: Shoot Portal",
            "Goal: Press button, reach the exit!"
        ]
        
        for i, line in enumerate(lines):
            text = self.small_font.render(line, True, (200, 200, 200))
            self.screen.blit(text, (30, height - 130 + i * 25))
    
    def draw_victory_screen(self, finish_times, players):
        """Draw professional victory screen"""
        width = self.screen.get_width()
        height = self.screen.get_height()
        
        # Dark overlay
        overlay = pygame.Surface((width, height))
        overlay.set_alpha(200)
        overlay.fill((0, 0, 0))
        self.screen.blit(overlay, (0, 0))
        
        # Victory box
        box_width = 600
        box_height = 400
        box_x = (width - box_width) // 2
        box_y = (height - box_height) // 2
        
        # Box background with border
        box_surface = pygame.Surface((box_width, box_height))
        box_surface.fill((30, 30, 40))
        pygame.draw.rect(box_surface, (100, 150, 255), (0, 0, box_width, box_height), 4)
        self.screen.blit(box_surface, (box_x, box_y))
        
        # Title
        title = self.title_font.render("Level Complete!", True, (255, 255, 255))
        title_rect = title.get_rect(center=(width // 2, box_y + 50))
        self.screen.blit(title, title_rect)
        
        # Results
        y_offset = box_y + 120
        for i, (player_idx, finish_time) in enumerate(finish_times):
            if finish_time is not None:
                player = players[player_idx]
                rank_emoji = ["🥇", "🥈", "🥉", "4️⃣"][i]
                time_str = f"{finish_time:.1f}s"
                result_text = self.font.render(
                    f"{rank_emoji} Player {player_idx + 1}: {time_str}", 
                    True, (255, 255, 255)
                )
                self.screen.blit(result_text, (box_x + 50, y_offset + i * 50))
    
    def draw_portal_indicator(self, player, has_portal, color):
        """Draw indicator showing if player has portal ready"""
        if has_portal:
            # Small indicator above player
            player_rect = player.rect()
            x = player_rect.centerx
            y = player_rect.top - 15
            pygame.draw.circle(self.screen, color, (x, y), 3)
            pygame.draw.circle(self.screen, (255, 255, 255), (x, y), 3, 1)
