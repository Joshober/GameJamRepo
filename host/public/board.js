import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { assetLoader, ASSET_PATHS } from './assets/assetLoader.js';

// Handle import errors gracefully
let assetLoaderAvailable = true;
try {
  // Asset loader is imported above
} catch (e) {
  console.warn('Asset loader not available, using fallbacks');
  assetLoaderAvailable = false;
}

// Board configuration
let boardConfig = null;

// Game state
let boardState = {
  players: [
    { id: 0, name: 'P1', position: 0, coins: 0, stars: 0, color: 0xff0000 },
    { id: 1, name: 'P2', position: 0, coins: 0, stars: 0, color: 0x0000ff },
    { id: 2, name: 'P3', position: 0, coins: 0, stars: 0, color: 0xffff00 },
    { id: 3, name: 'P4', position: 0, coins: 0, stars: 0, color: 0x00ff00 }
  ],
  currentTurn: 0,
  gamePhase: 'waiting', // waiting, rolling, moving, spaceEffect, minigame
  spaces: [],
  boardPath: [],
  totalSpaces: 28,
  nodes: [],
  edges: []
};

// Main game state (synced from server)
let mainState = {
  coins: [0, 0, 0, 0],
  stars: [0, 0, 0, 0]
};

// Three.js setup
let scene, camera, renderer, controls;
let playerPieces = [];
let spaceMeshes = [];
let diceMesh = null;
let loadedAssets = {};
let assetsLoaded = false;

// Environmental props and effects
let environmentalProps = [];
let ambientEffects = [];

// Constants
const PRIZE_COINS = [10, 5, 3, 1];  // Coins for 1st, 2nd, 3rd, 4th place
const PRIZE_STARS = [1, 0, 0, 0];   // Stars for 1st place only
const PLAYER_COLORS = [0xff0000, 0x0000ff, 0xffff00, 0x00ff00];
const ANIMATION_DURATIONS = {
  DICE_ROLL: 2000,
  PARTICLE_LIFETIME: 60,
  SPARKLE_LIFETIME: 30,
  SPACE_EFFECT_DELAY: 2000,
  PRIZE_DISPLAY: 4000
};

// WebSocket connection
const ws = new WebSocket(`ws://${location.host}`);

// Initialize
init();

async function init() {
  setupThreeJS();
  setupUI();
  setupWebSocket();
  
  // Show loading indicator
  showLoadingIndicator();
  
  // Load board configuration
  await loadBoardConfig();
  
  // Try to load assets
  await loadAssets();
  
  // Create board and pieces (will use assets if loaded, fallback otherwise)
  await createBoard();
  createPlayerPieces();
  createDice();
  setupLighting();
  
  // Hide loading indicator
  hideLoadingIndicator();
  
  animate();
}

function showLoadingIndicator() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.remove('hidden');
    const progressEl = document.getElementById('loading-progress');
    if (progressEl) progressEl.textContent = '0%';
  }
  
  if (assetLoaderAvailable && assetLoader) {
    assetLoader.setProgressCallback((loaded, total) => {
      const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
      const progressEl = document.getElementById('loading-progress');
      if (progressEl) {
        progressEl.textContent = `${percent}%`;
      }
    });
  }
}

function hideLoadingIndicator() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.opacity = '0';
    loading.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      loading.classList.add('hidden');
      loading.style.opacity = '1';
    }, 500);
  }
}

async function loadBoardConfig() {
  try {
    const response = await fetch('/board.json');
    boardConfig = await response.json();
    boardState.totalSpaces = boardConfig.nodes.length;
    boardState.nodes = boardConfig.nodes;
    boardState.edges = boardConfig.edges;
    console.log('Loaded board config:', boardConfig.meta.name);
  } catch (error) {
    console.warn('Failed to load board.json, using default board:', error);
    // Use default circular board if JSON fails
  }
}

async function loadAssets() {
  if (!assetLoaderAvailable || !assetLoader) {
    console.log('Asset loader not available, using procedural models');
    assetsLoaded = false;
    return;
  }
  
  // Load essential assets
  const assetList = [
    { type: 'model', name: 'character1', path: ASSET_PATHS.character1 },
    { type: 'model', name: 'character2', path: ASSET_PATHS.character2 },
    { type: 'model', name: 'character3', path: ASSET_PATHS.character3 },
    { type: 'model', name: 'character4', path: ASSET_PATHS.character4 },
    { type: 'model', name: 'dice', path: ASSET_PATHS.dice },
  ];
  
  // Load board tiles (try to load common ones)
  const boardTiles = [
    'path-straight', 'path-corner', 'path-crossing', 'path-end',
    'path-intersectionA', 'path-intersectionB', 'path-intersectionC', 'path-intersectionD',
    'grass', 'dirt', 'stone', 'water'
  ];
  
  for (const tile of boardTiles) {
    assetList.push({
      type: 'model',
      name: `board_${tile}`,
      path: `/assets/models/board/${tile}.glb`
    });
  }
  
  // Load dice textures
  const diceTextures = [
    '/assets/textures/dice/dice_1.png',
    '/assets/textures/dice/dice_2.png',
    '/assets/textures/dice/dice_3.png',
    '/assets/textures/dice/dice_4.png',
    '/assets/textures/dice/dice_5.png',
    '/assets/textures/dice/dice_6.png'
  ];
  
  for (const texPath of diceTextures) {
    assetList.push({
      type: 'texture',
      name: `dice_tex_${texPath.split('/').pop().replace('.png', '')}`,
      path: texPath
    });
  }
  
  try {
    // Try primary paths (.glb)
    loadedAssets = await assetLoader.loadAssets(assetList);
    
    // Try fallback paths (.gltf) for characters and dice
    const fallbackPaths = {
      character1: ASSET_PATHS.character1Alt,
      character2: ASSET_PATHS.character2Alt,
      character3: ASSET_PATHS.character3Alt,
      character4: ASSET_PATHS.character4Alt,
      dice: ASSET_PATHS.diceAlt
    };
    
    for (const [name, fallbackPath] of Object.entries(fallbackPaths)) {
      if (!loadedAssets[name]) {
        try {
          const fallback = await assetLoader.loadModel(fallbackPath);
          if (fallback) {
            loadedAssets[name] = fallback;
            console.log(`Loaded ${name} from fallback: ${fallbackPath}`);
          }
        } catch (e) {
          // Fallback also failed, will use procedural model
        }
      }
    }
    
    // Load decor models from board.json if available
    if (boardConfig && boardConfig.decor) {
      for (const decor of boardConfig.decor) {
        if (decor.optional && !loadedAssets[`decor_${decor.model}`]) continue;
        try {
          const decorModel = await assetLoader.loadModel(decor.model);
          if (decorModel) {
            loadedAssets[`decor_${decor.model}`] = decorModel;
          }
        } catch (e) {
          // Decor model failed, skip it
        }
      }
    }
    
    // Load game props (optional - will use procedural fallbacks if not available)
    const gameProps = [
      { name: 'pipe', path: ASSET_PATHS.pipe },
      { name: 'shop', path: ASSET_PATHS.shop },
      { name: 'tree', path: ASSET_PATHS.tree },
      { name: 'rock', path: ASSET_PATHS.rock },
      { name: 'coin', path: ASSET_PATHS.coin },
      { name: 'starCoin', path: ASSET_PATHS.starCoin },
      { name: 'doomImp', path: ASSET_PATHS.doomImp },
      { name: 'pacmanGhost', path: ASSET_PATHS.pacmanGhost },
      { name: 'tetrisBlock', path: ASSET_PATHS.tetrisBlock },
      { name: 'spaceInvader', path: ASSET_PATHS.spaceInvader },
      { name: 'arcadeCabinet', path: ASSET_PATHS.arcadeCabinet }
    ];
    
    for (const prop of gameProps) {
      try {
        const propModel = await assetLoader.loadModel(prop.path);
        if (propModel) {
          loadedAssets[prop.name] = propModel;
        }
      } catch (e) {
        // Prop model failed, will use procedural fallback
      }
    }
    
    assetsLoaded = Object.keys(loadedAssets).length > 0;
    console.log('Loaded assets:', Object.keys(loadedAssets));
  } catch (error) {
    console.warn('Some assets failed to load, using fallbacks:', error);
    assetsLoaded = false;
  }
}

