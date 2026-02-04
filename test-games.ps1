# Quick test script for QR integration
Write-Host "=== Testing QR Integration ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check host is running
Write-Host "Test 1: Checking host..." -ForegroundColor Yellow
try {
    $games = Invoke-RestMethod -Uri "http://localhost:8080/api/games"
    Write-Host "✓ Host is running" -ForegroundColor Green
    Write-Host "  Found $($games.Count) games:" -ForegroundColor Gray
    foreach ($game in $games) {
        Write-Host "    - $($game.id) ($($game.type))" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Host is not accessible" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Check QR endpoint
Write-Host "Test 2: Checking QR code endpoint..." -ForegroundColor Yellow
try {
    $qr = Invoke-RestMethod -Uri "http://localhost:8080/api/qrcode"
    Write-Host "✓ QR code endpoint works" -ForegroundColor Green
    Write-Host "  URL: $($qr.url)" -ForegroundColor Gray
} catch {
    Write-Host "✗ QR code endpoint failed" -ForegroundColor Red
}
Write-Host ""

# Test 3: Test each game
$games = @(
    @{id="mg-bored-game"; name="BoredGame"; type="pygame"},
    @{id="mg-portal-2d-pygame"; name="Portal 2D"; type="pygame"},
    @{id="mg-duck-attack"; name="DuckAttack"; type="pygame"},
    @{id="mg-shooter-4p-3d"; name="Shooter 3D"; type="js"}
)

Write-Host "Test 3: Testing games (this will start each game briefly)..." -ForegroundColor Yellow
Write-Host ""

foreach ($game in $games) {
    Write-Host "Testing: $($game.name) ($($game.type))..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/api/run/$($game.id)" -Method POST -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ Game started successfully" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ Game returned status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -like "*404*") {
            Write-Host "  ✗ Game not found" -ForegroundColor Red
        } else {
            Write-Host "  ✗ Error: $errorMsg" -ForegroundColor Red
        }
    }
    Start-Sleep -Seconds 2
    Write-Host ""
}

Write-Host "=== Testing Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:8080 in your browser" -ForegroundColor White
Write-Host "2. Verify QR code is displayed" -ForegroundColor White
Write-Host "3. Scan QR code with your phone" -ForegroundColor White
Write-Host "4. Test each game manually with mobile controls" -ForegroundColor White
