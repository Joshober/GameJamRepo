import pygame
from settings import *

class Overlay:
    def __init__(self, player):
        self.displaySurface = pygame.display.get_surface()
        self.player = player
        
        # Load inventory background and scale to 50%
        inv_bg_full = pygame.image.load('./graphics/overlay/inventory.png').convert_alpha()
        new_width = inv_bg_full.get_width() // 2
        new_height = inv_bg_full.get_height() // 2
        self.inventory_bg = pygame.transform.scale(inv_bg_full, (new_width, new_height))
        
        # Load prompt outline and scale to 60% (20% larger than original 50%)
        prompt_full = pygame.image.load('./graphics/overlay/prompt_outline.png').convert_alpha()
        prompt_width = int(prompt_full.get_width() * 0.6)
        prompt_height = int(prompt_full.get_height() * 0.6)
        self.prompt_outline = pygame.transform.scale(prompt_full, (prompt_width, prompt_height))
        
        # Load progress book
        try:
            self.progress_book = pygame.image.load('./graphics/overlay/progress_book.png').convert_alpha()
        except:
            # Create placeholder if not found
            self.progress_book = pygame.Surface((64, 64))
            self.progress_book.fill((139, 69, 19))
        
        # Load emote system
        try:
            self.emote_icon = pygame.image.load('./graphics/overlay/emote_icon.png').convert_alpha()
            emote_sheet_full = pygame.image.load('./graphics/overlay/emote.png').convert_alpha()
            # Scale emote sheet to 50%
            new_width = emote_sheet_full.get_width() // 2
            new_height = emote_sheet_full.get_height() // 2
            self.emote_sheet = pygame.transform.scale(emote_sheet_full, (new_width, new_height))
            emote_back_full = pygame.image.load('./graphics/overlay/emote_back.png').convert_alpha()
            # Scale emote_back down 50%
            back_width = emote_back_full.get_width() // 2
            back_height = emote_back_full.get_height() // 2
            self.emote_back = pygame.transform.scale(emote_back_full, (back_width, back_height))
        except:
            self.emote_icon = pygame.Surface((64, 64))
            self.emote_icon.fill((255, 200, 0))
            self.emote_sheet = pygame.Surface((150, 150))
            self.emote_sheet.fill((200, 200, 200))
            self.emote_back = pygame.Surface((50, 50))
            self.emote_back.fill((100, 100, 100))
        
        # Load gold icon
        try:
            self.gold_icon = None  # Not needed anymore, using gold_stat_template
        except:
            self.gold_icon = None
        
        # Load stat template
        try:
            stat_full = pygame.image.load('./graphics/overlay/stat_template.png').convert_alpha()
            stat_width = int(stat_full.get_width() * 0.75)
            stat_height = int(stat_full.get_height() * 0.75)
            self.stat_template = pygame.transform.scale(stat_full, (stat_width, stat_height))
        except:
            self.stat_template = pygame.Surface((132, 56))
            self.stat_template.fill((50, 50, 50))
        
        # Load gold stat template (same as stat_template but with coin icon)
        try:
            gold_full = pygame.image.load('./graphics/overlay/gold.png').convert_alpha()
            gold_width = int(gold_full.get_width() * 0.75)
            gold_height = int(gold_full.get_height() * 0.75)
            self.gold_stat_template = pygame.transform.scale(gold_full, (gold_width, gold_height))
        except:
            self.gold_stat_template = self.stat_template.copy()
        
        # Load fonts
        try:
            self.body_font = pygame.font.Font('./body_font.ttf', 27)
            self.message_font = pygame.font.Font('./body_font.ttf', 35)
            self.header_font = pygame.font.Font('./header_font.otf', 38)
            self.stat_title_font = pygame.font.Font('./body_font.ttf', 30)
            self.stat_value_font = pygame.font.Font('./body_font.ttf', 25)
            self.progress_title_font = pygame.font.Font('./body_font.ttf', 35)
            self.stat_title_font.set_bold(True)
            self.stat_value_font.set_bold(True)
        except:
            self.body_font = pygame.font.SysFont(None, 27)
            self.message_font = pygame.font.SysFont(None, 35)
            self.header_font = pygame.font.SysFont(None, 38)
            self.stat_title_font = pygame.font.SysFont(None, 30, bold=True)
            self.stat_value_font = pygame.font.SysFont(None, 25, bold=True)
            self.progress_title_font = pygame.font.SysFont(None, 35)
        
        # Inventory slot configuration (scaled to 50%)
        self.slot_size = 83 // 2
        self.slot_start = (36 // 2, 124 // 2)
        self.slot_spacing = 36 // 2
        self.inventory_slots = []
        
        # Create 2x5 grid of slots
        for row in range(2):
            for col in range(5):
                x = self.slot_start[0] + col * (self.slot_size + self.slot_spacing)
                y = self.slot_start[1] + row * (self.slot_size + self.slot_spacing)
                self.inventory_slots.append(pygame.Rect(x, y, self.slot_size, self.slot_size))
        
        # Load item images
        overlayPath = './graphics/overlay/'
        self.itemSurfaces = {
            'hoe': pygame.image.load(f'{overlayPath}hoe.png').convert_alpha(),
            'axe': pygame.image.load(f'{overlayPath}axe.png').convert_alpha(),
            'water': pygame.image.load(f'{overlayPath}water.png').convert_alpha(),
            'hand': pygame.image.load(f'{overlayPath}hand.png').convert_alpha(),
            'corn_seeds': pygame.image.load(f'{overlayPath}corn_seeds.png').convert_alpha(),
            'tomato_seeds': pygame.image.load(f'{overlayPath}tomato_seeds.png').convert_alpha(),
            'corn': pygame.image.load(f'{overlayPath}corn.png').convert_alpha(),
            'tomato': pygame.image.load(f'{overlayPath}tomato.png').convert_alpha(),
            'wood': pygame.image.load('./graphics/objects/tree_small.png').convert_alpha(),
            'apple': pygame.image.load('./graphics/fruit/apple.png').convert_alpha()
        }
        
        # Item names for hover text
        self.item_names = {
            'hoe': 'Hoe', 'axe': 'Axe', 'water': 'Water', 'hand': 'Hand',
            'corn_seeds': 'Corn Seeds', 'tomato_seeds': 'Tomato Seeds',
            'corn': 'Corn', 'tomato': 'Tomato', 'wood': 'Wood', 'apple': 'Apple'
        }
        
        # Inventory order: tools on top row, items on bottom row
        self.inventory_order = ['hoe', 'water', 'hand', 'corn_seeds', 'corn', 'axe', 'tomato_seeds', 'tomato', 'wood', 'apple']
        
        # Selection tracking
        self.selected_index = 0
        self.hovered_index = -1
        self.eat_prompt_item = None
        self.dragging_index = -1
        self.drag_start_pos = None
        self.info_item = None
        self.save_prompt = False  # Disabled for now (exists for possible future use)
        self.merchant_open = False
        
        # Load coin icon for merchant
        try:
            self.coin_icon = pygame.image.load('./graphics/overlay/coin.png').convert_alpha()
            self.coin_icon = pygame.transform.scale(self.coin_icon, (32, 32))  # Larger for proximity indicator
            self.coin_icon_small = pygame.transform.scale(pygame.image.load('./graphics/overlay/coin.png').convert_alpha(), (20, 20))  # Small for menu
        except:
            self.coin_icon = pygame.Surface((32, 32))
            self.coin_icon.fill((255, 215, 0))
            self.coin_icon_small = pygame.Surface((20, 20))
            self.coin_icon_small.fill((255, 215, 0))
        
        # Message display
        self.current_message = None
        self.message_timer = 0
        self.message_duration = 3.0
        self.message_delay_timer = 0
        
        # Announcement prompt
        self.announcement = None
        self.announcement_timer = 0
        self.announcement_scale = 1.0
        self.announcement_minimizing = False
        
        # Progress book tracking
        self.unlocked_items = {'hoe': True, 'water': True, 'hand': True, 'corn': True}
        self.book_open = False
        self.book_announcement = None
        
        # Emote system
        self.emote_menu_open = False
        self.current_emote = None
        self.emote_timer = 0
        self.emote_duration = 3.0
        
        # Victory screen
        self.victory_active = False
        self.victory_slide_y = None
        self.victory_stats_slide_y = None
        self.victory_animation_frame = 0
        self.victory_animation_timer = 0
        try:
            victory_frame0 = pygame.image.load('./graphics/overlay/frame0000.png').convert_alpha()
            victory_frame1 = pygame.image.load('./graphics/overlay/frame0001.png').convert_alpha()
            scale = 1.75
            self.victory_frames = [
                pygame.transform.scale(victory_frame0, (int(victory_frame0.get_width() * scale), int(victory_frame0.get_height() * scale))),
                pygame.transform.scale(victory_frame1, (int(victory_frame1.get_width() * scale), int(victory_frame1.get_height() * scale)))
            ]
        except:
            self.victory_frames = [pygame.Surface((200, 100)), pygame.Surface((200, 100))]
            self.victory_frames[0].fill((255, 215, 0))
            self.victory_frames[1].fill((255, 200, 0))
        
        # Create highlight surface
        self.highlight = pygame.Surface((self.slot_size, self.slot_size))
        self.highlight.fill((255, 0, 0))
        self.highlight.set_alpha(25)
    
    def getInventoryPosition(self):
        screen_width = self.displaySurface.get_width()
        screen_height = self.displaySurface.get_height()
        # Center horizontally, 10px from bottom
        x = (screen_width - self.inventory_bg.get_width()) // 2
        y = screen_height - self.inventory_bg.get_height() - 10
        return (x, y)
    
    def getSlotAtMouse(self, mouse_pos):
        inv_pos = self.getInventoryPosition()
        for i, slot in enumerate(self.inventory_slots):
            adjusted_slot = slot.move(inv_pos[0], inv_pos[1])
            if adjusted_slot.collidepoint(mouse_pos):
                return i
        return -1
    
    def handleMouseMove(self, mouse_pos):
        if self.dragging_index >= 0:
            return
        self.hovered_index = self.getSlotAtMouse(mouse_pos)
    
    def handleMouseDown(self, mouse_pos):
        slot_index = self.getSlotAtMouse(mouse_pos)
        if slot_index >= 0:
            self.dragging_index = slot_index
            self.drag_start_pos = mouse_pos
    
    def handleMouseUp(self, mouse_pos):
        if self.dragging_index >= 0:
            drop_index = self.getSlotAtMouse(mouse_pos)
            if drop_index >= 0 and drop_index != self.dragging_index:
                # Swap items
                self.inventory_order[self.dragging_index], self.inventory_order[drop_index] = \
                    self.inventory_order[drop_index], self.inventory_order[self.dragging_index]
                # Update selected index if needed
                if self.selected_index == self.dragging_index:
                    self.selected_index = drop_index
                elif self.selected_index == drop_index:
                    self.selected_index = self.dragging_index
            self.dragging_index = -1
            self.drag_start_pos = None
    
    def handleMouseClick(self, mouse_pos):
        slot_index = self.getSlotAtMouse(mouse_pos)
        if slot_index >= 0 and slot_index < len(self.inventory_order):
            item_key = self.inventory_order[slot_index]
            
            # Select any item (treat all as selectable)
            self.selected_index = slot_index
            
            # Update player's selected tool/seed based on item type
            if item_key in ['hoe', 'axe', 'water', 'hand']:
                self.player.selectedTool = item_key
                self.player.toolNum = self.player.tools.index(item_key)
            elif item_key in ['corn_seeds', 'tomato_seeds']:
                seed_name = item_key.replace('_seeds', '')
                self.player.selectedSeed = seed_name
                self.player.seedNum = self.player.seeds.index(seed_name)
            
            # Show eat prompt for edible items when left-clicked
            if item_key in ['corn', 'tomato', 'apple']:
                count = self.player.itemInventory.get(item_key, 0)
                if count > 0:
                    self.eat_prompt_item = item_key
    
    def handleRightClick(self, mouse_pos):
        """Handle right-click for item information."""
        slot_index = self.getSlotAtMouse(mouse_pos)
        if slot_index >= 0 and slot_index < len(self.inventory_order):
            item_key = self.inventory_order[slot_index]
            self.info_item = item_key
    
    def closeInfoPrompt(self):
        """Close the information prompt."""
        self.info_item = None
    
    def handleSavePrompt(self, mouse_pos, camera_offset=None):
        """Handle save prompt click."""
        if not self.save_prompt:
            return False
        
        # Convert world position to screen position
        if camera_offset:
            player_screen_pos = (self.player.rect.centerx - camera_offset.x, self.player.rect.centery - camera_offset.y)
        else:
            player_screen_pos = (self.player.rect.centerx, self.player.rect.centery)
        
        # Yes/No button positions (side by side)
        yes_rect = pygame.Rect(player_screen_pos[0] - 60, player_screen_pos[1] - 20, 50, 30)
        no_rect = pygame.Rect(player_screen_pos[0] + 10, player_screen_pos[1] - 20, 50, 30)
        
        if yes_rect.collidepoint(mouse_pos):
            # Save game
            self.addMessage("Game saved!")
            self.save_prompt = False
            return True
        elif no_rect.collidepoint(mouse_pos):
            self.save_prompt = False
            return True
        
        return False
    
    def handleEatPrompt(self, mouse_pos, camera_offset=None):
        if not self.eat_prompt_item:
            return False
        
        # Get prompt position (aligned with inventory, 6px above)
        inv_pos = self.getInventoryPosition()
        prompt_x = inv_pos[0]
        prompt_y = inv_pos[1] - self.prompt_outline.get_height() - 6
        
        # Yes/No button positions within prompt box (scaled)
        yes_rect = pygame.Rect(prompt_x + 25, prompt_y + 60, 40, 20)
        no_rect = pygame.Rect(prompt_x + 75, prompt_y + 60, 40, 20)
        
        if yes_rect.collidepoint(mouse_pos):
            # Eat the item
            if self.player.itemInventory.get(self.eat_prompt_item, 0) > 0:
                self.player.itemInventory[self.eat_prompt_item] -= 1
                result = self.player.gainExperience(10)
                if result == 'both_unlock':
                    self.showAnnouncement("50 exp reached", "Axe & Tomato unlocked!")
                self.addMessage("+10 exp")
            self.eat_prompt_item = None
            return True
        elif no_rect.collidepoint(mouse_pos):
            self.eat_prompt_item = None
            return True
        
        return False
    
    def addMessage(self, message):
        """Add a message to display in the inventory area."""
        self.current_message = None
        self.message_delay_timer = 0.1  # 100ms delay
        self.pending_message = message
    
    def showAnnouncement(self, header_text, body_text):
        """Show centered announcement with header and body text."""
        self.announcement = (header_text, body_text)
        self.announcement_timer = -1  # Negative means stay until clicked
        self.announcement_scale = 1.0
        self.announcement_minimizing = False
        
        # Track unlock in progress book
        if 'unlocked' in body_text.lower():
            item_name = body_text.lower().replace('unlocked!', '').replace('unlocked', '').strip()
            if item_name in self.itemSurfaces:
                self.unlocked_items[item_name] = True
    
    def handleAnnouncementClick(self, mouse_pos):
        """Close announcement on click."""
        if self.announcement:
            self.announcement_minimizing = True
            return True
        return False
    
    def drawPlayerStats(self):
        """Draw player stats stacked in top right corner."""
        screen_width = self.displaySurface.get_width()
        
        # Start from top right, stack downwards
        stat_x = screen_width - self.stat_template.get_width() - 10
        stat_y = 10
        
        # Stats to display: Score, Level, EXP (name: value side by side)
        stats = [
            ("Score", str(getattr(self, 'score', 0))),
            ("Level", str(self.player.level)),
            ("EXP", f"{self.player.experience}/{self.player.exp_to_next_level}")
        ]
        
        for title, value in stats:
            # Draw stat template background
            self.displaySurface.blit(self.stat_template, (stat_x, stat_y))
            
            # Draw title and value side by side, centered vertically within template
            text_y = stat_y + (self.stat_template.get_height() - self.stat_title_font.get_height()) // 2
            
            # Draw title left-aligned within template (with margin)
            title_text = self.stat_title_font.render(title, True, (255, 255, 255))
            title_x = stat_x + 7
            self.displaySurface.blit(title_text, (title_x, text_y))
            
            # Draw value right-aligned within template (with margin)
            value_text = self.stat_value_font.render(value, True, (255, 255, 255))
            value_x = stat_x + self.stat_template.get_width() - value_text.get_width() - 7
            self.displaySurface.blit(value_text, (value_x, text_y))
            
            # Move down for next stat
            stat_y += self.stat_template.get_height() + 5
        
        # Draw Gold stat with gold template (has coin icon built-in)
        self.displaySurface.blit(self.gold_stat_template, (stat_x, stat_y))
        
        # Draw gold value right aligned, centered vertically
        gold_value = self.stat_value_font.render(str(self.player.gold), True, (255, 255, 255))
        value_x = stat_x + self.gold_stat_template.get_width() - gold_value.get_width() - 7
        value_y = stat_y + (self.gold_stat_template.get_height() - self.stat_value_font.get_height()) // 2
        self.displaySurface.blit(gold_value, (value_x, value_y))
    
    def getBookPosition(self):
        """Get progress book position (below stats, aligned with left margin of stats)."""
        screen_width = self.displaySurface.get_width()
        stat_x = screen_width - self.stat_template.get_width() - 10
        # 4 stat cards + spacing + book offset
        book_y = 10 + (self.stat_template.get_height() + 5) * 4 + 10
        book_x = stat_x  # Align with left edge of stats
        return (book_x, book_y)
    
    def getEmoteIconPosition(self):
        """Get emote icon position (to the right of book)."""
        book_pos = self.getBookPosition()
        emote_x = book_pos[0] + self.progress_book.get_width() + 10
        emote_y = book_pos[1]
        return (emote_x, emote_y)
    
    def handleBookClick(self, mouse_pos):
        """Handle click on progress book."""
        book_pos = self.getBookPosition()
        book_rect = pygame.Rect(book_pos[0], book_pos[1], self.progress_book.get_width(), self.progress_book.get_height())
        if book_rect.collidepoint(mouse_pos):
            self.book_open = not self.book_open
            return True
        return False
    
    def handleEmoteIconClick(self, mouse_pos):
        """Handle click on emote icon."""
        emote_pos = self.getEmoteIconPosition()
        emote_rect = pygame.Rect(emote_pos[0], emote_pos[1], self.emote_icon.get_width(), self.emote_icon.get_height())
        if emote_rect.collidepoint(mouse_pos):
            self.emote_menu_open = not self.emote_menu_open
            return True
        return False
    
    def handleEmoteMenuClick(self, mouse_pos):
        """Handle click on emote in menu."""
        if not self.emote_menu_open:
            return False
        
        emote_icon_pos = self.getEmoteIconPosition()
        screen_width = self.displaySurface.get_width()
        screen_height = self.displaySurface.get_height()
        
        # Position menu within screen bounds
        menu_x = emote_icon_pos[0]
        menu_y = emote_icon_pos[1] + self.emote_icon.get_height() + 5
        
        # Adjust if menu goes off right edge
        if menu_x + self.emote_sheet.get_width() > screen_width:
            menu_x = screen_width - self.emote_sheet.get_width()
        
        # Adjust if menu goes off bottom edge
        if menu_y + self.emote_sheet.get_height() > screen_height:
            menu_y = emote_icon_pos[1] - self.emote_sheet.get_height() - 5
        
        # Emote sheet is 150x150 (50% of 300x300), so each emote is 50x50
        emote_size = self.emote_sheet.get_width() // 3
        
        # Check each emote slot (3x3 grid)
        for row in range(3):
            for col in range(3):
                emote_x = menu_x + col * emote_size
                emote_y = menu_y + row * emote_size
                emote_rect = pygame.Rect(emote_x, emote_y, emote_size, emote_size)
                
                if emote_rect.collidepoint(mouse_pos):
                    # Store emote position in original sheet (100x100 grid)
                    self.current_emote = (col * 100, row * 100)
                    self.emote_timer = self.emote_duration
                    self.emote_menu_open = False
                    return True
        
        return False
    
    def handleBookItemClick(self, mouse_pos):
        """Handle click on item in open book."""
        if not self.book_open:
            return False
        
        screen_center = self.displaySurface.get_rect().center
        book_x = screen_center[0] - 200
        book_y = screen_center[1] - 150
        
        # Check each item slot
        items_list = ['hoe', 'axe', 'water', 'hand', 'corn', 'tomato', 'wood', 'apple']
        for i, item_key in enumerate(items_list):
            row = i // 4
            col = i % 4
            item_x = book_x + 50 + col * 80
            item_y = book_y + 80 + row * 80
            item_rect = pygame.Rect(item_x, item_y, 60, 60)
            
            if item_rect.collidepoint(mouse_pos) and self.unlocked_items.get(item_key, False):
                # Show announcement for this item
                self.book_announcement = item_key
                return True
        
        return False
    
    def handleMerchantClick(self, mouse_pos, camera_offset=None):
        """Handle click on merchant menu items."""
        if not self.merchant_open:
            return False
        
        # Position menu to the right of player sprite
        if camera_offset:
            player_screen_x = self.player.rect.centerx - camera_offset.x
            player_screen_y = self.player.rect.centery - camera_offset.y
        else:
            player_screen_x = self.player.rect.centerx
            player_screen_y = self.player.rect.centery
        
        menu_x = player_screen_x + 100
        menu_y = player_screen_y - self.prompt_outline.get_height() // 2 - self.stat_template.get_height() // 2
        
        # Define merchant items (item_key, price, is_buy)
        merchant_items = [
            ('wood', 5, False),  # Sell wood for 5 gold
            ('corn_seeds', 5, True),  # Buy corn seeds for 5 gold
            ('tomato_seeds', 8, True)  # Buy tomato seeds for 8 gold
        ]
        
        item_height = 40
        start_y = menu_y + self.stat_template.get_height() + 20
        
        for i, (item_key, price, is_buy) in enumerate(merchant_items):
            item_y = start_y + i * item_height
            item_rect = pygame.Rect(menu_x + 10, item_y, self.prompt_outline.get_width() - 20, item_height - 5)
            
            if item_rect.collidepoint(mouse_pos):
                if is_buy:
                    # Buy item
                    if self.player.gold >= price:
                        self.player.gold -= price
                        self.player.itemInventory[item_key] += 1
                        self.addMessage(f"Bought {self.item_names[item_key]}!")
                    else:
                        self.addMessage("Not enough gold!")
                else:
                    # Sell item
                    if self.player.itemInventory.get(item_key, 0) > 0:
                        self.player.itemInventory[item_key] -= 1
                        self.player.gold += price
                        result = self.player.gainExperience(3)
                        if result == 'both_unlock':
                            self.showAnnouncement("50 exp reached", "Axe & Tomato unlocked!")
                        self.addMessage(f"Sold {self.item_names[item_key]}! +3 exp")
                    else:
                        self.addMessage(f"No {self.item_names[item_key]} to sell!")
                return True
        
        # Click outside items closes menu
        self.merchant_open = False
        return True
    
    def triggerVictory(self):
        """Trigger victory screen animation."""
        self.victory_active = True
        self.victory_slide_y = -self.victory_frames[0].get_height()
        screen_height = self.displaySurface.get_height()
        self.victory_stats_slide_y = screen_height
    
    def updateVictory(self, dt):
        """Update victory screen animation."""
        if not self.victory_active:
            return
        
        # Animate slide down from top
        if self.victory_slide_y is not None:
            screen_center_y = self.displaySurface.get_height() // 2
            target_y = screen_center_y - self.victory_frames[0].get_height()
            
            if self.victory_slide_y < target_y:
                self.victory_slide_y += 400 * dt
                if self.victory_slide_y >= target_y:
                    self.victory_slide_y = target_y
        
        # Animate stats slide up from bottom
        if self.victory_stats_slide_y is not None:
            screen_center_y = self.displaySurface.get_height() // 2
            target_animation_y = screen_center_y - self.victory_frames[0].get_height()
            target_stats_y = target_animation_y + self.victory_frames[0].get_height() + 20
            
            if self.victory_stats_slide_y > target_stats_y:
                self.victory_stats_slide_y -= 400 * dt
                if self.victory_stats_slide_y <= target_stats_y:
                    self.victory_stats_slide_y = target_stats_y
        
        # Animate frames
        self.victory_animation_timer += dt
        if self.victory_animation_timer >= 0.5:
            self.victory_animation_timer = 0
            self.victory_animation_frame = (self.victory_animation_frame + 1) % 2
    
    def updateMessages(self, dt):
        """Update message timer."""
        if self.message_delay_timer > 0:
            self.message_delay_timer -= dt
            if self.message_delay_timer <= 0 and hasattr(self, 'pending_message'):
                self.current_message = self.pending_message
                self.message_timer = self.message_duration
                delattr(self, 'pending_message')
        
        if self.message_timer > 0:
            self.message_timer -= dt
            if self.message_timer <= 0:
                self.current_message = None
        
        # Update emote timer
        if self.emote_timer > 0:
            self.emote_timer -= dt
            if self.emote_timer <= 0:
                self.current_emote = None
        
        # Announcement stays until clicked (timer is negative)
        # Only handle minimization animation
        if self.announcement_minimizing:
            self.announcement_scale -= dt * 3
            if self.announcement_scale <= 0:
                self.announcement = None
                self.announcement_minimizing = False
                self.announcement_scale = 1.0
    
    def updateDisplay(self, camera_offset=None):
        # Draw player stats
        self.drawPlayerStats()
        
        # Draw inventory background
        inv_pos = self.getInventoryPosition()
        self.displaySurface.blit(self.inventory_bg, inv_pos)
        
        # Draw items in slots
        for i, item_key in enumerate(self.inventory_order):
            if i >= len(self.inventory_slots):
                break
            
            slot = self.inventory_slots[i]
            slot_center = (inv_pos[0] + slot.centerx, inv_pos[1] + slot.centery)
            
            # Determine if item should be shown
            show_item = False
            count = 0
            
            # Hide axe until unlocked
            if item_key == 'axe' and not self.player.axe_unlocked:
                show_item = False
            # Hide tomato seeds until unlocked
            elif item_key == 'tomato_seeds' and not self.player.tomato_unlocked:
                show_item = False
            elif item_key in ['hoe', 'axe', 'water', 'hand']:
                show_item = True
            elif item_key in ['corn_seeds', 'tomato_seeds']:
                count = self.player.itemInventory.get(item_key, 0)
                show_item = True
            else:
                count = self.player.itemInventory.get(item_key, 0)
                show_item = count > 0
            
            if show_item:
                # Draw item sprite
                item_surf = self.itemSurfaces[item_key]
                scaled_surf = pygame.transform.scale(item_surf, (self.slot_size - 5, self.slot_size - 5))
                surf_rect = scaled_surf.get_rect(center=slot_center)
                self.displaySurface.blit(scaled_surf, surf_rect)
                
                # Draw count for non-tools
                if item_key not in ['hoe', 'axe', 'water', 'hand'] and count > 0:
                    count_text = self.body_font.render(str(count), True, (255, 255, 255))
                    count_pos = (inv_pos[0] + slot.right - 15, inv_pos[1] + slot.bottom - 15)
                    self.displaySurface.blit(count_text, count_pos)
            
            # Draw highlight for selected or hovered
            if i == self.selected_index or i == self.hovered_index:
                highlight_pos = (inv_pos[0] + slot.x, inv_pos[1] + slot.y)
                self.displaySurface.blit(self.highlight, highlight_pos)
            
            # Draw slot number (1-9, 0 for slot 10) - moved up 5 pixels
            slot_num = (i + 1) % 10
            num_text = self.body_font.render(str(slot_num), True, (255, 255, 255))
            num_pos = (inv_pos[0] + slot.x + 2, inv_pos[1] + slot.y - 3)
            self.displaySurface.blit(num_text, num_pos)
        
        # Draw hover text
        if self.hovered_index >= 0 and self.hovered_index < len(self.inventory_order):
            item_key = self.inventory_order[self.hovered_index]
            item_name = self.item_names.get(item_key, item_key)
            hover_text = self.body_font.render(item_name, True, (255, 255, 255))
            mouse_pos = pygame.mouse.get_pos()
            self.displaySurface.blit(hover_text, (mouse_pos[0] + 10, mouse_pos[1] - 30))
        
        # Draw eat prompt
        if self.eat_prompt_item:
            # Position aligned with inventory, 6px above
            inv_pos = self.getInventoryPosition()
            prompt_x = inv_pos[0]
            prompt_y = inv_pos[1] - self.prompt_outline.get_height() - 6
            
            # Draw prompt outline
            self.displaySurface.blit(self.prompt_outline, (prompt_x, prompt_y))
            
            # Draw "Eat?" text (scaled positioning)
            eat_text = self.body_font.render("Eat?", True, (255, 255, 255))
            eat_rect = eat_text.get_rect(center=(prompt_x + 70, prompt_y + 30))
            self.displaySurface.blit(eat_text, eat_rect)
            
            # Draw Yes button
            yes_text = self.body_font.render("Yes", True, (100, 255, 100))
            yes_rect = yes_text.get_rect(center=(prompt_x + 45, prompt_y + 70))
            self.displaySurface.blit(yes_text, yes_rect)
            
            # Draw No button
            no_text = self.body_font.render("No", True, (255, 100, 100))
            no_rect = no_text.get_rect(center=(prompt_x + 95, prompt_y + 70))
            self.displaySurface.blit(no_text, no_rect)
        
        # Draw save prompt (disabled)
        if False and self.save_prompt:
            # Convert world position to screen position
            if camera_offset:
                player_screen_pos = (self.player.rect.centerx - camera_offset.x, self.player.rect.centery - camera_offset.y)
            else:
                player_screen_pos = (self.player.rect.centerx, self.player.rect.centery)
            
            prompt_lines = ["Save?", "Yes", "No"]
            y_offset = -40
            for line in prompt_lines:
                text = self.body_font.render(line, True, (255, 255, 255))
                text_rect = text.get_rect(center=(player_screen_pos[0], player_screen_pos[1] + y_offset))
                
                # Draw background
                bg_rect = text_rect.inflate(20, 10)
                bg_surf = pygame.Surface(bg_rect.size)
                bg_surf.fill((0, 0, 0))
                bg_surf.set_alpha(200)
                self.displaySurface.blit(bg_surf, bg_rect)
                
                self.displaySurface.blit(text, text_rect)
                y_offset += 30
        
        # Draw item info prompt
        if self.info_item:
            screen_center = self.displaySurface.get_rect().center
            
            # Get item name
            item_name = self.item_names.get(self.info_item, self.info_item)
            
            # Placeholder info text (to be filled in later)
            info_text = f"{item_name}\n\nInformation coming soon..."
            
            # Draw background
            bg_width = 400
            bg_height = 300
            bg_rect = pygame.Rect(screen_center[0] - bg_width//2, screen_center[1] - bg_height//2, bg_width, bg_height)
            bg_surf = pygame.Surface((bg_width, bg_height))
            bg_surf.fill((40, 40, 40))
            bg_surf.set_alpha(240)
            self.displaySurface.blit(bg_surf, bg_rect)
            
            # Draw border
            pygame.draw.rect(self.displaySurface, (200, 200, 200), bg_rect, 3)
            
            # Draw text
            y_offset = bg_rect.top + 20
            for line in info_text.split('\n'):
                if line.strip():
                    text = self.body_font.render(line.strip(), True, (255, 255, 255))
                    text_rect = text.get_rect(center=(screen_center[0], y_offset))
                    self.displaySurface.blit(text, text_rect)
                y_offset += 35
            
            # Draw close instruction
            close_text = self.body_font.render("Click anywhere to close", True, (150, 150, 150))
            close_rect = close_text.get_rect(center=(screen_center[0], bg_rect.bottom - 30))
            self.displaySurface.blit(close_text, close_rect)
        
        # Draw message below inventory slots
        if self.current_message:
            inv_pos = self.getInventoryPosition()
            # Position 42px below bottom row of slots, then lower by 24px
            bottom_row_y = inv_pos[1] + self.slot_start[1] + self.slot_size + self.slot_spacing
            msg_y = bottom_row_y + 42 + 24
            msg_x = inv_pos[0] + 10
            
            text = self.message_font.render(self.current_message, True, (255, 255, 255))
            self.displaySurface.blit(text, (msg_x, msg_y))
        
        # Draw announcement prompt (centered with animation)
        if self.announcement:
            screen_center = self.displaySurface.get_rect().center
            book_pos = self.getBookPosition()
            book_center = (book_pos[0] + self.progress_book.get_width() // 2, 
                          book_pos[1] + self.progress_book.get_height() // 2)
            
            # Interpolate position during minimization
            if self.announcement_minimizing:
                t = self.announcement_scale
                current_x = screen_center[0] * t + book_center[0] * (1 - t)
                current_y = screen_center[1] * t + book_center[1] * (1 - t)
            else:
                current_x = screen_center[0]
                current_y = screen_center[1]
            
            # Scale prompt
            scaled_width = int(self.prompt_outline.get_width() * self.announcement_scale)
            scaled_height = int(self.prompt_outline.get_height() * self.announcement_scale)
            
            if scaled_width > 0 and scaled_height > 0:
                scaled_prompt = pygame.transform.scale(self.prompt_outline, (scaled_width, scaled_height))
                prompt_x = current_x - scaled_width // 2
                prompt_y = current_y - scaled_height // 2
                
                self.displaySurface.blit(scaled_prompt, (prompt_x, prompt_y))
                
                # Draw text only if not too small
                if self.announcement_scale > 0.3:
                    header_text = self.header_font.render(self.announcement[0], True, (255, 255, 255))
                    header_rect = header_text.get_rect(center=(current_x, prompt_y + 40 * self.announcement_scale))
                    self.displaySurface.blit(header_text, header_rect)
                    
                    body_text = self.body_font.render(self.announcement[1], True, (255, 255, 255))
                    body_rect = body_text.get_rect(center=(current_x, prompt_y + 80 * self.announcement_scale))
                    self.displaySurface.blit(body_text, body_rect)
        
        # Draw progress book icon
        book_pos = self.getBookPosition()
        self.displaySurface.blit(self.progress_book, book_pos)
        
        # Draw emote icon
        emote_pos = self.getEmoteIconPosition()
        self.displaySurface.blit(self.emote_icon, emote_pos)
        
        # Draw emote menu
        if self.emote_menu_open:
            emote_pos = self.getEmoteIconPosition()
            screen_width = self.displaySurface.get_width()
            screen_height = self.displaySurface.get_height()
            
            # Position menu within screen bounds
            menu_x = emote_pos[0]
            menu_y = emote_pos[1] + self.emote_icon.get_height() + 5
            
            # Adjust if menu goes off right edge
            if menu_x + self.emote_sheet.get_width() > screen_width:
                menu_x = screen_width - self.emote_sheet.get_width()
            
            # Adjust if menu goes off bottom edge
            if menu_y + self.emote_sheet.get_height() > screen_height:
                menu_y = emote_pos[1] - self.emote_sheet.get_height() - 5
            
            self.displaySurface.blit(self.emote_sheet, (menu_x, menu_y))
        
        # Draw open book
        if self.book_open:
            screen_center = self.displaySurface.get_rect().center
            book_bg = pygame.Surface((400, 300))
            book_bg.fill((222, 184, 135))
            book_bg.set_alpha(240)
            book_x = screen_center[0] - 200
            book_y = screen_center[1] - 150
            self.displaySurface.blit(book_bg, (book_x, book_y))
            
            # Draw border
            pygame.draw.rect(self.displaySurface, (139, 69, 19), (book_x, book_y, 400, 300), 3)
            
            # Draw title
            title_text = self.progress_title_font.render("Progress Report", True, (0, 0, 0))
            title_text_bold = self.progress_title_font.render("Progress Report", True, (0, 0, 0))
            title_rect = title_text.get_rect(center=(screen_center[0], book_y + 30))
            self.displaySurface.blit(title_text, title_rect)
            self.displaySurface.blit(title_text_bold, (title_rect.x + 1, title_rect.y))
            
            # Draw items grid
            items_list = ['hoe', 'axe', 'water', 'hand', 'corn', 'tomato', 'wood', 'apple']
            for i, item_key in enumerate(items_list):
                row = i // 4
                col = i % 4
                item_x = book_x + 50 + col * 80
                item_y = book_y + 80 + row * 80
                
                if item_key in self.itemSurfaces:
                    item_surf = self.itemSurfaces[item_key]
                    scaled_surf = pygame.transform.scale(item_surf, (60, 60))
                    
                    # Gray out if locked
                    if not self.unlocked_items.get(item_key, False):
                        gray_surf = scaled_surf.copy()
                        gray_surf.fill((100, 100, 100), special_flags=pygame.BLEND_RGB_MULT)
                        self.displaySurface.blit(gray_surf, (item_x, item_y))
                    else:
                        self.displaySurface.blit(scaled_surf, (item_x, item_y))
                    
                    # Draw item name
                    name_text = self.body_font.render(self.item_names.get(item_key, item_key), True, (0, 0, 0))
                    name_rect = name_text.get_rect(center=(item_x + 30, item_y + 70))
                    # Scale down text if needed
                    if name_rect.width > 70:
                        small_font = pygame.font.Font('./body_font.ttf', 18) if hasattr(self, 'body_font') else pygame.font.SysFont(None, 18)
                        name_text = small_font.render(self.item_names.get(item_key, item_key), True, (0, 0, 0))
                        name_rect = name_text.get_rect(center=(item_x + 30, item_y + 70))
                    self.displaySurface.blit(name_text, name_rect)
            
            # Close instruction
            close_text = self.body_font.render("Click to close", True, (0, 0, 0))
            close_rect = close_text.get_rect(center=(screen_center[0], book_y + 280))
            self.displaySurface.blit(close_text, close_rect)
        
        # Draw victory screen
        if self.victory_active:
            # Gray overlay
            overlay = pygame.Surface(self.displaySurface.get_size())
            overlay.set_alpha(180)
            overlay.fill((50, 50, 50))
            self.displaySurface.blit(overlay, (0, 0))
            
            # Draw animated victory frames
            if self.victory_slide_y is not None:
                screen_center = self.displaySurface.get_rect().center
                frame = self.victory_frames[self.victory_animation_frame]
                frame_x = screen_center[0] - frame.get_width() // 2
                self.displaySurface.blit(frame, (frame_x, self.victory_slide_y))
                
                # Draw stats below animation
                target_y = screen_center[1] - frame.get_height()
                if self.victory_slide_y >= target_y and self.victory_stats_slide_y is not None:
                    stats_y = self.victory_stats_slide_y
                    
                    # Draw stats centered, stacked vertically
                    stats_lines = [
                        "Player 1 wins!",
                        f"Score: {getattr(self, 'score', 0)}",
                        f"Exp: {self.player.experience}",
                        f"Gold: {self.player.gold}"
                    ]
                    
                    line_height = 35
                    for i, line in enumerate(stats_lines):
                        text = self.body_font.render(line, True, (255, 255, 255))
                        text_rect = text.get_rect(center=(screen_center[0], stats_y + i * line_height))
                        self.displaySurface.blit(text, text_rect)
        
        # Draw merchant menu
        if self.merchant_open:
            # Position menu to the right of player sprite
            if camera_offset:
                player_screen_x = self.player.rect.centerx - camera_offset.x
                player_screen_y = self.player.rect.centery - camera_offset.y
            else:
                player_screen_x = self.player.rect.centerx
                player_screen_y = self.player.rect.centery
            
            # Menu positioned to right of player
            menu_x = player_screen_x + 100
            menu_y = player_screen_y - self.prompt_outline.get_height() // 2 - self.stat_template.get_height() // 2
            
            # Draw stat template with "The Merchant" title centered
            self.displaySurface.blit(self.stat_template, (menu_x, menu_y))
            title_text = self.body_font.render("The Merchant", True, (255, 255, 255))
            title_rect = title_text.get_rect(center=(menu_x + self.stat_template.get_width() // 2, menu_y + self.stat_template.get_height() // 2))
            self.displaySurface.blit(title_text, title_rect)
            
            # Draw prompt outline below
            prompt_y = menu_y + self.stat_template.get_height()
            self.displaySurface.blit(self.prompt_outline, (menu_x, prompt_y))
            
            # Define merchant items (item_key, price, is_buy)
            merchant_items = [
                ('wood', 5, False),  # Sell wood for 5 gold
                ('corn_seeds', 5, True),  # Buy corn seeds for 5 gold
                ('tomato_seeds', 8, True)  # Buy tomato seeds for 8 gold
            ]
            
            # Draw items vertically
            item_height = 40
            start_y = prompt_y + 20
            
            for i, (item_key, price, is_buy) in enumerate(merchant_items):
                item_y = start_y + i * item_height
                
                # Draw item icon (left aligned)
                if item_key in self.itemSurfaces:
                    item_surf = self.itemSurfaces[item_key]
                    scaled_surf = pygame.transform.scale(item_surf, (30, 30))
                    self.displaySurface.blit(scaled_surf, (menu_x + 15, item_y))
                
                # Draw buy/sell indicator
                action_text = self.body_font.render("Buy" if is_buy else "Sell", True, (100, 255, 100) if is_buy else (255, 215, 0))
                self.displaySurface.blit(action_text, (menu_x + 50, item_y + 5))
                
                # Draw price and coin icon (right aligned)
                price_text = self.body_font.render(str(price), True, (255, 255, 255))
                coin_x = menu_x + self.prompt_outline.get_width() - 35
                price_x = coin_x - price_text.get_width() - 5
                self.displaySurface.blit(price_text, (price_x, item_y + 5))
                self.displaySurface.blit(self.coin_icon_small, (coin_x, item_y + 10))
