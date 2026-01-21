/**
 * Asset Download Script
 * Downloads free CC0 3D assets for the board game
 * Run with: node download-assets.js
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directories
const dirs = [
  'models/board',
  'models/characters',
  'models/dice',
  'textures'
];

dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded: ${path.basename(filepath)}`);
          resolve();
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
      } else {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download: ${url} (${response.statusCode})`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      reject(err);
    });
  });
}

// Asset URLs to try (these are example URLs - actual URLs may vary)
const assets = [
  // Try Three.js example models
  {
    url: 'https://threejs.org/examples/models/gltf/Duck/glTF-Binary/Duck.glb',
    path: 'models/characters/character_1.glb',
    name: 'Character 1 (Duck)'
  },
  {
    url: 'https://threejs.org/examples/models/gltf/Flamingo/glTF-Binary/Flamingo.glb',
    path: 'models/characters/character_2.glb',
    name: 'Character 2 (Flamingo)'
  },
  {
    url: 'https://threejs.org/examples/models/gltf/Parrot/glTF-Binary/Parrot.glb',
    path: 'models/characters/character_3.glb',
    name: 'Character 3 (Parrot)'
  },
  {
    url: 'https://threejs.org/examples/models/gltf/Stork/glTF-Binary/Stork.glb',
    path: 'models/characters/character_4.glb',
    name: 'Character 4 (Stork)'
  },
];

async function downloadAssets() {
  console.log('Starting asset download...\n');
  
  for (const asset of assets) {
    const filepath = path.join(__dirname, asset.path);
    try {
      await downloadFile(asset.url, filepath);
    } catch (error) {
      console.log(`✗ Failed: ${asset.name} - ${error.message}`);
    }
  }
  
  console.log('\nDownload complete!');
  console.log('\nNote: If downloads failed, you can manually download assets from:');
  console.log('- Kenney.nl: https://kenney.nl/assets');
  console.log('- Poly Haven: https://polyhaven.com');
  console.log('- pmndrs/market: https://github.com/pmndrs/market');
}

downloadAssets().catch(console.error);
