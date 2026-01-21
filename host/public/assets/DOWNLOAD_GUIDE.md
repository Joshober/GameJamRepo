# Asset Download Guide

This guide will help you download and set up 3D assets for the Mario Party board game.

## Quick Start

Run the download script:
```powershell
cd host/public/assets
.\download-assets.ps1
```

If automatic downloads fail, follow the manual instructions below.

## Manual Download Instructions

### Step 1: Download from Kenney.nl (Recommended)

1. **Visit**: https://kenney.nl/assets
2. **Download these packs**:
   - **Board Game Kit** - Contains dice, game pieces, tokens
   - **3D Game Kit** - Environmental elements and props
   - **3D Characters** (if available) - Character models

3. **Extract the ZIP files** to a temporary folder

### Step 2: Convert to GLTF/GLB Format

Most Kenney.nl assets come in FBX or OBJ format. Convert them using Blender:

1. **Download Blender** (free): https://www.blender.org/download/
2. **Open Blender**
3. **Import model**: File → Import → FBX (or OBJ)
4. **Select the model file** from the extracted Kenney.nl pack
5. **Export as GLTF**:
   - File → Export → glTF 2.0
   - Choose "glTF Binary (.glb)" format
   - Click "Export glTF 2.0"

### Step 3: Organize Files

Place the converted files in these directories:

```
host/public/assets/
├── models/
│   ├── board/
│   │   └── board_base.glb          # Main board model
│   ├── characters/
│   │   ├── character_1.glb        # Player 1 character
│   │   ├── character_2.glb        # Player 2 character
│   │   ├── character_3.glb        # Player 3 character
│   │   └── character_4.glb        # Player 4 character
│   └── dice/
│       └── dice.glb                # 3D dice model
└── textures/
    ├── board_wood.jpg              # Board surface texture
    ├── space_normal.jpg            # Normal space texture
    └── space_bonus.jpg             # Bonus space texture
```

### Step 4: Download Textures from Poly Haven

1. **Visit**: https://polyhaven.com/textures
2. **Search for**:
   - "wood" - For board surface
   - "tile" - For space textures
   - "metal" or "plastic" - For materials
3. **Download** in JPG format (1K or 2K resolution is fine)
4. **Place** in `host/public/assets/textures/`

### Alternative Sources

If Kenney.nl doesn't have what you need:

1. **Sketchfab** (https://sketchfab.com)
   - Search: "board game piece", "dice", "game character"
   - Filter: Downloadable + CC0 License
   - Download in GLTF format

2. **OpenGameArt.org**
   - Search for 3D models
   - Check individual licenses (many are CC0)

3. **pmndrs/market** (https://github.com/pmndrs/market)
   - Clone the repository
   - Browse for suitable models
   - Copy GLTF files to asset directories

## File Naming

Make sure files are named exactly as expected:
- `character_1.glb` through `character_4.glb` (not `character1.glb`)
- `dice.glb` (not `dice_model.glb`)
- `board_wood.jpg` (case-sensitive)

## Testing Assets

After placing assets:

1. Restart the Docker containers: `docker compose restart`
2. Open http://localhost:8080/board.html
3. Check browser console (F12) for loading messages
4. Assets should load automatically if files are in the correct locations

## Fallback System

**The game works perfectly without external assets!**

If assets aren't available, the game uses enhanced procedural 3D models:
- Improved player pieces (not just simple cones)
- Textured board surface
- Enhanced space markers
- All fully functional and visually appealing

## Troubleshooting

**Assets not loading?**
- Check file paths match exactly (case-sensitive)
- Verify files are GLTF/GLB format (not FBX/OBJ)
- Check browser console for errors
- Ensure server is running and serving static files

**Conversion issues?**
- Make sure Blender version supports glTF 2.0 export
- Try exporting as "glTF Separate" if binary doesn't work
- Check that textures are embedded or included separately

## Recommended Asset List

**Minimum (for best visuals):**
1. 4 character models (one per player)
2. 1 dice model
3. 1 board texture (wood)

**Full set (for maximum polish):**
1. Board base model
2. Space marker models
3. 4 character models
4. Dice model
5. Board wood texture
6. Space textures (normal, bonus, star)
7. Material textures (optional)

All assets should be CC0 (public domain) for commercial use.
