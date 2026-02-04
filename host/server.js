import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import express from "express";
import { WebSocketServer } from "ws";
import QRCode from "qrcode";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const REPO_ROOT = process.env.REPO_ROOT || "/repo";
const RUNNER_URL = process.env.RUNNER_URL || "http://runner:5001";
const MINIGAMES_DIR = path.join(REPO_ROOT, "minigames");
const RUN_LOCAL = process.env.RUN_LOCAL === "true" || process.env.RUN_LOCAL === "1";

// Control file path (platform-aware)
const CONTROL_FILE = os.platform() === "win32" 
  ? path.join(os.tmpdir(), "pygame_controls.json")
  : "/tmp/pygame_controls.json";

// Local control state for mobile controllers (when running locally)
let localControlState = {};

// Control mapping for each game - maps mobile buttons to game-specific controls
const GAME_CONTROL_MAPPINGS = {
  // Standard games (Portal, BoredGame, etc.) - use standard mapping
  "default": {
    // Mobile button -> game control mapping per player
    player1: { up: "up", down: "down", left: "left", right: "right", action: "action", aim_up: "aim_up", aim_down: "aim_down" },
    player2: { up: "up", down: "down", left: "left", right: "right", action: "action", aim_up: "aim_up", aim_down: "aim_down" },
    player3: { up: "up", down: "down", left: "left", right: "right", action: "action", aim_up: "aim_up", aim_down: "aim_down" },
    player4: { up: "up", down: "down", left: "left", right: "right", action: "action", aim_up: "aim_up", aim_down: "aim_down" },
    // Control hints for UI
    hints: {
      player1: "WASD+Space",
      player2: "Arrows+Enter",
      player3: "IJKL+U",
      player4: "TFGH+R"
    }
  },
  // Racing game - different control scheme
  "racer-main": {
    // Racing: Player 1 = Arrows, Player 2 = WASD, Player 3 = IJKL, Player 4 = Numpad
    player1: { up: "up", down: "down", left: "left", right: "right", action: null }, // Arrows - up=accelerate, left/right=steer
    player2: { up: "up", down: "down", left: "left", right: "right", action: null }, // WASD
    player3: { up: "up", down: "down", left: "left", right: "right", action: null }, // IJKL
    player4: { up: "up", down: "down", left: "left", right: "right", action: null }, // Numpad
    hints: {
      player1: "Arrows",
      player2: "WASD",
      player3: "IJKL",
      player4: "Numpad"
    }
  },
  // Mario game - uses jump instead of action
  "super-mario-python": {
    // Mario: Player 1 = A/D/W/S, Player 2 = Arrows, Player 3 = J/L/I/K, Player 4 = Numpad
    // Mobile "up" maps to "jump", "action" not used
    player1: { up: "jump", down: "down", left: "left", right: "right", action: null },
    player2: { up: "jump", down: "down", left: "left", right: "right", action: null },
    player3: { up: "jump", down: "down", left: "left", right: "right", action: null },
    player4: { up: "jump", down: "down", left: "left", right: "right", action: null },
    hints: {
      player1: "A/D/W/S",
      player2: "Arrows",
      player3: "J/L/I/K",
      player4: "Numpad"
    }
  },
  // Portal game - standard with aim
  "mg-portal-2d-pygame": {
    player1: { up: "up", down: "down", left: "left", right: "right", action: "action", aim_up: "aim_up", aim_down: "aim_down" },
    player2: { up: "up", down: "down", left: "left", right: "right", action: "action", aim_up: "aim_up", aim_down: "aim_down" },
    player3: { up: "up", down: "down", left: "left", right: "right", action: "action", aim_up: "aim_up", aim_down: "aim_down" },
    player4: { up: "up", down: "down", left: "left", right: "right", action: "action", aim_up: "aim_up", aim_down: "aim_down" },
    hints: {
      player1: "WASD+Space",
      player2: "Arrows+Enter",
      player3: "IJKL+U",
      player4: "TFGH+R"
    }
  },
  // BoredGame - farming game with extra buttons
  "mg-bored-game": {
    player1: { 
      up: "up", down: "down", left: "left", right: "right", 
      action: "action", 
      plant: "plant", 
      eat: "eat", 
      use: "use",
      interact: "interact",
      aim_up: "inventory_prev",  // Map aim_up to inventory_prev (mouse wheel up)
      aim_down: "inventory_next"  // Map aim_down to inventory_next (mouse wheel down)
    },
    player2: { 
      up: "up", down: "down", left: "left", right: "right", 
      action: "action", 
      plant: "plant", 
      eat: "eat", 
      use: "use",
      interact: "interact",
      aim_up: "inventory_prev",
      aim_down: "inventory_next"
    },
    player3: { 
      up: "up", down: "down", left: "left", right: "right", 
      action: "action", 
      plant: "plant", 
      eat: "eat", 
      use: "use",
      interact: "interact",
      aim_up: "inventory_prev",
      aim_down: "inventory_next"
    },
    player4: { 
      up: "up", down: "down", left: "left", right: "right", 
      action: "action", 
      plant: "plant", 
      eat: "eat", 
      use: "use",
      interact: "interact",
      aim_up: "inventory_prev",
      aim_down: "inventory_next"
    },
    hints: {
      player1: "WASD+Space+E+R+Enter",
      player2: "Arrows+Enter+E+R",
      player3: "IJKL+U+E+R+Enter",
      player4: "TFGH+R+E+R+Enter"
    }
  },
  // DuckAttack - JS duck hunting game
  "mg-duck-attack": {
    player1: { up: "up", down: "down", left: "left", right: "right", action: "action" },
    player2: { up: "up", down: "down", left: "left", right: "right", action: "action" },
    player3: { up: "up", down: "down", left: "left", right: "right", action: "action" },
    player4: { up: "up", down: "down", left: "left", right: "right", action: "action" },
    hints: {
      player1: "WASD+Space",
      player2: "Arrows+Enter",
      player3: "IJKL+U",
      player4: "TFGH+R"
    }
  }
};

