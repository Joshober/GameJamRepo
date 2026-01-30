# Asset Findings for Portal-Style 2D Platformer

This document contains all discovered free game assets that match the Portal-style 2D platformer aesthetic shown in the reference image.

## General Asset Sources

### 1. **itch.io** (Best for Portal-style assets)
- **URL**: https://itch.io/game-assets/free
- **Search terms**: "portal", "sci-fi", "pixel art character", "2D platformer"
- **What to look for**:
  - Character sprites with multiple color variants
  - Portal gun/weapon sprites
  - Portal effect sprites
  - Platform/tile assets

### 2. **CraftPix.net** (Free game assets)
- **URL**: https://craftpix.net/freebies
- **Search terms**: "2D character", "platformer", "sci-fi"
- **What to look for**:
  - Top-down or side-view character sprites
  - Weapon sprites
  - Environment tiles

### 3. **OpenGameArt.org** (Open source assets)
- **URL**: https://opengameart.org
- **Search terms**: "portal", "character sprite", "pixel art"
- **License**: Check individual licenses (usually CC0 or CC-BY)

### 4. **Kenney.nl** (Free game assets)
- **URL**: https://kenney.nl/assets
- **Search terms**: "characters", "weapons", "platformer"
- **Note**: Very clean, professional assets

## Primary Recommendations

### 1. Free Puzzle Platformer Kit (Portal-Inspired)
**Source:** itch.io - paweljarosz  
**URL:** https://paweljarosz.itch.io/puzzle-platformer-asset-mnimalistic-game-kit-portal-like  
**License:** Free for commercial and non-commercial use (credits appreciated but not required)  
**Format:** 16x16px pixel art tiles  
**Size:** 5.3 kB  
**Description:** Minimalist pixel art asset pack specifically designed as a Portal-inspired puzzle platformer kit. Includes full game kit suitable for prototyping or complete games.  
**Best For:** Core platformer tiles, Portal-style aesthetic, minimalist design  
**Download:** Available on itch.io (name-your-own-price, can be $0)

### 2. 2D Platformer Pack
**Source:** itch.io - Chequered Ink  
**URL:** https://chequered.ink/2d-platformer-pack/  
**License:** Free for commercial use  
**Format:** Up to 120x120px tiles (designed for 1080p)  
**Size:** 945 total assets  
**Description:** Comprehensive platformer pack with:
- 12 tile sets (768 tiles total)
- 24 backgrounds
- 10 enemies with 33 animation frames
- 102 interactive items (coins, switches, gems)
- Player sprite with 17 animation frames
**Best For:** Additional variety, higher resolution assets, backgrounds, interactive elements  
**Download:** Available on itch.io

### 3. 2D Pixel Art Portal Sprites
**Source:** itch.io - Elthen's Pixel Art Shop  
**URL:** https://elthen.itch.io/2d-pixel-art-portal-sprites  
**License:** Free for commercial and non-commercial use  
**Format:** Sprite sheets  
**Description:** Portal sprite sheets with animations (Idle, Emerge, Disappear) in green and purple variants.  
**Best For:** Portal effects, portal gun visuals  
**Download:** Available on itch.io (name-your-own-price)

## Asset Categories Needed

### Broken/Damaged Block Textures
**Status:** Not found as standalone assets  
**Solution:** 
- Use programmatic generation (already implemented in `LevelAssets.py`)
- Or extract from the 2D Platformer Pack tilesets
- Or create custom textures based on the programmatic version

