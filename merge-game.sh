#!/bin/bash
# Merge Game Helper Script
# This script helps move game files to minigames/mg-[game-name]/ after merging a game branch

echo "Merge Game Helper Script"
echo "========================"
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "Error: Not in a git repository!"
    exit 1
fi

# Check if manifest.json exists
if [ ! -f manifest.json ]; then
    echo "Error: manifest.json not found in current directory!"
    echo "Make sure you've merged your game branch and are in the repository root."
    exit 1
fi

# Read the game ID from manifest.json
GAME_ID=$(grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' manifest.json | head -1 | cut -d'"' -f4)

if [ -z "$GAME_ID" ]; then
    echo "Error: Could not find 'id' field in manifest.json!"
    exit 1
fi

echo "Found game ID: $GAME_ID"

# Create the game directory
GAME_DIR="minigames/$GAME_ID"
echo "Creating directory: $GAME_DIR"
mkdir -p "$GAME_DIR"

# Files and directories to exclude
EXCLUDE=(".git" ".github" "minigames" ".gitignore" "TEMPLATE_WORKFLOW.md" "merge-game.ps1" "merge-game.sh")

# Move files
echo "Moving files to $GAME_DIR..."
MOVED_COUNT=0

# Function to check if item should be excluded
should_exclude() {
    local item=$1
    for pattern in "${EXCLUDE[@]}"; do
        if [[ "$item" == "$pattern"* ]] || [[ "$item" == "$pattern" ]]; then
            return 0
        fi
    done
    return 1
}

# Move files in root
for file in *; do
    if [ -f "$file" ] && ! should_exclude "$file"; then
        echo "  Moving: $file"
        mv "$file" "$GAME_DIR/"
        ((MOVED_COUNT++))
    fi
done

# Move directories in root
for dir in */; do
    dir_name="${dir%/}"
    if [ -d "$dir_name" ] && ! should_exclude "$dir_name"; then
        echo "  Moving directory: $dir_name"
        mv "$dir_name" "$GAME_DIR/"
        ((MOVED_COUNT++))
    fi
done

if [ $MOVED_COUNT -eq 0 ]; then
    echo "Warning: No files were moved. Files may already be in the correct location."
else
    echo "Moved $MOVED_COUNT items to $GAME_DIR"
fi

# Stage the changes
echo "Staging changes..."
git add .

echo ""
echo "Done! Files have been moved to $GAME_DIR"
echo "Review the changes with: git status"
echo "Commit with: git commit -m 'Add $GAME_ID to minigames directory'"
