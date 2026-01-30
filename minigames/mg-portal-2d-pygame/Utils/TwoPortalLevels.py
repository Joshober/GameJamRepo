"""
Two-Portal Level Design System
Levels designed specifically around using exactly 2 portals strategically
"""
import pygame
from Utils.Platform import Platform
from Utils.ButtonObject import ButtonObject
from Utils.ExitDoor import ExitDoor
from Utils.GameScale import PLATFORM_THICKNESS

class TwoPortalLevels:
    """Level designs optimized for 2-portal gameplay"""
    
    @staticmethod
    def create_level_1():
        """
        Level 1: "The Bridge" - Two portals create a bridge across a gap
        Portal 1: Floor portal on starting side
        Portal 2: Floor portal on exit side
        Strategy: Place portals on floor, walk through to cross gap
        """
        platforms = []
        width = 1280
        height = 720
        wall_thickness = PLATFORM_THICKNESS
        platform_height = PLATFORM_THICKNESS
        
        # Outer boundaries (all portal-able)
        platforms.append(Platform(0, height - wall_thickness, width, wall_thickness, True, 0))  # Floor
        platforms.append(Platform(0, 0, wall_thickness, height, True, 0))  # Left wall
        platforms.append(Platform(width - wall_thickness, 0, wall_thickness, height, True, 0))  # Right wall
        platforms.append(Platform(0, 0, width, wall_thickness, True, 0))  # Ceiling
        
        # === STARTING AREA ===
        start_platform = Platform(60, height - 120, 250, platform_height, True, 0)
        platforms.append(start_platform)
        
        # === LARGE GAP (Requires portal bridge) ===
        gap_start = 350
        gap_end = 850
        
        # === EXIT AREA ===
        exit_platform = Platform(900, height - 120, 300, platform_height, True, 0)
        platforms.append(exit_platform)
        door = ExitDoor(1050, height - 170)
        
        # Portal walls for strategic placement
        platforms.append(Platform(300, height - 300, wall_thickness, 180, True, 0))  # Left wall portal spot
        platforms.append(Platform(950, height - 300, wall_thickness, 180, True, 0))  # Right wall portal spot
        
        return {
            'platforms': platforms,
            'button': None,
            'door': door,
            'start_positions': [
                (120, height - 170),
                (180, height - 170),
                (240, height - 170),
                (300, height - 170),
            ],
            'cube_position': (350, height - 130),
            'background_color': (25, 25, 40)
        }
    
    @staticmethod
    def create_level_2():
        """
        Level 2: "The Elevator" - Vertical portal chain to reach high exit
        Portal 1: Floor portal (entry)
        Portal 2: Ceiling portal above exit (exit)
        Strategy: Fall through floor portal, exit from ceiling above goal
        """
        platforms = []
        width = 1280
        height = 720
        wall_thickness = PLATFORM_THICKNESS
        platform_height = PLATFORM_THICKNESS
        
        # Outer boundaries
        platforms.append(Platform(0, height - wall_thickness, width, wall_thickness, True, 0))
        platforms.append(Platform(0, 0, wall_thickness, height, True, 0))
        platforms.append(Platform(width - wall_thickness, 0, wall_thickness, height, True, 0))
        platforms.append(Platform(0, 0, width, wall_thickness, True, 0))
        
        # === STARTING AREA (Ground level) ===
        start_platform = Platform(60, height - 120, 300, platform_height, True, 0)
        platforms.append(start_platform)
        
        # === MIDDLE PLATFORM (Blocks direct path) ===
        platforms.append(Platform(500, height - 280, 200, platform_height, False, 0))  # Non-portal-able blocker
        
        # === HIGH EXIT AREA ===
        exit_platform = Platform(800, height - 450, 300, platform_height, True, 0)
        platforms.append(exit_platform)
        door = ExitDoor(950, height - 500)
        
        # Portal walls for vertical travel
        platforms.append(Platform(400, height - 120, wall_thickness, 200, True, 0))  # Entry portal wall
        platforms.append(Platform(700, height - 500, wall_thickness, 100, True, 0))  # Exit portal wall (high)
        
        # Button puzzle
        button_platform = Platform(600, height - 200, 150, platform_height, True, 0)
        platforms.append(button_platform)
        button = ButtonObject(670, height - 220, 0)
        
        return {
            'platforms': platforms,
            'button': button,
            'door': door,
            'start_positions': [
                (120, height - 170),
                (180, height - 170),
                (240, height - 170),
                (300, height - 170),
            ],
            'cube_position': (350, height - 130),
            'background_color': (30, 30, 45)
        }
    
    @staticmethod
    def create_level_3():
        """
        Level 3: "The Loop" - Portal loop to build momentum
        Portal 1: Floor portal (entry)
        Portal 2: Wall portal (horizontal exit)
        Strategy: Fall through floor, exit horizontally with momentum to cross gap
        """
        platforms = []
        width = 1280
        height = 720
        wall_thickness = PLATFORM_THICKNESS
        platform_height = PLATFORM_THICKNESS
        
        # Outer boundaries
        platforms.append(Platform(0, height - wall_thickness, width, wall_thickness, True, 0))
        platforms.append(Platform(0, 0, wall_thickness, height, True, 0))
        platforms.append(Platform(width - wall_thickness, 0, wall_thickness, height, True, 0))
        platforms.append(Platform(0, 0, width, wall_thickness, True, 0))
        
        # === STARTING AREA (High platform) ===
        start_platform = Platform(60, height - 400, 250, platform_height, True, 0)
        platforms.append(start_platform)
        
        # === PORTAL SETUP FOR MOMENTUM ===
        # Floor portal target (below start)
        platforms.append(Platform(200, height - 120, 100, platform_height, True, 0))
        
        # Wall portal target (horizontal exit)
        platforms.append(Platform(400, height - 400, wall_thickness, 200, True, 0))
        
        # === LARGE GAP (Requires momentum) ===
        gap_size = 500
        
        # === EXIT AREA (Far right) ===
        exit_platform = Platform(900, height - 120, 300, platform_height, True, 0)
        platforms.append(exit_platform)
        door = ExitDoor(1050, height - 170)
        
        return {
            'platforms': platforms,
            'button': None,
            'door': door,
            'start_positions': [
                (120, height - 450),
                (180, height - 450),
                (240, height - 450),
                (300, height - 450),
            ],
            'cube_position': (350, height - 130),
            'background_color': (25, 30, 45)
        }
    
    @staticmethod
    def create_level_4():
        """
        Level 4: "The Maze" - Complex navigation requiring strategic portal placement
        Portal 1: Entry portal (player choice)
        Portal 2: Exit portal (player choice)
        Strategy: Multiple paths, choose optimal portal locations
        """
        platforms = []
        width = 1280
        height = 720
        wall_thickness = PLATFORM_THICKNESS
        platform_height = PLATFORM_THICKNESS
        
        # Outer boundaries
        platforms.append(Platform(0, height - wall_thickness, width, wall_thickness, True, 0))
        platforms.append(Platform(0, 0, wall_thickness, height, True, 0))
        platforms.append(Platform(width - wall_thickness, 0, wall_thickness, height, True, 0))
        platforms.append(Platform(0, 0, width, wall_thickness, True, 0))
        
        # === STARTING AREA ===
        start_platform = Platform(60, height - 120, 200, platform_height, True, 0)
        platforms.append(start_platform)
        
        # === MAZE SECTION 1: Lower level ===
        platforms.append(Platform(300, height - 120, 150, platform_height, True, 0))
        platforms.append(Platform(500, height - 120, 150, platform_height, True, 0))
        
        # Vertical walls (portal-able)
        platforms.append(Platform(450, height - 120, wall_thickness, 200, True, 0))
        platforms.append(Platform(650, height - 120, wall_thickness, 200, True, 0))
        
        # === MAZE SECTION 2: Middle level ===
        platforms.append(Platform(300, height - 320, 150, platform_height, True, 0))
        platforms.append(Platform(500, height - 320, 150, platform_height, True, 0))
        platforms.append(Platform(700, height - 320, 150, platform_height, True, 0))
        
        # Portal walls
        platforms.append(Platform(450, height - 320, wall_thickness, 200, True, 0))
        platforms.append(Platform(650, height - 320, wall_thickness, 200, True, 0))
        platforms.append(Platform(850, height - 320, wall_thickness, 200, True, 0))
        
        # === MAZE SECTION 3: Upper level ===
        platforms.append(Platform(500, height - 520, 200, platform_height, True, 0))
        platforms.append(Platform(700, height - 520, 200, platform_height, True, 0))
        
        # Portal walls
        platforms.append(Platform(650, height - 520, wall_thickness, 200, True, 0))
        
        # === BUTTON PUZZLE ===
        button_platform = Platform(900, height - 320, 150, platform_height, True, 0)
        platforms.append(button_platform)
        button = ButtonObject(970, height - 340, 0)
        
        # === EXIT AREA (Upper right) ===
        exit_platform = Platform(width - 300, height - 520, 250, platform_height, True, 0)
        platforms.append(exit_platform)
        door = ExitDoor(width - 150, height - 570)
        
        # Portal wall near exit
        platforms.append(Platform(width - 550, height - 520, wall_thickness, 200, True, 0))
        
        return {
            'platforms': platforms,
            'button': button,
            'door': door,
            'start_positions': [
                (120, height - 170),
                (180, height - 170),
                (240, height - 170),
                (300, height - 170),
            ],
            'cube_position': (350, height - 130),
            'background_color': (30, 30, 45)
        }
    
    @staticmethod
    def create_level_5():
        """
        Level 5: "The Challenge" - Ultimate 2-portal test
        Combines all mechanics: gaps, vertical travel, momentum, buttons
        Portal 1: Strategic placement required
        Portal 2: Strategic placement required
        Strategy: Multiple solutions, optimal path requires both portals
        """
        platforms = []
        width = 1280
        height = 720
        wall_thickness = PLATFORM_THICKNESS
        platform_height = PLATFORM_THICKNESS
        
        # Outer boundaries
        platforms.append(Platform(0, height - wall_thickness, width, wall_thickness, True, 0))
        platforms.append(Platform(0, 0, wall_thickness, height, True, 0))
        platforms.append(Platform(width - wall_thickness, 0, wall_thickness, height, True, 0))
        platforms.append(Platform(0, 0, width, wall_thickness, True, 0))
        
        # === STARTING AREA ===
        start_platform = Platform(60, height - 120, 200, platform_height, True, 0)
        platforms.append(start_platform)
        
        # === CHALLENGE 1: Gap with portal wall ===
        platforms.append(Platform(300, height - 120, 150, platform_height, True, 0))
        
        # Large gap
        platforms.append(Platform(500, height - 280, wall_thickness, 160, True, 0))  # Portal wall in gap
        
        platforms.append(Platform(650, height - 120, 150, platform_height, True, 0))
        
        # === CHALLENGE 2: Vertical section ===
        platforms.append(Platform(800, height - 280, 150, platform_height, True, 0))
        platforms.append(Platform(800, height - 450, 150, platform_height, True, 0))
        
        # Portal walls for vertical travel
        platforms.append(Platform(750, height - 280, wall_thickness, 180, True, 0))
        platforms.append(Platform(750, height - 450, wall_thickness, 100, True, 0))
        
        # === CHALLENGE 3: Button puzzle ===
        button_platform = Platform(1000, height - 200, 150, platform_height, True, 0)
        platforms.append(button_platform)
        button = ButtonObject(1070, height - 220, 0)
        
        platforms.append(Platform(1000, height - 380, 150, platform_height, True, 0))
        
        # Portal walls
        platforms.append(Platform(950, height - 380, wall_thickness, 180, True, 0))
        
        # === EXIT AREA (High up) ===
        exit_platform = Platform(width - 250, height - 500, 200, platform_height, True, 0)
        platforms.append(exit_platform)
        door = ExitDoor(width - 120, height - 550)
        
        # Portal wall near exit
        platforms.append(Platform(width - 450, height - 500, wall_thickness, 100, True, 0))
        
        # === STRATEGIC ELEMENTS ===
        platforms.append(Platform(500, height - 450, 100, platform_height, True, 0))  # Small platform
        platforms.append(Platform(300, height - 350, 100, platform_height, True, 0))  # Small platform
        
        return {
            'platforms': platforms,
            'button': button,
            'door': door,
            'start_positions': [
                (120, height - 170),
                (180, height - 170),
                (240, height - 170),
                (300, height - 170),
            ],
            'cube_position': (350, height - 130),
            'background_color': (25, 25, 40)
        }