function getControlMapping(gameId) {
  return GAME_CONTROL_MAPPINGS[gameId] || GAME_CONTROL_MAPPINGS["default"];
}

function mapMobileControlToGame(gameId, playerNum, mobileButton) {
  const mapping = getControlMapping(gameId);
  const playerKey = `player${playerNum}`;
  const playerMapping = mapping[playerKey] || mapping.player1;
  return playerMapping[mobileButton] || null; // Returns null if button not used in this game
}

function safeReadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function listMinigames() {
  if (!fs.existsSync(MINIGAMES_DIR)) {
    return [];
  }
  
  const entries = fs.readdirSync(MINIGAMES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(name => !name.startsWith("_"));

  const games = [];
  for (const dir of entries) {
    const manifestPath = path.join(MINIGAMES_DIR, dir, "manifest.json");
    if (!fs.existsSync(manifestPath)) continue;
    try {
      const m = safeReadJson(manifestPath);
      // normalize relative entry to repo root
      const entry = m.entry?.startsWith("minigames/")
        ? m.entry
        : `minigames/${dir}/${m.entry}`;
      games.push({
        id: m.id,
        name: m.name,
        type: m.type,
        players: m.players ?? 4,
        folder: dir,
        entry
      });
    } catch {
      // ignore bad manifest
    }
  }
  return games.sort((a,b) => a.id.localeCompare(b.id));
}

function runNodeGame(entryPath, args) {
  return new Promise((resolve) => {
    const cmd = ["node", entryPath, ...args];
    const proc = spawn(cmd[0], cmd.slice(1), {
      cwd: path.dirname(entryPath),
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      // Look for line like: RESULT: {...json...}
      let resultLine = null;
      for (const line of stdout.split("\n")) {
        if (line.startsWith("RESULT:")) {
          resultLine = line.substring("RESULT:".length).trim();
          break;
        }
      }

      if (code !== 0) {
        resolve({
          ok: false,
          error: "Node.js process failed",
          returncode: code,
          stdout: stdout.slice(-4000),
          stderr: stderr.slice(-4000),
        });
        return;
      }

      if (!resultLine) {
        resolve({
          ok: false,
          error: "Missing RESULT line in stdout",
          stdout: stdout.slice(-4000),
          stderr: stderr.slice(-4000),
        });
        return;
      }

      try {
        const payload = JSON.parse(resultLine);
        resolve({ ok: true, result: payload });
      } catch (e) {
        resolve({
          ok: false,
          error: `Invalid RESULT JSON: ${e.message}`,
          raw: resultLine,
          stdout: stdout.slice(-4000),
          stderr: stderr.slice(-4000),
        });
      }
    });

    // Timeout after 120 seconds
    setTimeout(() => {
      proc.kill();
      resolve({
        ok: false,
        error: "Process timeout (120s)",
        stdout: stdout.slice(-4000),
        stderr: stderr.slice(-4000),
      });
    }, 120000);
  });
}

function runPygameLocal(entryPath, args) {
  return new Promise((resolve) => {
    // Clear control state before starting
    localControlState = {};
    updateLocalControlFile();
    
    // Determine Python command (python3 on Linux/Mac, python on Windows)
    const pythonCmd = os.platform() === "win32" ? "python" : "python3";
    const cmd = [pythonCmd, entryPath, ...args];
    
    const proc = spawn(cmd[0], cmd.slice(1), {
      cwd: path.dirname(entryPath),
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env } // Pass through environment (including DISPLAY if set)
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
      // Also output to console so user can see game output
      process.stdout.write(data);
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    proc.on("close", (code) => {
      // Clear control state after game ends
      localControlState = {};
      updateLocalControlFile();
      
      // Look for line like: RESULT: {...json...}
      let resultLine = null;
      for (const line of stdout.split("\n")) {
        if (line.startsWith("RESULT:")) {
          resultLine = line.substring("RESULT:".length).trim();
          break;
        }
      }

      if (code !== 0) {
        resolve({
          ok: false,
          error: "Pygame process failed",
          returncode: code,
          stdout: stdout.slice(-4000),
          stderr: stderr.slice(-4000),
        });
        return;
      }

      if (!resultLine) {
        resolve({
          ok: false,
          error: "Missing RESULT line in stdout",
          stdout: stdout.slice(-4000),
          stderr: stderr.slice(-4000),
        });
        return;
      }

      try {
        const payload = JSON.parse(resultLine);
        resolve({ ok: true, result: payload });
      } catch (e) {
        resolve({
          ok: false,
          error: `Invalid RESULT JSON: ${e.message}`,
          raw: resultLine,
          stdout: stdout.slice(-4000),
          stderr: stderr.slice(-4000),
        });
      }
    });

    // Timeout after 120 seconds
    setTimeout(() => {
      proc.kill();
      localControlState = {};
      updateLocalControlFile();
      resolve({
        ok: false,
        error: "Process timeout (120s)",
        stdout: stdout.slice(-4000),
        stderr: stderr.slice(-4000),
      });
    }, 120000);
  });
}

function updateLocalControlFile() {
  try {
    fs.writeFileSync(CONTROL_FILE, JSON.stringify(localControlState, null, 2));
  } catch (err) {
    console.error("Failed to write control file:", err);
  }
}

let state = {
  players: ["P1","P2","P3","P4"],
  scores: [0,0,0,0],  // Total points/score
  coins: [0,0,0,0],   // Coins earned
  stars: [0,0,0,0],   // Stars earned (bonus currency)
  games: [],
  lastResult: null,
  prizeHistory: []    // History of prize distributions
};

let currentGame = null; // Track currently running game

// Board game state
let boardGameState = {
  players: [
    { id: 0, name: 'P1', position: 0, coins: 0, stars: 0 },
    { id: 1, name: 'P2', position: 0, coins: 0, stars: 0 },
    { id: 2, name: 'P3', position: 0, coins: 0, stars: 0 },
    { id: 3, name: 'P4', position: 0, coins: 0, stars: 0 }
  ],
  currentTurn: 0,
  gamePhase: 'waiting',
  totalSpaces: 40
};

state.games = listMinigames();

app.use(express.static(path.join(__dirname, "public")));
app.use("/minigame", express.static(MINIGAMES_DIR));

// Serve controller.html for /controller route
app.get("/controller", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "controller.html"));
});

