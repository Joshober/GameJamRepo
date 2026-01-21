/**
 * Download 3D assets using Playwright browser automation
 * Handles sites that require browser interaction (like Kenney.nl)
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import stream from 'stream';
import https from 'https';
import http from 'http';

const pipeline = promisify(stream.pipeline);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname);
const DOWNLOAD_DIR = path.join(ASSETS_DIR, 'downloads');

// Ensure directories exist
['models/board', 'models/characters', 'models/dice', 'textures', 'downloads'].forEach(dir => {
  const fullPath = path.join(ASSETS_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

/**
 * Download file from URL
 */
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(outputPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        return downloadFile(response.headers.location, outputPath).then(resolve).catch(reject);
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
        resolve();
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
 * Download from Three.js examples (direct links)
 * Try multiple URL patterns
 */
async function downloadThreeJSModels() {
  console.log('--- Downloading from Three.js examples ---');
  const models = [
    {
      urls: [
        'https://threejs.org/examples/models/gltf/Duck/glTF-Binary/Duck.glb',
        'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/models/gltf/Duck/glTF-Binary/Duck.glb',
        'https://github.com/mrdoob/three.js/raw/r160/examples/models/gltf/Duck/glTF-Binary/Duck.glb'
      ],
      output: path.join(ASSETS_DIR, 'models/characters/character_1.glb'),
      name: 'Character 1 (Duck)'
    },
    {
      urls: [
        'https://threejs.org/examples/models/gltf/Flamingo/glTF-Binary/Flamingo.glb',
        'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/models/gltf/Flamingo/glTF-Binary/Flamingo.glb'
      ],
      output: path.join(ASSETS_DIR, 'models/characters/character_2.glb'),
      name: 'Character 2 (Flamingo)'
    },
    {
      urls: [
        'https://threejs.org/examples/models/gltf/Parrot/glTF-Binary/Parrot.glb',
        'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/models/gltf/Parrot/glTF-Binary/Parrot.glb'
      ],
      output: path.join(ASSETS_DIR, 'models/characters/character_3.glb'),
      name: 'Character 3 (Parrot)'
    },
    {
      urls: [
        'https://threejs.org/examples/models/gltf/Stork/glTF-Binary/Stork.glb',
        'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/models/gltf/Stork/glTF-Binary/Stork.glb'
      ],
      output: path.join(ASSETS_DIR, 'models/characters/character_4.glb'),
      name: 'Character 4 (Stork)'
    }
  ];

  let successCount = 0;
  for (const model of models) {
    let downloaded = false;
    for (const url of model.urls) {
      try {
        console.log(`Trying ${model.name} from: ${url.substring(0, 60)}...`);
        await downloadFile(url, model.output);
        if (fs.existsSync(model.output) && fs.statSync(model.output).size > 100) {
          console.log(`✓ Success: ${model.name}`);
          successCount++;
          downloaded = true;
          break;
        } else {
          if (fs.existsSync(model.output)) fs.unlinkSync(model.output);
        }
      } catch (error) {
        // Try next URL
        if (fs.existsSync(model.output)) fs.unlinkSync(model.output);
      }
    }
    if (!downloaded) {
      console.log(`✗ Failed: ${model.name} (all URLs failed)`);
    }
  }
  return successCount;
}

/**
 * Download from Kenney.nl using Playwright browser automation
 */
async function downloadFromKenney(browser) {
  console.log('--- Downloading from Kenney.nl with Playwright ---');
  
  const kenneyAssets = [
    {
      url: 'https://kenney.nl/assets/board-game-kit',
      name: 'Board Game Kit',
      outputDir: path.join(ASSETS_DIR, 'models')
    },
    {
      url: 'https://kenney.nl/assets/3d-characters',
      name: '3D Characters',
      outputDir: path.join(ASSETS_DIR, 'models/characters')
    }
  ];

  let successCount = 0;
  
  for (const asset of kenneyAssets) {
    try {
      console.log(`Downloading: ${asset.name}...`);
      const page = await browser.newPage();
      
      // Set up download handler
      const downloadPromise = new Promise((resolve, reject) => {
        page.on('download', async (download) => {
          try {
            const suggestedFilename = download.suggestedFilename();
            const downloadPath = path.join(DOWNLOAD_DIR, suggestedFilename);
            await download.saveAs(downloadPath);
            console.log(`  Downloaded: ${suggestedFilename}`);
            
            // Extract ZIP if needed
            if (suggestedFilename.endsWith('.zip')) {
              // We'll extract this later if needed
              resolve({ path: downloadPath, extracted: false });
            } else {
              resolve({ path: downloadPath, extracted: true });
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      // Navigate to asset page
      await page.goto(asset.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait a bit for page to fully load
      await page.waitForTimeout(2000);

      // Wait for page to be fully interactive
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for download button with multiple strategies
      let clicked = false;
      
      // Strategy 1: Look for common download button selectors
      const downloadSelectors = [
        'a[href*="download"]',
        'button:has-text("Download")',
        'a:has-text("Download")',
        'a:has-text("DOWNLOAD")',
        '.download',
        '.download-button',
        '[class*="download"]',
        '[id*="download"]',
        'a[href*=".zip"]',
        'a[href*="/download"]',
        'button[class*="btn"]',
        'a.btn'
      ];

      for (const selector of downloadSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          const element = await page.$(selector);
          if (element) {
            const isVisible = await element.isVisible();
            if (isVisible) {
              await element.click();
              clicked = true;
              console.log(`  ✓ Clicked download button: ${selector}`);
              break;
            }
          }
        } catch (e) {
          // Try next selector
        }
      }

      // Strategy 2: Find all links and check for download-related text/href
      if (!clicked) {
        try {
          const links = await page.$$eval('a', (elements) => 
            elements.map(el => ({
              href: el.getAttribute('href'),
              text: el.textContent?.trim(),
              visible: el.offsetParent !== null
            }))
          );

          for (const linkInfo of links) {
            if (!linkInfo.visible) continue;
            
            const href = linkInfo.href?.toLowerCase() || '';
            const text = linkInfo.text?.toLowerCase() || '';
            
            if (href.includes('download') || href.includes('.zip') || 
                text.includes('download') || text.includes('get') ||
                href.includes('/downloads/') || href.includes('/files/')) {
              try {
                await page.click(`a[href="${linkInfo.href}"]`);
                clicked = true;
                console.log(`  ✓ Clicked download link: ${linkInfo.href}`);
                break;
              } catch (e) {
                // Try next link
              }
            }
          }
        } catch (e) {
          console.log(`  Error finding links: ${e.message}`);
        }
      }

      // Strategy 3: Look for buttons with download-related text
      if (!clicked) {
        try {
          const buttons = await page.$$('button, a');
          for (const button of buttons) {
            const text = await button.textContent();
            const href = await button.getAttribute('href');
            if (text && (text.toLowerCase().includes('download') || 
                        text.toLowerCase().includes('get') ||
                        text.toLowerCase().includes('free'))) {
              try {
                await button.click();
                clicked = true;
                console.log(`  ✓ Clicked button: ${text}`);
                break;
              } catch (e) {
                // Continue
              }
            }
          }
        } catch (e) {
          // Continue
        }
      }

      if (clicked) {
        // Wait for download or redirect
        await page.waitForTimeout(3000);
        
        // Check if we're on a "continue without donating" page
        const continueSelectors = [
          'a:has-text("Continue")',
          'a:has-text("without")',
          'a[href*="continue"]',
          'button:has-text("Continue")'
        ];

        for (const selector of continueSelectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              await element.click();
              console.log(`  Clicked continue button`);
              await page.waitForTimeout(2000);
              break;
            }
          } catch (e) {
            // Continue
          }
        }

        // Wait for download to complete
        try {
          const result = await Promise.race([
            downloadPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
          ]);
          
          if (result && fs.existsSync(result.path)) {
            console.log(`✓ Success: ${asset.name}`);
            successCount++;
          }
        } catch (error) {
          console.log(`  Download timeout or error: ${error.message}`);
        }
      } else {
        console.log(`  Could not find download button for ${asset.name}`);
      }

      await page.close();
    } catch (error) {
      console.log(`✗ Failed: ${asset.name} - ${error.message}`);
    }
  }

  return successCount;
}

/**
 * Download dice model
 */
async function downloadDice() {
  console.log('--- Downloading Dice Model ---');
  
  const diceSources = [
    {
      url: 'https://raw.githubusercontent.com/pmndrs/market/main/public/models/dice.glb',
      output: path.join(ASSETS_DIR, 'models/dice/dice.glb'),
      name: 'Dice (pmndrs/market)'
    },
    // Try alternative sources
    {
      url: 'https://github.com/pmndrs/market/raw/main/public/models/dice.glb',
      output: path.join(ASSETS_DIR, 'models/dice/dice.glb'),
      name: 'Dice (GitHub raw)'
    }
  ];

  for (const source of diceSources) {
    try {
      console.log(`Trying: ${source.name}...`);
      await downloadFile(source.url, source.output);
      if (fs.existsSync(source.output) && fs.statSync(source.output).size > 0) {
        console.log(`✓ Success: ${source.name}`);
        return true;
      } else {
        if (fs.existsSync(source.output)) fs.unlinkSync(source.output);
      }
    } catch (error) {
      console.log(`✗ Failed: ${source.name}`);
    }
  }
  
  return false;
}

/**
 * Use Playwright to download from sites that require browser interaction
 */
async function downloadWithPlaywright() {
  console.log('==========================================');
  console.log('Downloading 3D assets with Playwright...');
  console.log('==========================================');
  console.log('');

  let totalSuccess = 0;

  // Try direct downloads first (faster)
  console.log('Step 1: Trying direct downloads...');
  const threeJSCount = await downloadThreeJSModels();
  totalSuccess += threeJSCount;
  
  const diceSuccess = await downloadDice();
  if (diceSuccess) totalSuccess++;

  // If we got some assets, we're good
  if (totalSuccess > 0) {
    console.log('');
    console.log(`✓ Successfully downloaded ${totalSuccess} assets`);
    return totalSuccess;
  }

  // If direct downloads failed, try Playwright for interactive sites
  console.log('');
  console.log('Step 2: Direct downloads failed, trying browser automation...');
  
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for Docker
    });
    
    // Try to download from Kenney.nl using browser automation
    const kenneyCount = await downloadFromKenney(browser);
    totalSuccess += kenneyCount;

    await browser.close();
  } catch (error) {
    console.log(`Playwright error: ${error.message}`);
    if (browser) await browser.close();
  }

  console.log('');
  console.log(`Download Summary: ${totalSuccess} assets downloaded`);
  return totalSuccess;
}

// Main execution
downloadWithPlaywright()
  .then((count) => {
    if (count === 0) {
      console.log('');
      console.log('⚠️  No assets downloaded automatically.');
      console.log('The game will use procedural models or fallbacks.');
      process.exit(0); // Don't fail the build
    } else {
      console.log('');
      console.log('✓ Asset download completed successfully!');
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error('Download error:', error);
    console.log('Build will continue with fallback models.');
    process.exit(0); // Don't fail the build
  });