function setupThreeJS() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  scene.fog = new THREE.Fog(0x1a1a2e, 50, 200);

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 30, 40);
  camera.lookAt(0, 0, 0);

  // Renderer
  const canvas = document.getElementById('board-canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 20;
  controls.maxDistance = 100;
  controls.maxPolarAngle = Math.PI / 2.2;

  // Handle window resize
  window.addEventListener('resize', onWindowResize);
}

async function createBoard() {
  // Create base ground plane
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a6741, // Grass green
    roughness: 0.9,
    metalness: 0.1
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Use board.json if available, otherwise fallback to circular board
  if (boardConfig && boardConfig.nodes) {
    await createBoardFromConfig();
  } else {
    createCircularBoard();
  }
  
  // Place decor models
  if (boardConfig && boardConfig.decor) {
    placeDecorModels();
  }
}

async function createBoardFromConfig() {
  const nodes = boardConfig.nodes;
  const edges = boardConfig.edges;
  const nodeRadius = boardConfig.meta.style.nodeRadius || 0.55;
  
  // Create node lookup
  const nodeMap = {};
  nodes.forEach(node => {
    nodeMap[node.id] = node;
  });
  
  // Build board path from nodes
  boardState.boardPath = [];
  boardState.spaces = [];
  
  // Create spaces from nodes
  nodes.forEach((node, index) => {
    const pos = new THREE.Vector3(node.pos[0], node.pos[1] + 0.5, node.pos[2]);
    boardState.boardPath.push(pos);
    
    // Map node type to space type
    let spaceType = 'blue';
    let color = 0x4a90e2; // Blue default
    
    if (node.type === 'start') { spaceType = 'start'; color = 0x00ff00; }
    else if (node.type === 'red') { spaceType = 'red'; color = 0xff0000; }
    else if (node.type === 'mini') { spaceType = 'minigame'; color = 0xff6600; }
    else if (node.type === 'event') { spaceType = 'event'; color = 0x9b59b6; }
    else if (node.type === 'star') { spaceType = 'star'; color = 0xffd700; }
    else if (node.type === 'shop') { spaceType = 'shop'; color = 0xff00ff; }
    else if (node.type === 'warp_in') { spaceType = 'warp_in'; color = 0x00ffff; }
    else if (node.type === 'warp_out') { spaceType = 'warp_out'; color = 0x00ffff; }
    
    boardState.spaces.push({
      id: node.id,
      type: spaceType,
      position: pos,
      nodeType: node.type
    });
    
    // Create space marker
    createSpaceMarker(pos, spaceType, color, nodeRadius);
  });
  
  // Create paths between nodes using board tiles
  edges.forEach(edge => {
    const [fromId, toId] = edge;
    const fromNode = nodeMap[fromId];
    const toNode = nodeMap[toId];
    
    if (fromNode && toNode) {
      createPathSegment(fromNode, toNode);
    }
  });
}

function createPathSegment(fromNode, toNode) {
  const from = new THREE.Vector3(fromNode.pos[0], 0, fromNode.pos[2]);
  const to = new THREE.Vector3(toNode.pos[0], 0, toNode.pos[2]);
  const direction = new THREE.Vector3().subVectors(to, from).normalize();
  const distance = from.distanceTo(to);
  const steps = Math.ceil(distance / 2); // Place tiles every 2 units
  
  // Try to use path-straight tile, fallback to procedural
  const pathTile = loadedAssets.board_path_straight || loadedAssets['board_path-straight'];
  
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const pos = new THREE.Vector3().lerpVectors(from, to, t);
    pos.y = 0.1;
    
    if (pathTile && pathTile.scene) {
      const tile = pathTile.scene.clone();
      tile.position.copy(pos);
      tile.rotation.y = Math.atan2(direction.x, direction.z);
      scene.add(tile);
    } else {
      // Procedural path tile
      const tileGeometry = new THREE.BoxGeometry(1.8, 0.2, 1.8);
      const tileMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b7355, // Brown path
        roughness: 0.8
      });
      const tile = new THREE.Mesh(tileGeometry, tileMaterial);
      tile.position.copy(pos);
      tile.receiveShadow = true;
      scene.add(tile);
    }
  }
}

function createSpaceMarker(pos, spaceType, color, radius) {
  let spaceMesh;
  
  // Try to use grass tile as base
  const grassTile = loadedAssets.board_grass;
  if (grassTile && grassTile.scene) {
    spaceMesh = grassTile.scene.clone();
    spaceMesh.scale.set(radius * 2, 1, radius * 2);
    spaceMesh.position.copy(pos);
    spaceMesh.position.y = 0.05;
    scene.add(spaceMesh);
  }
  
  // Create space indicator
  const spaceGeometry = new THREE.CylinderGeometry(radius, radius, 0.15, 16);
  const spaceMaterial = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: spaceType === 'star' ? 0.8 : 0.3,
    roughness: 0.7,
    metalness: spaceType === 'star' ? 0.5 : 0.1
  });
  spaceMesh = new THREE.Mesh(spaceGeometry, spaceMaterial);
  spaceMesh.position.copy(pos);
  spaceMesh.castShadow = true;
  spaceMesh.receiveShadow = true;
  scene.add(spaceMesh);
  spaceMeshes.push(spaceMesh);
  
  // Add glow for special spaces
  if (spaceType === 'star' || spaceType === 'minigame') {
    const glowGeometry = new THREE.CylinderGeometry(radius * 1.2, radius * 1.2, 0.05, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.4
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(pos);
    glow.position.y = 0.2;
    scene.add(glow);
  }
}

/**
 * Place decorative models from board.json
 */
