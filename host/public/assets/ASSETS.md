# Assets Documentation

This directory contains 3D models, textures, UI elements, and audio assets for the board game.

## Quick Start

**Current Status:**
- ✅ Character models - 4 player pieces (in repo)
- ✅ Dice textures - 24 PNG images (in repo)
- ✅ Board tiles - 72 GLB hexagonal tile models (in repo)
- ⚠️ Dice 3D model - Procedural fallback (works fine)
- ⚠️ Board textures - Optional (procedural works)

## Essential Files

- `assetLoader.js` - Loads 3D models and textures
- `extract-assets.sh` - Extracts assets during Docker build
- `generate-assets.js` - Creates procedural fallback models

## Directory Structure

```
assets/
├── models/
│   ├── archives/            # Asset archives (zip/tar.gz files)
│   │   ├── characters.tar.gz
│   │   ├── board_tiles.zip
│   │   ├── dice_models.zip
│   │   ├── dice_textures.zip
│   │   ├── ui_pack.zip
│   │   └── audio_pack.zip
│   ├── characters/          # Player pieces (extracted from archive)
│   ├── dice/                # Dice models (DAE format, needs conversion)
│   ├── board/               # Board models (✅ 72 GLB tiles)
│   ├── collectibles/        # Optional collectible models
│   ├── props/               # Optional prop models
│   └── nature_pack/         # Optional nature/environment models
├── textures/
│   └── dice/                # Dice face images (✅ 24 PNG files)
├── ui/                      # UI elements and icons (✅ extracted)
├── audio/                   # Sound effects (✅ extracted)
├── hdr/                     # HDRI sky textures
├── materials/               # Material textures
│   └── grass/
└── downloads/               # Temporary staging area (gitignored)
```

## Asset Archives

All assets are stored as compressed archives and automatically extracted during Docker build:

1. **Character Models** ✅
   - File: `models/archives/characters.tar.gz`
   - Contains: 4 GLB character models (Player 1-4)
   - Format: GLB (ready to use)
   - Source: Kenney Blocky Characters
   - Extracted to: `models/characters/`

2. **Board Tiles** ✅
   - File: `models/archives/board_tiles.zip`
   - Contains: 72 GLB hexagonal tile models
   - Format: GLB (ready to use!)
   - Includes: Grass, dirt, stone, water, paths, buildings, units
   - Source: Kenney Hexagon Kit
   - Extracted to: `models/board/`

3. **Dice Models** ⚠️
   - File: `models/archives/dice_models.zip`
   - Contains: 6 DAE dice models (d4, d6, d8, d10, d12, d20)
   - Format: DAE (needs conversion to GLB)
   - Source: OpenGameArt.org
   - Extracted to: `models/dice/`

4. **Dice Textures** ✅
   - File: `models/archives/dice_textures.zip`
   - Contains: 24 PNG dice face images
   - Format: PNG (ready to use as textures)
   - Source: Kenney Board Game Pack
   - Extracted to: `textures/dice/`

5. **UI Pack** ✅
   - File: `models/archives/ui_pack.zip`
   - Contains: UI elements and icons
   - Source: Kenney UI Pack, Game Icons, Board Game Icons
   - Extracted to: `ui/`

6. **Audio Pack** ✅
   - File: `models/archives/audio_pack.zip`
   - Contains: Sound effects (click, dice, move, win)
   - Source: Kenney Digital Audio
   - Extracted to: `audio/`

## How It Works

1. **Assets in Repo**: Assets can be stored as:
   - **Extracted files** (committed directly) - used immediately, no extraction needed
   - **Compressed archives** (in `models/archives/`) - extracted during Docker build if files not already present
2. **Smart Extraction**: `extract-assets.sh` only extracts if files don't already exist
   - If files are already committed to git, they're used directly
   - If only archives exist, they're extracted during build
3. **Procedural Fallback**: Auto-generates models if assets missing
4. **Always Works**: Game is fully functional either way!

**Note**: The extraction script checks if files already exist before extracting, so you can commit either extracted files OR archives (or both for redundancy).

## File Format Details

### GLB vs GLTF
- **`.glb`** (GLTF Binary) - **RECOMMENDED**
  - Single file with embedded textures
  - Faster to load
  - Smaller file size
  - Best for web games

- **`.gltf`** (GLTF JSON)
  - JSON file + separate texture files
  - Easier to edit
  - Also works fine

### Converting Other Formats
If you download models in other formats:

**From OBJ/FBX/DAE/etc. → GLB:**
1. Download Blender (free): https://www.blender.org/
2. Import: File → Import → [Format]
3. Export: File → Export → glTF 2.0
4. Choose "glTF Binary (.glb)"

## Optional Assets (Not Required)

These assets are optional but recommended for enhanced visuals:

### Collectibles
- Coin (poly.pizza): https://poly.pizza/m/7IrL01B97W
- Star Coin (poly.pizza): https://poly.pizza/m/n5nJIQAozN

### Props
- Mushroom (poly.pizza): https://poly.pizza/m/A2rwQyfqYG
- Pipe (poly.pizza, optional): https://poly.pizza/m/f1A1MuUQfC3

### Environment
- Ultimate Stylized Nature Pack (poly.pizza): https://poly.pizza/bundle/Ultimate-Stylized-Nature-Pack-zyIyYd9yGr

### Sky & Materials
- Day Sky HDRI (ambientcg.com): https://ambientcg.com/view?id=DaySkyHDRI001A
- Grass Material (ambientcg.com): https://ambientcg.com/view?id=Grass004

## Asset Sources

All assets use CC0 (Public Domain) licenses - free for commercial use:

- **Kenney.nl** - https://kenney.nl/assets
  - Hexagon Kit, Board Game Pack, UI Pack, Digital Audio, Game Icons
- **OpenGameArt.org** - https://opengameart.org
  - Low Poly Dice models
- **Poly Pizza** - https://poly.pizza
  - Collectibles, props, nature packs
- **AmbientCG** - https://ambientcg.com
  - HDRI skies, materials

## Next Steps (Optional)

1. **Convert dice models** (DAE → GLB):
   - Use Blender to convert the 6 DAE files to GLB
   - Or download Kytric's Voxel Pack (has GLTF dice ready to use)

2. **Download optional assets**:
   - See URLs above for collectibles, props, and environment packs
   - Place in appropriate directories after extraction

## Status Summary

| Asset Type | Status | File Format | Location |
|------------|--------|-------------|----------|
| Character Models | ✅ Have | `.glb` | `models/characters/` |
| Board Tiles | ✅ Have | `.glb` | `models/board/` |
| Dice Textures | ✅ Have | `.png` | `textures/dice/` |
| Dice 3D Model | ⚠️ Procedural | `.glb` (optional) | `models/dice/` |
| UI Elements | ✅ Have | `.png`, `.svg` | `ui/` |
| Audio | ✅ Have | `.ogg` | `audio/` |

**Bottom Line**: Core assets are complete! The game works perfectly. Adding optional assets would enhance visuals. 🎉
