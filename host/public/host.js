const scoresEl = document.getElementById("scores");
const prizesEl = document.getElementById("prizes");
const prizeBreakdownEl = document.getElementById("prizeBreakdown");
const lastEl = document.getElementById("last");
const gameSelect = document.getElementById("gameSelect");
const frame = document.getElementById("frame");
const qrcodeEl = document.getElementById("qrcode");
const controllerStatusEl = document.getElementById("controllerStatus");

const ws = new WebSocket(`ws://${location.host}`);

let currentState = null;
const connectedControllers = new Set();
let currentGame = null;

// Load QR code on page load
async function loadQRCode() {
  try {
    const resp = await fetch("/api/qrcode");
    const data = await resp.json();
    qrcodeEl.src = data.qrCode;
    controllerStatusEl.textContent = `Scan to connect: ${data.url}`;
    updateQRDisplay();
  } catch (e) {
    controllerStatusEl.textContent = "Failed to load QR code";
    console.error(e);
  }
}

loadQRCode();

ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === "STATE") {
    currentState = msg.payload;
    render();
  }
  if (msg.type === "START_JS") {
    const game = msg.payload.game;
    currentGame = game;
    updateQRDisplay();
    // Load JS game in iframe and make it fullscreen
    // Extract the filename from the entry path (e.g., "minigames/DuckAttack/duck_hunt_ultra_realistic.html" -> "duck_hunt_ultra_realistic.html")
    const entryFile = game.entry.split('/').pop();
    const gameUrl = `/minigame/${game.folder}/${entryFile}?gameId=${encodeURIComponent(game.id)}`;
    
    // Load game in iframe
    frame.src = gameUrl;
    
    // Show iframe and make it fullscreen
    frame.style.display = 'block';
    frame.onload = () => {
      // Request fullscreen for the iframe
      if (frame.requestFullscreen) {
        frame.requestFullscreen().catch(err => {
          console.log("Fullscreen request failed:", err);
        });
      } else if (frame.webkitRequestFullscreen) {
        frame.webkitRequestFullscreen();
      } else if (frame.mozRequestFullScreen) {
        frame.mozRequestFullScreen();
      } else if (frame.msRequestFullscreen) {
        frame.msRequestFullscreen();
      }
    };
  }
  if (msg.type === "PRIZES_AWARDED") {
    // Game finished, clear current game after a delay
    setTimeout(() => {
      currentGame = null;
      updateQRDisplay();
    }, 5000);
  }
  if (msg.type === "MOBILE_CONTROL") {
    // Forward mobile control event to game iframe
    if (frame && frame.contentWindow) {
      try {
        frame.contentWindow.postMessage({
          type: "MOBILE_CONTROL",
          player: msg.player,
          button: msg.button,
          pressed: msg.pressed
        }, "*");
      } catch (e) {
        console.warn("Failed to send mobile control to game iframe:", e);
      }
    }
  }
  if (msg.type === "CONTROLLER_JOINED") {
    connectedControllers.add(msg.player);
    updateControllerStatus();
  }
  if (msg.type === "CONTROLLER_LEFT") {
    connectedControllers.delete(msg.player);
    updateControllerStatus();
  }
  if (msg.type === "PRIZES_AWARDED") {
    showPrizeBreakdown(msg.payload);
  }
};

function updateControllerStatus() {
  const count = connectedControllers.size;
  if (count === 0) {
    controllerStatusEl.textContent = "No controllers connected";
  } else {
    const players = Array.from(connectedControllers).sort().join(", ");
    controllerStatusEl.textContent = `${count} controller(s) connected: Player ${players}`;
  }
}

function updateQRDisplay() {
  const qrContainer = document.getElementById("qrcodeContainer");
  if (!qrContainer) return;
  
  if (currentGame) {
    qrContainer.style.opacity = "1";
    qrContainer.style.border = "3px solid var(--mp-green)";
    qrContainer.style.borderRadius = "12px";
    qrContainer.style.padding = "12px";
    qrContainer.style.background = "rgba(76, 175, 80, 0.1)";
    qrContainer.setAttribute("title", `Game active: ${currentGame.name}. QR code ready for controllers.`);
  } else {
    qrContainer.style.opacity = "1";
    qrContainer.style.border = "3px solid var(--mp-blue)";
    qrContainer.style.borderRadius = "12px";
    qrContainer.style.padding = "12px";
    qrContainer.style.background = "rgba(74, 144, 226, 0.1)";
    qrContainer.setAttribute("title", "QR code works for all minigames. Scan to connect your phone as a controller.");
  }
}

