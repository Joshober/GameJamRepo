# Dice Assets from Kenney Board Game Pack

## Assets Added

### Dice Textures (24 PNG images)
- **Location**: `host/public/assets/textures/dice/`
- **Source**: Kenney Board Game Pack (2D assets)
- **Files**:
  - `dieRed1.png` through `dieRed6.png` (red dice faces 1-6)
  - `dieRed_border1.png` through `dieRed_border6.png` (red dice with border)
  - `dieWhite1.png` through `dieWhite6.png` (white dice faces 1-6)
  - `dieWhite_border1.png` through `dieWhite_border6.png` (white dice with border)

### Archive
- **File**: `host/public/assets/models/dice_textures.tar.gz`
- **Contains**: All 24 dice texture PNG files
- **Size**: ~25KB

## Usage

These textures can be used to:
1. **Texture the 3D dice model**: Apply dice face textures to the procedural dice cube
2. **2D dice display**: Show dice results as 2D sprites
3. **UI elements**: Use in scoreboards or game UI

## Integration

The textures are automatically extracted during Docker build from the `dice_textures.tar.gz` archive.

## Note

These are 2D sprite textures, not 3D models. The 3D dice model is still generated procedurally, but these textures can be applied to it for better visuals.
