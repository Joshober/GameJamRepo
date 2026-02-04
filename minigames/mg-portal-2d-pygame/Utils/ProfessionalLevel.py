"""
Professional level design system
Creates well-designed, balanced levels based on classic Portal test chamber designs
Room-based architecture with mandatory co-op portal puzzles
Player 1 = Orange portal, Player 2 = Blue portal
"""
import pygame
from Utils.Platform import Platform
from Utils.ButtonObject import ButtonObject
from Utils.ExitDoor import ExitDoor
from Utils.GameScale import PLATFORM_THICKNESS

class LevelDesign:
    """Professional level design with proper flow and challenges"""
    
    @staticmethod
    def create_level_1():
        """
        Level 1: "The Gap" - Co-op portal introduction
        Spawn Room → Co-op Puzzle Room → Exit Room
        
        Co-op Puzzle:
        - Player 1 (left side) can see left portalable wall
        - Player 2 (right side) can see right portalable wall
        - Both portals required to cross gap
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
        
        # === ROOM 1: SPAWN ROOM ===
        # Both players spawn together
        start_platform = Platform(60, height - 120, 280, platform_height, True, 0)
        platforms.append(start_platform)
        
        # Full-height divider wall (blocks progress - can see puzzle but can't enter)
        platforms.append(Platform(400, 0, wall_thickness, height, True, 0))
        
        # === ROOM 2: CO-OP PUZZLE ROOM ===
        # Large gap (180px - too wide to jump, requires both portals)
        
        # Left side floor (Player 1's position)
        platforms.append(Platform(450, height - 120, 180, platform_height, True, 0))
        
        # Right side floor (Player 2's position - separated by gap)
        platforms.append(Platform(680, height - 120, 180, platform_height, True, 0))
        
        # Player 1's portalable wall (left side, visible from left floor)
        platforms.append(Platform(500, height - 300, wall_thickness, 180, True, 0))
        
        # Player 2's portalable wall (right side, visible from right floor)
        platforms.append(Platform(630, height - 300, wall_thickness, 180, True, 0))
        
        # Hard gate: Full-height wall blocking exit until both portals placed
        platforms.append(Platform(900, 0, wall_thickness, height, True, 0))
        
        # === ROOM 3: EXIT ROOM ===
        # Floor platform (only reachable via both portals)
        exit_platform = Platform(950, height - 120, 280, platform_height, True, 0)
        platforms.append(exit_platform)
        door = ExitDoor(1050, height - 170)
        
        return {
            'platforms': platforms,
            'button': None,
            'door': door,
            'start_positions': [
                (120, height - 170),  # Player 1
                (180, height - 170),  # Player 2
                (240, height - 170),  # Player 3
                (300, height - 170),  # Player 4
            ],
            'cube_position': None,  # No cube in level 1
            'background_color': (25, 25, 40)
        }
    
    @staticmethod
    def create_level_2():
        """
        Level 2: "Button and Door" - Co-op cube relay
        Spawn Room → Co-op Puzzle Room → Exit Room
        
        Co-op Puzzle:
        - Player 1 (lower left) can see left portalable wall, cube spawns here
        - Player 2 (upper right) can see right portalable wall, button only reachable by Player 2
        - Cube must be relayed through both portals to reach button
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
        
        # === ROOM 1: SPAWN ROOM ===
        start_platform = Platform(60, height - 120, 280, platform_height, True, 0)
        platforms.append(start_platform)
        
        # Divider wall
        platforms.append(Platform(400, 0, wall_thickness, height, True, 0))
        
        # === ROOM 2: CO-OP PUZZLE ROOM ===
        # Player 1's area (lower left) - cube spawns here
        platforms.append(Platform(450, height - 120, 200, platform_height, True, 0))
        
        # Player 1's portalable wall (left side, visible from lower left)
        platforms.append(Platform(500, height - 280, wall_thickness, 160, True, 0))
        
        # Player 2's area (upper right) - button only reachable from here
        platforms.append(Platform(700, height - 280, 200, platform_height, True, 0))
        
        # Player 2's portalable wall (right side, visible from upper right)
        platforms.append(Platform(650, height - 400, wall_thickness, 120, True, 0))
        
        # Button (only reachable by Player 2 after portals placed)
        button_platform = Platform(750, height - 280, 150, platform_height, True, 0)
        platforms.append(button_platform)
        button = ButtonObject(800, height - 300, 0)
        
        # Hard gate: Wall blocking exit until button pressed
        platforms.append(Platform(950, 0, wall_thickness, height, True, 0))
        
        # === ROOM 3: EXIT ROOM ===
        exit_platform = Platform(1000, height - 120, 240, platform_height, True, 0)
        platforms.append(exit_platform)
        door = ExitDoor(1100, height - 170)
        
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
            'cube_position': (520, height - 140),  # Spawns on Player 1's side
            'background_color': (30, 30, 45)
        }
    
    @staticmethod
    def create_level_3():
        """
        Level 3: "Multi-Level" - Co-op vertical transfer
        Spawn Room → Co-op Puzzle Room → Exit Room
        
        Co-op Puzzle:
        - Player 1 (lower level) can see lower portalable wall
        - Player 2 (upper level) can see upper portalable wall
        - Both portals required for vertical transfer
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
        
        # === ROOM 1: SPAWN ROOM ===
        start_platform = Platform(60, height - 120, 280, platform_height, True, 0)
        platforms.append(start_platform)
        
        # Divider wall
        platforms.append(Platform(400, 0, wall_thickness, height, True, 0))
        
        # === ROOM 2: CO-OP PUZZLE ROOM ===
        # Player 1's area (lower level)
        platforms.append(Platform(450, height - 120, 200, platform_height, True, 0))
        
        # Player 1's portalable wall (lower, visible from lower floor)
        platforms.append(Platform(700, height - 280, wall_thickness, 160, True, 0))
        
        # Player 2's area (upper level - must reach via separate path)
        platforms.append(Platform(450, height - 360, 200, platform_height, True, 0))
        
        # Player 2's portalable wall (upper, visible from upper floor)
        platforms.append(Platform(700, height - 500, wall_thickness, 160, True, 0))
        
        # Hard gate: Wall blocking exit until both portals used
        platforms.append(Platform(950, 0, wall_thickness, height, True, 0))
        
        # === ROOM 3: EXIT ROOM ===
        # Exit on upper level (requires portal chain)
        exit_platform = Platform(1000, height - 360, 240, platform_height, True, 0)
        platforms.append(exit_platform)
        door = ExitDoor(1100, height - 410)
        
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
            'cube_position': None,
            'background_color': (35, 35, 50)
        }
    
    @staticmethod
    def create_level_4():
        """
        Level 4: "The Maze" - Co-op navigation puzzle
        Spawn Room → Co-op Puzzle Room → Exit Room
        
        Co-op Puzzle:
        - Player 1 (left path) can see left portalable wall
        - Player 2 (right path) can see right portalable wall
        - Both must navigate separate paths, then use portals to regroup
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
        
        # === ROOM 1: SPAWN ROOM ===
        start_platform = Platform(60, height - 120, 280, platform_height, True, 0)
        platforms.append(start_platform)
        
        # Divider wall
        platforms.append(Platform(400, 0, wall_thickness, height, True, 0))
        
        # === ROOM 2: CO-OP PUZZLE ROOM ===
        # Player 1's path (left side, lower)
        platforms.append(Platform(450, height - 120, 150, platform_height, True, 0))
        platforms.append(Platform(450, height - 240, 150, platform_height, True, 0))
        
        # Player 1's portalable wall (left, visible from upper left platform)
        platforms.append(Platform(550, height - 240, wall_thickness, 120, True, 0))
        
        # Player 2's path (right side, upper)
        platforms.append(Platform(650, height - 240, 150, platform_height, True, 0))
        platforms.append(Platform(650, height - 360, 150, platform_height, True, 0))
        
        # Player 2's portalable wall (right, visible from upper right platform)
        platforms.append(Platform(750, height - 360, wall_thickness, 120, True, 0))
        
        # Button (requires both players to reach via portals)
        button_platform = Platform(800, height - 240, 150, platform_height, True, 0)
        platforms.append(button_platform)
        button = ButtonObject(850, height - 260, 0)
        
        # Hard gate: Wall blocking exit until button pressed
        platforms.append(Platform(1000, 0, wall_thickness, height, True, 0))
        
        # === ROOM 3: EXIT ROOM ===
        exit_platform = Platform(1050, height - 240, 190, platform_height, True, 0)
        platforms.append(exit_platform)
        door = ExitDoor(1130, height - 290)
        
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
            'cube_position': None,
            'background_color': (30, 30, 45)
        }
    
    @staticmethod
    def create_level_5():
        """
        Level 5: "The Challenge" - Complex co-op puzzle
        Spawn Room → Co-op Puzzle Room → Exit Room
        
        Co-op Puzzle:
        - Player 1 (left, lower) can see left portalable wall, cube spawns here
        - Player 2 (right, upper) can see right portalable wall, button only reachable by Player 2
        - Cube must be relayed through both portals to button
        - Exit requires both players to regroup
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
        
        # === ROOM 1: SPAWN ROOM ===
        start_platform = Platform(60, height - 120, 280, platform_height, True, 0)
        platforms.append(start_platform)
        
        # Divider wall
        platforms.append(Platform(400, 0, wall_thickness, height, True, 0))
        
        # === ROOM 2: CO-OP PUZZLE ROOM ===
        # Player 1's area (lower left) - cube spawns here
        platforms.append(Platform(450, height - 120, 200, platform_height, True, 0))
        
        # Player 1's portalable wall (left, visible from lower left)
        platforms.append(Platform(500, height - 300, wall_thickness, 180, True, 0))
        
        # Intermediate platform (cube transfer point)
        platforms.append(Platform(600, height - 240, 100, platform_height, True, 0))
        
        # Player 2's area (upper right) - button only reachable from here
        platforms.append(Platform(750, height - 320, 200, platform_height, True, 0))
        
        # Player 2's portalable wall (right, visible from upper right)
        platforms.append(Platform(700, height - 480, wall_thickness, 160, True, 0))
        
        # Button (only reachable by Player 2 after portals placed)
        button_platform = Platform(800, height - 320, 150, platform_height, True, 0)
        platforms.append(button_platform)
        button = ButtonObject(850, height - 340, 0)
        
        # Hard gate: Wall blocking exit until button pressed
        platforms.append(Platform(1000, 0, wall_thickness, height, True, 0))
        
        # === ROOM 3: EXIT ROOM ===
        # Exit on upper level (requires regrouping)
        exit_platform = Platform(1050, height - 320, 190, platform_height, True, 0)
        platforms.append(exit_platform)
        door = ExitDoor(1130, height - 370)
        
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
            'cube_position': (520, height - 140),  # Spawns on Player 1's side
            'background_color': (25, 25, 40)
        }
