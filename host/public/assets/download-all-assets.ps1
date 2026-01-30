# Download all missing assets for the board game
$ErrorActionPreference = "Continue"

$baseDir = $PSScriptRoot
$archivesDir = Join-Path $baseDir "models\archives"

# Ensure archives directory exists
if (-not (Test-Path $archivesDir)) {
    New-Item -ItemType Directory -Path $archivesDir -Force | Out-Null
}

Write-Host "Downloading assets...`n"

# Kenney Blocky Characters - try multiple possible URLs
$kenneyUrls = @(
    "https://kenney.nl/content/3-assets/blocky-characters.zip",
    "https://www.kenney.nl/assets/blocky-characters",
    "https://kenney.nl/assets/blocky-characters/download"
)

$charactersZip = Join-Path $archivesDir "blocky-characters.zip"
if (-not (Test-Path $charactersZip)) {
    Write-Host "Attempting to download Blocky Characters..."
    foreach ($url in $kenneyUrls) {
        try {
            Invoke-WebRequest -Uri $url -OutFile $charactersZip -ErrorAction Stop
            Write-Host "  ✓ Downloaded: blocky-characters.zip"
            break
        } catch {
            Write-Host "  ✗ Failed: $url"
        }
    }
}

# Try downloading from GitHub releases or CDN if available
# For now, create a comprehensive list of what needs to be downloaded

$downloadList = @"
# Assets to Download Manually

## Required Assets

### 1. Character Models (Kenney Blocky Characters)
- URL: https://kenney.nl/assets/blocky-characters
- Download the ZIP file
- Extract and rename 4 character models to:
  - character_1.glb
  - character_2.glb  
  - character_3.glb
  - character_4.glb
- Place in: models/characters/

### 2. Pipe Model (Poly Pizza)
- URL: https://poly.pizza/m/f1A1MuUQfC3
- Click "Download" button
- Select "GLB" format
- Save as: models/pipe.glb

### 3. Coin Model (Poly Pizza)
- URL: https://poly.pizza/m/7IrL01B97W
- Click "Download" button
- Select "GLB" format
- Save as: models/coin.glb

### 4. Star Coin Model (Poly Pizza)
- URL: https://poly.pizza/m/n5nJIQAozN
- Click "Download" button
- Select "GLB" format
- Save as: models/star_coin.glb

### 5. Tree Model (Poly Pizza Nature Pack)
- URL: https://poly.pizza/bundle/Ultimate-Stylized-Nature-Pack-zyIyYd9yGr
- Download the bundle
- Extract tree.glb
- Place in: models/nature_pack/tree.glb

### 6. Rock Model (Poly Pizza Nature Pack)
- From the same nature pack bundle
- Extract rock.glb
- Place in: models/nature_pack/rock.glb

## Optional Assets (Game Reference Props)

These have procedural fallbacks, but you can add custom models:

### 7. Shop Model (Create or download)
- Create a simple shop building model
- Or download from: https://poly.pizza (search "shop" or "store")
- Save as: models/shop.glb

### 8. Doom Imp (Optional)
- Search poly.pizza for "demon" or "imp"
- Save as: models/props/doom_imp.glb

### 9. Pacman Ghost (Optional)
- Search poly.pizza for "ghost"
- Save as: models/props/pacman_ghost.glb

### 10. Tetris Block (Optional)
- Search poly.pizza for "block" or "cube"
- Save as: models/props/tetris_block.glb

### 11. Space Invader (Optional)
- Search poly.pizza for "alien" or "spaceship"
- Save as: models/props/space_invader.glb

### 12. Arcade Cabinet (Optional)
- Search poly.pizza for "arcade" or "cabinet"
- Save as: models/props/arcade_cabinet.glb

## Quick Links Summary

1. **Kenney Blocky Characters**: https://kenney.nl/assets/blocky-characters
2. **Pipe**: https://poly.pizza/m/f1A1MuUQfC3
3. **Coin**: https://poly.pizza/m/7IrL01B97W
4. **Star Coin**: https://poly.pizza/m/n5nJIQAozN
5. **Nature Pack**: https://poly.pizza/bundle/Ultimate-Stylized-Nature-Pack-zyIyYd9yGr

## Note
The game works with procedural fallbacks for all missing assets.
Downloading these will enhance the visuals but is not required.
"@

$listPath = Join-Path $baseDir "ASSETS_TO_DOWNLOAD.md"
$downloadList | Out-File -FilePath $listPath -Encoding UTF8
Write-Host "Created download list at: $listPath`n"

Write-Host "Summary:"
Write-Host "- Character models: Download from Kenney.nl"
Write-Host "- Props (pipe, coin, star_coin): Download from poly.pizza"
Write-Host "- Nature pack (tree, rock): Download from poly.pizza bundle"
Write-Host "`nSee ASSETS_TO_DOWNLOAD.md for detailed instructions."
Write-Host "`nThe game will work with procedural fallbacks until you download these."
