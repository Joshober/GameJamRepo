#!/bin/bash
# Enhanced asset download script for Docker build
# Attempts to download assets from multiple sources with fallbacks

set -e

ASSETS_DIR="/app/public/assets"
mkdir -p "$ASSETS_DIR/models/board"
mkdir -p "$ASSETS_DIR/models/characters"
mkdir -p "$ASSETS_DIR/models/dice"
mkdir -p "$ASSETS_DIR/textures"

echo "=========================================="
echo "Downloading 3D assets for board game..."
echo "=========================================="
echo ""

# Function to download with multiple attempts and error handling
download_file() {
    local url=$1
    local output=$2
    local name=$3
    local max_attempts=${4:-2}
    
    echo -n "Downloading: $name... "
    
    for attempt in $(seq 1 $max_attempts); do
        if wget -q --timeout=15 --tries=1 -O "$output" "$url" 2>/dev/null; then
            # Verify file is not empty and is valid
            if [ -s "$output" ] && [ "$(file -b --mime-type "$output" 2>/dev/null || echo 'unknown')" != "text/html" ]; then
                echo "✓ Success"
                return 0
            else
                rm -f "$output"
            fi
        fi
        if [ $attempt -lt $max_attempts ]; then
            sleep 1
        fi
    done
    
    echo "✗ Failed (will use fallback)"
    rm -f "$output"
    return 1
}

SUCCESS_COUNT=0
TOTAL_COUNT=0

# Try downloading character models from Three.js examples
echo "--- Character Models ---"
for i in 1 2 3 4; do
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    case $i in
        1) url="https://threejs.org/examples/models/gltf/Duck/glTF-Binary/Duck.glb"; name="Character 1 (Duck)" ;;
        2) url="https://threejs.org/examples/models/gltf/Flamingo/glTF-Binary/Flamingo.glb"; name="Character 2 (Flamingo)" ;;
        3) url="https://threejs.org/examples/models/gltf/Parrot/glTF-Binary/Parrot.glb"; name="Character 3 (Parrot)" ;;
        4) url="https://threejs.org/examples/models/gltf/Stork/glTF-Binary/Stork.glb"; name="Character 4 (Stork)" ;;
    esac
    
    if download_file "$url" "$ASSETS_DIR/models/characters/character_$i.glb" "$name"; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    fi
done

echo ""
echo "--- Dice Model ---"
TOTAL_COUNT=$((TOTAL_COUNT + 1))
# Try pmndrs/market dice
if download_file \
    "https://raw.githubusercontent.com/pmndrs/market/main/public/models/dice.glb" \
    "$ASSETS_DIR/models/dice/dice.glb" \
    "Dice Model"; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
fi

echo ""
echo "=========================================="
echo "Download Summary: $SUCCESS_COUNT/$TOTAL_COUNT assets downloaded"
echo "=========================================="
echo ""

if [ $SUCCESS_COUNT -eq 0 ]; then
    echo "⚠️  No assets were downloaded automatically."
    echo ""
    echo "The game will use enhanced procedural 3D models which look great!"
    echo ""
    echo "To add custom assets:"
    echo "1. Download from Kenney.nl: https://kenney.nl/assets"
    echo "2. Convert FBX/OBJ to GLTF/GLB using Blender"
    echo "3. Place files in host/public/assets/ before building"
    echo "4. Rebuild: docker compose build"
else
    echo "✓ Assets downloaded successfully!"
    echo "The game will use these models when available."
fi

echo ""
