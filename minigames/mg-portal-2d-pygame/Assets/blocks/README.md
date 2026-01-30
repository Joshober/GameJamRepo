# Broken Block Textures

Place broken/damaged block textures here. These should match the Portal-style aesthetic:
- Dark brown-reddish color (#502832 / RGB: 80, 50, 40)
- White outlines
- Grid pattern (broken window effect)

## File Naming Convention

- `broken_block_40.png` - 40x40 broken block
- `broken_block_60.png` - 60x60 broken block
- `broken_block_80.png` - 80x80 broken block

If no files are found, the code will use programmatic generation (see `Utils/LevelAssets.py`).

## Creating Custom Broken Blocks

You can create these by:
1. Using the programmatic version as a base (save from game)
2. Creating pixel art matching the color scheme
3. Extracting from asset packs and modifying colors
