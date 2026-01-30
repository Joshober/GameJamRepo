# Portal-Inspired Level Designs

Based on classic Portal test chamber designs, I've created 5 distinct levels that progressively teach and challenge players with Portal mechanics.

## Level 1: "The Gap"
**Difficulty:** Beginner  
**Mechanics:** Basic portal usage

### Design:
- Simple starting area
- Large gap that cannot be jumped (requires portal)
- Strategic portal wall in the gap
- Straightforward path to exit
- **Purpose:** Teaches players that portals are needed to cross gaps

### Key Features:
- No button puzzle (simplified)
- Clear portal targets
- Single solution path
- Focus on learning portal mechanics

---

## Level 2: "Button and Door"
**Difficulty:** Easy  
**Mechanics:** Button activation, door opening

### Design:
- Starting area on left
- Button puzzle in center-left
- Platform above button (for cube dropping)
- Gap requiring portal
- Exit door on right (opens when button pressed)
- **Purpose:** Introduces button mechanics and door opening

### Key Features:
- Button can be activated by player or cube
- Door blocks exit until button is pressed
- Portal walls for strategic navigation
- Teaches coordination between players

---

## Level 3: "Multi-Level"
**Difficulty:** Medium  
**Mechanics:** Portal chains, vertical navigation

### Design:
- Three distinct vertical levels (bottom, middle, top)
- Multiple platforms on each level
- Portal walls connecting levels
- Exit on top level (requires portal chain)
- **Purpose:** Teaches players to chain portals vertically

### Key Features:
- Multiple floors
- Portal walls at strategic heights
- Requires thinking about portal placement
- Multiple valid paths to exit

---

## Level 4: "The Maze"
**Difficulty:** Medium-Hard  
**Mechanics:** Complex navigation, strategic portal placement

### Design:
- Three-level maze structure
- Multiple platforms on each level
- Vertical walls creating maze-like paths
- Button puzzle integrated into maze
- Exit requires navigating through maze
- **Purpose:** Challenges players with complex navigation

### Key Features:
- Multiple paths through maze
- Strategic portal walls
- Button puzzle adds complexity
- Rewards exploration and planning

---

## Level 5: "The Challenge"
**Difficulty:** Hard  
**Mechanics:** All mechanics combined

### Design:
- Starting area
- Gap challenge with portal wall
- Button puzzle
- Upper section requiring portal chains
- Exit high up (most challenging)
- Small strategic platforms
- **Purpose:** Final challenge combining all learned mechanics

### Key Features:
- Combines gap, button, and multi-level challenges
- Requires advanced portal techniques
- Multiple strategic elements
- Most complex level

---

## Level Design Principles

All levels follow classic Portal design principles:

1. **Progressive Difficulty:** Each level builds on previous mechanics
2. **Clear Objectives:** Players always know what to do
3. **Multiple Solutions:** Some levels allow creative approaches
4. **Strategic Portal Placement:** Portal walls positioned for optimal gameplay
5. **Teaching Through Play:** Mechanics introduced naturally
6. **Visual Clarity:** Clean layouts with clear paths

## How to Switch Levels

In `main.py`, change the level number:
```python
level_data = LevelDesign.create_level_1()  # Level 1
level_data = LevelDesign.create_level_2()  # Level 2
level_data = LevelDesign.create_level_3()  # Level 3
level_data = LevelDesign.create_level_4()  # Level 4
level_data = LevelDesign.create_level_5()  # Level 5
```

## Level Statistics

| Level | Platforms | Portal Walls | Button | Difficulty |
|-------|-----------|--------------|--------|------------|
| 1     | ~8        | 2            | No     | Beginner   |
| 2     | ~10       | 3            | Yes    | Easy       |
| 3     | ~12       | 4            | No     | Medium     |
| 4     | ~18       | 6            | Yes    | Medium-Hard|
| 5     | ~15       | 5            | Yes    | Hard       |

## Design Inspiration

These levels are inspired by:
- Classic Portal test chambers
- 2D Portal games like Mari0
- Portal 2D puzzle platformers
- Portal-style level design principles

Each level teaches specific mechanics while maintaining the clean, minimalist aesthetic of Portal games.
