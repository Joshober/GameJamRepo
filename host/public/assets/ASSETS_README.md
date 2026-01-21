# Asset Management - Simplified System

## Overview

The asset system has been simplified! Assets are now stored directly in the GitHub repository, eliminating the need for complex Playwright downloads during Docker builds.

## How It Works

1. **Assets in Repo**: Essential 3D models are stored as `tar.gz` archives in the repository
2. **Fast Extraction**: During Docker build, assets are extracted from the repo (no downloads needed)
3. **Procedural Fallback**: If assets aren't found, the system automatically generates simple but functional 3D models

## Current Status

✅ **System is simplified and working**
- No Playwright dependency needed
- Fast Docker builds (no browser automation)
- Procedural assets work as fallback
- Assets can be added to repo for better visuals

## Adding Better Assets

### Option 1: Add to Repository (Recommended)

1. Download assets from [Kenney.nl](https://kenney.nl/assets):
   - **Blocky Characters** (3D): https://kenney.nl/assets/blocky-characters
   - Extract the GLB files from the ZIP

2. Rename files to match expected names:
   - `character-a.glb` → `character_1.glb`
   - `character-b.glb` → `character_2.glb`
   - `character-c.glb` → `character_3.glb`
   - `character-d.glb` → `character_4.glb`

3. Create tar.gz archive:
   ```bash
   cd host/public/assets/models/characters
   tar -czf ../characters.tar.gz character_*.glb
   ```

4. Commit to repository:
   ```bash
   git add host/public/assets/models/characters.tar.gz
   git commit -m "Add character models from Kenney.nl"
   git push
   ```

### Option 2: Use Procedural Assets (Current Default)

The system automatically generates simple but valid GLTF models if no assets are found. These work perfectly fine for gameplay!

## File Structure

```
host/public/assets/models/
├── characters/
│   ├── character_1.glb (or .gltf)
│   ├── character_2.glb (or .gltf)
│   ├── character_3.glb (or .gltf)
│   └── character_4.glb (or .gltf)
├── dice/
│   └── dice.glb (or .gltf)
└── characters.tar.gz (optional archive)
```

## Docker Build Process

1. Copy files from repo
2. Extract `characters.tar.gz` if it exists
3. Check for individual character files
4. Generate procedural assets if nothing found
5. Build completes successfully either way!

## Benefits of This Approach

- ✅ **Fast builds**: No network downloads during build
- ✅ **Reliable**: Assets are version-controlled in Git
- ✅ **Simple**: No complex browser automation
- ✅ **Flexible**: Easy to add/update assets
- ✅ **Fallback**: Always works, even without assets

## Updating Assets

To update assets:
1. Download new assets
2. Replace files in `host/public/assets/models/`
3. Update `characters.tar.gz` if using archive
4. Commit and push
5. Rebuild Docker image

The game will automatically use the new assets!
