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
    else if (node.type === 'warp_in' || node.type === 'warp_out') { spaceType = 'warp'; color = 0x00ffff; }
    
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

function placeDecorModels() {
  boardConfig.decor.forEach(decor => {
    const decorKey = `decor_${decor.model}`;
    if (loadedAssets[decorKey] && loadedAssets[decorKey].scene) {
      const model = loadedAssets[decorKey].scene.clone();
      model.position.set(decor.pos[0], decor.pos[1], decor.pos[2]);
      model.scale.set(decor.scale || 1, decor.scale || 1, decor.scale || 1);
      model.rotation.y = decor.rotY || 0;
      scene.add(model);
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

function createPlayerPieces() {
  playerPieces = [];
  const colors = [0xff0000, 0x0000ff, 0xffff00, 0x00ff00];
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
                mat.color.setHex(colors[i]);
                if (mat.emissive) {
                  mat.emissive.setHex(colors[i]);
                  mat.emissiveIntensity = 0.3;
                }
              }
            });
          } else {
            if (child.material.color) {
              child.material.color.setHex(colors[i]);
            }
            if (child.material.emissive) {
              child.material.emissive.setHex(colors[i]);
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
        color: colors[i],
        emissive: colors[i],
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
        color: colors[i],
        emissive: colors[i],
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
        color: colors[i],
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
        emissive: colors[i],
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
    document.getElementById('minigame-select').classList.add('hidden');
  });
}

function setupWebSocket() {
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'BOARD_STATE') {
      boardState = msg.payload;
      updateBoardVisuals();
      updateUI();
    } else if (msg.type === 'PRIZES_AWARDED' && boardState.gamePhase === 'minigame') {
      // Minigame completed, update board state and continue
      boardState.players.forEach((p, i) => {
        p.coins = mainState.coins[i] || 0;
        p.stars = mainState.stars[i] || 0;
      });
      updateScoreboard();
      setTimeout(() => nextTurn(), 2000);
    } else if (msg.type === 'STATE') {
      // Sync coins/stars from main state
      const newState = msg.payload;
      mainState.coins = newState.coins || [0, 0, 0, 0];
      mainState.stars = newState.stars || [0, 0, 0, 0];
      boardState.players.forEach((p, i) => {
        p.coins = mainState.coins[i] || 0;
        p.stars = mainState.stars[i] || 0;
      });
      updateScoreboard();
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
      mainState.coins = data.coins || [0, 0, 0, 0];
      mainState.stars = data.stars || [0, 0, 0, 0];
      boardState.players.forEach((p, i) => {
        p.coins = mainState.coins[i] || 0;
        p.stars = mainState.stars[i] || 0;
      });
      updateScoreboard();
    });
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
  const rollDuration = 2000;
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
      
      if (frame < 30) {
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
      setTimeout(() => nextTurn(), 2000);
      break;
    case 'bonus':
      spaceDescEl.textContent = 'You earned 5 coins!';
      boardState.players[boardState.currentTurn].coins += 5;
      // Sync with main state
      mainState.coins[boardState.currentTurn] = boardState.players[boardState.currentTurn].coins;
      syncBoardState();
      setTimeout(() => nextTurn(), 2000);
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
      setTimeout(() => nextTurn(), 2000);
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
      state.coins[boardState.currentTurn] = boardState.players[boardState.currentTurn].coins;
      syncBoardState();
      setTimeout(() => nextTurn(), 2000);
      break;
  }
  
  spaceInfoEl.classList.remove('hidden');
  updateUI();
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
