import argparse
import json
import random
import time
import pygame
import sys
import os
from settings import *
from level import Level
from start_menu import StartMenu

# Import mobile controls helper (if available)
try:
    from mobile_controls import get_player_mobile_input
    MOBILE_CONTROLS_AVAILABLE = True
except ImportError:
    MOBILE_CONTROLS_AVAILABLE = False
    def get_player_mobile_input(player_num):
        return {'up': False, 'down': False, 'left': False, 'right': False, 'action': False}

class Game:
    def __init__(self, args):
        # Needed for pygame
        pygame.init()
        
        # Load custom fonts (increased sizes by 10+)
        try:
            self.header_font_large = pygame.font.Font('./header_font.otf', 58)  # was 48, +10
            self.header_font_medium = pygame.font.Font('./header_font.otf', 46)  # was 36, +10
            self.header_font_small = pygame.font.Font('./header_font.otf', 38)  # was 28, +10
            self.body_font_medium = pygame.font.Font('./body_font.ttf', 34)  # was 24, +10
            self.body_font_small = pygame.font.Font('./body_font.ttf', 30)  # was 20, +10
        except:
            # Fallback to system fonts if custom fonts fail
            self.header_font_large = pygame.font.SysFont(None, 58)
            self.header_font_medium = pygame.font.SysFont(None, 46)
            self.header_font_small = pygame.font.SysFont(None, 38)
            self.body_font_medium = pygame.font.SysFont(None, 34)
            self.body_font_small = pygame.font.SysFont(None, 30)
        
        # Set up virtual display for Docker
        if 'DISPLAY' not in os.environ:
            os.environ['DISPLAY'] = ':99'
            
        # Gets the screen - start in windowed mode
        self.fullscreen = False
        self.show_menu = False
        self.screen = pygame.display.set_mode((1280, 720), pygame.RESIZABLE)
        # Sets the clock
        self.clock = pygame.time.Clock()
        # Sets the caption for the game
        pygame.display.set_caption("Bored Game - Stardew Valley Style")
        # Creates a level class inside our game
        self.level = Level()
        
        # GameJam integration
        self.args = args
        self.start_time = time.time()
        self.scores = [0, 0, 0, 0]  # Score for each player
        self.menu_section = None  # Track which menu section is open
        
        # Track previous mobile control states for edge detection
        self.prev_mobile_inventory_prev = False
        self.prev_mobile_inventory_next = False
        
        random.seed(args.seed)

    def run(self):
        # Show start menu first
        menu = StartMenu(self.screen)
        while menu.active:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    return
                if menu.handle_event(event):
                    break
            menu.draw()
            self.clock.tick(60)
        
        # Update args with selected number of players
        self.args.players = menu.num_players
        
        # Game Loop
        running = True
        while running:
            elapsed = time.time() - self.start_time
                
            # Event checker for if we exit the game
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        self.show_menu = not self.show_menu
                    elif event.key == pygame.K_EQUALS:
                        # Trigger victory for demo
                        if hasattr(self.level, 'overlay'):
                            self.level.overlay.triggerVictory()
                    elif event.key == pygame.K_F11:
                        # Toggle fullscreen with F11
                        self.fullscreen = not self.fullscreen
                        if self.fullscreen:
                            self.screen = pygame.display.set_mode((0, 0), pygame.FULLSCREEN)
                        else:
                            self.screen = pygame.display.set_mode((1280, 720), pygame.RESIZABLE)
                    elif self.show_menu and event.key == pygame.K_f:
                        # Toggle fullscreen from menu
                        self.fullscreen = not self.fullscreen
                        if self.fullscreen:
                            self.screen = pygame.display.set_mode((0, 0), pygame.FULLSCREEN)
                        else:
                            self.screen = pygame.display.set_mode((1280, 720), pygame.RESIZABLE)
                        self.show_menu = False
                    # Number keys 1-0 for inventory selection
                    elif not self.show_menu and hasattr(self.level, 'overlay'):
                        # E key for merchant interaction (takes priority)
                        if event.key == pygame.K_e:
                            if hasattr(self.level, 'near_merchant') and self.level.near_merchant:
                                self.level.overlay.merchant_open = not self.level.overlay.merchant_open
                            else:
                                # E key for tool/seed use when not near merchant
                                if hasattr(self.level, 'player'):
                                    player = self.level.player
                                    if not player.timers['toolUse'].active and not player.timers['seedUse'].active and not player.sleep:
                                        target_pos = player.rect.center + PLAYER_TOOL_OFFSET[player.status.split('_')[0]]
                                        if hasattr(player, 'hitLocation') and player.hitLocation:
                                            target_pos = player.hitLocation
                                        
                                        if player.isWithinReach(target_pos):
                                            if player.hitLocation:
                                                player.turnTowardTarget(player.hitLocation)
                                            player.timers['toolTurn'].activate()
                                            player.direction = pygame.math.Vector2()
                                            player.frameIndex = 0
                                            if not hasattr(player, 'hitLocation') or player.hitLocation is None:
                                                player.hitLocation = player.rect.center + PLAYER_TOOL_OFFSET[player.status.split('_')[0]]
                        # Check mobile plant button (handled in game loop, not events)
                        
                        key_to_slot = {
                            pygame.K_1: 0, pygame.K_2: 1, pygame.K_3: 2, pygame.K_4: 3, pygame.K_5: 4,
                            pygame.K_6: 5, pygame.K_7: 6, pygame.K_8: 7, pygame.K_9: 8, pygame.K_0: 9
                        }
                        if event.key in key_to_slot:
                            overlay = self.level.overlay
                            overlay.selected_index = key_to_slot[event.key]
                            item_key = overlay.inventory_order[overlay.selected_index]
                            if item_key in ['hoe', 'axe', 'water', 'hand']:
                                if item_key in self.level.player.tools:
                                    self.level.player.selectedTool = item_key
                                    self.level.player.toolNum = self.level.player.tools.index(item_key)
                            elif item_key in ['corn_seeds', 'tomato_seeds']:
                                seed_name = item_key.replace('_seeds', '')
                                self.level.player.selectedSeed = seed_name
                                self.level.player.seedNum = self.level.player.seeds.index(seed_name)
                elif event.type == pygame.MOUSEMOTION:
                    if hasattr(self.level, 'overlay'):
                        self.level.overlay.handleMouseMove(pygame.mouse.get_pos())
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    if event.button == 1 and not self.show_menu:
                        if hasattr(self.level, 'overlay'):
                            self.level.overlay.handleMouseDown(pygame.mouse.get_pos())
                    elif event.button == 4:  # Scroll up
                        if hasattr(self.level, 'overlay'):
                            overlay = self.level.overlay
                            # Clear eat prompt when scrolling
                            overlay.eat_prompt_item = None
                            # Skip empty slots
                            start_index = overlay.selected_index
                            for _ in range(len(overlay.inventory_order)):
                                overlay.selected_index = (overlay.selected_index - 1) % len(overlay.inventory_order)
                                item_key = overlay.inventory_order[overlay.selected_index]
                                # Check if slot should be shown
                                if item_key == 'axe' and not self.level.player.axe_unlocked:
                                    continue
                                if item_key == 'tomato_seeds' and not self.level.player.tomato_unlocked:
                                    continue
                                if item_key in ['hoe', 'axe', 'water', 'hand', 'corn_seeds', 'tomato_seeds']:
                                    break
                                if self.level.player.itemInventory.get(item_key, 0) > 0:
                                    break
                            # Update player selection based on item type
                            if item_key in ['hoe', 'axe', 'water', 'hand']:
                                if item_key in self.level.player.tools:
                                    self.level.player.selectedTool = item_key
                                    self.level.player.toolNum = self.level.player.tools.index(item_key)
                            elif item_key in ['corn_seeds', 'tomato_seeds']:
                                seed_name = item_key.replace('_seeds', '')
                                self.level.player.selectedSeed = seed_name
                                self.level.player.seedNum = self.level.player.seeds.index(seed_name)
                    elif event.button == 5:  # Scroll down
                        if hasattr(self.level, 'overlay'):
                            overlay = self.level.overlay
                            # Clear eat prompt when scrolling
                            overlay.eat_prompt_item = None
                            # Skip empty slots
                            start_index = overlay.selected_index
                            for _ in range(len(overlay.inventory_order)):
                                overlay.selected_index = (overlay.selected_index + 1) % len(overlay.inventory_order)
                                item_key = overlay.inventory_order[overlay.selected_index]
                                # Check if slot should be shown
                                if item_key == 'axe' and not self.level.player.axe_unlocked:
                                    continue
                                if item_key == 'tomato_seeds' and not self.level.player.tomato_unlocked:
                                    continue
                                if item_key in ['hoe', 'axe', 'water', 'hand', 'corn_seeds', 'tomato_seeds']:
                                    break
                                if self.level.player.itemInventory.get(item_key, 0) > 0:
                                    break
                            # Update player selection based on item type
                            if item_key in ['hoe', 'axe', 'water', 'hand']:
                                if item_key in self.level.player.tools:
                                    self.level.player.selectedTool = item_key
                                    self.level.player.toolNum = self.level.player.tools.index(item_key)
                            elif item_key in ['corn_seeds', 'tomato_seeds']:
                                seed_name = item_key.replace('_seeds', '')
                                self.level.player.selectedSeed = seed_name
                                self.level.player.seedNum = self.level.player.seeds.index(seed_name)
                elif event.type == pygame.MOUSEBUTTONUP:
                    if event.button == 1 and not self.show_menu:
                        mouse_pos = pygame.mouse.get_pos()
                        if hasattr(self.level, 'overlay'):
                            # Check emote menu first
                            if self.level.overlay.emote_menu_open:
                                if self.level.overlay.handleEmoteMenuClick(mouse_pos):
                                    continue
                            
                            # Check emote icon
                            if self.level.overlay.handleEmoteIconClick(mouse_pos):
                                continue
                            
                            # Check merchant menu first
                            if self.level.overlay.merchant_open:
                                if self.level.overlay.handleMerchantClick(mouse_pos, self.level.allSprites.offset):
                                    continue
                            
                            # Check if book is open
                            if self.level.overlay.book_open:
                                if self.level.overlay.handleBookItemClick(mouse_pos):
                                    continue
                                self.level.overlay.book_open = False
                                continue
                            
                            # Check book click
                            if self.level.overlay.handleBookClick(mouse_pos):
                                continue
                            
                            # Check announcement first
                            if self.level.overlay.announcement:
                                self.level.overlay.handleAnnouncementClick(mouse_pos)
                                continue
                            
                            # Close info prompt if open
                            if self.level.overlay.info_item:
                                self.level.overlay.closeInfoPrompt()
                                continue
                            
                            # Check save prompt
                            if self.level.overlay.save_prompt:
                                if self.level.overlay.handleSavePrompt(mouse_pos, self.level.allSprites.offset):
                                    continue
                            
                            self.level.overlay.handleMouseUp(mouse_pos)
                            # Check eat prompt first
                            if self.level.overlay.eat_prompt_item:
                                if self.level.overlay.handleEatPrompt(mouse_pos, self.level.allSprites.offset):
                                    continue
                            # Check inventory click
                            self.level.overlay.handleMouseClick(mouse_pos)
                        # Mouse clicks removed - now use button press instead
                        # Left-click only for UI interactions (handled above)
                    elif event.button == 3 and not self.show_menu:
                        # Right-click for item information only (no tool/seed use)
                        mouse_pos = pygame.mouse.get_pos()
                        if hasattr(self.level, 'overlay'):
                            self.level.overlay.handleRightClick(mouse_pos)
                    elif event.button == 1 and self.show_menu:
                        mouse_pos = pygame.mouse.get_pos()
                        if hasattr(self, 'menu_buttons'):
                            for button_name, button_rect in self.menu_buttons.items():
                                if button_rect.collidepoint(mouse_pos):
                                    if button_name == 'quit':
                                        running = False
                                    else:
                                        self.menu_section = button_name if self.menu_section != button_name else None
                    
            # Gets delta time
            dt = self.clock.tick(60) / 1000
            
            # Check mobile controls for plant/eat/use buttons (outside event loop for continuous checking)
            if not self.show_menu and hasattr(self.level, 'player') and MOBILE_CONTROLS_AVAILABLE:
                player = self.level.player
                mobile_input = get_player_mobile_input(getattr(player, 'player_id', 1))
                
                # Mobile plant button (E key equivalent)
                if mobile_input.get('plant', False) and not player.timers['toolUse'].active and not player.timers['seedUse'].active and not player.sleep:
                    # Check if near merchant first
                    if hasattr(self.level, 'near_merchant') and self.level.near_merchant:
                        if hasattr(self.level, 'overlay'):
                            self.level.overlay.merchant_open = not self.level.overlay.merchant_open
                    else:
                        # Plant seed
                        target_pos = player.rect.center + PLAYER_TOOL_OFFSET[player.status.split('_')[0]]
                        if hasattr(player, 'hitLocation') and player.hitLocation:
                            target_pos = player.hitLocation
                        
                        if player.isWithinReach(target_pos):
                            player.timers['seedUse'].activate()
                            player.direction = pygame.math.Vector2()
                            player.frameIndex = 0
                            if not hasattr(player, 'hitLocation') or player.hitLocation is None:
                                player.hitLocation = target_pos
                
                # Mobile use button (replaces mouse click) - handled in player.py via action/use button
                
                # Mobile inventory scroll - previous item (mouse wheel up equivalent)
                # Use edge detection to only trigger on button press, not while held
                current_inventory_prev = mobile_input.get('inventory_prev', False)
                if current_inventory_prev and not self.prev_mobile_inventory_prev and hasattr(self.level, 'overlay'):
                    overlay = self.level.overlay
                    # Clear eat prompt when scrolling
                    overlay.eat_prompt_item = None
                    # Skip empty slots
                    for _ in range(len(overlay.inventory_order)):
                        overlay.selected_index = (overlay.selected_index - 1) % len(overlay.inventory_order)
                        item_key = overlay.inventory_order[overlay.selected_index]
                        # Check if slot should be shown
                        if item_key == 'axe' and not self.level.player.axe_unlocked:
                            continue
                        if item_key == 'tomato_seeds' and not self.level.player.tomato_unlocked:
                            continue
                        if item_key in ['hoe', 'axe', 'water', 'hand', 'corn_seeds', 'tomato_seeds']:
                            break
                        if self.level.player.itemInventory.get(item_key, 0) > 0:
                            break
                    # Update player selection based on item type
                    if item_key in ['hoe', 'axe', 'water', 'hand']:
                        if item_key in self.level.player.tools:
                            self.level.player.selectedTool = item_key
                            self.level.player.toolNum = self.level.player.tools.index(item_key)
                    elif item_key in ['corn_seeds', 'tomato_seeds']:
                        seed_name = item_key.replace('_seeds', '')
                        self.level.player.selectedSeed = seed_name
                        self.level.player.seedNum = self.level.player.seeds.index(seed_name)
                self.prev_mobile_inventory_prev = current_inventory_prev
                
                # Mobile inventory scroll - next item (mouse wheel down equivalent)
                # Use edge detection to only trigger on button press, not while held
                current_inventory_next = mobile_input.get('inventory_next', False)
                if current_inventory_next and not self.prev_mobile_inventory_next and hasattr(self.level, 'overlay'):
                    overlay = self.level.overlay
                    # Clear eat prompt when scrolling
                    overlay.eat_prompt_item = None
                    # Skip empty slots
                    for _ in range(len(overlay.inventory_order)):
                        overlay.selected_index = (overlay.selected_index + 1) % len(overlay.inventory_order)
                        item_key = overlay.inventory_order[overlay.selected_index]
                        # Check if slot should be shown
                        if item_key == 'axe' and not self.level.player.axe_unlocked:
                            continue
                        if item_key == 'tomato_seeds' and not self.level.player.tomato_unlocked:
                            continue
                        if item_key in ['hoe', 'axe', 'water', 'hand', 'corn_seeds', 'tomato_seeds']:
                            break
                        if self.level.player.itemInventory.get(item_key, 0) > 0:
                            break
                    # Update player selection based on item type
                    if item_key in ['hoe', 'axe', 'water', 'hand']:
                        if item_key in self.level.player.tools:
                            self.level.player.selectedTool = item_key
                            self.level.player.toolNum = self.level.player.tools.index(item_key)
                    elif item_key in ['corn_seeds', 'tomato_seeds']:
                        seed_name = item_key.replace('_seeds', '')
                        self.level.player.selectedSeed = seed_name
                        self.level.player.seedNum = self.level.player.seeds.index(seed_name)
                self.prev_mobile_inventory_next = current_inventory_next
            
            # Update scores based on player inventory and gold
            if hasattr(self.level, 'player'):
                player = self.level.player
                if hasattr(player, 'itemInventory'):
                    # Calculate score based on items collected + gold + experience
                    total_score = (
                        player.itemInventory.get('wood', 0) * 1 +
                        player.itemInventory.get('apple', 0) * 2 +
                        player.itemInventory.get('corn', 0) * 3 +
                        player.itemInventory.get('tomato', 0) * 4 +
                        player.gold +
                        player.experience
                    )
                    self.scores[0] = total_score  # Single player for now
            
            # Update overlay messages and pass score
            if hasattr(self.level, 'overlay'):
                self.level.overlay.score = self.scores[0]
                self.level.overlay.updateMessages(dt)
                self.level.overlay.updateVictory(dt)
                
                # Check for victory trigger
                if self.level.player.level >= 3 and not self.level.overlay.victory_active:
                    self.level.overlay.triggerVictory()
            
            # Runs the level/game
            self.level.run(dt)
            
            # Draw menu if active
            if self.show_menu:
                overlay = pygame.Surface(self.screen.get_size())
                overlay.set_alpha(128)
                overlay.fill((0, 0, 0))
                self.screen.blit(overlay, (0, 0))
                
                screen_center = self.screen.get_rect().center
                
                # Menu title
                menu_text = self.body_font_medium.render("MENU", True, (255, 255, 255))
                menu_rect = menu_text.get_rect(center=(screen_center[0], 100))
                self.screen.blit(menu_text, menu_rect)
                
                # Menu buttons (centered list)
                self.menu_buttons = {}
                button_names = ['CONTROLS', 'OPTIONS', 'QUIT']
                y_start = 200
                button_spacing = 80
                
                for i, button_name in enumerate(button_names):
                    button_text = self.header_font_medium.render(button_name, True, (255, 255, 100))
                    button_rect = button_text.get_rect(center=(screen_center[0], y_start + i * button_spacing))
                    self.menu_buttons[button_name.lower()] = button_rect
                    self.screen.blit(button_text, button_rect)
                
                # Show details if a section is selected
                if self.menu_section == 'controls':
                    details_y = y_start + len(button_names) * button_spacing + 50
                    controls = [
                        "WASD Move",
                        "Left Click Action Tool Plant Harvest Eat",
                        "Right Click Item Information",
                        "Mouse Wheel Scroll Inventory",
                        "Drag Items Rearrange Inventory",
                        "Hover Over Item View Name"
                    ]
                    for i, text in enumerate(controls):
                        detail_text = self.body_font_small.render(text, True, (255, 255, 255))
                        detail_rect = detail_text.get_rect(center=(screen_center[0], details_y + i * 35))
                        self.screen.blit(detail_text, detail_rect)
                
                elif self.menu_section == 'options':
                    details_y = y_start + len(button_names) * button_spacing + 50
                    options = [
                        f"Fullscreen {'ON' if self.fullscreen else 'OFF'}",
                        "F Toggle Fullscreen",
                        "F11 Quick Toggle",
                        "ESC Close Menu"
                    ]
                    for i, text in enumerate(options):
                        detail_text = self.body_font_small.render(text, True, (255, 255, 255))
                        detail_rect = detail_text.get_rect(center=(screen_center[0], details_y + i * 35))
                        self.screen.blit(detail_text, detail_rect)
            
            # Updates the display
            pygame.display.update()

        pygame.quit()
        
        # Return GameJam format result
        result = {
            "scores": self.scores,
            "winner": self.scores.index(max(self.scores)) if max(self.scores) > 0 else 0,
            "meta": {"mode": self.args.mode, "total_items": self.scores[0]}
        }
        print("RESULT:", json.dumps(result))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--players", type=int, default=1)
    parser.add_argument("--seed", type=int, default=123)
    parser.add_argument("--mode", type=str, default="jam")
    args = parser.parse_args()

    game = Game(args)
    game.run()

if __name__ == '__main__':
    main()