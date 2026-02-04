# PowerShell script to run a pygame game locally with mobile control support
param(
    [Parameter(Mandatory=$true)]
    [string]$GamePath,
    
    [int]$Players = 4,
    [int]$Seed = 123,
    [string]$Mode = "jam"
)

Write-Host "=== Running Game Locally ===" -ForegroundColor Cyan
Write-Host ""

# Check if game path exists
if (-not (Test-Path $GamePath)) {
    Write-Host "Error: Game not found at $GamePath" -ForegroundColor Red
    exit 1
}

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Python not found. Please install Python 3.11+" -ForegroundColor Red
    exit 1
}

# Check if host/runner are running
Write-Host "Checking host system..." -ForegroundColor Yellow
try {
    $hostStatus = Invoke-WebRequest -Uri "http://localhost:8080/api/games" -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "✓ Host is running" -ForegroundColor Green
} catch {
    Write-Host "⚠ Host not running. Mobile controls won't work." -ForegroundColor Yellow
    Write-Host "  Start with: docker-compose up -d" -ForegroundColor Gray
}

try {
    $runnerStatus = Invoke-WebRequest -Uri "http://localhost:5001" -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "✓ Runner is running" -ForegroundColor Green
} catch {
    Write-Host "⚠ Runner not running. Mobile controls won't work." -ForegroundColor Yellow
    Write-Host "  Start with: docker-compose up -d runner" -ForegroundColor Gray
}

# Create temp directory for control file (Windows)
if ($IsWindows -or $env:OS -like "*Windows*") {
    $tempDir = $env:TEMP
    $controlFile = Join-Path $tempDir "pygame_controls.json"
    Write-Host "Control file will be at: $controlFile" -ForegroundColor Gray
    
    # Ensure directory exists
    if (-not (Test-Path $tempDir)) {
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    }
}

Write-Host ""
Write-Host "Starting game..." -ForegroundColor Cyan
Write-Host "Game: $GamePath" -ForegroundColor White
Write-Host "Players: $Players, Seed: $Seed, Mode: $Mode" -ForegroundColor White
Write-Host ""
Write-Host "Controls:" -ForegroundColor Yellow
Write-Host "  Player 1: WASD + Space" -ForegroundColor White
Write-Host "  Player 2: Arrow Keys + Enter" -ForegroundColor White
Write-Host "  Player 3: IJKL + U" -ForegroundColor White
Write-Host "  Player 4: TFGH + R" -ForegroundColor White
Write-Host ""
Write-Host "Mobile Controls:" -ForegroundColor Yellow
Write-Host "  Scan QR code at http://localhost:8080" -ForegroundColor White
Write-Host "  Or use network IP: http://10.110.101.211:8080" -ForegroundColor White
Write-Host ""

# Change to game directory
$gameDir = Split-Path -Parent $GamePath
$gameFile = Split-Path -Leaf $GamePath

Push-Location $gameDir

try {
    # Run the game
    python $gameFile --players $Players --seed $Seed --mode $Mode
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Game finished!" -ForegroundColor Green