function placeDecorModels() {
  if (!boardConfig || !boardConfig.decor) return;
  
  boardConfig.decor.forEach(decor => {
    const decorKey = `decor_${decor.model}`;
    if (loadedAssets[decorKey] && loadedAssets[decorKey].scene) {
      const model = loadedAssets[decorKey].scene.clone();
      model.position.set(decor.pos[0], decor.pos[1], decor.pos[2]);
      model.scale.set(decor.scale || 1, decor.scale || 1, decor.scale || 1);
      model.rotation.y = decor.rotY || 0;
      scene.add(model);
      environmentalProps.push(model);
    } else {
      // Create procedural fallback for common props
      createProceduralProp(decor);
    }
  });
  
  // Create ambient effects for special spaces
  createAmbientEffects();
}

/**
 * Create procedural fallback for props that don't have models
 * @param {Object} decor - Decor configuration from board.json
 */
function createProceduralProp(decor) {
  const modelPath = decor.model.toLowerCase();
  
  // Create simple procedural models for common props
  if (modelPath.includes('pipe')) {
    const pipeGroup = new THREE.Group();
    const pipeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 16);
    const pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.position.y = 0.75;
    pipeGroup.add(pipe);
    pipeGroup.position.set(decor.pos[0], decor.pos[1], decor.pos[2]);
    pipeGroup.scale.set(decor.scale || 1, decor.scale || 1, decor.scale || 1);
    pipeGroup.rotation.y = decor.rotY || 0;
    scene.add(pipeGroup);
    environmentalProps.push(pipeGroup);
  } else if (modelPath.includes('tree')) {
    const treeGroup = new THREE.Group();
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    treeGroup.add(trunk);
    
    const leavesGeometry = new THREE.ConeGeometry(1, 1.5, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 2.5;
    treeGroup.add(leaves);
    
    treeGroup.position.set(decor.pos[0], decor.pos[1], decor.pos[2]);
    treeGroup.scale.set(decor.scale || 1, decor.scale || 1, decor.scale || 1);
    treeGroup.rotation.y = decor.rotY || 0;
    scene.add(treeGroup);
    environmentalProps.push(treeGroup);
  } else if (modelPath.includes('coin')) {
    const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
    const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    coin.position.set(decor.pos[0], decor.pos[1] + 1, decor.pos[2]);
    coin.rotation.x = Math.PI / 2;
    coin.rotation.y = decor.rotY || 0;
    scene.add(coin);
    ambientEffects.push({ type: 'coin', mesh: coin, baseY: decor.pos[1] + 1 });
  } else if (modelPath.includes('doom') || modelPath.includes('imp')) {
    // Doom imp/demon reference
    const impGroup = new THREE.Group();
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.6);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    impGroup.add(body);
    
    const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xcc0000 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.1;
    impGroup.add(head);
    
    impGroup.position.set(decor.pos[0], decor.pos[1], decor.pos[2]);
    impGroup.scale.set(decor.scale || 1, decor.scale || 1, decor.scale || 1);
    impGroup.rotation.y = decor.rotY || 0;
    scene.add(impGroup);
    environmentalProps.push(impGroup);
  } else if (modelPath.includes('pacman') || modelPath.includes('ghost')) {
    // Pacman ghost reference
    const ghostGroup = new THREE.Group();
    const ghostBodyGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.6, 8);
    const ghostColors = [0xff0000, 0xff69b4, 0x00ffff, 0xffa500]; // Blinky, Pinky, Inky, Clyde
    const ghostColor = ghostColors[Math.floor(Math.random() * ghostColors.length)];
    const ghostMaterial = new THREE.MeshStandardMaterial({ color: ghostColor });
    const ghostBody = new THREE.Mesh(ghostBodyGeometry, ghostMaterial);
    ghostBody.position.y = 0.3;
    ghostGroup.add(ghostBody);
    
    const ghostHeadGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const ghostHead = new THREE.Mesh(ghostHeadGeometry, ghostMaterial);
    ghostHead.position.y = 0.9;
    ghostGroup.add(ghostHead);
    
    ghostGroup.position.set(decor.pos[0], decor.pos[1], decor.pos[2]);
    ghostGroup.scale.set(decor.scale || 1, decor.scale || 1, decor.scale || 1);
    ghostGroup.rotation.y = decor.rotY || 0;
    scene.add(ghostGroup);
    environmentalProps.push(ghostGroup);
    ambientEffects.push({ type: 'ghost', mesh: ghostGroup, baseY: decor.pos[1] });
  } else if (modelPath.includes('tetris') || modelPath.includes('block')) {
    // Tetris block reference
    const blockGroup = new THREE.Group();
    const blockColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
    for (let i = 0; i < 4; i++) {
      const blockGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const blockMaterial = new THREE.MeshStandardMaterial({ 
        color: blockColors[i % blockColors.length],
        emissive: blockColors[i % blockColors.length],
        emissiveIntensity: 0.3
      });
      const block = new THREE.Mesh(blockGeometry, blockMaterial);
      block.position.set((i % 2) * 0.35 - 0.175, Math.floor(i / 2) * 0.35, 0);
      blockGroup.add(block);
    }
    blockGroup.position.set(decor.pos[0], decor.pos[1] + 0.6, decor.pos[2]);
    blockGroup.scale.set(decor.scale || 1, decor.scale || 1, decor.scale || 1);
    blockGroup.rotation.y = decor.rotY || 0;
    scene.add(blockGroup);
    environmentalProps.push(blockGroup);
    ambientEffects.push({ type: 'tetris', mesh: blockGroup, baseY: decor.pos[1] + 0.6 });
  } else if (modelPath.includes('invader') || modelPath.includes('space')) {
    // Space Invader reference
    const invaderGroup = new THREE.Group();
    const invaderBodyGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.3);
    const invaderMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const invaderBody = new THREE.Mesh(invaderBodyGeometry, invaderMaterial);
    invaderBody.position.y = 0.3;
    invaderGroup.add(invaderBody);
    
    const antennaGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.2);
    const antenna = new THREE.Mesh(antennaGeometry, invaderMaterial);
    antenna.position.set(0, 0.75, 0);
    invaderGroup.add(antenna);
    
    invaderGroup.position.set(decor.pos[0], decor.pos[1], decor.pos[2]);
    invaderGroup.scale.set(decor.scale || 1, decor.scale || 1, decor.scale || 1);
    invaderGroup.rotation.y = decor.rotY || 0;
    scene.add(invaderGroup);
    environmentalProps.push(invaderGroup);
  } else if (modelPath.includes('arcade') || modelPath.includes('cabinet')) {
    // Arcade cabinet reference
    const cabinetGroup = new THREE.Group();
    const cabinetBodyGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.4);
    const cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const cabinetBody = new THREE.Mesh(cabinetBodyGeometry, cabinetMaterial);
    cabinetBody.position.y = 0.75;
    cabinetGroup.add(cabinetBody);
    
    const screenGeometry = new THREE.PlaneGeometry(0.5, 0.4);
    const screenMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 1, 0.21);
    screen.rotation.x = -Math.PI / 2;
    cabinetGroup.add(screen);
    
    cabinetGroup.position.set(decor.pos[0], decor.pos[1], decor.pos[2]);
    cabinetGroup.scale.set(decor.scale || 1, decor.scale || 1, decor.scale || 1);
    cabinetGroup.rotation.y = decor.rotY || 0;
    scene.add(cabinetGroup);
    environmentalProps.push(cabinetGroup);
  }
}

