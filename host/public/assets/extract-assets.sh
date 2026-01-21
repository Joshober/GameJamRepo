#!/bin/bash
# Simple asset extraction script
# Extracts pre-downloaded assets from tar.gz files stored in the repo

set -e

ASSETS_DIR="/app/public/assets"
CHARACTERS_DIR="$ASSETS_DIR/models/characters"
DICE_DIR="$ASSETS_DIR/models/dice"
CHARACTERS_TAR="$ASSETS_DIR/models/characters.tar.gz"
DICE_TAR="$ASSETS_DIR/models/dice.tar.gz"

echo "=========================================="
echo "Extracting assets from repository..."
echo "=========================================="

# Extract character models from tar.gz if it exists
if [ -f "$CHARACTERS_TAR" ]; then
    echo "Extracting character models from archive..."
    cd "$ASSETS_DIR/models"
    # Extract to temp directory first
    mkdir -p temp_extract
    tar -xzf characters.tar.gz -C temp_extract 2>/dev/null || true
    # Move files to characters directory
    if [ -d "temp_extract/characters" ]; then
        mv temp_extract/characters/* "$CHARACTERS_DIR/" 2>/dev/null || true
    elif [ -f "temp_extract/character_1.glb" ] || [ -f "temp_extract/character_1.gltf" ]; then
        # Files are at root of archive
        mv temp_extract/character_*.glb temp_extract/character_*.gltf "$CHARACTERS_DIR/" 2>/dev/null || true
    fi
    rm -rf temp_extract 2>/dev/null || true
    echo "✓ Character models extracted"
fi

# Extract dice model from tar.gz if it exists
if [ -f "$DICE_TAR" ]; then
    echo "Extracting dice model from archive..."
    cd "$ASSETS_DIR/models"
    mkdir -p temp_extract
    tar -xzf dice.tar.gz -C temp_extract 2>/dev/null || true
    if [ -d "temp_extract/dice" ]; then
        mv temp_extract/dice/* "$DICE_DIR/" 2>/dev/null || true
    elif [ -f "temp_extract/dice.glb" ] || [ -f "temp_extract/dice.gltf" ]; then
        mv temp_extract/dice.glb temp_extract/dice.gltf "$DICE_DIR/" 2>/dev/null || true
    fi
    rm -rf temp_extract 2>/dev/null || true
    echo "✓ Dice model extracted"
fi

# Extract dice textures if available (ZIP format)
DICE_TEXTURES_ZIP="$ASSETS_DIR/models/dice_textures.zip"
if [ -f "$DICE_TEXTURES_ZIP" ]; then
    echo "Extracting dice textures..."
    mkdir -p "$ASSETS_DIR/textures/dice"
    # Use unzip if available, or Python as fallback
    if command -v unzip >/dev/null 2>&1; then
        unzip -q -o "$DICE_TEXTURES_ZIP" -d "$ASSETS_DIR/textures/dice" 2>/dev/null || true
    elif command -v python3 >/dev/null 2>&1; then
        python3 -c "import zipfile; zipfile.ZipFile('$DICE_TEXTURES_ZIP').extractall('$ASSETS_DIR/textures/dice')" 2>/dev/null || true
    fi
    echo "✓ Dice textures extracted"
fi

# Check what we have
CHAR_COUNT=0
for i in 1 2 3 4; do
    if [ -f "$CHARACTERS_DIR/character_$i.glb" ] || [ -f "$CHARACTERS_DIR/character_$i.gltf" ]; then
        CHAR_COUNT=$((CHAR_COUNT + 1))
    fi
done

DICE_COUNT=0
if [ -f "$DICE_DIR/dice.glb" ] || [ -f "$DICE_DIR/dice.gltf" ]; then
    DICE_COUNT=1
fi

if [ $CHAR_COUNT -gt 0 ]; then
    echo "✓ Found $CHAR_COUNT character model(s) ready to use"
else
    echo "⚠ No character models found, will use procedural fallback"
fi

if [ $DICE_COUNT -gt 0 ]; then
    echo "✓ Found dice model ready to use"
else
    echo "⚠ No dice model found, will use procedural fallback"
fi

echo ""
echo "Asset extraction complete!"
echo ""
