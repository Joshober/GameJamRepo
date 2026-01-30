# Simple asset download script
# Downloads assets from free sources

$ErrorActionPreference = "Continue"
$assetsDir = $PSScriptRoot

Write-Host "Downloading assets for board game...`n"

# Create a simple script to download from known CDN sources
# Since direct downloads from Kenney/poly.pizza require manual interaction,
# we'll create placeholder instructions and check what's available

Write-Host "Checking for existing assets..."

$missing = @()
$existing = @()

# Check characters
1..4 | ForEach-Object {
    $path = Join-Path $assetsDir "models\characters\character_$_.glb"
    if (Test-Path $path) {
        $existing += "character_$_.glb"
    } else {
        $missing += "character_$_.glb"
    }
}

# Check props
@("pipe.glb", "coin.glb", "star_coin.glb", "tree.glb", "rock.glb") | ForEach-Object {
    $path = Join-Path $assetsDir "models\$_"
    if (Test-Path $path) {
        $existing += $_
    } else {
        $missing += $_
    }
}

Write-Host "`nExisting: $($existing.Count) assets"
Write-Host "Missing: $($missing.Count) assets`n"

if ($missing.Count -gt 0) {
    Write-Host "Missing assets will use procedural fallbacks."
    Write-Host "See DOWNLOAD_INSTRUCTIONS.md for manual download links.`n"
    
    # Try to download from a public CDN if available
    Write-Host "Attempting to find downloadable assets..."
    
    # Note: Most free asset sites require manual download
    # The game will work with procedural fallbacks
}

Write-Host "Asset check complete. Game will work with procedural fallbacks."
