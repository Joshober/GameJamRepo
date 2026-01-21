import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
  totalSpaces: 40
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

// WebSocket connection
const ws = new WebSocket(`ws://${location.host}`);

// Initialize
init();

function init() {
  setupThreeJS();
  createBoard();
  createPlayerPieces();
  createDice();
  setupLighting();
  setupUI();
  setupWebSocket();
  animate();
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

function createBoard() {
  // Create board base with better materials
  const boardGeometry = new THREE.PlaneGeometry(60, 60);
  const boardMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d3561,
    roughness: 0.8,
    metalness: 0.2,
    emissive: 0x1a1a2e,
    emissiveIntensity: 0.1
  });
  const board = new THREE.Mesh(boardGeometry, boardMaterial);
  board.rotation.x = -Math.PI / 2;
  board.receiveShadow = true;
  scene.add(board);

  // Add decorative border
  const borderGeometry = new THREE.RingGeometry(28, 30, 64);
  const borderMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a90e2,
    emissive: 0x4a90e2,
    emissiveIntensity: 0.3
  });
  const border = new THREE.Mesh(borderGeometry, borderMaterial);
  border.rotation.x = -Math.PI / 2;
  border.position.y = 0.1;
  scene.add(border);

  // Create board path (circular/looping)
  const radius = 20;
  const centerX = 0;
  const centerZ = 0;
  
  boardState.boardPath = [];
  for (let i = 0; i < boardState.totalSpaces; i++) {
    const angle = (i / boardState.totalSpaces) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radius;
    const z = centerZ + Math.sin(angle) * radius;
    boardState.boardPath.push(new THREE.Vector3(x, 0.5, z));
  }

  // Create spaces
  boardState.spaces = [];
  for (let i = 0; i < boardState.totalSpaces; i++) {
    const pos = boardState.boardPath[i];
    let spaceType = 'normal';
    let color = 0x4a90e2; // Blue for normal

    // Distribute space types
    if (i % 8 === 0) spaceType = 'minigame', color = 0xff0000; // Red
    else if (i % 7 === 0) spaceType = 'bonus', color = 0x00ff00; // Green
    else if (i % 10 === 0) spaceType = 'star', color = 0xffd700; // Gold
    else if (i % 6 === 0) spaceType = 'event', color = 0x9b59b6; // Purple

    boardState.spaces.push({
      id: i,
      type: spaceType,
      position: pos
    });

    // Create space mesh with enhanced visuals
    const spaceGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 16);
    const spaceMaterial = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: spaceType === 'star' ? 0.8 : 0.3,
      roughness: 0.7,
      metalness: spaceType === 'star' ? 0.5 : 0.1
    });
    const spaceMesh = new THREE.Mesh(spaceGeometry, spaceMaterial);
    spaceMesh.position.copy(pos);
    spaceMesh.castShadow = true;
    spaceMesh.receiveShadow = true;
    
    // Add glow effect for special spaces
    if (spaceType === 'star' || spaceType === 'minigame') {
      const glowGeometry = new THREE.CylinderGeometry(1.4, 1.4, 0.1, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(pos);
      glow.position.y = 0.15;
      scene.add(glow);
    }
    
    scene.add(spaceMesh);
    spaceMeshes.push(spaceMesh);
  }
}

function createPlayerPieces() {
  playerPieces = [];
  const colors = [0xff0000, 0x0000ff, 0xffff00, 0x00ff00];
  
  for (let i = 0; i < 4; i++) {
    // Create player piece group for better visuals
    const pieceGroup = new THREE.Group();
    
    // Main body (cone)
    const geometry = new THREE.ConeGeometry(0.8, 2, 8);
    const material = new THREE.MeshStandardMaterial({
      color: colors[i],
      emissive: colors[i],
      emissiveIntensity: 0.5,
      roughness: 0.5,
      metalness: 0.3
    });
    const piece = new THREE.Mesh(geometry, material);
    piece.castShadow = true;
    pieceGroup.add(piece);
    
    // Add glow ring at base
    const ringGeometry = new THREE.TorusGeometry(0.9, 0.1, 8, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: colors[i],
      transparent: true,
      opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1;
    pieceGroup.add(ring);
    
    pieceGroup.position.copy(boardState.boardPath[0]);
    pieceGroup.position.y = 1.5;
    scene.add(pieceGroup);
    playerPieces.push(pieceGroup);
  }
}

function createDice() {
  // Create simple dice (white cube with dots)
  const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.1
  });
  diceMesh = new THREE.Mesh(geometry, material);
  diceMesh.position.set(0, 5, 0);
  diceMesh.visible = false;
  scene.add(diceMesh);
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
      mesh.material.emissiveIntensity = pulse;
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
  
  // Animate dice
  diceMesh.visible = true;
  diceMesh.position.set(0, 5, 0);
  
  // Roll animation
  const rollDuration = 2000;
  const startTime = Date.now();
  const rollInterval = setInterval(() => {
    diceMesh.rotation.x += 0.2;
    diceMesh.rotation.y += 0.2;
    diceMesh.rotation.z += 0.2;
  }, 16);
  
  // Get random result
  const result = Math.floor(Math.random() * 6) + 1;
  
  setTimeout(() => {
    clearInterval(rollInterval);
    showDiceResult(result);
    
    // Move player
    setTimeout(() => {
      movePlayer(result);
    }, 1500);
  }, rollDuration);
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
    
    for (let frame = 0; frame < 10; frame++) {
      const t = frame / 10;
      piece.position.lerpVectors(start, end, t);
      piece.position.y = 1.5 + Math.sin(t * Math.PI) * 0.5; // Jump animation
      updateBoardVisuals();
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    // Create particle effect on landing
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
      state.coins[boardState.currentTurn] = boardState.players[boardState.currentTurn].coins;
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
