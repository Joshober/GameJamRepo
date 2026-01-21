/**
 * Generate simple GLTF/GLB files programmatically
 * Creates minimal but valid 3D models for characters and dice
 */

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

/**
 * Generate a minimal GLTF JSON structure for a simple cube (dice)
 */
function generateDiceGLTF() {
  return {
    "asset": { "version": "2.0" },
    "scene": 0,
    "scenes": [{ "nodes": [0] }],
    "nodes": [{
      "mesh": 0,
      "name": "Dice"
    }],
    "meshes": [{
      "primitives": [{
        "attributes": {
          "POSITION": 0,
          "NORMAL": 1
        },
        "indices": 2
      }]
    }],
    "accessors": [
      {
        "bufferView": 0,
        "componentType": 5126,
        "count": 8,
        "type": "VEC3",
        "max": [0.5, 0.5, 0.5],
        "min": [-0.5, -0.5, -0.5]
      },
      {
        "bufferView": 1,
        "componentType": 5126,
        "count": 8,
        "type": "VEC3"
      },
      {
        "bufferView": 2,
        "componentType": 5123,
        "count": 36,
        "type": "SCALAR"
      }
    ],
    "bufferViews": [
      {
        "buffer": 0,
        "byteOffset": 0,
        "byteLength": 96
      },
      {
        "buffer": 0,
        "byteOffset": 96,
        "byteLength": 96
      },
      {
        "buffer": 0,
        "byteOffset": 192,
        "byteLength": 72
      }
    ],
    "buffers": [{
      "uri": "data:application/octet-stream;base64," + Buffer.from(new Float32Array([
        // Positions (8 vertices of a cube)
        -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, 0.5, -0.5,  -0.5, 0.5, -0.5,
        -0.5, -0.5, 0.5,   0.5, -0.5, 0.5,   0.5, 0.5, 0.5,   -0.5, 0.5, 0.5,
        // Normals (same for all vertices, pointing outward)
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
        // Indices (12 triangles = 36 indices)
        0, 1, 2, 2, 3, 0, 4, 7, 6, 6, 5, 4,
        0, 4, 5, 5, 1, 0, 2, 6, 7, 7, 3, 2,
        0, 3, 7, 7, 4, 0, 1, 5, 6, 6, 2, 1
      ]).buffer).toString('base64'),
      "byteLength": 264
    }],
    "materials": [{
      "pbrMetallicRoughness": {
        "baseColorFactor": [1.0, 1.0, 1.0, 1.0],
        "metallicFactor": 0.1,
        "roughnessFactor": 0.3
      }
    }]
  };
}

/**
 * Generate a minimal GLTF for a character (simple cylinder/cone shape)
 */
function generateCharacterGLTF(color) {
  const r = ((color >> 16) & 0xFF) / 255;
  const g = ((color >> 8) & 0xFF) / 255;
  const b = (color & 0xFF) / 255;
  
  return {
    "asset": { "version": "2.0" },
    "scene": 0,
    "scenes": [{ "nodes": [0] }],
    "nodes": [{
      "mesh": 0,
      "name": "Character"
    }],
    "meshes": [{
      "primitives": [{
        "attributes": {
          "POSITION": 0,
          "NORMAL": 1
        },
        "indices": 2,
        "material": 0
      }]
    }],
    "materials": [{
      "pbrMetallicRoughness": {
        "baseColorFactor": [r, g, b, 1.0],
        "metallicFactor": 0.3,
        "roughnessFactor": 0.5
      },
      "emissiveFactor": [r * 0.5, g * 0.5, b * 0.5]
    }],
    "accessors": [
      {
        "bufferView": 0,
        "componentType": 5126,
        "count": 16,
        "type": "VEC3",
        "max": [0.7, 1.8, 0.7],
        "min": [-0.7, 0, -0.7]
      },
      {
        "bufferView": 1,
        "componentType": 5126,
        "count": 16,
        "type": "VEC3"
      },
      {
        "bufferView": 2,
        "componentType": 5123,
        "count": 42,
        "type": "SCALAR"
      }
    ],
    "bufferViews": [
      {
        "buffer": 0,
        "byteOffset": 0,
        "byteLength": 192
      },
      {
        "buffer": 0,
        "byteOffset": 192,
        "byteLength": 192
      },
      {
        "buffer": 0,
        "byteOffset": 384,
        "byteLength": 84
      }
    ],
    "buffers": [{
      "uri": "data:application/octet-stream;base64," + Buffer.from(new Float32Array([
        // Simple cylinder vertices (bottom and top circles)
        // Bottom circle (8 vertices)
        0.7, 0, 0, 0.5, 0, 0.5, 0, 0, 0.7, -0.5, 0, 0.5,
        -0.7, 0, 0, -0.5, 0, -0.5, 0, 0, -0.7, 0.5, 0, -0.5,
        // Top circle (8 vertices)
        0.7, 1.8, 0, 0.5, 1.8, 0.5, 0, 1.8, 0.7, -0.5, 1.8, 0.5,
        -0.7, 1.8, 0, -0.5, 1.8, -0.5, 0, 1.8, -0.7, 0.5, 1.8, -0.5,
        // Normals (simplified)
        1, 0, 0, 0.7, 0, 0.7, 0, 0, 1, -0.7, 0, 0.7,
        -1, 0, 0, -0.7, 0, -0.7, 0, 0, -1, 0.7, 0, -0.7,
        1, 0, 0, 0.7, 0, 0.7, 0, 0, 1, -0.7, 0, 0.7,
        -1, 0, 0, -0.7, 0, -0.7, 0, 0, -1, 0.7, 0, -0.7,
        // Indices for cylinder sides
        0, 1, 9, 9, 8, 0, 1, 2, 10, 10, 9, 1,
        2, 3, 11, 11, 10, 2, 3, 4, 12, 12, 11, 3,
        4, 5, 13, 13, 12, 4, 5, 6, 14, 14, 13, 5,
        6, 7, 15, 15, 14, 6, 7, 0, 8, 8, 15, 7,
        // Bottom and top caps
        0, 7, 6, 6, 1, 0, 8, 9, 10, 10, 11, 8
      ]).buffer).toString('base64'),
      "byteLength": 468
    }]
  };
}

// Generate assets
console.log('Generating procedural 3D assets...');

// Generate dice (as GLTF JSON - Three.js can load this)
const diceGLTF = generateDiceGLTF();
const dicePath = path.join(__dirname, 'models/dice/dice.gltf');
fs.writeFileSync(dicePath, JSON.stringify(diceGLTF, null, 2));
console.log('✓ Generated: dice.gltf');

// Generate characters with player colors
const colors = [0xff0000, 0x0000ff, 0xffff00, 0x00ff00];
for (let i = 0; i < 4; i++) {
  const charGLTF = generateCharacterGLTF(colors[i]);
  const charPath = path.join(__dirname, `models/characters/character_${i + 1}.gltf`);
  fs.writeFileSync(charPath, JSON.stringify(charGLTF, null, 2));
  console.log(`✓ Generated: character_${i + 1}.gltf`);
}

console.log('');
console.log('All procedural assets generated successfully!');
console.log('Note: These are simple but valid GLTF files.');
console.log('For better visuals, download assets from Kenney.nl and replace these files.');
