import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import express from "express";
import { WebSocketServer } from "ws";
import QRCode from "qrcode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const REPO_ROOT = process.env.REPO_ROOT || "/repo";
const RUNNER_URL = process.env.RUNNER_URL || "http://runner:5001";
const MINIGAMES_DIR = path.join(REPO_ROOT, "minigames");

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

state.games = listMinigames();

app.use(express.static(path.join(__dirname, "public")));
app.use("/minigame", express.static(MINIGAMES_DIR));

app.get("/api/games", (req, res) => {
  state.games = listMinigames();
  res.json(state.games);
});

app.get("/api/state", (req, res) => res.json(state));

app.post("/api/reset", (req, res) => {
  state.scores = [0,0,0,0];
  state.coins = [0,0,0,0];
  state.stars = [0,0,0,0];
  state.lastResult = null;
  state.prizeHistory = [];
  broadcast({ type: "STATE", payload: state });
  res.json({ ok: true });
});

app.post("/api/run/:gameId", async (req, res) => {
  const gameId = req.params.gameId;
  const game = listMinigames().find(g => g.id === gameId);
  if (!game) return res.status(404).json({ ok: false, error: "Game not found" });

  try {
    let result;
    currentGame = game; // Track running game for mobile controls
    
    if (game.type === "pygame") {
      // call runner
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
    } else if (game.type === "node") {
      // run Node.js game via subprocess
      const entryPath = path.join(REPO_ROOT, game.entry);
      const args = ["--players", "4", "--seed", String(Math.floor(Math.random()*1e9)), "--mode", "jam"];
      const data = await runNodeGame(entryPath, args);
      if (!data.ok) throw new Error(data.error || "Node.js game failed");
      result = data.result;
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
    res.status(500).json({ ok: false, error: String(e) });
  }
});

function calculatePrizes(scores) {
  // Calculate ranking based on scores
  const players = scores.map((score, idx) => ({ player: idx, score: Number(score) || 0 }));
  players.sort((a, b) => b.score - a.score);
  
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
  
  // Calculate prizes based on game scores
  const prizes = calculatePrizes(gameScores);
  
  // Add coins and stars to player totals
  state.coins = state.coins.map((c, i) => c + prizes.coins[i]);
  state.stars = state.stars.map((s, i) => s + prizes.stars[i]);
  
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

const server = app.listen(8080, () => {
  console.log("Host running on http://localhost:8080");
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
    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === "JOIN") {
          // Player wants to join a slot
          const requestedPlayer = data.player || null;
          let assignedPlayer = null;
          
          // Find available slot
          if (requestedPlayer && requestedPlayer >= 1 && requestedPlayer <= 4) {
            // Check if slot is available (less than 2 controllers per slot)
            const existing = mobileControllers.get(requestedPlayer) || new Set();
            if (existing.size < 2) {
              assignedPlayer = requestedPlayer;
            }
          }
          
          // If requested slot not available, find first available
          if (!assignedPlayer) {
            for (let p = 1; p <= 4; p++) {
              const existing = mobileControllers.get(p) || new Set();
              if (existing.size < 2) {
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
            ws.send(JSON.stringify({ 
              type: "JOINED", 
              player: assignedPlayer,
              controls: getControlMapping(assignedPlayer)
            }));
            broadcast({ type: "CONTROLLER_JOINED", player: assignedPlayer });
          } else {
            ws.send(JSON.stringify({ type: "JOIN_FAILED", error: "All slots full" }));
          }
        } else if (data.type === "CONTROL") {
          // Forward control event to game iframe (JS games) or runner (pygame games)
          const playerNum = controllerAssignments.get(ws);
          if (playerNum) {
            if (currentGame && currentGame.type === "pygame") {
              // Forward to runner for pygame games
              fetch(`${RUNNER_URL}/control`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  player: playerNum,
                  button: data.button,
                  pressed: data.pressed
                })
              }).catch(err => console.error("Failed to forward control to runner:", err));
            } else {
              // Broadcast control event to all clients (JS game iframe will pick it up)
              broadcast({ 
                type: "MOBILE_CONTROL", 
                player: playerNum,
                button: data.button,
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
        broadcast({ type: "CONTROLLER_LEFT", player: playerNum });
      }
    });
  } else {
    // Regular client (host UI or game iframe)
    clients.add(ws);
    ws.send(JSON.stringify({ type: "STATE", payload: state }));

    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
      if (data.type === "RESULT") {
        // JS minigame sends {scores:[..], winner:..}
        const prizes = applyResult(data.payload);
        state.lastResult = { gameId: data.payload?.gameId ?? "js", result: data.payload, prizes };
        broadcast({ type: "STATE", payload: state });
        broadcast({ type: "PRIZES_AWARDED", payload: { gameId: data.payload?.gameId ?? "js", prizes } });
      }
      } catch {}
    });

    ws.on("close", () => clients.delete(ws));
  }
});

function getControlMapping(playerNum) {
  const mappings = {
    1: { up: "W", down: "S", left: "A", right: "D", action: "Space" },
    2: { up: "↑", down: "↓", left: "←", right: "→", action: "Enter" },
    3: { up: "I", down: "K", left: "J", right: "L", action: "U" },
    4: { up: "T", down: "G", left: "F", right: "H", action: "R" }
  };
  return mappings[playerNum] || {};
}

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

// QR code generation endpoint
app.get("/api/qrcode", async (req, res) => {
  try {
    const protocol = req.protocol;
    const host = req.get("host");
    const controllerUrl = `${protocol}://${host}/controller`;
    
    const qrCodeDataUrl = await QRCode.toDataURL(controllerUrl, {
      errorCorrectionLevel: "M",
      type: "image/png",
      width: 400,
      margin: 2
    });
    
    res.json({ url: controllerUrl, qrCode: qrCodeDataUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
