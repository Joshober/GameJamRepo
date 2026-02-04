# Run host server with LOCAL MODE enabled
# This allows pygame games to run with visible windows on your PC
# while still using mobile controls via the host system

Write-Host "=== Starting Host Server (Local Mode) ===" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "host\server.js")) {
    Write-Host "ERROR: host\server.js not found. Please run this script from the repo root." -ForegroundColor Red
    exit 1
}

# Set environment variable for local mode
$env:RUN_LOCAL = "true"
$env:REPO_ROOT = (Get-Location).Path

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Local Mode: ENABLED (pygame games will show windows)" -ForegroundColor White
Write-Host "  Repo Root: $env:REPO_ROOT" -ForegroundColor White
Write-Host ""

# Install dependencies if needed
if (-not (Test-Path "host\node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    Push-Location host
    npm install
    Pop-Location
}

Write-Host "Starting server..." -ForegroundColor Cyan
Write-Host "  Open http://localhost:8080 in your browser" -ForegroundColor White
Write-Host "  Scan QR code with your phone to connect mobile controllers" -ForegroundColor White
Write-Host "  Pygame games will open in visible windows on your PC!" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start the server
Push-Location host
node server.js
Pop-Location
