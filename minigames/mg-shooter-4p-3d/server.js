import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3847;

// Rutas antes de static para que /qrcode, /ip, /qr tengan prioridad
app.get('/ip', (req, res) => {
  res.json({ ip: getLocalIP(), port: PORT });
});

app.get('/qrcode', async (req, res) => {
  const player = Math.min(4, Math.max(1, parseInt(req.query.player, 10) || 1));
  const ip = getLocalIP();
  const url = `http://${ip}:${PORT}/controller?player=${player}`;
  try {
    const size = Math.min(400, parseInt(req.query.size, 10) || 320);
    const buf = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'H',
      margin: 3,
      width: size,
      type: 'png'
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.send(buf);
  } catch (e) {
    res.status(500).send('Error generando QR');
  }
});

app.use(express.static(__dirname));

app.get('/controller', (req, res) => {
  const player = Math.min(4, Math.max(1, parseInt(req.query.player, 10) || 1));
  const html = getControllerHTML(player);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

function getControllerHTML(playerNum) {
  const colors = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a'];
  const color = colors[playerNum - 1] || colors[0];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no"/>
  <title>Player ${playerNum} Control</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body { background: #1a1a2e; color: #fff; font-family: system-ui, sans-serif; overflow: hidden; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    h1 { font-size: 1.2rem; margin-bottom: 8px; color: ${color}; }
    #status { font-size: 0.85rem; opacity: 0.8; margin-bottom: 24px; }
    #status.connected { color: #2a9d8f; }
    #status.disconnected { color: #e63946; }
    .dpad { display: grid; grid-template-columns: 1fr 80px 1fr; grid-template-rows: 1fr 80px 1fr; gap: 8px; margin-bottom: 24px; }
    .dpad button { width: 80px; height: 80px; border: none; border-radius: 16px; background: rgba(255,255,255,0.15); color: #fff; font-size: 24px; touch-action: manipulation; }
    .dpad button:active, .dpad button.held { background: ${color}; }
    .dpad .up { grid-column: 2; grid-row: 1; }
    .dpad .down { grid-column: 2; grid-row: 3; }
    .dpad .left { grid-column: 1; grid-row: 2; }
    .dpad .right { grid-column: 3; grid-row: 2; }
    #shoot { width: 160px; height: 80px; border: none; border-radius: 16px; background: ${color}; color: #fff; font-size: 1.2rem; font-weight: bold; touch-action: manipulation; }
    #shoot:active { opacity: 0.9; }
  </style>
</head>
<body>
  <h1>Player ${playerNum}</h1>
  <p id="status" class="disconnected">Connecting...</p>
  <div class="dpad">
    <button class="up" data="up" aria-label="Up">▲</button>
    <button class="down" data="down" aria-label="Down">▼</button>
    <button class="left" data="left" aria-label="Left">◀</button>
    <button class="right" data="right" aria-label="Right">▶</button>
  </div>
  <button id="shoot" data="action">FIRE</button>
  <script>
    const player = ${playerNum};
    const state = { up: false, down: false, left: false, right: false, action: false };
    const wsUrl = (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host;
    let ws = null;
    function connect() {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => { document.getElementById('status').textContent = 'Connected'; document.getElementById('status').className = 'connected'; sendState(); };
      ws.onclose = () => { document.getElementById('status').textContent = 'Disconnected'; document.getElementById('status').className = 'disconnected'; setTimeout(connect, 2000); };
      ws.onerror = () => {};
    }
    function sendState() {
      if (ws && ws.readyState === WebSocket.OPEN)
        ws.send(JSON.stringify({ type: 'control', player, ...state }));
    }
    function setKey(key, value) {
      state[key] = value;
      sendState();
    }
    document.querySelectorAll('.dpad button, #shoot').forEach(btn => {
      const key = btn.getAttribute('data');
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); setKey(key, true); btn.classList.add('held'); });
      btn.addEventListener('touchend', (e) => { e.preventDefault(); setKey(key, false); btn.classList.remove('held'); });
      btn.addEventListener('mousedown', () => { setKey(key, true); btn.classList.add('held'); });
      btn.addEventListener('mouseup', () => { setKey(key, false); btn.classList.remove('held'); });
      btn.addEventListener('mouseleave', () => { setKey(key, false); btn.classList.remove('held'); });
    });
    connect();
  </script>
</body>
</html>`;
}

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

// QR page: 4 large QRs, one per player
app.get('/qr', (req, res) => {
  const ip = getLocalIP();
  const base = `http://${ip}:${PORT}/controller`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Mobile Control QR · 4 players</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh; background: linear-gradient(180deg, #0d0d14 0%, #1a1a2e 100%);
      color: #fff; font-family: system-ui, sans-serif;
      display: flex; flex-direction: column; align-items: center; padding: 24px;
    }
    h1 { font-size: 1.5rem; margin-bottom: 8px; color: #2a9d8f; }
    p { opacity: 0.85; margin-bottom: 20px; text-align: center; }
    .qrGrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; max-width: 520px; margin-bottom: 24px; }
    .qrCell {
      background: #fff; padding: 16px; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      text-align: center;
    }
    .qrCell span { display: block; font-size: 14px; color: #1a1a2e; margin-bottom: 10px; font-weight: bold; }
    .qrCell img { display: block; width: 200px; height: 200px; margin: 0 auto; }
    .url { font-size: 12px; word-break: break-all; background: rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 10px; margin-bottom: 16px; max-width: 400px; text-align: center; }
    .links { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
    .links a { color: #2a9d8f; padding: 8px 14px; border-radius: 10px; background: rgba(42,157,143,0.2); text-decoration: none; font-size: 14px; }
    .links a:hover { background: rgba(42,157,143,0.35); }
  </style>
</head>
<body>
  <h1>Scan with your phone</h1>
  <p>Each player scans their QR · Same WiFi as the computer</p>
  <div class="qrGrid">
    <div class="qrCell"><span>Player 1</span><img src="/qrcode?player=1&size=240" alt="QR P1" width="200" height="200"/></div>
    <div class="qrCell"><span>Player 2</span><img src="/qrcode?player=2&size=240" alt="QR P2" width="200" height="200"/></div>
    <div class="qrCell"><span>Player 3</span><img src="/qrcode?player=3&size=240" alt="QR P3" width="200" height="200"/></div>
    <div class="qrCell"><span>Player 4</span><img src="/qrcode?player=4&size=240" alt="QR P4" width="200" height="200"/></div>
  </div>
  <div class="url">${base}?player=1 ... ${base}?player=4</div>
  <div class="links">
    <a href="/controller?player=1">Open control P1</a>
    <a href="/controller?player=2">Open control P2</a>
    <a href="/controller?player=3">Open control P3</a>
    <a href="/controller?player=4">Open control P4</a>
  </div>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

let gameClient = null;

wss.on('connection', (ws, req) => {
  const url = req.url || '';
  if (url.includes('game')) {
    gameClient = ws;
    ws.on('close', () => { gameClient = null; });
    return;
  }
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'control' && gameClient && gameClient.readyState === 1)
        gameClient.send(JSON.stringify(msg));
    } catch (_) {}
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`Shooter 4p: http://localhost:${PORT}`);
  console.log(`Móviles (misma WiFi): http://${ip}:${PORT}/controller?player=1 ... player=4`);
});