app.get("/api/games", (req, res) => {
  state.games = listMinigames();
  res.json(state.games);
});

app.get("/api/state", (req, res) => res.json(state));

// Board game API endpoints
app.get("/api/board/state", (req, res) => {
  // Sync board game coins/stars with main state
  boardGameState.players.forEach((p, i) => {
    p.coins = state.coins[i] || 0;
    p.stars = state.stars[i] || 0;
  });
  res.json({ state: boardGameState });
});

app.post("/api/board/state", (req, res) => {
  const newState = req.body.state;
  if (newState) {
    boardGameState = newState;
    // Sync back to main state
    state.coins = boardGameState.players.map(p => p.coins);
    state.stars = boardGameState.players.map(p => p.stars);
    broadcast({ type: "BOARD_STATE", payload: boardGameState });
    broadcast({ type: "STATE", payload: state });
  }
  res.json({ ok: true });
});

app.post("/api/board/roll", (req, res) => {
  const playerId = req.body.playerId;
  if (playerId !== boardGameState.currentTurn) {
    return res.status(400).json({ ok: false, error: "Not your turn" });
  }
  if (boardGameState.gamePhase !== 'waiting') {
    return res.status(400).json({ ok: false, error: "Invalid game phase" });
  }
  
  const result = Math.floor(Math.random() * 6) + 1;
  boardGameState.gamePhase = 'rolling';
  broadcast({ type: "BOARD_STATE", payload: boardGameState });
  res.json({ ok: true, result });
});

