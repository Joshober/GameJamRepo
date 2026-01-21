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
import { extractZip } from './extract-zip.js';
import { execSync } from 'child_process';

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
      url: 'https://kenney.nl/assets/blocky-characters',
      name: 'Blocky Characters',
      outputDir: path.join(ASSETS_DIR, 'models/characters'),
      extractTo: 'models/characters',
      filterFiles: (filePath) => {
        // Extract GLTF/GLB character files
        const lowerPath = filePath.toLowerCase();
        if (lowerPath.endsWith('.glb') || lowerPath.endsWith('.gltf')) {
          // Try to name them character_1.glb, character_2.glb, etc.
          const filename = path.basename(filePath);
          return `models/characters/${filename}`;
        }
        // Also extract FBX/OBJ if present (we can convert later)
        if (lowerPath.endsWith('.fbx') || lowerPath.endsWith('.obj')) {
          const filename = path.basename(filePath);
          return `models/characters/${filename}`;
        }
        return null;
      }
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

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Wait for page to be fully interactive
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Kenney.nl specific flow:
      // 1. Click "Download" link (href="#inline-download")
      // 2. Wait for dialog modal to appear
      // 3. Click "Continue without donating..." link in the dialog
      
      let clicked = false;
      
      // Step 1: Find and click the Download link
      try {
        // Wait for page to be fully loaded
        await page.waitForLoadState('domcontentloaded');
        
        // Look for the download link - Kenney.nl uses href="#inline-download"
        // Try multiple ways to find it
        const downloadSelectors = [
          'a[href="#inline-download"]',
          'a[href*="inline-download"]',
          'a:has-text("Download")',
          'a:has-text("DOWNLOAD")'
        ];
        
        let downloadLink = null;
        for (const selector of downloadSelectors) {
          try {
            downloadLink = await page.$(selector);
            if (downloadLink && await downloadLink.isVisible()) {
              break;
            }
            downloadLink = null;
          } catch (e) {
            // Try next selector
          }
        }
        
        if (downloadLink) {
          await downloadLink.click();
          console.log(`  ✓ Clicked Download button`);
          clicked = true;
          
          // Step 2: Wait for the dialog modal to appear
          try {
            await page.waitForSelector('dialog[open], dialog, [role="dialog"]', { timeout: 5000 });
            await page.waitForTimeout(1500); // Give it a moment to fully render
            
            // Step 3: Find and click "Continue without donating..." link
            // This link contains the actual download URL
            const continueSelectors = [
              'a:has-text("Continue without donating")',
              'a:has-text("Continue")',
              'dialog a[href*=".zip"]',
              'dialog a[href*="/media/"]',
              '[role="dialog"] a[href*=".zip"]',
              '[role="dialog"] a[href*="/media/"]'
            ];
            
            let continueClicked = false;
            for (const selector of continueSelectors) {
              try {
                const continueLink = await page.$(selector);
                if (continueLink) {
                  const href = await continueLink.getAttribute('href');
                  const text = await continueLink.textContent();
                  if (href && (href.includes('.zip') || href.includes('/media/'))) {
                    await continueLink.click();
                    console.log(`  ✓ Clicked continue link (${text?.trim() || 'link'}): ${href.substring(0, 60)}...`);
                    continueClicked = true;
                    break;
                  }
                }
              } catch (e) {
                // Try next selector
              }
            }
            
            // Fallback: Find any link in the dialog that looks like a download
            if (!continueClicked) {
              try {
                const dialogLinks = await page.$$eval('dialog a, [role="dialog"] a', (links) => 
                  links.map(link => ({
                    href: link.getAttribute('href'),
                    text: link.textContent?.trim(),
                    visible: link.offsetParent !== null
                  }))
                );
                
                for (const linkInfo of dialogLinks) {
                  if (!linkInfo.visible) continue;
                  if (linkInfo.href && (linkInfo.href.includes('.zip') || 
                                       linkInfo.href.includes('/media/') ||
                                       linkInfo.text?.toLowerCase().includes('continue'))) {
                    await page.click(`a[href="${linkInfo.href}"]`);
                    console.log(`  ✓ Clicked dialog link: ${linkInfo.href.substring(0, 60)}...`);
                    continueClicked = true;
                    break;
                  }
                }
              } catch (e) {
                console.log(`  Could not find continue link in dialog: ${e.message}`);
              }
            }
          } catch (e) {
            console.log(`  Dialog did not appear or error: ${e.message}`);
          }
        } else {
          console.log(`  Could not find Download link on page`);
        }
      } catch (e) {
        console.log(`  Error in download flow: ${e.message}`);
      }

      if (clicked) {
        // Wait for download to complete
        // The download should have been triggered by clicking the continue link
        try {
          const result = await Promise.race([
            downloadPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 20000))
          ]);
          
          if (result && fs.existsSync(result.path)) {
            const fileSize = fs.statSync(result.path).size;
            if (fileSize > 0) {
              console.log(`✓ Downloaded: ${asset.name} (${(fileSize / 1024).toFixed(1)}KB)`);
              
              // Extract ZIP file if it's a ZIP
              if (result.path.endsWith('.zip')) {
                try {
                  console.log(`  Extracting ZIP file...`);
                  extractZip(result.path, ASSETS_DIR, asset.filterFiles);
                  
                  // Rename character files to match expected naming (character-a → character_1, etc.)
                  if (asset.name === 'Blocky Characters') {
                    const charDir = path.join(ASSETS_DIR, 'models/characters');
                    const charMap = [
                      { from: 'character-a.glb', to: 'character_1.glb' },
                      { from: 'character-b.glb', to: 'character_2.glb' },
                      { from: 'character-c.glb', to: 'character_3.glb' },
                      { from: 'character-d.glb', to: 'character_4.glb' }
                    ];
                    
                    console.log(`  Renaming character files in: ${charDir}`);
                    for (const mapping of charMap) {
                      const fromPath = path.join(charDir, mapping.from);
                      const toPath = path.join(charDir, mapping.to);
                      try {
                        if (fs.existsSync(fromPath)) {
                          fs.copyFileSync(fromPath, toPath);
                          // Verify copy succeeded
                          if (fs.existsSync(toPath) && fs.statSync(toPath).size > 0) {
                            console.log(`  ✓ Renamed: ${mapping.from} → ${mapping.to} (${fs.statSync(toPath).size} bytes)`);
                          } else {
                            console.log(`  ✗ Copy failed: ${mapping.from} → ${mapping.to}`);
                          }
                        } else {
                          console.log(`  ⚠ Source not found: ${fromPath}`);
                        }
                      } catch (error) {
                        console.log(`  ✗ Error renaming ${mapping.from}: ${error.message}`);
                      }
                    }
                  }
                  
                  console.log(`✓ Extracted: ${asset.name}`);
                  successCount++;
                  
                  // Clean up ZIP file after extraction
                  fs.unlinkSync(result.path);
                } catch (error) {
                  console.log(`  Extraction error: ${error.message}`);
                  // Still count as success if download worked
                  successCount++;
                }
              } else {
                // Not a ZIP, just mark as success
                successCount++;
              }
            } else {
              console.log(`  Downloaded file is empty`);
              if (fs.existsSync(result.path)) fs.unlinkSync(result.path);
            }
          }
        } catch (error) {
          console.log(`  Download timeout or error: ${error.message}`);
          // Check if file was downloaded anyway (sometimes the promise doesn't fire)
          const downloadedFiles = fs.readdirSync(DOWNLOAD_DIR);
          if (downloadedFiles.length > 0) {
            const latestFile = downloadedFiles[downloadedFiles.length - 1];
            const filePath = path.join(DOWNLOAD_DIR, latestFile);
            if (fs.statSync(filePath).size > 0) {
              console.log(`✓ Found downloaded file: ${latestFile}`);
              
              // Extract if ZIP
              if (latestFile.endsWith('.zip')) {
                try {
                  console.log(`  Extracting ZIP file...`);
                  extractZip(filePath, ASSETS_DIR, asset.filterFiles);
                  
                  // Rename character files to match expected naming
                  if (asset.name === 'Blocky Characters') {
                    const charDir = path.join(ASSETS_DIR, 'models/characters');
                    const charMap = [
                      { from: 'character-a.glb', to: 'character_1.glb' },
                      { from: 'character-b.glb', to: 'character_2.glb' },
                      { from: 'character-c.glb', to: 'character_3.glb' },
                      { from: 'character-d.glb', to: 'character_4.glb' }
                    ];
                    
                    console.log(`  Renaming character files in: ${charDir}`);
                    for (const mapping of charMap) {
                      const fromPath = path.join(charDir, mapping.from);
                      const toPath = path.join(charDir, mapping.to);
                      try {
                        if (fs.existsSync(fromPath)) {
                          fs.copyFileSync(fromPath, toPath);
                          // Verify copy succeeded
                          if (fs.existsSync(toPath) && fs.statSync(toPath).size > 0) {
                            console.log(`  ✓ Renamed: ${mapping.from} → ${mapping.to} (${fs.statSync(toPath).size} bytes)`);
                          } else {
                            console.log(`  ✗ Copy failed: ${mapping.from} → ${mapping.to}`);
                          }
                        } else {
                          console.log(`  ⚠ Source not found: ${fromPath}`);
                        }
                      } catch (error) {
                        console.log(`  ✗ Error renaming ${mapping.from}: ${error.message}`);
                      }
                    }
                  }
                  
                  console.log(`✓ Extracted: ${asset.name}`);
                  fs.unlinkSync(filePath);
                } catch (error) {
                  console.log(`  Extraction error: ${error.message}`);
                }
              }
              
              successCount++;
            }
          }
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
