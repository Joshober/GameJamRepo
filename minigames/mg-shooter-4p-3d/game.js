const params = new URLSearchParams(location.search);
const gameId = params.get('gameId') || 'mg-shooter-4p-3d';

// --- Config ---
const ARENA_SIZE = 24;
const PLAYER_SIZE = 1.2;
const PLAYER_SPEED = 12;
const BULLET_SPEED = 28;
const BULLET_RADIUS = 0.25;
const BULLET_DAMAGE = 25;
const FIRE_COOLDOWN = 0.2;
const RESPAWN_TIME = 1.5;
const GAME_DURATION = 120;
const WAVES_TOTAL = 5;
const ENEMIES_PER_WAVE_BASE = 6;
const ENEMY_SIZE = 1.0;
const ENEMY_SPEED = 4;
const ENEMY_HP = 40;
const ENEMY_CONTACT_DAMAGE = 12;
const ENEMY_CONTACT_RADIUS = 1.4;
const PLAYER_COLORS = [0xe63946, 0x457b9d, 0x2a9d8f, 0xe9c46a];
const SPAWNS = [
  { x: -ARENA_SIZE/2 + 4, z: -ARENA_SIZE/2 + 4 },
  { x:  ARENA_SIZE/2 - 4, z: -ARENA_SIZE/2 + 4 },
  { x: -ARENA_SIZE/2 + 4, z:  ARENA_SIZE/2 - 4 },
  { x:  ARENA_SIZE/2 - 4, z:  ARENA_SIZE/2 - 4 }
];

// --- State ---
let scene, camera, renderer, clock;
let players = [];
let bullets = [];
let enemies = [];
let gameTime = 0;
let gameStarted = false;
let gameEnded = false;
let lastFire = [0, 0, 0, 0];
let currentWave = 0;
let waveEnemiesSpawned = 0;
let waveEnemiesTotal = 0;
let teamKills = 0;
let ws = null;

function connectWebSocket() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = proto + '//' + location.host + '/?game=1';
  try {
    ws = new WebSocket(url);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'control' && msg.player >= 1 && msg.player <= 4 && typeof playerControls.setMobileState === 'function')
          playerControls.setMobileState(msg.player, msg);
      } catch (_) {}
    };
    ws.onclose = () => { ws = null; };
  } catch (_) { ws = null; }
}

