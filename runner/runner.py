import json
import os
import subprocess
import threading
import time
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from host
REPO_ROOT = os.environ.get("REPO_ROOT", "/repo")

# Shared control state for mobile controllers
# Format: {player: {button: pressed}}
control_state = {}
control_lock = threading.Lock()
control_state_file = "/tmp/pygame_controls.json"

def run_pygame(entry_path: str, args: list[str]) -> dict:
    # Run python file, capture stdout, parse RESULT line
    cmd = ["python", entry_path] + args
    proc = subprocess.run(
        cmd,
        cwd=os.path.dirname(entry_path),
        capture_output=True,
        text=True,
        timeout=120
    )

    stdout = proc.stdout or ""
    stderr = proc.stderr or ""

    # Look for line like: RESULT: {...json...}
    result_line = None
    for line in stdout.splitlines():
        if line.startswith("RESULT:"):
            result_line = line[len("RESULT:"):].strip()
            break

    if proc.returncode != 0:
        return {
            "ok": False,
            "error": "Pygame process failed",
            "returncode": proc.returncode,
            "stdout": stdout[-4000:],
            "stderr": stderr[-4000:],
        }

    if not result_line:
        return {
            "ok": False,
            "error": "Missing RESULT line in stdout",
            "stdout": stdout[-4000:],
            "stderr": stderr[-4000:],
        }

    try:
        payload = json.loads(result_line)
    except Exception as e:
        return {
            "ok": False,
            "error": f"Invalid RESULT JSON: {e}",
            "raw": result_line,
            "stdout": stdout[-4000:],
            "stderr": stderr[-4000:],
        }

    return {"ok": True, "result": payload}

def update_control_state():
    """Write control state to file for pygame games to read"""
    with control_lock:
        with open(control_state_file, "w") as f:
            json.dump(control_state, f)

@app.post("/control")
def set_control():
    """Receive control events from host (mobile controllers)"""
    data = request.get_json(force=True)
    player = data.get("player")
    button = data.get("button")
    pressed = data.get("pressed", False)
    
    if not player or not button:
        return jsonify({"ok": False, "error": "Missing player or button"}), 400
    
    with control_lock:
        if player not in control_state:
            control_state[player] = {}
        control_state[player][button] = pressed
        update_control_state()
    
    return jsonify({"ok": True})

@app.post("/run")
def run_game():
    data = request.get_json(force=True)
    entry = data.get("entry")
    players = data.get("players", 4)
    seed = data.get("seed", 123)

    if not entry:
        return jsonify({"ok": False, "error": "Missing entry"}), 400

    entry_path = os.path.join(REPO_ROOT, entry)
    if not os.path.exists(entry_path):
        return jsonify({"ok": False, "error": f"Entry not found: {entry}"}), 404

    # Clear control state before starting game
    with control_lock:
        control_state.clear()
        update_control_state()

    args = ["--players", str(players), "--seed", str(seed), "--mode", "jam"]
    out = run_pygame(entry_path, args)
    
    # Clear control state after game ends
    with control_lock:
        control_state.clear()
        update_control_state()
    
    return jsonify(out), (200 if out.get("ok") else 500)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
