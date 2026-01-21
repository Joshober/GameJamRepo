import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import express from "express";
import { WebSocketServer } from "ws";

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
  scores: [0,0,0,0],
  games: [],
  lastResult: null
};

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
  state.lastResult = null;
  broadcast({ type: "STATE", payload: state });
  res.json({ ok: true });
});

app.post("/api/run/:gameId", async (req, res) => {
  const gameId = req.params.gameId;
  const game = listMinigames().find(g => g.id === gameId);
  if (!game) return res.status(404).json({ ok: false, error: "Game not found" });

  try {
    let result;
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
      return res.status(400).json({ ok: false, error: "Unknown type" });
    }

    applyResult(result);
    state.lastResult = { gameId, result };
    broadcast({ type: "STATE", payload: state });
    res.json({ ok: true, mode: game.type, game, result });

  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

function applyResult(result) {
  const add = result?.scores;
  if (!Array.isArray(add) || add.length !== 4) return;
  state.scores = state.scores.map((s, i) => s + (Number(add[i]) || 0));
}

const server = app.listen(8080, () => {
  console.log("Host running on http://localhost:8080");
});

// WebSockets for real-time UI + receiving JS results
const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: "STATE", payload: state }));

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === "RESULT") {
        // JS minigame sends {scores:[..], winner:..}
        applyResult(data.payload);
        state.lastResult = { gameId: data.payload?.gameId ?? "js", result: data.payload };
        broadcast({ type: "STATE", payload: state });
      }
    } catch {}
  });

  ws.on("close", () => clients.delete(ws));
});

function broadcast(obj) {
  const s = JSON.stringify(obj);
  for (const ws of clients) {
    try { ws.send(s); } catch {}
  }
}
