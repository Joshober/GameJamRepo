# Template Workflow Guide

This guide explains how to use the template branches to create a new minigame and merge it back into the main repository at `minigames/mg-[game-name]/`.

## Available Templates

- `template/pygame-template` - Pygame-based minigame template
- `template/js-template` - JavaScript/browser-based minigame template  
- `template/node-template` - Node.js console-based minigame template

## Creating a New Game

### Step 1: Checkout a Template Branch

```bash
git checkout template/pygame-template
# or
git checkout template/js-template
# or
git checkout template/node-template
```

Each template branch has the template files at the **root level** of the branch, making it easy to work with.

### Step 2: Create Your Game Branch

Create a new branch from the template for your specific game:

```bash
git checkout -b game/my-awesome-game
```

### Step 3: Update the Manifest

Edit `manifest.json` and update:
- `id`: Your unique game ID (e.g., `"mg-my-awesome-game"`)
- `name`: Your game's display name
- Other metadata as needed

### Step 4: Develop Your Game

- Modify the template files to implement your game logic
- Add any additional files you need
- Test your game thoroughly

### Step 5: Commit Your Work

```bash
git add .
git commit -m "Implement my awesome game"
```

## Merging Back to Master

When you're ready to merge your finished game back into master, it will be placed in `minigames/mg-[game-name]/` (e.g., `minigames/mg-portal-2d-pygame/`).

### Step 1: Prepare for Merge

Make sure your game branch is up to date and all files are committed.

### Step 2: Switch to Master

```bash
git checkout master
git pull origin master
```

### Step 3: Merge Your Game

Merge your game branch into master:

```bash
git merge game/my-awesome-game --no-commit
```

### Step 4: Move Files to Correct Location

After merging, move all files to `minigames/mg-[game-name]/` based on the game ID in your `manifest.json`:

**For Windows PowerShell:**
```powershell
# Read the game ID from manifest.json
$manifest = Get-Content manifest.json | ConvertFrom-Json
$gameId = $manifest.id
$gameDir = "minigames/$gameId"

# Create the directory
New-Item -ItemType Directory -Force -Path $gameDir

# Move all game files (excluding .git, .github, etc.)
Get-ChildItem -File | Where-Object { $_.Name -notlike ".git*" -and $_.Name -ne ".gitignore" } | Move-Item -Destination $gameDir
Get-ChildItem -Directory | Where-Object { $_.Name -ne "minigames" -and $_.Name -ne ".git" -and $_.Name -ne ".github" } | Move-Item -Destination $gameDir

# Commit the changes
git add .
git commit -m "Add $gameId to minigames directory"
```

**For Linux/Mac:**
```bash
# Read the game ID from manifest.json
GAME_ID=$(grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' manifest.json | cut -d'"' -f4)
GAME_DIR="minigames/$GAME_ID"

# Create the directory
mkdir -p "$GAME_DIR"

# Move all game files (excluding .git, .github, etc.)
find . -maxdepth 1 -type f ! -name '.git*' ! -name '.gitignore' -exec mv {} "$GAME_DIR/" \;
find . -maxdepth 1 -type d ! -name '.' ! -name 'minigames' ! -name '.git' ! -name '.github' -exec mv {} "$GAME_DIR/" \;

# Commit the changes
git add .
git commit -m "Add $GAME_ID to minigames directory"
```

### Step 5: Push to Remote

```bash
git push origin master
```

## Alternative: Using the Merge Script

A helper script is available to automate the merge process. After merging your branch:

```bash
# Windows PowerShell
.\merge-game.ps1

# Linux/Mac
./merge-game.sh
```

## Example Workflow

```bash
# Start with template
git checkout template/pygame-template
git checkout -b game/portal-game

# Update manifest.json with id: "mg-portal-2d-pygame"
# ... develop your game ...
git add .
git commit -m "Complete portal game implementation"

# Merge back to master
git checkout master
git merge game/portal-game --no-commit

# Move files to minigames/mg-portal-2d-pygame/
# (use the script or manual commands above)

git commit -m "Add portal game to minigames directory"
git push origin master
```

## Notes

- Each template branch contains only the template files at the root level
- When merging, ensure your game has a unique ID in `manifest.json`
- The game will be placed in `minigames/mg-[game-name]/` based on the game ID in the manifest
- Always test your game before merging to master
- The merge process preserves all your game files and places them in the correct location