/**
 * Create ambient effects for special spaces (animated coins, sparkles, etc.)
 */
function createAmbientEffects() {
  if (!boardState || !boardState.spaces) return;
  
  boardState.spaces.forEach((space, index) => {
    const spacePos = boardState.boardPath[index];
    if (!spacePos) return;
    
    // Animated coins above bonus spaces
    if (space.type === 'bonus') {
      const coinGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
      const coinMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.5
      });
      const coin = new THREE.Mesh(coinGeometry, coinMaterial);
      coin.position.set(spacePos.x, 2, spacePos.z);
      coin.rotation.x = Math.PI / 2;
      scene.add(coin);
      ambientEffects.push({ type: 'coin', mesh: coin, baseY: 2, spaceIndex: index });
    }
    
    // Continuous sparkle effects on star spaces
    if (space.type === 'star') {
      for (let i = 0; i < 5; i++) {
        const sparkleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const sparkleMaterial = new THREE.MeshBasicMaterial({
          color: 0xffd700,
          transparent: true,
          opacity: 0.8
        });
        const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
        const angle = (i / 5) * Math.PI * 2;
        const radius = 1.5;
        sparkle.position.set(
          spacePos.x + Math.cos(angle) * radius,
          1.5 + Math.sin(Date.now() * 0.001 + i) * 0.3,
          spacePos.z + Math.sin(angle) * radius
        );
        scene.add(sparkle);
        ambientEffects.push({ 
          type: 'sparkle', 
          mesh: sparkle, 
          basePos: new THREE.Vector3(spacePos.x, 1.5, spacePos.z),
          angle: angle,
          radius: radius,
          offset: i
        });
      }
    }
  });
}

function createCircularBoard() {
  // Fallback circular board if board.json not available
  const radius = 20;
  boardState.boardPath = [];
  
  for (let i = 0; i < boardState.totalSpaces; i++) {
    const angle = (i / boardState.totalSpaces) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const pos = new THREE.Vector3(x, 0.5, z);
    boardState.boardPath.push(pos);
    
    let spaceType = 'blue';
    let color = 0x4a90e2;
    if (i % 8 === 0) spaceType = 'minigame', color = 0xff0000;
    else if (i % 7 === 0) spaceType = 'bonus', color = 0x00ff00;
    else if (i % 10 === 0) spaceType = 'star', color = 0xffd700;
    else if (i % 6 === 0) spaceType = 'event', color = 0x9b59b6;
    
    boardState.spaces.push({ id: i, type: spaceType, position: pos });
    createSpaceMarker(pos, spaceType, color, 0.55);
  }
}

/**
 * Create player pieces for all 4 players
 */
function createPlayerPieces() {
  playerPieces = [];
  const characterKeys = ['character1', 'character2', 'character3', 'character4'];
  
  for (let i = 0; i < 4; i++) {
    let pieceGroup;
    
    // Try to use loaded character model
    if (loadedAssets[characterKeys[i]] && loadedAssets[characterKeys[i]].scene) {
      pieceGroup = loadedAssets[characterKeys[i]].scene.clone();
      
      // Apply player color to materials
      pieceGroup.traverse((child) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if (mat && mat.color) {
                mat.color.setHex(PLAYER_COLORS[i]);
                if (mat.emissive) {
                  mat.emissive.setHex(PLAYER_COLORS[i]);
                  mat.emissiveIntensity = 0.3;
                }
              }
            });
          } else {
            if (child.material.color) {
              child.material.color.setHex(PLAYER_COLORS[i]);
            }
            if (child.material.emissive) {
              child.material.emissive.setHex(PLAYER_COLORS[i]);
              child.material.emissiveIntensity = 0.3;
            }
          }
          child.castShadow = true;
        }
      });
      
      // Scale appropriately
      pieceGroup.scale.set(0.5, 0.5, 0.5);
    } else {
      // Fallback: Create enhanced procedural player piece
      pieceGroup = new THREE.Group();
      
      // Base platform
      const baseGeometry = new THREE.CylinderGeometry(1.0, 1.0, 0.3, 16);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: PLAYER_COLORS[i],
        emissive: PLAYER_COLORS[i],
        emissiveIntensity: 0.2,
        roughness: 0.7,
        metalness: 0.2
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = -0.85;
      base.castShadow = true;
      base.receiveShadow = true;
      pieceGroup.add(base);
      
      // Main body (tapered cylinder for better Mario Party look)
      const bodyGeometry = new THREE.CylinderGeometry(0.7, 0.9, 1.8, 12);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: PLAYER_COLORS[i],
        emissive: PLAYER_COLORS[i],
        emissiveIntensity: 0.5,
        roughness: 0.5,
        metalness: 0.3
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.1;
      body.castShadow = true;
      pieceGroup.add(body);
      
      // Glow ring at base
      const ringGeometry = new THREE.TorusGeometry(1.0, 0.08, 8, 24);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: PLAYER_COLORS[i],
        transparent: true,
        opacity: 0.7
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.7;
      pieceGroup.add(ring);
      
      // Player number indicator (colored sphere with number)
      const numberGeometry = new THREE.SphereGeometry(0.35, 12, 12);
      const numberMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.3,
        roughness: 0.3,
        metalness: 0.7
      });
      const numberSphere = new THREE.Mesh(numberGeometry, numberMaterial);
      numberSphere.position.y = 1.3;
      pieceGroup.add(numberSphere);
      
      // Add colored band around middle
      const bandGeometry = new THREE.TorusGeometry(0.8, 0.1, 8, 24);
      const bandMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: PLAYER_COLORS[i],
        emissiveIntensity: 0.4,
        roughness: 0.4,
        metalness: 0.5
      });
      const band = new THREE.Mesh(bandGeometry, bandMaterial);
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.1;
      pieceGroup.add(band);
    }
    
    pieceGroup.position.copy(boardState.boardPath[0]);
    pieceGroup.position.y = 1.5;
    scene.add(pieceGroup);
    playerPieces.push(pieceGroup);
  }
}