app.post("/api/board/move", (req, res) => {
  const playerId = req.body.playerId;
  const spaces = req.body.spaces;
  
  if (playerId !== boardGameState.currentTurn) {
    return res.status(400).json({ ok: false, error: "Not your turn" });
  }
  
  const player = boardGameState.players[playerId];
  player.position = (player.position + spaces) % boardGameState.totalSpaces;
  boardGameState.gamePhase = 'moving';
  
  broadcast({ type: "BOARD_STATE", payload: boardGameState });
  res.json({ ok: true, position: player.position });
});

app.post("/api/reset", (req, res) => {
  state.scores = [0,0,0,0];
  state.coins = [0,0,0,0];
  state.stars = [0,0,0,0];
  state.lastResult = null;
  state.prizeHistory = [];
  
  // Reset board game state
  boardGameState.players.forEach(p => {
    p.position = 0;
    p.coins = 0;
    p.stars = 0;
  });
  boardGameState.currentTurn = 0;
  boardGameState.gamePhase = 'waiting';
  
  broadcast({ type: "STATE", payload: state });
  broadcast({ type: "BOARD_STATE", payload: boardGameState });
  res.json({ ok: true });
});

app.post("/api/run/:gameId", async (req, res) => {
  const gameId = req.params.gameId;
  const game = listMinigames().find(g => g.id === gameId);
  if (!game) return res.status(404).json({ ok: false, error: "Game not found" });

  try {
    let result;
    currentGame = game; // Track running game for mobile controls
    
    // Get control hints for this game
    const controlMapping = getControlMapping(game.id);
    const hints = controlMapping.hints || GAME_CONTROL_MAPPINGS["default"].hints;
    
    // Broadcast game start to all controllers
    broadcast({ 
      type: "GAME_STARTED", 
      payload: { 
        game: { id: game.id, name: game.name, type: game.type },
        controlHints: hints
      } 
    });
    
    if (game.type === "pygame") {
      if (RUN_LOCAL) {
        // Run locally with visible window
        const entryPath = path.join(REPO_ROOT, game.entry);
        const args = ["--players", "4", "--seed", String(Math.floor(Math.random()*1e9)), "--mode", "jam"];
        const data = await runPygameLocal(entryPath, args);
        if (!data.ok) throw new Error(data.error || "Pygame game failed");
        result = data.result;
        currentGame = null;
        broadcast({ type: "GAME_ENDED", payload: {} });
      } else {
        // call runner (Docker/headless)
        const resp = await fetch(`${RUNNER_URL}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entry: game.entry,
            players: 4,
            seed: Math.floor(Math.random()*1e9)
          })
        });
        const data = await resp.json();
        if (!data.ok) throw new Error(data.error || "Runner failed");
        result = data.result;
        currentGame = null; // Clear after game completes
        // Broadcast game end
        broadcast({ type: "GAME_ENDED", payload: {} });
      }
    } else if (game.type === "node") {
      // run Node.js game via subprocess
      const entryPath = path.join(REPO_ROOT, game.entry);
      const args = ["--players", "4", "--seed", String(Math.floor(Math.random()*1e9)), "--mode", "jam"];
      const data = await runNodeGame(entryPath, args);
      if (!data.ok) throw new Error(data.error || "Node.js game failed");
      result = data.result;
      currentGame = null;
      // Broadcast game end
      broadcast({ type: "GAME_ENDED", payload: {} });
    } else if (game.type === "js") {
      // JS games run in browser; host waits for WS RESULT from client
      // We just broadcast "START_JS" and return immediately
      broadcast({ type: "START_JS", payload: { game }});
      return res.json({ ok: true, mode: "js", game });
    } else {
      currentGame = null;
      return res.status(400).json({ ok: false, error: "Unknown type" });
    }

    const prizes = applyResult(result);
    state.lastResult = { gameId, result, prizes };
    broadcast({ type: "STATE", payload: state });
    broadcast({ type: "PRIZES_AWARDED", payload: { gameId, prizes } });
    res.json({ ok: true, mode: game.type, game, result, prizes });

  } catch (e) {
    currentGame = null;
    broadcast({ type: "GAME_ENDED", payload: {} });
    res.status(500).json({ ok: false, error: String(e) });
  }
});

function calculatePrizes(scores, winner = null) {
  // Calculate ranking based on scores
  const players = scores.map((score, idx) => ({ player: idx, score: Number(score) || 0 }));
  
  // If winner is provided and valid, use it to determine 1st place
  // Otherwise, calculate from highest score
  if (winner !== null && winner >= 0 && winner < 4) {
    // Winner field provided - use it to set 1st place
    // Sort by score, but ensure winner is first
    players.sort((a, b) => {
      if (a.player === winner) return -1;
      if (b.player === winner) return 1;
      return b.score - a.score;
    });
  } else {
    // No winner field or invalid - calculate from highest score
    players.sort((a, b) => b.score - a.score);
  }
  
  // Assign rankings (handle ties)
  const rankings = new Array(4);
  let currentRank = 1;
  for (let i = 0; i < players.length; i++) {
    if (i > 0 && players[i].score < players[i-1].score) {
      currentRank = i + 1;
    }
    rankings[players[i].player] = currentRank;
  }
  
  // Prize distribution (Mario Party style)
  const prizeCoins = [10, 5, 3, 1];  // Coins for 1st, 2nd, 3rd, 4th
  const prizeStars = [1, 0, 0, 0];   // Stars for 1st place only
  
  const coins = new Array(4).fill(0);
  const stars = new Array(4).fill(0);
  
  for (let i = 0; i < 4; i++) {
    const rank = rankings[i];
    coins[i] = prizeCoins[rank - 1] || 0;
    stars[i] = prizeStars[rank - 1] || 0;
  }
  
  return {
    rankings,
    coins,
    stars,
    winner: winner !== null && winner >= 0 && winner < 4 ? winner : players[0].player,
    breakdown: players.map((p, idx) => ({
      player: p.player,
      score: p.score,
      rank: rankings[p.player],
      coins: coins[p.player],
      stars: stars[p.player]
    }))
  };
}

function applyResult(result) {
  const gameScores = result?.scores;
  if (!Array.isArray(gameScores) || gameScores.length !== 4) return;
  
  // Calculate prizes based on game scores, using winner field if provided
  const winner = result?.winner !== undefined ? Number(result.winner) : null;
  const prizes = calculatePrizes(gameScores, winner);
  
  // Add coins and stars to player totals
  state.coins = state.coins.map((c, i) => c + prizes.coins[i]);
  state.stars = state.stars.map((s, i) => s + prizes.stars[i]);
  
  // Sync with board game state
  boardGameState.players.forEach((p, i) => {
    p.coins = state.coins[i];
    p.stars = state.stars[i];
  });
  
  // Add raw scores to total scores
  state.scores = state.scores.map((s, i) => s + (Number(gameScores[i]) || 0));
  
  // Store prize history
  state.prizeHistory.unshift({
    gameId: result?.gameId || "unknown",
    timestamp: Date.now(),
    scores: gameScores,
    prizes: prizes
  });
  
  // Keep only last 10 games in history
  if (state.prizeHistory.length > 10) {
    state.prizeHistory.pop();
  }
  
  return prizes;
}

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, '0.0.0.0', () => {
  const networkIP = getLocalIP();
  console.log(`Host running on http://localhost:${PORT}`);
  console.log(`Network access: http://${networkIP}:${PORT}`);
  console.log(`QR code URL: http://${networkIP}:${PORT}/controller`);
  if (RUN_LOCAL) {
    console.log(`\n⚠️  LOCAL MODE ENABLED - Pygame games will run with visible windows`);
    console.log(`   Control file: ${CONTROL_FILE}`);
  }
});

// Mobile controller tracking
const mobileControllers = new Map(); // playerNum -> Set of WebSocket connections
const controllerAssignments = new Map(); // ws -> playerNum

// WebSockets for real-time UI + receiving JS results + mobile controllers
const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const isMobile = url.searchParams.get("mobile") === "true";
  
  if (isMobile) {
    // Mobile controller connection
    // Send current player availability when connecting
    const getTakenPlayers = () => {
      const taken = [];
      for (let p = 1; p <= 4; p++) {
        const existing = mobileControllers.get(p) || new Set();
        if (existing.size > 0) {
          taken.push(p);
        }
      }
      return taken;
    };
    
    ws.send(JSON.stringify({ 
      type: "PLAYER_AVAILABILITY", 
      takenPlayers: getTakenPlayers() 
    }));
    
    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === "JOIN") {
          // Player wants to join a slot
          const requestedPlayer = data.player || null;
          let assignedPlayer = null;
          
          // Find available slot
          if (requestedPlayer && requestedPlayer >= 1 && requestedPlayer <= 4) {
            // Check if slot is available (only 1 controller per slot)
            const existing = mobileControllers.get(requestedPlayer) || new Set();
            if (existing.size === 0) {
              assignedPlayer = requestedPlayer;
            }
          }
          
          // If requested slot not available, find first available
          if (!assignedPlayer) {
            for (let p = 1; p <= 4; p++) {
              const existing = mobileControllers.get(p) || new Set();
              if (existing.size === 0) {
                assignedPlayer = p;
                break;
              }
            }
          }
          
          if (assignedPlayer) {
            if (!mobileControllers.has(assignedPlayer)) {
              mobileControllers.set(assignedPlayer, new Set());
            }
            mobileControllers.get(assignedPlayer).add(ws);
            controllerAssignments.set(ws, assignedPlayer);
            
            // Get control hints for current game
            const gameId = currentGame ? currentGame.id : null;
            const controlMapping = getControlMapping(gameId);
            const hints = controlMapping.hints || GAME_CONTROL_MAPPINGS["default"].hints;
            
            ws.send(JSON.stringify({ 
              type: "JOINED", 
              player: assignedPlayer,
              currentGame: currentGame ? { id: currentGame.id, name: currentGame.name } : null,
              controlHints: hints
            }));
            // Broadcast to all mobile controllers about player availability change
            const takenPlayers = getTakenPlayers();
            for (const controllers of mobileControllers.values()) {
              for (const controllerWs of controllers) {
                if (controllerWs !== ws && controllerWs.readyState === 1) {
                  controllerWs.send(JSON.stringify({ 
                    type: "PLAYER_AVAILABILITY", 
                    takenPlayers: takenPlayers 
                  }));
                }
              }
            }
            broadcast({ type: "CONTROLLER_JOINED", player: assignedPlayer });
          } else {
            ws.send(JSON.stringify({ type: "JOIN_FAILED", error: "All slots full" }));
          }
        } else if (data.type === "CONTROL") {
          // Forward control event to game iframe (JS games) or runner (pygame games)
          const playerNum = controllerAssignments.get(ws);
          if (playerNum) {
            const gameId = currentGame ? currentGame.id : null;
            // Map mobile button to game-specific control
            const gameButton = mapMobileControlToGame(gameId, playerNum, data.button);
            
            // Skip if button not used in this game
            if (!gameButton) {
              return;
            }
            
            if (currentGame && currentGame.type === "pygame") {
              if (RUN_LOCAL) {
                // Write to local control file
                if (!localControlState[playerNum]) {
                  localControlState[playerNum] = {};
                }
                localControlState[playerNum][gameButton] = data.pressed;
                updateLocalControlFile();
              } else {
                // Forward to runner for pygame games (Docker mode)
                fetch(`${RUNNER_URL}/control`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    player: playerNum,
                    button: gameButton,
                    pressed: data.pressed
                  })
                }).catch(err => console.error("Failed to forward control to runner:", err));
              }
            } else {
              // Broadcast control event to all clients (JS game iframe will pick it up)
              broadcast({ 
                type: "MOBILE_CONTROL", 
                player: playerNum,
                button: gameButton, // Use mapped button
                pressed: data.pressed
              });
            }
          }
        }
      } catch {}
    });
    
    ws.on("close", () => {
      const playerNum = controllerAssignments.get(ws);
      if (playerNum) {
        const controllers = mobileControllers.get(playerNum);
        if (controllers) {
          controllers.delete(ws);
          if (controllers.size === 0) {
            mobileControllers.delete(playerNum);
          }
        }
        controllerAssignments.delete(ws);
        
        // Broadcast to all mobile controllers about player availability change
        const takenPlayers = getTakenPlayers();
        for (const controllers of mobileControllers.values()) {
          for (const controllerWs of controllers) {
            if (controllerWs.readyState === 1) {
              controllerWs.send(JSON.stringify({ 
                type: "PLAYER_AVAILABILITY", 
                takenPlayers: takenPlayers 
              }));
            }
          }
        }
        
        broadcast({ type: "CONTROLLER_LEFT", player: playerNum });
      }
    });
  } else {
    // Regular client (host UI or game iframe)
    clients.add(ws);
    ws.send(JSON.stringify({ type: "STATE", payload: state }));
    // Send current game info if available
    if (currentGame) {
      ws.send(JSON.stringify({ 
        type: "GAME_STARTED", 
        payload: { game: { id: currentGame.id, name: currentGame.name, type: currentGame.type } } 
      }));
    }

    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
      if (data.type === "RESULT") {
        // JS minigame sends {scores:[..], winner:..}
        const prizes = applyResult(data.payload);
        state.lastResult = { gameId: data.payload?.gameId ?? "js", result: data.payload, prizes };
        currentGame = null; // Clear after JS game completes
        broadcast({ type: "STATE", payload: state });
        broadcast({ type: "PRIZES_AWARDED", payload: { gameId: data.payload?.gameId ?? "js", prizes } });
        broadcast({ type: "GAME_ENDED", payload: {} });
      }
      } catch {}
    });

    ws.on("close", () => clients.delete(ws));
  }
});

