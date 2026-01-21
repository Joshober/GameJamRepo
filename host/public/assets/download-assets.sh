#!/bin/bash
# Asset download script for Docker build
# Downloads free CC0 3D assets automatically

set -e

ASSETS_DIR="/app/public/assets"
mkdir -p "$ASSETS_DIR/models/board"
mkdir -p "$ASSETS_DIR/models/characters"
mkdir -p "$ASSETS_DIR/models/dice"
mkdir -p "$ASSETS_DIR/textures"

echo "Downloading 3D assets for board game..."

# Function to download with error handling
download_file() {
    local url=$1
    local output=$2
    local name=$3
    
    echo "Attempting to download: $name..."
    if wget -q --timeout=10 --tries=2 -O "$output" "$url" 2>/dev/null; then
        echo "✓ Downloaded: $name"
        return 0
    else
        echo "✗ Failed: $name (will use fallback)"
        rm -f "$output"
        return 1
    fi
}

# Try downloading from known working sources
# Note: Most Kenney.nl assets require manual download, but we'll try some alternatives

# Try Three.js example models (if available)
download_file \
    "https://threejs.org/examples/models/gltf/Duck/glTF-Binary/Duck.glb" \
    "$ASSETS_DIR/models/characters/character_1.glb" \
    "Character 1 (Duck)"

download_file \
    "https://threejs.org/examples/models/gltf/Flamingo/glTF-Binary/Flamingo.glb" \
    "$ASSETS_DIR/models/characters/character_2.glb" \
    "Character 2 (Flamingo)"

download_file \
    "https://threejs.org/examples/models/gltf/Parrot/glTF-Binary/Parrot.glb" \
    "$ASSETS_DIR/models/characters/character_3.glb" \
    "Character 3 (Parrot)"

download_file \
    "https://threejs.org/examples/models/gltf/Stork/glTF-Binary/Stork.glb" \
    "$ASSETS_DIR/models/characters/character_4.glb" \
    "Character 4 (Stork)"

# Try downloading textures from Poly Haven (if direct links work)
# Note: Poly Haven usually requires API or manual download, but we'll try

# Try pmndrs/market assets (if available via raw GitHub)
download_file \
    "https://raw.githubusercontent.com/pmndrs/market/main/public/models/dice.glb" \
    "$ASSETS_DIR/models/dice/dice.glb" \
    "Dice Model"

echo ""
echo "Asset download complete!"
echo "Note: If downloads failed, the game will use enhanced procedural models."
echo "You can manually download assets from Kenney.nl and place them in the assets directory."