function createDice() {
  // Try to use loaded dice model
  if (loadedAssets.dice && loadedAssets.dice.scene) {
    diceMesh = loadedAssets.dice.scene.clone();
    
    // Apply dice textures if available
    const textureLoader = new THREE.TextureLoader();
    diceMesh.traverse((child) => {
      if (child.isMesh && child.material) {
        // Try to apply dice textures to faces
        const materials = [];
        for (let i = 0; i < 6; i++) {
          const texKey = `dice_tex_dice_${i + 1}`;
          if (loadedAssets[texKey]) {
            materials.push(new THREE.MeshStandardMaterial({
              map: loadedAssets[texKey],
              roughness: 0.3,
              metalness: 0.1
            }));
          } else {
            materials.push(new THREE.MeshStandardMaterial({
              color: 0xffffff,
              roughness: 0.3,
              metalness: 0.1
            }));
          }
        }
        if (materials.length === 6) {
          child.material = materials;
        }
      }
    });
    
    diceMesh.scale.set(1.5, 1.5, 1.5);
    diceMesh.position.set(0, 5, 0);
    diceMesh.visible = false;
    scene.add(diceMesh);
  } else {
    // Fallback: Create simple dice with textures
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const materials = [];
    
    // Create materials for each face with textures
    for (let i = 1; i <= 6; i++) {
      const texKey = `dice_tex_dice_${i}`;
      if (loadedAssets[texKey]) {
        materials.push(new THREE.MeshStandardMaterial({
          map: loadedAssets[texKey],
          roughness: 0.3,
          metalness: 0.1
        }));
      } else {
        materials.push(new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.3,
          metalness: 0.1
        }));
      }
    }
    
    diceMesh = new THREE.Mesh(geometry, materials);
    diceMesh.position.set(0, 5, 0);
    diceMesh.visible = false;
    scene.add(diceMesh);
  }
}

function setupLighting() {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(20, 30, 20);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 100;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  scene.add(directionalLight);

  // Point lights on special spaces
  boardState.spaces.forEach((space, i) => {
    if (space.type === 'star') {
      const pointLight = new THREE.PointLight(0xffd700, 1, 10);
      pointLight.position.copy(space.position);
      pointLight.position.y = 3;
      scene.add(pointLight);
    }
  });
}

function setupUI() {
  updateScoreboard();
  updateTurnIndicator();
  
  document.getElementById('roll-dice-btn').addEventListener('click', rollDice);
  document.getElementById('cancel-minigame').addEventListener('click', () => {
    // Hide minigame selection panel
    document.getElementById('minigame-select').classList.add('hidden');
    // Hide space info
    document.getElementById('space-info').classList.add('hidden');
    // Reset game phase and continue to next turn
    boardState.gamePhase = 'waiting';
    // Continue game flow - move to next turn
    nextTurn();
  });
}

function setupWebSocket() {
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'BOARD_STATE') {
      boardState = msg.payload;
      updateBoardVisuals();
      updateUI();
    } else if (msg.type === 'PRIZES_AWARDED') {
      // Minigame completed, prizes automatically awarded by server
      // Update board state with new coins/stars
      const prizes = msg.payload;
      console.log('Prizes awarded:', prizes);
      
      // Sync coins and stars from main state (server already applied them)
      fetch('/api/state')
        .then(r => r.json())
        .then(data => {
          syncCoinsAndStars(data);
          
          // Show prize breakdown
          if (prizes && prizes.breakdown) {
            showPrizeBreakdown(prizes.breakdown);
          }
          
          // Continue to next turn after showing prizes
          if (boardState.gamePhase === 'minigame') {
            setTimeout(() => {
              nextTurn();
            }, ANIMATION_DURATIONS.PRIZE_DISPLAY);
          }
        });
    } else if (msg.type === 'STATE') {
      // Sync coins/stars from main state
      syncCoinsAndStars(msg.payload);
    }
  };

  // Request initial state
  fetch('/api/board/state')
    .then(r => r.json())
    .then(data => {
      if (data.state) {
        boardState = data.state;
        updateBoardVisuals();
        updateUI();
      }
    });
  
  // Also get main state for coins/stars
  fetch('/api/state')
    .then(r => r.json())
    .then(data => {
      syncCoinsAndStars(data);
    });
}

/**
 * Sync coins and stars from server state to board state
 * @param {Object} data - State data from server with coins and stars arrays
 */
function syncCoinsAndStars(data) {
  mainState.coins = data.coins || [0, 0, 0, 0];
  mainState.stars = data.stars || [0, 0, 0, 0];
  boardState.players.forEach((p, i) => {
    p.coins = mainState.coins[i] || 0;
    p.stars = mainState.stars[i] || 0;
  });
  updateScoreboard();
}

function updateCamera() {
  // Auto-follow active player
  if (boardState.gamePhase === 'moving' || boardState.gamePhase === 'waiting') {
    const currentPlayer = boardState.players[boardState.currentTurn];
    const playerPos = boardState.boardPath[currentPlayer.position];
    
    // Smooth camera follow
    const targetX = playerPos.x * 0.5;
    const targetZ = playerPos.z * 0.5 + 30;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    camera.lookAt(playerPos.x, 0, playerPos.z);
  }
}

function updateBoardVisuals() {
  // Update player piece positions with smooth animation
  playerPieces.forEach((piece, i) => {
    const player = boardState.players[i];
    const targetPos = boardState.boardPath[player.position];
    piece.position.lerp(targetPos, 0.1);
    piece.position.y = 1.5;
    
    // Add bounce animation for active player
    if (i === boardState.currentTurn && boardState.gamePhase === 'waiting') {
      piece.rotation.y += 0.02;
      piece.position.y = 1.5 + Math.sin(Date.now() * 0.005) * 0.2;
    } else {
      piece.rotation.y = 0;
    }
  });
  
  // Animate space pulsing for special spaces
  spaceMeshes.forEach((mesh, i) => {
    const space = boardState.spaces[i];
    if (space && (space.type === 'star' || space.type === 'minigame')) {
      const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 0.3;
      if (mesh.material && mesh.material.emissive) {
        mesh.material.emissiveIntensity = pulse;
      }
    }
  });
  
  // Update ambient effects
  updateAmbientEffects();
}

/**
 * Update ambient effects (animated coins, sparkles, etc.)
 */
function updateAmbientEffects() {
  if (!ambientEffects || ambientEffects.length === 0) return;
  
  const time = Date.now() * 0.001;
  
  ambientEffects.forEach(effect => {
    if (!effect || !effect.mesh) return;
    
    try {
      if (effect.type === 'coin') {
        // Rotate and float coins
        if (effect.mesh.rotation) effect.mesh.rotation.y += 0.02;
        if (effect.mesh.position && effect.baseY !== undefined) {
          effect.mesh.position.y = effect.baseY + Math.sin(time * 2 + (effect.spaceIndex || 0)) * 0.3;
        }
      } else if (effect.type === 'sparkle') {
        // Animate sparkles around star spaces
        if (effect.basePos && effect.radius !== undefined) {
          const angle = effect.angle + time * 0.5;
          effect.mesh.position.x = effect.basePos.x + Math.cos(angle) * effect.radius;
          effect.mesh.position.z = effect.basePos.z + Math.sin(angle) * effect.radius;
          effect.mesh.position.y = effect.basePos.y + Math.sin(time * 2 + (effect.offset || 0)) * 0.3;
          if (effect.mesh.rotation) effect.mesh.rotation.y += 0.05;
          if (effect.mesh.material) {
            effect.mesh.material.opacity = 0.5 + Math.sin(time * 3 + (effect.offset || 0)) * 0.3;
          }
        }
      } else if (effect.type === 'ghost') {
        // Animate Pacman ghosts floating
        if (effect.mesh.position && effect.baseY !== undefined) {
          effect.mesh.position.y = effect.baseY + Math.sin(time * 1.5) * 0.2;
        }
        if (effect.mesh.rotation) effect.mesh.rotation.y += 0.01;
      } else if (effect.type === 'tetris') {
        // Animate Tetris blocks rotating
        if (effect.mesh.rotation) effect.mesh.rotation.y += 0.02;
        if (effect.mesh.position && effect.baseY !== undefined) {
          effect.mesh.position.y = effect.baseY + Math.sin(time * 2) * 0.1;
        }
      }
    } catch (e) {
      console.warn('Error updating ambient effect:', e);
    }
  });
}