**Current Implementation:**
- File: `Utils/LevelAssets.py`
- Function: `create_broken_block_surface()`
- Color: Dark brown-red (#502832 / RGB: 80, 50, 40)
- Features: Grid pattern, white outlines, random dark spots

### Mechanical Bridge Assets
**Status:** Not found as standalone assets  
**Solution:**
- Use programmatic generation (already implemented in `LevelAssets.py`)
- Or create custom sprites based on the programmatic version
- Or extract platform segments from asset packs and add piston graphics

**Current Implementation:**
- File: `Utils/LevelAssets.py`
- Function: `create_mechanical_bridge_surface()`
- Features: Grey platform with piston arms underneath

### Glass Tube/Container
**Status:** Not found as standalone assets  
**Solution:**
- Use programmatic generation (already implemented in `LevelAssets.py`)
- Or create custom sprite based on the programmatic version

**Current Implementation:**
- File: `Utils/LevelAssets.py`
- Function: `create_glass_tube_surface()`
- Features: Transparent tube with blue liquid, grey base and cap

### Platform Textures
**Status:** Available in asset packs  
**Sources:**
1. Free Puzzle Platformer Kit - 16x16px grey platform tiles
2. 2D Platformer Pack - Multiple tileset options with grey industrial textures

**Recommendation:** Use tiles from Free Puzzle Platformer Kit for core Portal aesthetic, supplement with 2D Platformer Pack for variety

### Checkered Flag/Arrow
**Status:** Already implemented programmatically  
**Current Implementation:**
- File: `Utils/LevelAssets.py`
- Function: `create_checkered_flag_surface()`
- **Action:** No change needed, programmatic version works well

### Background Elements
**Status:** Available in 2D Platformer Pack  
**Source:** 2D Platformer Pack includes 24 backgrounds  
**Recommendation:** Use backgrounds from 2D Platformer Pack, or create custom beige background with faint patterns

### Wall Bars (Yellow/Blue)
**Status:** Already implemented programmatically  
**Current Implementation:**
- File: `Utils/LevelAssets.py`
- Function: `create_wall_bar_surface()`
- **Action:** No change needed, programmatic version works well

## Implementation Strategy

### Phase 1: Download Core Assets
1. Download **Free Puzzle Platformer Kit** from itch.io
2. Extract platform tiles and organize in `Assets/platforms/`
3. Download **2D Pixel Art Portal Sprites** for portal effects
4. Optionally download **2D Platformer Pack** for additional variety

### Phase 2: Asset Organization
Create subdirectories in `Assets/`:
- `Assets/platforms/` - Platform tiles and textures
- `Assets/blocks/` - Broken block textures (if custom created)
- `Assets/props/` - Glass tubes, bridges, etc. (if custom created)
- `Assets/backgrounds/` - Background tiles and patterns
- `Assets/portals/` - Portal effect sprites

### Phase 3: Integration
1. Update `Utils/LevelAssets.py` to load sprite files with fallback to programmatic generation
2. Update `Utils/Platform.py` to use tiled textures for platforms
3. Keep programmatic generation as fallback for missing assets

## License Summary

All recommended assets are:
- **Free for commercial use**
- **No attribution required** (though appreciated)
- **Available for download** without payment (name-your-own-price can be $0)

## Next Steps

1. Download the Free Puzzle Platformer Kit
2. Extract and organize platform tiles
3. Update asset loading code to use sprite files
4. Test integration and ensure fallback works
5. Optionally create custom sprites for broken blocks and mechanical bridges if programmatic versions don't match desired aesthetic

## Asset Requirements

- **Format**: PNG with transparency
- **Size**: 64x64 for characters, variable for weapons
- **Style**: Pixel art or minimalist 2D
- **Colors**: Should match team color scheme or be easily colorizable
  - Team 1: Blue (#6496FF) and Orange (#FF9664)
  - Team 2: Red (#FF3232) and Yellow (#FFFF64)

## Current Asset Status

The game currently uses:
- Programmatically generated character sprites (CharacterSprites.py)
- Colorized portal gun sprites (from base blue/orange assets)
- Fallback simple shapes if assets are missing

## Notes

- The programmatic generation in `LevelAssets.py` already creates good approximations of broken blocks, mechanical bridges, glass tubes, checkered flags, and wall bars
- The main improvement will come from using actual platform texture tiles instead of solid colors
- Portal sprites from Elthen's pack will enhance the portal gun effects
- Background elements from 2D Platformer Pack can add depth to the scene
