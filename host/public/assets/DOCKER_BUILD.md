# Automatic Asset Download During Docker Build

The Dockerfile is configured to automatically download assets during the build process.

## How It Works

1. **During Build**: The Dockerfile runs `download-assets-docker.sh` which attempts to download assets from known working sources
2. **Fallback**: If downloads fail, the game uses enhanced procedural 3D models (which look great!)
3. **Manual Override**: You can place manually downloaded assets in `host/public/assets/` before building

## Build Process

When you run `docker compose build`, the following happens:

1. Base image is set up (Node.js)
2. Dependencies are installed
3. Application files are copied
4. **Asset download script runs automatically**
5. Assets are placed in the correct directories
6. Container is ready to use

## Manual Asset Installation (Recommended)

For best results, download assets manually and place them before building:

### Step 1: Download Assets
- Visit https://kenney.nl/assets
- Download: Board Game Kit, 3D Game Kit, 3D Characters
- Convert FBX/OBJ to GLTF/GLB using Blender

### Step 2: Place in Directory
```
host/public/assets/
├── models/
│   ├── board/board_base.glb
│   ├── characters/
│   │   ├── character_1.glb
│   │   ├── character_2.glb
│   │   ├── character_3.glb
│   │   └── character_4.glb
│   └── dice/dice.glb
└── textures/
    └── board_wood.jpg
```

### Step 3: Build
```bash
docker compose build
```

The Dockerfile will:
- Use your manually placed assets (if they exist)
- Skip downloading if files already exist
- Only download missing assets

## Automatic Download Sources

The script attempts to download from:
- Three.js example models (Duck, Flamingo, Parrot, Stork)
- pmndrs/market repository
- Other known CC0 sources

## Build Options

### Build with automatic downloads (default)
```bash
docker compose build
```

### Build without downloads (use only manual assets)
If you've placed assets manually, they'll be used. The download script will skip existing files.

### Force re-download
```bash
# Remove existing assets first
rm -rf host/public/assets/models/*.glb
docker compose build
```

## Notes

- **Build Time**: Automatic downloads add ~10-30 seconds to build time
- **Network Required**: Build environment needs internet access
- **Fallback**: Game works perfectly without external assets
- **Image Size**: Downloaded assets increase image size by ~5-50MB depending on models

## Troubleshooting

**Downloads failing?**
- Check internet connectivity during build
- Some sources may be temporarily unavailable
- Game will use procedural models (fully functional)

**Assets not loading?**
- Verify files are in GLTF/GLB format
- Check file names match exactly (case-sensitive)
- Ensure files are in correct directories
- Check browser console for errors

**Build taking too long?**
- Assets are cached in Docker layers
- Subsequent builds are faster
- Consider downloading manually for faster builds
