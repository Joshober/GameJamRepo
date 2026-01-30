# Download assets for board game
$ErrorActionPreference = "Continue"

$baseDir = $PSScriptRoot
$modelsDir = Join-Path $baseDir "models"
$charactersDir = Join-Path $modelsDir "characters"
$natureDir = Join-Path $modelsDir "nature_pack"
$propsDir = Join-Path $modelsDir "props"

# Create directories
@($charactersDir, $natureDir, $propsDir) | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}

Write-Host "Downloading assets...`n"

# Function to download file
function Download-Asset {
    param($Url, $OutputPath, $Name)
    
    Write-Host "Downloading $Name..." -NoNewline
    try {
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $Url -OutFile $OutputPath -ErrorAction Stop
        Write-Host " ✓" -ForegroundColor Green
        return $true
    } catch {
        Write-Host " ✗ Failed" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

# Try to download from CDN or direct links
# Note: Many free asset sites don't provide direct download links
# These will need manual download

Write-Host "Attempting downloads from available sources...`n"

# Since direct downloads from Kenney/poly.pizza require manual interaction,
# we'll create a simple batch download script

$downloadScript = @"
@echo off
echo Downloading assets for board game...
echo.
echo NOTE: Most free asset sites require manual download through browser
echo.
echo Please download these assets manually:
echo.
echo 1. Characters: https://kenney.nl/assets/blocky-characters
echo 2. Pipe: https://poly.pizza/m/f1A1MuUQfC3
echo 3. Coin: https://poly.pizza/m/7IrL01B97W
echo 4. Star Coin: https://poly.pizza/m/n5nJIQAozN
echo 5. Nature Pack: https://poly.pizza/bundle/Ultimate-Stylized-Nature-Pack-zyIyYd9yGr
echo.
echo See QUICK_DOWNLOAD.md for detailed instructions
pause
"@

$batchPath = Join-Path $baseDir "download-assets.bat"
$downloadScript | Out-File -FilePath $batchPath -Encoding ASCII

Write-Host "Created download helper: download-assets.bat`n"

# Check what we have
Write-Host "Checking existing assets...`n"

$missing = @()
$existing = @()

# Check characters
1..4 | ForEach-Object {
    $path = Join-Path $charactersDir "character_$_.glb"
    if (Test-Path $path) {
        $existing += "character_$_.glb"
    } else {
        $missing += "character_$_.glb"
    }
}

# Check props
@("pipe.glb", "coin.glb", "star_coin.glb") | ForEach-Object {
    $path = Join-Path $modelsDir $_
    if (Test-Path $path) {
        $existing += $_
    } else {
        $missing += $_
    }
}

# Check nature
@("tree.glb", "rock.glb") | ForEach-Object {
    $path = Join-Path $natureDir $_
    if (Test-Path $path) {
        $existing += $_
    } else {
        $missing += $_
    }
}

Write-Host "Existing: $($existing.Count) assets"
if ($existing.Count -gt 0) {
    $existing | ForEach-Object { Write-Host "  ✓ $_" -ForegroundColor Green }
}

Write-Host "`nMissing: $($missing.Count) assets"
if ($missing.Count -gt 0) {
    $missing | ForEach-Object { Write-Host "  ✗ $_" -ForegroundColor Red }
    Write-Host "`nThese will use procedural fallbacks until downloaded."
    Write-Host "See QUICK_DOWNLOAD.md for download links.`n"
}

Write-Host "Done! Game works with procedural fallbacks."
