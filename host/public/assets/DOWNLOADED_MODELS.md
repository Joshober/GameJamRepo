# Downloaded 3D Models

## Sources Found

### Filer.dev (https://www.filer.dev/3d-models)
Found multiple free dice models:
- `dice.glb` (0.49MB) - Main dice model
- `6-dice.glb` (0.05MB) - Alternative dice
- `dice-free.glb` (0.03MB) - Free variant
- `dicey.glb` (0.52MB) - Another variant
- `dices.glb` (0.06MB) - Multiple dice

**Issue**: Direct blob storage URLs are currently disabled (`AccountIsDisabled` error).

**Solution**: Models can be downloaded manually from:
1. Visit https://www.filer.dev/3d-models/1?search=dice
2. Click on any dice model
3. Click the "Download" button
4. Save the `.glb` file to `host/public/assets/models/dice/`

### Three.js Examples Repository
- **URL**: https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/Dice
- **File**: `Dice.glb`
- **Status**: Attempting to download via raw GitHub URL

### Alternative Sources

1. **KayKit Character Pack** (GitHub)
   - URL: https://github.com/kaykit-game-assets/kaykit-character-pack-adventures-1.0
   - Contains: 4 stylized low-poly characters
   - License: CC0
   - Format: GLTF/FBX

2. **Webaverse Character Assets** (GitHub)
   - URL: https://github.com/webaverse-studios/character-assets
   - Contains: Weapons, armor, accessories
   - Format: Various

## Current Status

- ✅ Character models: In repo (`characters.tar.gz`)
- ✅ Dice textures: In repo (`dice_textures.zip`)
- ⚠️ Dice 3D models: Need manual download from Filer.dev (blob storage disabled)
- ⚠️ Board models: Not yet sourced

## Next Steps

1. Manually download dice models from Filer.dev
2. Or use procedural dice (already working)
3. Search for board game piece models
3. Consider board tile/space models
