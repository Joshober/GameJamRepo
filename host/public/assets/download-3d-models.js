#!/usr/bin/env node
/**
 * Download free 3D models from various sources
 * Focuses on dice, board game pieces, and board elements
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const ASSETS_DIR = path.join(process.cwd(), 'host/public/assets/models');
const DOWNLOADS_DIR = path.join(ASSETS_DIR, 'downloads');

// Ensure directories exist
['dice', 'board', 'characters', 'downloads'].forEach(dir => {
  const dirPath = path.join(ASSETS_DIR, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

/**
 * Download a file from URL
 */
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(outputPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        return downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(outputPath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(outputPath);
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      reject(err);
    });
  });
}

/**
 * Download 3D models from known free sources
 */
async function downloadModels() {
  console.log('==========================================');
  console.log('Downloading free 3D models...');
  console.log('==========================================\n');

  const models = [
    // Dice models - try multiple sources
    {
      name: 'Dice Model',
      url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Dice/Dice.glb',
      output: path.join(ASSETS_DIR, 'dice', 'dice.glb'),
      description: 'Three.js example dice'
    },
    {
      name: 'Dice Model (Alternative)',
      url: 'https://github.com/mrdoob/three.js/raw/dev/examples/models/gltf/Dice/Dice.glb',
      output: path.join(ASSETS_DIR, 'dice', 'dice_alt.glb'),
      description: 'Three.js dice (GitHub raw)'
    },
    // Try Sketchfab CC0 dice if available
    // Note: Most Sketchfab models require API or manual download
  ];

  let successCount = 0;
  let failCount = 0;

  for (const model of models) {
    try {
      console.log(`Downloading: ${model.name}...`);
      console.log(`  URL: ${model.url}`);
      
      await downloadFile(model.url, model.output);
      
      // Verify file exists and has content
      const stats = fs.statSync(model.output);
      if (stats.size > 0) {
        console.log(`  ✓ Downloaded: ${model.name} (${(stats.size / 1024).toFixed(2)}KB)`);
        successCount++;
      } else {
        console.log(`  ✗ File is empty`);
        fs.unlinkSync(model.output);
        failCount++;
      }
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n==========================================');
  console.log(`Download Summary: ${successCount} succeeded, ${failCount} failed`);
  console.log('==========================================\n');

  // If dice download failed, note that procedural will be used
  const diceExists = fs.existsSync(path.join(ASSETS_DIR, 'dice', 'dice.glb')) ||
                     fs.existsSync(path.join(ASSETS_DIR, 'dice', 'dice_alt.glb'));
  
  if (!diceExists) {
    console.log('⚠ No dice model downloaded. Procedural dice will be generated.');
  }

  return successCount;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadModels().catch(console.error);
}

export { downloadModels };