function updateUI() {
  updateScoreboard();
  updateTurnIndicator();
  
  const currentPlayer = boardState.players[boardState.currentTurn];
  const rollBtn = document.getElementById('roll-dice-btn');
  rollBtn.disabled = boardState.gamePhase !== 'waiting';
}

function updateScoreboard() {
  const container = document.getElementById('player-scores');
  container.innerHTML = '';
  
  boardState.players.forEach((player, i) => {
    const item = document.createElement('div');
    item.className = `player-score-item ${i === boardState.currentTurn ? 'active' : ''}`;
    item.innerHTML = `
      <div>
        <span class="player-name">${player.name}</span>
        <div class="player-stats">
          <span class="coin">🪙 ${player.coins}</span>
          <span class="star">⭐ ${player.stars}</span>
        </div>
      </div>
      <div>Space ${player.position}</div>
    `;
    container.appendChild(item);
  });
}

function updateTurnIndicator() {
  const currentPlayer = boardState.players[boardState.currentTurn];
  document.getElementById('current-turn').textContent = `${currentPlayer.name}'s Turn`;
}

async function rollDice() {
  if (boardState.gamePhase !== 'waiting') return;
  
  boardState.gamePhase = 'rolling';
  updateUI();
  
  // Add shake animation to button
  const rollBtn = document.getElementById('roll-dice-btn');
  rollBtn.classList.add('animate-shake');
  setTimeout(() => rollBtn.classList.remove('animate-shake'), 500);
  
  // Animate dice with enhanced physics
  diceMesh.visible = true;
  diceMesh.position.set(0, 8, 0);
  diceMesh.rotation.set(0, 0, 0);
  
  // Roll animation with physics-like movement
  const rollDuration = ANIMATION_DURATIONS.DICE_ROLL;
  const startTime = Date.now();
  let velocity = { x: 0.3, y: 0.3, z: 0.3 };
  let position = { y: 8 };
  
  const rollInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = elapsed / rollDuration;
    
    // Rotate dice
    diceMesh.rotation.x += velocity.x;
    diceMesh.rotation.y += velocity.y;
    diceMesh.rotation.z += velocity.z;
    
    // Bounce effect
    position.y = 8 - Math.sin(progress * Math.PI * 4) * 2;
    diceMesh.position.y = position.y;
    
    // Decelerate
    velocity.x *= 0.98;
    velocity.y *= 0.98;
    velocity.z *= 0.98;
  }, 16);
  
  // Get random result
  const result = Math.floor(Math.random() * 6) + 1;
  
  setTimeout(() => {
    clearInterval(rollInterval);
    // Settle dice
    diceMesh.position.y = 5;
    diceMesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    showDiceResult(result);
    
    // Create confetti effect
    createConfetti();
    
    // Move player
    setTimeout(() => {
      movePlayer(result);
    }, 1500);
  }, rollDuration);
}

function createConfetti() {
  // Create colorful particle confetti
  const colors = [0xff0000, 0x0000ff, 0xffff00, 0x00ff00, 0xff00ff];
  const particleCount = 30;
  
  for (let i = 0; i < particleCount; i++) {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      transparent: true,
      opacity: 1
    });
    const particle = new THREE.Mesh(geometry, material);
    
    const angle = (i / particleCount) * Math.PI * 2;
    const radius = 3;
    particle.position.set(
      Math.cos(angle) * radius,
      5 + Math.random() * 2,
      Math.sin(angle) * radius
    );
    
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      Math.random() * 0.5 + 0.5,
      (Math.random() - 0.5) * 0.3
    );
    
    scene.add(particle);
    
    // Animate particle
    let frame = 0;
    const animate = () => {
      frame++;
      particle.position.add(velocity);
      particle.position.y -= 0.05;
      particle.rotation.x += 0.1;
      particle.rotation.y += 0.1;
      particle.material.opacity -= 0.02;
      velocity.multiplyScalar(0.95);
      
      if (frame < 60 && particle.material.opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        scene.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
      }
    };
    animate();
  }
}

function showDiceResult(value) {
  const diceResultEl = document.getElementById('dice-result');
  const diceValueEl = document.getElementById('dice-value');
  diceValueEl.textContent = value;
  diceResultEl.classList.remove('hidden');
  
  setTimeout(() => {
    diceResultEl.classList.add('hidden');
    diceMesh.visible = false;
  }, 2000);
}

async function movePlayer(spaces) {
  boardState.gamePhase = 'moving';
  const currentPlayer = boardState.players[boardState.currentTurn];
  const piece = playerPieces[boardState.currentTurn];
  
  // Smooth movement animation
  const targetPosition = (currentPlayer.position + spaces) % boardState.totalSpaces;
  const steps = spaces;
  
  for (let i = 0; i < steps; i++) {
    const startPos = currentPlayer.position;
    currentPlayer.position = (currentPlayer.position + 1) % boardState.totalSpaces;
    
    // Animate piece moving to next space
    const start = boardState.boardPath[startPos];
    const end = boardState.boardPath[currentPlayer.position];
    
    for (let frame = 0; frame < 15; frame++) {
      const t = frame / 15;
      const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // Ease in-out
      piece.position.lerpVectors(start, end, easedT);
      piece.position.y = 1.5 + Math.sin(t * Math.PI) * 0.8; // Enhanced jump animation
      
      // Add rotation during movement
      piece.rotation.y += 0.1;
      
      updateBoardVisuals();
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    
    // Reset rotation
    piece.rotation.y = 0;
    
    // Create enhanced particle effect on landing
    createLandingParticles(end);
  }
  
  // Land on space
  const landedSpace = boardState.spaces[currentPlayer.position];
  handleSpaceEffect(landedSpace);
}

/**
 * Create sparkle particle effect for star space
 * @param {THREE.Vector3} position - Position to create effect at
 */
function createStarEffect(position) {
  // Create sparkle effect for star space
  const sparkleCount = 20;
  for (let i = 0; i < sparkleCount; i++) {
    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 1
    });
    const sparkle = new THREE.Mesh(geometry, material);
    sparkle.position.copy(position);
    sparkle.position.y = 1;
    
    const angle = (i / sparkleCount) * Math.PI * 2;
    const radius = 2;
    const targetX = position.x + Math.cos(angle) * radius;
    const targetZ = position.z + Math.sin(angle) * radius;
    const targetY = position.y + 3;
    
    scene.add(sparkle);
    
    let frame = 0;
    const animate = () => {
      frame++;
      const t = frame / 30;
      sparkle.position.x = THREE.MathUtils.lerp(position.x, targetX, t);
      sparkle.position.z = THREE.MathUtils.lerp(position.z, targetZ, t);
      sparkle.position.y = THREE.MathUtils.lerp(position.y, targetY, t) + Math.sin(t * Math.PI) * 2;
      sparkle.material.opacity = 1 - t;
      sparkle.scale.setScalar(1 + t * 2);
      
      if (frame < ANIMATION_DURATIONS.SPARKLE_LIFETIME) {
        requestAnimationFrame(animate);
      } else {
        scene.remove(sparkle);
        sparkle.geometry.dispose();
        sparkle.material.dispose();
      }
    };
    animate();
  }
}

