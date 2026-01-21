#!/bin/bash
# Simple asset extraction script
# Extracts pre-downloaded assets from tar.gz files stored in the repo

set -e

ASSETS_DIR="/app/public/assets"
CHARACTERS_DIR="$ASSETS_DIR/models/characters"
CHARACTERS_TAR="$ASSETS_DIR/models/characters.tar.gz"

echo "=========================================="
echo "Extracting assets from repository..."
echo "=========================================="

# Extract character models from tar.gz if it exists
if [ -f "$CHARACTERS_TAR" ]; then
    echo "Extracting character models from archive..."
    cd "$ASSETS_DIR/models"
    tar -xzf characters.tar.gz -C characters/ 2>/dev/null || true
    echo "✓ Character models extracted"
fi

# Check what we have
CHAR_COUNT=0
for i in 1 2 3 4; do
    if [ -f "$CHARACTERS_DIR/character_$i.glb" ] || [ -f "$CHARACTERS_DIR/character_$i.gltf" ]; then
        CHAR_COUNT=$((CHAR_COUNT + 1))
    fi
done

if [ $CHAR_COUNT -gt 0 ]; then
    echo "✓ Found $CHAR_COUNT character model(s) ready to use"
else
    echo "⚠ No character models found, will use procedural fallback"
fi

echo ""
echo "Asset extraction complete!"
echo ""
