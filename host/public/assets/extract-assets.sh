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

# Extract dice models from tar.gz if it exists
if [ -f "$DICE_TAR" ]; then
    echo "Extracting dice models from archive..."
    cd "$ASSETS_DIR/models"
    mkdir -p temp_extract
    tar -xzf dice.tar.gz -C temp_extract 2>/dev/null || true
    # Move all dice GLB files to dice directory
    if [ -d "temp_extract/dice" ]; then
        mv temp_extract/dice/* "$DICE_DIR/" 2>/dev/null || true
    else
        # Files are at root of archive
        mv temp_extract/*.glb temp_extract/*.gltf "$DICE_DIR/" 2>/dev/null || true
    fi
    rm -rf temp_extract 2>/dev/null || true
    echo "✓ Dice models extracted"
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

# Extract board tiles from zip if it exists
BOARD_TILES_ZIP="$ASSETS_DIR/models/board_tiles.zip"
if [ -f "$BOARD_TILES_ZIP" ]; then
    echo "Extracting board tiles from archive..."
    mkdir -p "$ASSETS_DIR/models/board" # Ensure target directory exists
    if command -v unzip >/dev/null 2>&1; then
        unzip -q -o "$BOARD_TILES_ZIP" -d "$ASSETS_DIR/models/board" 2>/dev/null || true
    elif command -v python3 >/dev/null 2>&1; then
        python3 -c "import zipfile; zipfile.ZipFile('$BOARD_TILES_ZIP').extractall('$ASSETS_DIR/models/board')" 2>/dev/null || true
    fi
    echo "✓ Board tiles extracted"
fi

# Extract dice models from zip if it exists
DICE_MODELS_ZIP="$ASSETS_DIR/models/dice_models.zip"
if [ -f "$DICE_MODELS_ZIP" ]; then
    echo "Extracting dice models from archive..."
    mkdir -p "$DICE_DIR" # Ensure target directory exists
    if command -v unzip >/dev/null 2>&1; then
        unzip -q -o "$DICE_MODELS_ZIP" -d "$DICE_DIR" 2>/dev/null || true
    elif command -v python3 >/dev/null 2>&1; then
        python3 -c "import zipfile; zipfile.ZipFile('$DICE_MODELS_ZIP').extractall('$DICE_DIR')" 2>/dev/null || true
    fi
    echo "✓ Dice models extracted (DAE format - may need conversion to GLB)"
fi

# Extract UI pack from zip if it exists
UI_PACK_ZIP="$ASSETS_DIR/models/ui_pack.zip"
if [ -f "$UI_PACK_ZIP" ]; then
    echo "Extracting UI pack from archive..."
    mkdir -p "$ASSETS_DIR/ui" # Ensure target directory exists
    if command -v unzip >/dev/null 2>&1; then
        unzip -q -o "$UI_PACK_ZIP" -d "$ASSETS_DIR/ui" 2>/dev/null || true
    elif command -v python3 >/dev/null 2>&1; then
        python3 -c "import zipfile; zipfile.ZipFile('$UI_PACK_ZIP').extractall('$ASSETS_DIR/ui')" 2>/dev/null || true
    fi
    echo "✓ UI pack extracted"
fi

# Extract audio pack from zip if it exists
AUDIO_PACK_ZIP="$ASSETS_DIR/models/audio_pack.zip"
if [ -f "$AUDIO_PACK_ZIP" ]; then
    echo "Extracting audio pack from archive..."
    mkdir -p "$ASSETS_DIR/audio" # Ensure target directory exists
    if command -v unzip >/dev/null 2>&1; then
        unzip -q -o "$AUDIO_PACK_ZIP" -d "$ASSETS_DIR/audio" 2>/dev/null || true
    elif command -v python3 >/dev/null 2>&1; then
        python3 -c "import zipfile; zipfile.ZipFile('$AUDIO_PACK_ZIP').extractall('$ASSETS_DIR/audio')" 2>/dev/null || true
    fi
    echo "✓ Audio pack extracted"
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

BOARD_TILE_COUNT=$(ls -1 "$ASSETS_DIR/models/board"/*.glb 2>/dev/null | wc -l)
DICE_DAE_COUNT=$(ls -1 "$DICE_DIR"/*.dae 2>/dev/null | wc -l)

if [ $CHAR_COUNT -gt 0 ]; then
    echo "✓ Found $CHAR_COUNT character model(s) ready to use"
else
    echo "⚠ No character models found, will use procedural fallback"
fi

if [ $BOARD_TILE_COUNT -gt 0 ]; then
    echo "✓ Found $BOARD_TILE_COUNT board tile model(s) ready to use"
else
    echo "⚠ No board tiles found, will use procedural fallback"
fi

if [ $DICE_DAE_COUNT -gt 0 ]; then
    echo "⚠ Found $DICE_DAE_COUNT dice model(s) in DAE format (needs conversion to GLB)"
elif [ $DICE_COUNT -gt 0 ]; then
    echo "✓ Found dice model ready to use"
else
    echo "⚠ No dice model found, will use procedural fallback"
fi

echo ""
echo "Asset extraction complete!"
echo ""
