/**
 * Asset Loader for 3D Models and Textures
 * Handles loading, caching, and fallback for 3D assets
 */

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TextureLoader } from 'three';

class AssetLoader {
  constructor() {
    this.loader = new GLTFLoader();
    this.textureLoader = new TextureLoader();
    this.cache = new Map();
    this.loadingPromises = new Map();
    this.onProgress = null;
    this.totalAssets = 0;
    this.loadedAssets = 0;
  }

  /**
   * Set progress callback
   */
  setProgressCallback(callback) {
    this.onProgress = callback;
  }

  /**
   * Update progress
   */
  updateProgress() {
    this.loadedAssets++;
    if (this.onProgress) {
      this.onProgress(this.loadedAssets, this.totalAssets);
    }
  }

  /**
   * Load a GLTF/GLB model
   */
  async loadModel(path) {
    // Check cache first
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    // Check if already loading
    if (this.loadingPromises.has(path)) {
      return this.loadingPromises.get(path);
    }

    // Start loading
    const promise = new Promise((resolve, reject) => {
      // Extract base path for texture resolution (relative paths in GLTF files)
      const basePath = path.substring(0, path.lastIndexOf('/') + 1);
      
      // Handle texture loading errors gracefully
      const originalOnError = this.loader.manager.onError;
      this.loader.manager.onError = (url) => {
        // Suppress 404 errors for textures (they're optional)
        if (url && url.includes('404')) {
          // Silent fail for missing textures
          return;
        }
        if (originalOnError) originalOnError(url);
      };
      
      // Set path for resolving relative texture paths in GLTF files
      this.loader.setPath(basePath);
      
      // Extract just the filename for loading (since we set the base path)
      const filename = path.substring(path.lastIndexOf('/') + 1);
      
      this.loader.load(
        filename,
        (gltf) => {
          this.cache.set(path, gltf);
          this.loadingPromises.delete(path);
          this.updateProgress();
          resolve(gltf);
        },
        (progress) => {
          // Progress tracking if needed
        },
        (error) => {
          this.loadingPromises.delete(path);
          // Suppress 404 errors silently (expected for optional assets)
          if (error && error.target && error.target.status === 404) {
            // Silent fail for missing assets
          } else if (error && (!error.message || !error.message.includes('404'))) {
            console.warn(`Failed to load model: ${path}`, error);
          }
          reject(error);
        }
      );
    });

    this.loadingPromises.set(path, promise);
    return promise;
  }

  /**
   * Load a texture
   */
  async loadTexture(path) {
    // Check cache first
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    // Check if already loading
    if (this.loadingPromises.has(path)) {
      return this.loadingPromises.get(path);
    }

    // Start loading
    const promise = new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => {
          this.cache.set(path, texture);
          this.loadingPromises.delete(path);
          this.updateProgress();
          resolve(texture);
        },
        undefined,
        (error) => {
          this.loadingPromises.delete(path);
          // Suppress 404 errors silently (expected for optional assets)
          if (error && error.target && error.target.status === 404) {
            // Silent fail for missing textures
          } else if (error && (!error.message || !error.message.includes('404'))) {
            console.warn(`Failed to load texture: ${path}`, error);
          }
          reject(error);
        }
      );
    });

    this.loadingPromises.set(path, promise);
    return promise;
  }

  /**
   * Load multiple assets
   */
  async loadAssets(assetList) {
    this.totalAssets = assetList.length;
    this.loadedAssets = 0;

    const promises = assetList.map(asset => {
      if (asset.type === 'model') {
        return this.loadModel(asset.path).catch(() => null);
      } else if (asset.type === 'texture') {
        return this.loadTexture(asset.path).catch(() => null);
      }
      return Promise.resolve(null);
    });

    const results = await Promise.allSettled(promises);
    
    const loaded = {};
    assetList.forEach((asset, index) => {
      if (results[index].status === 'fulfilled' && results[index].value) {
        loaded[asset.name] = results[index].value;
      }
    });

    return loaded;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.forEach((asset, path) => {
      if (asset.scene) {
        // Dispose of 3D model
        asset.scene.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      } else if (asset.dispose) {
        // Dispose of texture
        asset.dispose();
      }
    });
    this.cache.clear();
  }
}

// Export singleton instance
export const assetLoader = new AssetLoader();

// Default asset paths (will be used if assets exist)
// Supports both .glb and .gltf extensions
export const ASSET_PATHS = {
  // Board assets
  boardBase: '/assets/models/board/board_base.glb',
  spaceMarker: '/assets/models/board/space_marker.glb',
  
  // Character assets (try .glb first, then .gltf)
  character1: '/assets/models/characters/character_1.glb',
  character1Alt: '/assets/models/characters/character_1.gltf',
  character2: '/assets/models/characters/character_2.glb',
  character2Alt: '/assets/models/characters/character_2.gltf',
  character3: '/assets/models/characters/character_3.glb',
  character3Alt: '/assets/models/characters/character_3.gltf',
  character4: '/assets/models/characters/character_4.glb',
  character4Alt: '/assets/models/characters/character_4.gltf',
  
  // Dice (try .glb first, then .gltf)
  dice: '/assets/models/dice/dice.glb',
  diceAlt: '/assets/models/dice/dice.gltf',
  
  // Textures
  boardWood: '/assets/textures/board_wood.jpg',
  spaceNormal: '/assets/textures/space_normal.jpg',
  spaceBonus: '/assets/textures/space_bonus.jpg',
};