function broadcast(obj) {
  const s = JSON.stringify(obj);
  for (const ws of clients) {
    try { ws.send(s); } catch {}
  }
  // Also broadcast to mobile controllers
  for (const controllers of mobileControllers.values()) {
    for (const ws of controllers) {
      try { ws.send(s); } catch {}
    }
  }
}

// Get local network IP address (not localhost)
function getLocalIP() {
  const ifaces = os.networkInterfaces();
  // First, try to find a non-internal IPv4 address
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      // Find first IPv4 address that's not internal (not 127.0.0.1)
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  // Fallback to localhost if no network interface found
  return '127.0.0.1';
}

// QR code generation endpoint
app.get("/api/qrcode", async (req, res) => {
  console.log("QR endpoint called");
  try {
    const port = process.env.PORT || 8080;
    const protocol = req.protocol === 'https' ? 'https' : 'http';
    
    // Try to get IP from request host first (works when accessed from network)
    let hostIP = req.get("host");
    if (hostIP && hostIP.includes(':')) {
      hostIP = hostIP.split(':')[0];
    }
    
    // Check environment variable first (for Docker)
    const dockerHost = process.env.HOST_IP;
    let networkIP;
    
    // If host is localhost/127.0.0.1, use environment variable or detect network IP
    if (!hostIP || hostIP === 'localhost' || hostIP === '127.0.0.1') {
      if (dockerHost) {
        networkIP = dockerHost;
        console.log(`QR: Using HOST_IP from environment: ${networkIP}`);
      } else {
        networkIP = getLocalIP();
        console.log(`QR: Using detected IP: ${networkIP}`);
      }
    } else {
      // Use the host IP from request (when accessed from network)
      networkIP = hostIP;
      console.log(`QR: Using request host IP: ${networkIP}`);
    }
    
    const controllerUrl = `${protocol}://${networkIP}:${port}/controller`;
    
    const qrCodeDataUrl = await QRCode.toDataURL(controllerUrl, {
      errorCorrectionLevel: "M",
      type: "image/png",
      width: 400,
      margin: 2
    });
    
    res.json({ url: controllerUrl, qrCode: qrCodeDataUrl, ip: networkIP });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
