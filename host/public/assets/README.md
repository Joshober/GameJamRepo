# 3D Assets Directory

This directory contains 3D models and textures for the board game.

## Asset Sources

### Recommended Downloads (CC0/Free):

1. **Kenney.nl Board Game Kit**
   - URL: https://kenney.nl/assets/board-game-kit
   - Contains: Dice, game pieces, tokens, board elements
   - License: CC0 (Public Domain)
   - Format: Download and convert FBX/OBJ to GLTF/GLB

2. **Kenney.nl 3D Game Kit**
   - URL: https://kenney.nl/assets/3d-game-kit
   - Contains: Environmental elements, props
   - License: CC0

3. **Poly Haven Textures**
   - URL: https://polyhaven.com/textures
   - Contains: Wood, tile, material textures
   - License: CC0

4. **Sketchfab (CC0 filter)**
   - Search: "board game piece", "game character", "dice"
   - Filter: Downloadable + CC0 License

## Directory Structure

```
assets/
├── models/
│   ├── board/
│   │   ├── board_base.glb          # Main board model
│   │   └── space_marker.glb        # Space markers
│   ├── characters/
│   │   ├── character_1.glb         # Player 1 character
│   │   ├── character_2.glb         # Player 2 character
│   │   ├── character_3.glb         # Player 3 character
│   │   └── character_4.glb         # Player 4 character
│   └── dice/
│       └── dice.glb                 # 3D dice model
└── textures/
    ├── board_wood.jpg               # Board surface texture
    ├── space_normal.jpg             # Normal space texture
    └── space_bonus.jpg              # Bonus space texture
```

## Conversion Instructions

If assets are in FBX/OBJ format:

1. Download Blender (free): https://www.blender.org/
2. Import the model: File → Import → FBX/OBJ
3. Export as GLTF: File → Export → glTF 2.0
4. Choose "glTF Binary (.glb)" format
5. Place in appropriate directory above

## Fallback System

If assets are not available, the game will use procedural 3D models:
- Board: Simple plane with materials
- Characters: Colored geometric shapes
- Dice: Procedural cube with dots

The game is fully functional without external assets!