function initThree() {
  const canvas = document.getElementById('canvas');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a12);
  scene.fog = new THREE.Fog(0x0a0a12, 22, 55);

  camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 26, 20);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  clock = new THREE.Clock();

  // Suelo: más brillante y con rejilla visible
  const floorSize = ARENA_SIZE + 2;
  const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e32,
    roughness: 0.7,
    metalness: 0.08,
    emissive: 0x0c0c18
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const gridHelper = new THREE.GridHelper(floorSize, 20, 0x3a3a5a, 0x252540);
  gridHelper.position.y = 0.02;
  scene.add(gridHelper);

  // Paredes: más definidas
  const wallHeight = 3.2;
  const half = ARENA_SIZE / 2 + 0.5;
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x252545, roughness: 0.7, metalness: 0.15 });
  [[-half, 0, 0], [half, 0, 0], [0, 0, -half], [0, 0, half]].forEach(([x, y, z], i) => {
    const w = i < 2 ? 1.2 : ARENA_SIZE + 2.2;
    const d = i >= 2 ? 1.2 : ARENA_SIZE + 2.2;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, wallHeight, d), wallMat);
    wall.position.set(x, wallHeight/2, z);
    wall.castShadow = true;
    scene.add(wall);
  });

  // Iluminación: más luces y más suave
  scene.add(new THREE.AmbientLight(0x5566aa, 0.55));
  const dir = new THREE.DirectionalLight(0xffeedd, 1);
  dir.position.set(10, 28, 8);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.near = 0.5;
  dir.shadow.camera.far = 55;
  dir.shadow.bias = -0.0001;
  scene.add(dir);
  const fill = new THREE.PointLight(0x4488ff, 0.5, 45);
  fill.position.set(-12, 10, -12);
  scene.add(fill);
  const fill2 = new THREE.PointLight(0xff8844, 0.25, 35);
  fill2.position.set(12, 6, 10);
  scene.add(fill2);
  const rim = new THREE.DirectionalLight(0xaaccff, 0.35);
  rim.position.set(-5, 15, -15);
  scene.add(rim);

  // Label above player: "Player 1", "Player 2", etc.
  function makeLabel(text, colorHex) {
    const canvas = document.createElement('canvas');
    const w = 256, h = 64;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, h);
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, w / 2, h / 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    const geo = new THREE.PlaneGeometry(2.4, 0.6);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: true
    });
    const plane = new THREE.Mesh(geo, mat);
    plane.position.y = PLAYER_SIZE * 1.35;
    return plane;
  }

  // Players: rounded capsule (clearly different from angular enemies)
  for (let i = 0; i < 4; i++) {
    const group = new THREE.Group();
    const bodyGeo = new THREE.CylinderGeometry(PLAYER_SIZE * 0.45, PLAYER_SIZE * 0.5, PLAYER_SIZE * 0.6, 10);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: PLAYER_COLORS[i],
      roughness: 0.5,
      metalness: 0.25,
      emissive: PLAYER_COLORS[i],
      emissiveIntensity: 0.12
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = PLAYER_SIZE * 0.3;
    body.castShadow = true;
    group.add(body);
    const headGeo = new THREE.SphereGeometry(PLAYER_SIZE * 0.35, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = PLAYER_SIZE * 0.75;
    head.castShadow = true;
    group.add(head);
    const label = makeLabel('Player ' + (i + 1), PLAYER_COLORS[i]);
    group.add(label);
    group.position.set(SPAWNS[i].x, 0, SPAWNS[i].z);
    scene.add(group);
    players.push({
      mesh: group,
      labelMesh: label,
      health: 100,
      kills: 0,
      angle: 0,
      dead: false,
      respawnAt: 0,
      index: i
    });
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function spawnPlayer(i) {
  const p = players[i];
  p.mesh.position.set(SPAWNS[i].x, 0, SPAWNS[i].z);
  p.health = 100;
  p.dead = false;
  p.mesh.visible = true;
  if (p.labelMesh) p.labelMesh.visible = true;
}

// Enemies: angular robot/drone shape (box + horns) — clearly different from rounded players
function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x, z;
  if (side === 0) { x = -ARENA_SIZE/2 - 1; z = (Math.random() - 0.5) * ARENA_SIZE; }
  else if (side === 1) { x = ARENA_SIZE/2 + 1; z = (Math.random() - 0.5) * ARENA_SIZE; }
  else if (side === 2) { x = (Math.random() - 0.5) * ARENA_SIZE; z = -ARENA_SIZE/2 - 1; }
  else { x = (Math.random() - 0.5) * ARENA_SIZE; z = ARENA_SIZE/2 + 1; }
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x442244,
    roughness: 0.5,
    metalness: 0.3,
    emissive: 0xff4422,
    emissiveIntensity: 0.4
  });
  const bodyGeo = new THREE.BoxGeometry(ENEMY_SIZE * 0.9, ENEMY_SIZE * 1.0, ENEMY_SIZE * 0.9);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.y = ENEMY_SIZE * 0.5;
  body.castShadow = true;
  group.add(body);
  const hornGeo = new THREE.BoxGeometry(ENEMY_SIZE * 0.15, ENEMY_SIZE * 0.4, ENEMY_SIZE * 0.15);
  const horn1 = new THREE.Mesh(hornGeo, mat);
  horn1.position.set(-ENEMY_SIZE * 0.25, ENEMY_SIZE * 1.0, 0);
  group.add(horn1);
  const horn2 = new THREE.Mesh(hornGeo, mat);
  horn2.position.set(ENEMY_SIZE * 0.25, ENEMY_SIZE * 1.0, 0);
  group.add(horn2);
  const eyeGeo = new THREE.BoxGeometry(ENEMY_SIZE * 0.2, ENEMY_SIZE * 0.15, ENEMY_SIZE * 0.05);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
  eye1.position.set(-ENEMY_SIZE * 0.2, ENEMY_SIZE * 0.55, ENEMY_SIZE * 0.46);
  group.add(eye1);
  const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
  eye2.position.set(ENEMY_SIZE * 0.2, ENEMY_SIZE * 0.55, ENEMY_SIZE * 0.46);
  group.add(eye2);
  group.position.set(x, 0, z);
  scene.add(group);
  enemies.push({ mesh: group, x, z, hp: ENEMY_HP });
}

