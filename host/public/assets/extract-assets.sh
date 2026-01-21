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
    # Extract preserving directory structure
    tar -xzf characters.tar.gz 2>/dev/null || true
    # If files are in characters/ subdirectory, move them up
    if [ -d "characters/characters" ]; then
        mv characters/characters/* characters/ 2>/dev/null || true
        rmdir characters/characters 2>/dev/null || true
    fi
    echo "✓ Character models extracted"
fi

# Extract dice model from tar.gz if it exists
if [ -f "$DICE_TAR" ]; then
    echo "Extracting dice model from archive..."
    cd "$ASSETS_DIR/models"
    tar -xzf dice.tar.gz -C dice/ 2>/dev/null || true
    echo "✓ Dice model extracted"
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
