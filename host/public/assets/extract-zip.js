/**
 * Extract ZIP file and organize files based on filter function
 */

import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { promisify } from 'util';
import { execSync } from 'child_process';

/**
 * Extract ZIP file using unzip command (more reliable than JS libraries)
 */
export function extractZip(zipPath, extractTo, filterFiles = null) {
  if (!fs.existsSync(zipPath)) {
    throw new Error(`ZIP file not found: ${zipPath}`);
  }

  const extractDir = path.dirname(zipPath);
  const tempExtractDir = path.join(extractDir, 'temp_extract');
  
  // Create temp directory
  if (!fs.existsSync(tempExtractDir)) {
    fs.mkdirSync(tempExtractDir, { recursive: true });
  }

  try {
    // Extract ZIP to temp directory
    execSync(`unzip -q "${zipPath}" -d "${tempExtractDir}"`, { stdio: 'inherit' });
    
    // If filter function provided, organize files
    if (filterFiles) {
      organizeExtractedFiles(tempExtractDir, extractTo, filterFiles);
    } else {
      // Just move everything to extractTo
      moveDirectory(tempExtractDir, extractTo);
    }
    
    // Clean up temp directory
    if (fs.existsSync(tempExtractDir)) {
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
    }
    
    return true;
  } catch (error) {
    console.error(`Error extracting ZIP: ${error.message}`);
    // Clean up on error
    if (fs.existsSync(tempExtractDir)) {
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
    }
    throw error;
  }
}

/**
 * Organize extracted files based on filter function
 */
function organizeExtractedFiles(sourceDir, baseOutputDir, filterFiles) {
  function walkDir(dir, basePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        walkDir(fullPath, relativePath);
      } else {
        // Check if file should be extracted and where
        const targetDir = filterFiles(relativePath);
        if (targetDir) {
          // If targetDir already includes filename, use it directly
          // Otherwise append entry.name
          let outputPath;
          if (targetDir.endsWith(entry.name) || targetDir.includes('/')) {
            // targetDir is a full path including filename
            outputPath = path.join(baseOutputDir, targetDir);
          } else {
            // targetDir is just a directory, append filename
            outputPath = path.join(baseOutputDir, targetDir, entry.name);
          }
          
          const outputDir = path.dirname(outputPath);
          
          // Create output directory
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          
          // Copy file
          fs.copyFileSync(fullPath, outputPath);
          console.log(`  Extracted: ${relativePath} → ${path.relative(baseOutputDir, outputPath)}`);
        }
      }
    }
  }
  
  walkDir(sourceDir);
}

/**
 * Move entire directory
 */
function moveDirectory(sourceDir, targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  const entries = fs.readdirSync(sourceDir);
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry);
    const targetPath = path.join(targetDir, entry);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      moveDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}