let previousCoins = [0, 0, 0, 0];
let previousStars = [0, 0, 0, 0];

function render() {
  if (!currentState) return;
  
  // Render scores with player cards
  scoresEl.innerHTML = currentState.players
    .map((p,i)=>`
      <div class="player-card player-${i+1}" style="margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="font-size:18px;">${p}</strong>
            <div style="font-size:14px; color:var(--text-secondary); margin-top:4px;">
              ${currentState.scores[i]} pts
            </div>
          </div>
        </div>
      </div>
    `)
    .join("");
  
  // Render coins and stars with animations
  prizesEl.innerHTML = currentState.players
    .map((p,i)=> {
      const coinsChanged = currentState.coins[i] !== previousCoins[i];
      const starsChanged = currentState.stars[i] !== previousStars[i];
      previousCoins[i] = currentState.coins[i] || 0;
      previousStars[i] = currentState.stars[i] || 0;
      
      return `
        <div class="prize-item player-card player-${i+1}" style="margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <strong>${p}</strong>
            <div style="display:flex; gap:16px;">
              <span class="coin ${coinsChanged ? 'animate-bounce' : ''}" style="transition:all 0.3s;">
                🪙 ${currentState.coins[i] || 0}
              </span>
              <span class="star ${starsChanged ? 'animate-bounce' : ''}" style="transition:all 0.3s;">
                ⭐ ${currentState.stars[i] || 0}
              </span>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
  
  lastEl.textContent = currentState.lastResult
    ? `🎮 Last game: ${currentState.lastResult.gameId || "unknown"}`
    : "Last: (none)";
}

function showPrizeBreakdown(data) {
  const { gameId, prizes } = data;
  if (!prizes || !prizes.breakdown) return;
  
  prizeBreakdownEl.style.display = "block";
  prizeBreakdownEl.style.animation = "none";
  setTimeout(() => {
    prizeBreakdownEl.style.animation = "bounce 0.5s ease";
  }, 10);
  
  prizeBreakdownEl.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
      <span style="font-size:24px;">🏆</span>
      <strong style="font-size:18px;">Prize Breakdown</strong>
      <span class="badge badge-js" style="margin-left:auto;">${gameId}</span>
    </div>
    ${prizes.breakdown.map(p => `
      <div class="player-card player-${p.player + 1}" style="margin-top:12px; padding:12px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span class="rank-badge rank-${p.rank}">${p.rank}</span>
          <div style="flex:1;">
            <strong>Player ${p.player + 1}</strong>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">
              Score: ${p.score}
            </div>
          </div>
          <div style="display:flex; gap:12px; align-items:center;">
            <span class="coin" style="font-size:18px;">+${p.coins} 🪙</span>
            ${p.stars > 0 ? `<span class="star" style="font-size:18px;">+${p.stars} ⭐</span>` : ''}
          </div>
        </div>
      </div>
    `).join("")}
  `;
  
  // Auto-hide after 10 seconds with fade
  setTimeout(() => {
    prizeBreakdownEl.style.opacity = "0";
    prizeBreakdownEl.style.transition = "opacity 0.5s";
    setTimeout(() => {
      prizeBreakdownEl.style.display = "none";
      prizeBreakdownEl.style.opacity = "1";
    }, 500);
  }, 10000);
}

async function refreshGames() {
  try {
    const games = await (await fetch("/api/games")).json();
    gameSelect.innerHTML = "";
    
    // Add default placeholder option
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a game...";
    placeholder.disabled = true;
    placeholder.selected = true;
    gameSelect.appendChild(placeholder);
    
    for (const g of games) {
      const opt = document.createElement("option");
      opt.value = g.id;
      const typeBadge = g.type === 'js' ? 'badge-js' : g.type === 'node' ? 'badge-node' : 'badge-pygame';
      opt.innerHTML = `${g.id} — ${g.name} <span class="badge ${typeBadge}">${g.type}</span>`;
      gameSelect.appendChild(opt);
    }
    
    // Make sure select is visible
    gameSelect.style.display = "block";
    gameSelect.style.visibility = "visible";
    gameSelect.style.opacity = "1";
  } catch (e) {
    console.error("Failed to load games:", e);
    gameSelect.innerHTML = '<option value="">Error loading games</option>';
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
    // Exit fullscreen and hide iframe after result is sent
    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setTimeout(() => {
      frame.style.display = 'none';
      frame.src = 'about:blank';
    }, 1000);
  }
});

// initial
refreshGames();
