// Download missing assets for the board game
// This script attempts to download assets from free sources

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Create directories
const directories = [
  'models/characters',
  'models/nature_pack',
  'models/props',
  'models/collectibles'
];

directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

console.log('\nDownloading assets...');
console.log('Note: Some assets may need to be downloaded manually from the sources listed in ASSETS.md\n');

// Asset URLs - these are placeholder URLs that may need to be updated
// For now, we'll create a comprehensive download instructions file
const instructions = `# Asset Download Instructions

## Character Models
Download from: https://kenney.nl/assets/blocky-characters
- Extract 4 character models as character_1.glb through character_4.glb
- Place in: models/characters/

## Props and Collectibles
Download from poly.pizza (CC0 models):
- Coin: https://poly.pizza/m/7IrL01B97W (download as GLB)
- Star Coin: https://poly.pizza/m/n5nJIQAozN (download as GLB)
- Mushroom: https://poly.pizza/m/A2rwQyfqYG (download as GLB)
- Pipe: https://poly.pizza/m/f1A1MuUQfC3 (download as GLB)

Place in: models/collectibles/ or models/ (for pipe.glb)

## Nature Pack
Download from: https://poly.pizza/bundle/Ultimate-Stylized-Nature-Pack-zyIyYd9yGr
- Extract tree.glb and rock.glb
- Place in: models/nature_pack/

## Game Reference Props
These are created procedurally in the code, but you can add custom models:
- Doom imp: models/props/doom_imp.glb
- Pacman ghost: models/props/pacman_ghost.glb
- Tetris block: models/props/tetris_block.glb
- Space invader: models/props/space_invader.glb
- Arcade cabinet: models/props/arcade_cabinet.glb

Note: The game will work with procedural fallbacks if these files don't exist.

## Quick Download Links

### Kenney Assets (Free, CC0)
- Blocky Characters: https://kenney.nl/assets/blocky-characters
- Hexagon Kit: https://kenney.nl/assets/hexagon-kit
- Board Game Pack: https://kenney.nl/assets/boardgame-pack

### Poly Pizza Assets (Free, CC0)
- Coin: https://poly.pizza/m/7IrL01B97W
- Star Coin: https://poly.pizza/m/n5nJIQAozN
- Mushroom: https://poly.pizza/m/A2rwQyfqYG
- Pipe: https://poly.pizza/m/f1A1MuUQfC3
- Nature Pack: https://poly.pizza/bundle/Ultimate-Stylized-Nature-Pack-zyIyYd9yGr
`;

const instructionsPath = path.join(__dirname, 'DOWNLOAD_INSTRUCTIONS.md');
fs.writeFileSync(instructionsPath, instructions, 'utf8');
console.log(`Created download instructions at: ${instructionsPath}`);

// Check what we have
const existingAssets = [];
const missingAssets = [];

// Check characters
for (let i = 1; i <= 4; i++) {
  const charPath = path.join(__dirname, `models/characters/character_${i}.glb`);
  if (fs.existsSync(charPath)) {
    existingAssets.push(`character_${i}.glb`);
  } else {
    missingAssets.push(`character_${i}.glb`);
  }
}

// Check props
const props = ['pipe.glb', 'shop.glb', 'coin.glb', 'star_coin.glb'];
props.forEach(prop => {
  const propPath = path.join(__dirname, `models/${prop}`);
  if (fs.existsSync(propPath)) {
    existingAssets.push(prop);
  } else {
    missingAssets.push(prop);
  }
});

// Check nature pack
const nature = ['tree.glb', 'rock.glb'];
nature.forEach(item => {
  const naturePath = path.join(__dirname, `models/nature_pack/${item}`);
  if (fs.existsSync(naturePath)) {
    existingAssets.push(item);
  } else {
    missingAssets.push(item);
  }
});

console.log(`\nExisting assets: ${existingAssets.length}`);
if (existingAssets.length > 0) {
  existingAssets.forEach(asset => console.log(`  ✓ ${asset}`));
}

console.log(`\nMissing assets: ${missingAssets.length}`);
if (missingAssets.length > 0) {
  missingAssets.forEach(asset => console.log(`  ✗ ${asset}`));
  console.log('\nThese will use procedural fallbacks. See DOWNLOAD_INSTRUCTIONS.md for manual download links.');
}

console.log('\nDone! The game will work with procedural fallbacks for missing assets.');
console.log('To enhance visuals, download assets manually using the instructions above.');
