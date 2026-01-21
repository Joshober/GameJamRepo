# 3D Assets Directory

This directory contains 3D models and textures for the board game.

## Quick Start

**See [REQUIRED_ASSETS.md](./REQUIRED_ASSETS.md) for complete asset requirements and file types.**

## Current Status

✅ **Character models** - 4 player pieces (in repo)  
✅ **Dice textures** - 24 PNG images (in repo)  
⚠️ **Dice 3D model** - Procedural fallback (works fine)  
⚠️ **Board textures** - Optional (procedural works)

## Essential Files

- `assetLoader.js` - Loads 3D models and textures
- `extract-assets.sh` - Extracts assets during Docker build
- `generate-assets.js` - Creates procedural fallback models
- `REQUIRED_ASSETS.md` - Complete guide for all assets

## Directory Structure

```
assets/
├── models/
│   ├── characters/          # Player pieces (✅ have)
│   ├── dice/                # Dice model (⚠️ procedural)
│   └── board/               # Board models (⚠️ procedural)
└── textures/
    ├── dice/                # Dice face images (✅ have)
    └── *.jpg                # Board textures (⚠️ optional)
```

## How It Works

1. **Assets in Repo**: Models stored as `tar.gz` archives
2. **Fast Extraction**: Extracted during Docker build
3. **Procedural Fallback**: Auto-generates models if assets missing
4. **Always Works**: Game is fully functional either way!

For detailed information, see [REQUIRED_ASSETS.md](./REQUIRED_ASSETS.md).
