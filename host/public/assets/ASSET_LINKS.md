# Direct Links to Download Assets

## 🎲 Board Game Assets (Kenney.nl)

### Board Game Kit
**Direct Link:** https://kenney.nl/assets/board-game-kit
- Contains: Dice, game pieces, tokens, board elements
- Format: FBX/OBJ (needs conversion to GLTF/GLB)
- License: CC0 (Public Domain)

### 3D Game Kit
**Direct Link:** https://kenney.nl/assets/3d-game-kit
- Contains: Environmental elements, props, decorative items
- Format: FBX/OBJ (needs conversion to GLTF/GLB)
- License: CC0 (Public Domain)

### 3D Characters
**Direct Link:** https://kenney.nl/assets/3d-characters
- Contains: Simple character models for player pieces
- Format: FBX/OBJ (needs conversion to GLTF/GLB)
- License: CC0 (Public Domain)
- Note: If not available, try "3D Game Kit" which may include characters

### UI Pack
**Direct Link:** https://kenney.nl/assets/ui-pack
- Contains: Buttons, panels, icons (optional, for UI elements)
- Format: PNG/SVG
- License: CC0 (Public Domain)

## 🎨 Textures (Poly Haven)

### Wood Textures (for board surface)
**Direct Link:** https://polyhaven.com/textures?q=wood
- Search for: "wood", "wooden", "board"
- Recommended: Seamless wood textures
- Format: JPG/PNG
- License: CC0 (Public Domain)
- Resolution: 1K or 2K is sufficient

### Tile Textures (for spaces)
**Direct Link:** https://polyhaven.com/textures?q=tile
- Search for: "tile", "floor", "stone"
- Format: JPG/PNG
- License: CC0 (Public Domain)

### Material Textures
**Direct Link:** https://polyhaven.com/textures
- Browse categories: Metal, Plastic, Fabric
- Format: JPG/PNG
- License: CC0 (Public Domain)

## 🎲 Dice Models

### Free3D.com ⭐ BEST SOURCE
**Direct Link:** https://free3d.com/3d-models/dice
- Large collection of free dice models
- Formats: OBJ, FBX, GLTF, GLB
- License: Varies (check individual models - many are free for commercial use)
- **Note**: Requires manual download (has bot protection)
- **Tip**: Filter by "Free" and "GLB" format for easiest integration

### Filer.dev
**Direct Link:** https://www.filer.dev/3d-models/1?search=dice
- Multiple free dice models in GLB format
- Direct download links (when blob storage is active)
- License: CC0/Free Standard

## 🎭 Character Models (Alternative Sources)

### Sketchfab (CC0 Filter)
**Direct Link:** https://sketchfab.com/3d-models?features=downloadable&sort_by=-likeCount&q=game+character&licenses=322449d3fa8e41f5a69c8716fba3169c
- Search: "game character", "board game piece", "player character"
- Filter: Downloadable + CC0 License
- Format: GLTF/GLB (preferred) or OBJ
- License: CC0 (Public Domain)

### OpenGameArt.org
**Direct Link:** https://opengameart.org/art-search-advanced?keys=&field_art_type_tid%5B%5D=9&sort=count
- Search: "3D character", "game piece", "player model"
- Check individual licenses (many are CC0)
- Format: Various (may need conversion)

### pmndrs/market (GitHub)
**Direct Link:** https://github.com/pmndrs/market
- Clone repository: `git clone https://github.com/pmndrs/market.git`
- Browse: `/public/models/` directory
- Format: GLTF/GLB (ready to use)
- License: CC0 (Public Domain)

## 🎲 Dice Models

### Kenney.nl Board Game Kit
**Direct Link:** https://kenney.nl/assets/board-game-kit
- Contains dice models
- Format: FBX/OBJ (needs conversion)

### Sketchfab (CC0 Dice)
**Direct Link:** https://sketchfab.com/3d-models?features=downloadable&sort_by=-likeCount&q=dice&licenses=322449d3fa8e41f5a69c8716fba3169c
- Search: "dice", "game dice", "6 sided dice"
- Filter: Downloadable + CC0 License
- Format: GLTF/GLB preferred

## 🖼️ HDRI Lighting (Optional)

### Poly Haven HDRIs
**Direct Link:** https://polyhaven.com/hdris
- For realistic environment lighting
- Format: HDR/EXR
- License: CC0 (Public Domain)
- Recommended: Bright, outdoor scenes

## 🔧 Conversion Tools

### Blender (Free)
**Direct Link:** https://www.blender.org/download/
- Use to convert FBX/OBJ to GLTF/GLB
- Free and open source
- Tutorial: File → Import → FBX/OBJ, then File → Export → glTF 2.0

### Online GLTF Converter
**Direct Link:** https://products.aspose.app/3d/conversion
- Alternative: Online converter (no installation needed)
- Upload FBX/OBJ, download GLTF/GLB

## 📦 Quick Download Checklist

### Essential Assets:
1. ✅ **Board Game Kit** - https://kenney.nl/assets/board-game-kit
2. ✅ **3D Game Kit** - https://kenney.nl/assets/3d-game-kit
3. ✅ **Wood Texture** - https://polyhaven.com/textures?q=wood

### Optional (for better visuals):
4. ⭐ **3D Characters** - https://kenney.nl/assets/3d-characters (or Sketchfab)
5. ⭐ **Dice Model** - Included in Board Game Kit
6. ⭐ **Additional Textures** - https://polyhaven.com/textures

## 📝 File Organization After Download

After downloading and converting, place files here:

```
host/public/assets/
├── models/
│   ├── board/
│   │   └── board_base.glb          ← From Board Game Kit
│   ├── characters/
│   │   ├── character_1.glb        ← From 3D Characters or Sketchfab
│   │   ├── character_2.glb
│   │   ├── character_3.glb
│   │   └── character_4.glb
│   └── dice/
│       └── dice.glb                ← From Board Game Kit
└── textures/
    ├── board_wood.jpg              ← From Poly Haven
    ├── space_normal.jpg
    └── space_bonus.jpg
```

## 🚀 Quick Start

1. **Download Board Game Kit** from Kenney.nl
2. **Extract ZIP file**
3. **Open Blender** → Import FBX/OBJ files
4. **Export as GLTF Binary (.glb)**
5. **Place in appropriate folder** (see structure above)
6. **Restart Docker**: `docker compose restart`
7. **Open game**: http://localhost:8080/board.html

The game will automatically detect and use the assets!