function fire(playerIndex) {
  const now = clock.getElapsedTime();
  if (now - lastFire[playerIndex] < FIRE_COOLDOWN) return;
  lastFire[playerIndex] = now;
  const p = players[playerIndex];
  if (p.dead) return;
  const pos = p.mesh.position;
  const geo = new THREE.SphereGeometry(BULLET_RADIUS, 10, 10);
  const mat = new THREE.MeshBasicMaterial({
    color: PLAYER_COLORS[playerIndex],
    transparent: true,
    opacity: 0.95
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pos.x, PLAYER_SIZE * 0.5, pos.z);
  const angle = p.angle;
  scene.add(mesh);
  bullets.push({
    mesh,
    vx: Math.sin(angle) * BULLET_SPEED,
    vz: -Math.cos(angle) * BULLET_SPEED,
    owner: playerIndex
  });
}

function hitTestBullet(b, dt) {
  b.mesh.position.x += b.vx * dt;
  b.mesh.position.z += b.vz * dt;
  const x = b.mesh.position.x, z = b.mesh.position.z;
  if (Math.abs(x) > ARENA_SIZE/2 + 2 || Math.abs(z) > ARENA_SIZE/2 + 2) return { hit: true, enemyIndex: -1 };
  const r = ENEMY_SIZE * 0.65 + BULLET_RADIUS * 2;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    const dx = x - e.mesh.position.x, dz = z - e.mesh.position.z;
    if (dx*dx + dz*dz < r * r) return { hit: true, enemyIndex: i };
  }
  return { hit: false };
}

function updateEnemies(dt) {
  for (const e of enemies) {
    let nearestDist = 1e9;
    let tx = e.x, tz = e.z;
    for (const p of players) {
      if (p.dead) continue;
      const dx = p.mesh.position.x - e.mesh.position.x, dz = p.mesh.position.z - e.mesh.position.z;
      const d = dx*dx + dz*dz;
      if (d < nearestDist) { nearestDist = d; tx = p.mesh.position.x; tz = p.mesh.position.z; }
    }
    const dx = tx - e.mesh.position.x, dz = tz - e.mesh.position.z;
    const len = Math.sqrt(dx*dx + dz*dz) || 1;
    e.mesh.position.x += (dx / len) * ENEMY_SPEED * dt;
    e.mesh.position.z += (dz / len) * ENEMY_SPEED * dt;
    e.mesh.position.x = Math.max(-ARENA_SIZE/2, Math.min(ARENA_SIZE/2, e.mesh.position.x));
    e.mesh.position.z = Math.max(-ARENA_SIZE/2, Math.min(ARENA_SIZE/2, e.mesh.position.z));
    e.mesh.rotation.y += dt * 2;
  }
}

function updateUI() {
  const teamEl = document.getElementById('teamScore');
  if (teamEl) teamEl.textContent = teamKills;
  const waveEl = document.getElementById('waveNum');
  if (waveEl) waveEl.textContent = currentWave + ' / ' + WAVES_TOTAL;
  for (let i = 0; i < 4; i++) {
    const p = players[i];
    const elH = document.getElementById('h' + (i+1));
    if (elH) elH.textContent = p.dead ? 0 : Math.max(0, p.health);
  }
  const left = Math.max(0, Math.ceil(GAME_DURATION - gameTime));
  const t = document.getElementById('timer');
  if (t) t.textContent = left;
}

function endGame(victory) {
  gameEnded = true;
  const scores = players.map(p => p.kills);
  const maxKills = Math.max(...scores);
  const winner = scores.indexOf(maxKills);
  const ranking = players.map((p, i) => ({ index: i, kills: p.kills })).sort((a, b) => b.kills - a.kills);
  const rankEl = document.getElementById('ranking');
  const winnerEl = document.getElementById('winnerText');
  if (rankEl) {
    rankEl.innerHTML = '';
  const posLabel = ['1st', '2nd', '3rd', '4th'];
  const pColors = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a'];
  ranking.forEach((r, pos) => {
    const li = document.createElement('li');
    li.style.background = pColors[r.index] + '33';
    li.style.borderLeft = '4px solid ' + pColors[r.index];
    li.innerHTML = '<span class="pos">' + posLabel[pos] + '</span> Player ' + (r.index + 1) + ' <span class="kills">' + r.kills + ' kills</span>';
    rankEl.appendChild(li);
  });
}
if (winnerEl) winnerEl.textContent = maxKills > 0 ? 'Winner: Player ' + (winner + 1) + ' with ' + maxKills + ' kills!' : 'Draw!';
  const endScreen = document.getElementById('endScreen');
  if (endScreen) endScreen.classList.add('visible');
  window.parent.postMessage({
    type: 'RESULT',
    payload: { gameId, scores, winner }
  }, '*');
}

