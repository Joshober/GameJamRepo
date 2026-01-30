# Template Workflow Guide

This guide explains how to use the template branches to create a new minigame and merge it back into the main repository.

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

### Step 1: Prepare for Merge

Make sure your game branch is up to date and all files are committed.

### Step 2: Switch to Master

```bash
git checkout master
git pull origin master
```

### Step 3: Merge Your Game

Merge your game branch into master. The files will be placed in `minigames/mg-[your-game-name]/`:

```bash
git merge game/my-awesome-game
```

**Important**: During the merge, you may need to move files to the correct location:

```bash
# If files are at root, move them to minigames/mg-[game-name]/
mkdir -p minigames/mg-my-awesome-game
git mv *.py *.json *.md minigames/mg-my-awesome-game/ 2>/dev/null || true
git mv *.js *.html minigames/mg-my-awesome-game/ 2>/dev/null || true
git commit -m "Move game files to minigames/mg-my-awesome-game/"
```

### Step 4: Push to Remote

```bash
git push origin master
```

## Alternative: Manual File Placement

If the automatic merge doesn't place files correctly, you can manually place them:

1. Checkout your game branch
2. Copy all files to `minigames/mg-[game-name]/` in master
3. Commit the changes

## Example Workflow

```bash
# Start with template
git checkout template/pygame-template
git checkout -b game/portal-game

# Develop your game
# ... make changes ...
git add .
git commit -m "Complete portal game implementation"

# Merge back to master
git checkout master
git merge game/portal-game

# Move files to correct location (if needed)
mkdir -p minigames/mg-portal-game
git mv *.py *.json *.md minigames/mg-portal-game/
git commit -m "Move portal game to minigames/mg-portal-game/"

# Push
git push origin master
```

## Notes

- Each template branch contains only the template files at the root level
- When merging, ensure your game has a unique ID in `manifest.json`
- The game will be placed in `minigames/mg-[game-name]/` based on the game ID in the manifest
- Always test your game before merging to master