/**
 * Create landing particle effect when player lands on a space
 * @param {THREE.Vector3} position - Position to create effect at
 */
function createLandingParticles(position) {
  // Simple particle effect using sprites
  const particleCount = 10;
  for (let i = 0; i < particleCount; i++) {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 1
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(position);
    particle.position.y = 0.5;
    
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 2 + 1,
      (Math.random() - 0.5) * 2
    );
    
    scene.add(particle);
    
    // Animate and remove particle
    let frame = 0;
    const animate = () => {
      frame++;
      particle.position.add(velocity.clone().multiplyScalar(0.1));
      particle.position.y -= 0.05;
      particle.material.opacity -= 0.02;
      velocity.multiplyScalar(0.95);
      
      if (frame < 60 && particle.material.opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        scene.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
      }
    };
    animate();
  }
}

/**
 * Handle the effect when a player lands on a space
 * @param {Object} space - The space object with type and position
 */
function handleSpaceEffect(space) {
  boardState.gamePhase = 'spaceEffect';
  
  // Show space info
  const spaceInfoEl = document.getElementById('space-info');
  const spaceNameEl = document.getElementById('space-name');
  const spaceDescEl = document.getElementById('space-description');
  
  spaceNameEl.textContent = `${space.type.charAt(0).toUpperCase() + space.type.slice(1)} Space`;
  
  switch (space.type) {
    case 'normal':
      spaceDescEl.textContent = 'Nothing happens. Continue to next turn.';
      setTimeout(() => nextTurn(), ANIMATION_DURATIONS.SPACE_EFFECT_DELAY);
      break;
    case 'bonus':
      spaceDescEl.textContent = 'You earned 5 coins!';
      boardState.players[boardState.currentTurn].coins += 5;
      // Sync with main state
      mainState.coins[boardState.currentTurn] = boardState.players[boardState.currentTurn].coins;
      syncBoardState();
      setTimeout(() => nextTurn(), ANIMATION_DURATIONS.SPACE_EFFECT_DELAY);
      break;
    case 'star':
      spaceDescEl.textContent = 'You earned a star and 10 coins!';
      boardState.players[boardState.currentTurn].stars += 1;
      boardState.players[boardState.currentTurn].coins += 10;
      // Create star particle effect
      createStarEffect(space.position);
      // Sync with main state
      mainState.stars[boardState.currentTurn] = boardState.players[boardState.currentTurn].stars;
      mainState.coins[boardState.currentTurn] = boardState.players[boardState.currentTurn].coins;
      syncBoardState();
      setTimeout(() => nextTurn(), ANIMATION_DURATIONS.SPACE_EFFECT_DELAY);
      break;
    case 'minigame':
      spaceDescEl.textContent = 'Select a minigame to play!';
      showMinigameSelection();
      break;
    case 'event':
      spaceDescEl.textContent = 'Random event!';
      const eventResult = Math.random() > 0.5 ? 'gain' : 'lose';
      if (eventResult === 'gain') {
        boardState.players[boardState.currentTurn].coins += 3;
        spaceDescEl.textContent = 'You found 3 coins!';
      } else {
        boardState.players[boardState.currentTurn].coins = Math.max(0, boardState.players[boardState.currentTurn].coins - 3);
        spaceDescEl.textContent = 'You lost 3 coins!';
      }
      // Sync with main state
      mainState.coins[boardState.currentTurn] = boardState.players[boardState.currentTurn].coins;
      syncBoardState();
      setTimeout(() => nextTurn(), ANIMATION_DURATIONS.SPACE_EFFECT_DELAY);
      break;
    case 'warp_in':
      handleWarpSpace(space);
      break;
    case 'warp_out':
      spaceDescEl.textContent = 'Warp pipe exit. Nothing happens.';
      setTimeout(() => nextTurn(), ANIMATION_DURATIONS.SPACE_EFFECT_DELAY);
      break;
    case 'shop':
      showShopMenu();
      break;
  }
  
  spaceInfoEl.classList.remove('hidden');
  updateUI();
}

/**
 * Handle warp pipe teleportation
 * @param {Object} space - The warp_in space
 */