function gameLoop() {
  if (!gameStarted || gameEnded) {
    requestAnimationFrame(gameLoop);
    return;
  }

  const dt = Math.min(clock.getDelta(), 0.1);
  gameTime += dt;
  const now = clock.getElapsedTime();

  if (gameTime >= GAME_DURATION) {
    endGame(teamKills > 0);
    requestAnimationFrame(gameLoop);
    return;
  }

  for (let i = 0; i < 4; i++) {
    const p = players[i];
    if (p.dead && now >= p.respawnAt) spawnPlayer(i);
  }

  if (enemies.length === 0 && waveEnemiesSpawned >= waveEnemiesTotal) {
    currentWave++;
    if (currentWave >= WAVES_TOTAL) {
      endGame(true);
      requestAnimationFrame(gameLoop);
      return;
    }
    waveEnemiesTotal = ENEMIES_PER_WAVE_BASE + currentWave * 2;
    waveEnemiesSpawned = 0;
  }
  while (waveEnemiesSpawned < waveEnemiesTotal && (waveEnemiesSpawned === 0 || Math.random() < 0.04)) {
    spawnEnemy();
    waveEnemiesSpawned++;
  }

  updateEnemies(dt);

  for (const e of enemies) {
    for (const p of players) {
      if (p.dead) continue;
      const dx = p.mesh.position.x - e.mesh.position.x, dz = p.mesh.position.z - e.mesh.position.z;
      if (dx*dx + dz*dz < ENEMY_CONTACT_RADIUS * ENEMY_CONTACT_RADIUS)
        p.health -= ENEMY_CONTACT_DAMAGE * dt;
    }
  }

  for (let i = 0; i < 4; i++) {
    const p = players[i];
    if (p.labelMesh) p.labelMesh.lookAt(camera.position);
    if (p.dead) continue;
    const state = playerControls.getPlayerState(i + 1);
    let vx = 0, vz = 0;
    if (state.up) vz -= 1;
    if (state.down) vz += 1;
    if (state.left) vx -= 1;
    if (state.right) vx += 1;
    if (vx !== 0 || vz !== 0) {
      const len = Math.sqrt(vx*vx + vz*vz);
      vx /= len; vz /= len;
      p.angle = Math.atan2(vx, -vz);
    }
    p.mesh.position.x += vx * PLAYER_SPEED * dt;
    p.mesh.position.z += vz * PLAYER_SPEED * dt;
    p.mesh.rotation.y = p.angle;
    p.mesh.position.x = Math.max(-ARENA_SIZE/2 + PLAYER_SIZE, Math.min(ARENA_SIZE/2 - PLAYER_SIZE, p.mesh.position.x));
    p.mesh.position.z = Math.max(-ARENA_SIZE/2 + PLAYER_SIZE, Math.min(ARENA_SIZE/2 - PLAYER_SIZE, p.mesh.position.z));
    if (state.action) fire(i);
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    const result = hitTestBullet(b, dt);
    if (result.hit) {
      scene.remove(b.mesh);
      bullets.splice(i, 1);
      if (result.enemyIndex >= 0) {
        const e = enemies[result.enemyIndex];
        e.hp -= BULLET_DAMAGE;
        if (e.hp <= 0) {
          scene.remove(e.mesh);
          enemies.splice(result.enemyIndex, 1);
          teamKills++;
          players[b.owner].kills++;
        }
      }
    }
  }

  updateUI();
  renderer.render(scene, camera);
  requestAnimationFrame(gameLoop);
}

document.getElementById('startBtn').onclick = () => {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('ui').style.display = 'flex';
  gameStarted = true;
  currentWave = 0;
  waveEnemiesTotal = ENEMIES_PER_WAVE_BASE;
  waveEnemiesSpawned = 0;
  teamKills = 0;
  clock.getDelta();
};

connectWebSocket();
initThree();
gameLoop();
