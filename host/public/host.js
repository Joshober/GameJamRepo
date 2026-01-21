const scoresEl = document.getElementById("scores");
const lastEl = document.getElementById("last");
const gameSelect = document.getElementById("gameSelect");
const frame = document.getElementById("frame");

const ws = new WebSocket(`ws://${location.host}`);

let currentState = null;

ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === "STATE") {
    currentState = msg.payload;
    render();
  }
  if (msg.type === "START_JS") {
    const game = msg.payload.game;
    // load JS game directly from repo-mounted minigames folder via host static? not served automatically.
    // simplest: JS minigames are plain files; host will serve them via a small proxy endpoint later if needed.
    // For now: we load from /minigame?path=... (implemented below as a quick static mapping approach)
    frame.src = `/minigame/${game.folder}/index.html?gameId=${encodeURIComponent(game.id)}`;
  }
};

function render() {
  if (!currentState) return;
  scoresEl.innerHTML = currentState.players
    .map((p,i)=>`<div><b>${p}</b>: ${currentState.scores[i]}</div>`)
    .join("");
  lastEl.textContent = currentState.lastResult
    ? `Last: ${JSON.stringify(currentState.lastResult)}`
    : "Last: (none)";
}

async function refreshGames() {
  const games = await (await fetch("/api/games")).json();
  gameSelect.innerHTML = "";
  for (const g of games) {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = `${g.id} — ${g.name} (${g.type})`;
    gameSelect.appendChild(opt);
  }
}

document.getElementById("refreshBtn").onclick = refreshGames;

document.getElementById("resetBtn").onclick = async () => {
  await fetch("/api/reset", { method:"POST" });
};

document.getElementById("runBtn").onclick = async () => {
  const gameId = gameSelect.value;
  const resp = await fetch(`/api/run/${encodeURIComponent(gameId)}`, { method:"POST" });
  const data = await resp.json();
  if (!data.ok) alert(data.error || "Failed");

  // If it's pygame or node, scores update immediately via STATE broadcast.
  // If it's JS, it will load in iframe and send RESULT over postMessage->WS below.
};

window.addEventListener("message", (evt) => {
  if (evt?.data?.type === "RESULT") {
    // forward to server via WS
    ws.send(JSON.stringify({ type: "RESULT", payload: evt.data.payload }));
  }
});

// initial
refreshGames();
