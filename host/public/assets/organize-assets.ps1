# Asset Organization Script
# Organizes downloaded assets into the proper folder structure

$assetsDir = "C:\Users\Josh\Downloads\GameJamRepo\host\public\assets"
$downloadsDir = "$assetsDir\downloads"

Write-Host "Organizing assets from downloads folder..." -ForegroundColor Green

# Create target directories
$dirs = @(
    "$assetsDir\models\nature_pack",
    "$assetsDir\ui",
    "$assetsDir\audio",
    "$assetsDir\hdr",
    "$assetsDir\materials\grass"
)

foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "Created: $dir" -ForegroundColor Cyan
}

# Copy board tiles (already done, but verify)
if (Test-Path "$downloadsDir\kenney_hexagon-kit\Models\GLB format") {
    $glbFiles = Get-ChildItem "$downloadsDir\kenney_hexagon-kit\Models\GLB format\*.glb"
    Write-Host "Found $($glbFiles.Count) GLB board tiles" -ForegroundColor Yellow
}

# Copy dice textures (already extracted)
if (Test-Path "$assetsDir\models\dice_textures.zip") {
    Write-Host "Dice textures archive found" -ForegroundColor Yellow
}

# Note: Additional assets (coin, star_coin, mushroom, nature pack, UI, audio, HDRI)
# need to be downloaded manually from the URLs in ADDITIONAL_ASSETS.md

Write-Host "`nAsset organization complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Download collectibles (coin, star_coin) from poly.pizza" -ForegroundColor White
Write-Host "2. Download mushroom from poly.pizza" -ForegroundColor White
Write-Host "3. Download nature pack from poly.pizza/quaternius" -ForegroundColor White
Write-Host "4. Download UI packs from Kenney.nl" -ForegroundColor White
Write-Host "5. Download audio from Kenney.nl" -ForegroundColor White
Write-Host "6. Download HDRI and materials from ambientcg.com" -ForegroundColor White
Write-Host "`nSee ADDITIONAL_ASSETS.md for direct links" -ForegroundColor Cyan
