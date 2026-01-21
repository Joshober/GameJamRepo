import json
import os
import subprocess
from flask import Flask, request, jsonify

app = Flask(__name__)
REPO_ROOT = os.environ.get("REPO_ROOT", "/repo")

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

    args = ["--players", str(players), "--seed", str(seed), "--mode", "jam"]
    out = run_pygame(entry_path, args)
    return jsonify(out), (200 if out.get("ok") else 500)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