async function handleWarpSpace(space) {
  const spaceInfoEl = document.getElementById('space-info');
  const spaceNameEl = document.getElementById('space-name');
  const spaceDescEl = document.getElementById('space-description');
  
  spaceNameEl.textContent = 'Warp Pipe!';
  spaceDescEl.textContent = 'Entering warp pipe...';
  spaceInfoEl.classList.remove('hidden');
  
  // Find warp_out space
  const warpOutSpace = boardState.spaces.find(s => s.type === 'warp_out');
  
  if (warpOutSpace) {
    const currentPlayer = boardState.players[boardState.currentTurn];
    const piece = playerPieces[boardState.currentTurn];
    
    // Animate player sinking into pipe
    const startY = piece.position.y;
    for (let frame = 0; frame < 20; frame++) {
      const t = frame / 20;
      piece.position.y = startY - t * 1.5;
      piece.scale.setScalar(1 - t * 0.5);
      updateBoardVisuals();
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    // Teleport to warp_out
    const warpOutIndex = boardState.spaces.findIndex(s => s.type === 'warp_out');
    if (warpOutIndex >= 0) {
      const warpOutPos = boardState.boardPath[warpOutIndex];
      currentPlayer.position = warpOutIndex;
      piece.position.set(warpOutPos.x, -1, warpOutPos.z);
      
      // Animate player emerging from pipe
      for (let frame = 0; frame < 20; frame++) {
        const t = frame / 20;
        piece.position.y = -1 + t * 2.5;
        piece.scale.setScalar(0.5 + t * 0.5);
        updateBoardVisuals();
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      
      spaceDescEl.textContent = `Warped to space ${warpOutIndex + 1}!`;
    } else {
      spaceDescEl.textContent = 'No exit pipe found!';
    }
    setTimeout(() => {
      nextTurn();
    }, ANIMATION_DURATIONS.SPACE_EFFECT_DELAY);
  } else {
    spaceDescEl.textContent = 'No exit pipe found!';
    setTimeout(() => {
      nextTurn();
    }, ANIMATION_DURATIONS.SPACE_EFFECT_DELAY);
  }
}

/**
 * Show shop menu for purchasing items
 */
function showShopMenu() {
  const spaceInfoEl = document.getElementById('space-info');
  const spaceNameEl = document.getElementById('space-name');
  const spaceDescEl = document.getElementById('space-description');
  
  spaceNameEl.textContent = 'Shop';
  spaceDescEl.textContent = 'Select an item to purchase';
  spaceInfoEl.classList.remove('hidden');
  
  // Create shop menu if it doesn't exist
  let shopMenu = document.getElementById('shop-menu');
  if (!shopMenu) {
    shopMenu = document.createElement('div');
    shopMenu.id = 'shop-menu';
    shopMenu.className = 'ui-panel hidden';
    shopMenu.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; min-width: 400px;';
    document.body.appendChild(shopMenu);
  }
  
  const currentPlayer = boardState.players[boardState.currentTurn];
  const playerCoins = currentPlayer.coins;
  
  const shopItems = [
    { name: 'Extra Dice Roll', cost: 10, description: 'Roll the dice again this turn' },
    { name: 'Star', cost: 50, description: 'Purchase a star' },
    { name: 'Coin Bonus', cost: 5, description: 'Get 15 coins' }
  ];
  
  shopMenu.innerHTML = `
    <h3>Shop - ${currentPlayer.name}</h3>
    <p>Coins: 🪙 ${playerCoins}</p>
    <div id="shop-items">
      ${shopItems.map((item, idx) => `
        <div class="shop-item ${playerCoins >= item.cost ? '' : 'disabled'}" data-index="${idx}">
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.description}</div>
          <div class="shop-item-cost">Cost: 🪙 ${item.cost}</div>
        </div>
      `).join('')}
    </div>
    <button id="shop-close" class="action-btn">Close</button>
  `;
  
  shopMenu.classList.remove('hidden');
  
  // Remove old event listeners by cloning (cleaner approach)
  const newShopMenu = shopMenu.cloneNode(true);
  shopMenu.parentNode.replaceChild(newShopMenu, shopMenu);
  shopMenu = newShopMenu;
  
  // Add event listeners
  shopMenu.querySelectorAll('.shop-item').forEach((item, idx) => {
    if (playerCoins >= shopItems[idx].cost) {
      item.addEventListener('click', () => purchaseItem(shopItems[idx]));
    }
  });
  
  const closeBtn = shopMenu.querySelector('#shop-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      shopMenu.classList.add('hidden');
      nextTurn();
    });
  }
}

/**
 * Handle item purchase
 * @param {Object} item - The shop item being purchased
 */
function purchaseItem(item) {
  const currentPlayer = boardState.players[boardState.currentTurn];
  
  if (currentPlayer.coins < item.cost) {
    alert('Not enough coins!');
    return;
  }
  
  currentPlayer.coins -= item.cost;
  mainState.coins[boardState.currentTurn] = currentPlayer.coins;
  
  if (item.name === 'Star') {
    currentPlayer.stars += 1;
    mainState.stars[boardState.currentTurn] = currentPlayer.stars;
    alert('Purchased a star!');
  } else if (item.name === 'Coin Bonus') {
    currentPlayer.coins += 15;
    mainState.coins[boardState.currentTurn] = currentPlayer.coins;
    alert('Got 15 coins!');
  } else if (item.name === 'Extra Dice Roll') {
    // Allow player to roll dice again
    boardState.gamePhase = 'waiting';
    document.getElementById('roll-dice-btn').disabled = false;
    alert('You can roll the dice again!');
  }
  
  syncBoardState();
  updateScoreboard();
  
  const shopMenu = document.getElementById('shop-menu');
  if (shopMenu) {
    shopMenu.classList.add('hidden');
  }
  nextTurn();
}

function showMinigameSelection() {
  fetch('/api/games')
    .then(r => r.json())
    .then(games => {
      const container = document.getElementById('minigame-list');
      container.innerHTML = '';
      
      games.forEach(game => {
        const item = document.createElement('div');
        item.className = 'minigame-item';
        item.innerHTML = `
          <div class="minigame-name">${game.name}</div>
          <div class="minigame-type">${game.type}</div>
        `;
        item.addEventListener('click', () => runMinigame(game.id));
        container.appendChild(item);
      });
      
      document.getElementById('minigame-select').classList.remove('hidden');
    });
}

async function runMinigame(gameId) {
  document.getElementById('minigame-select').classList.add('hidden');
  document.getElementById('space-info').classList.add('hidden');
  
  // Run minigame via API
  const response = await fetch(`/api/run/${encodeURIComponent(gameId)}`, {
    method: 'POST'
  });
  
  const data = await response.json();
  if (data.ok) {
    if (data.result) {
      // Pygame/Node games return result immediately
      // Prizes are automatically applied by server
      updateScoreboard();
      setTimeout(() => nextTurn(), 3000);
    } else if (data.mode === 'js') {
      // JS games run in iframe - wait for result via WebSocket
      // The result will come through WebSocket and trigger nextTurn
      boardState.gamePhase = 'minigame';
      updateUI();
    } else {
      nextTurn();
    }
  } else {
    nextTurn();
  }
}

function nextTurn() {
  boardState.currentTurn = (boardState.currentTurn + 1) % 4;
  boardState.gamePhase = 'waiting';
  document.getElementById('space-info').classList.add('hidden');
  updateUI();
  
  // Sync state with server
  syncBoardState();
}

function syncBoardState() {
  fetch('/api/board/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: boardState })
  });
}

function showPrizeBreakdown(breakdown) {
  // Create or update prize breakdown display
  let prizeEl = document.getElementById('prize-breakdown');
  if (!prizeEl) {
    prizeEl = document.createElement('div');
    prizeEl.id = 'prize-breakdown';
    prizeEl.className = 'prize-breakdown';
    document.body.appendChild(prizeEl);
  }
  
  prizeEl.innerHTML = `
    <div class="prize-breakdown-content">
      <h3>🎉 Minigame Results!</h3>
      ${breakdown.map((p, i) => `
        <div class="prize-item ${p.coins > 0 || p.stars > 0 ? 'winner' : ''}">
          <span class="player-name">${boardState.players[i].name}</span>
          ${p.coins > 0 ? `<span class="coin">+${p.coins} 🪙</span>` : ''}
          ${p.stars > 0 ? `<span class="star">+${p.stars} ⭐</span>` : ''}
          ${p.coins === 0 && p.stars === 0 ? '<span class="no-prize">No prize</span>' : ''}
        </div>
      `).join('')}
    </div>
  `;
  
  prizeEl.classList.remove('hidden');
  
  // Auto-hide after 4 seconds
  setTimeout(() => {
    prizeEl.classList.add('hidden');
  }, 4000);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateBoardVisuals();
  updateCamera();
  renderer.render(scene, camera);
}
