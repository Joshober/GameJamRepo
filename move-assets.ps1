# Move assets from assetstomove to proper locations
$srcDir = "assetstomove"
$dstBase = "host\public\assets\models"

# Create destination directories
$natureDir = Join-Path $dstBase "nature_pack"
$propsDir = Join-Path $dstBase "props"
New-Item -ItemType Directory -Force -Path $natureDir | Out-Null
New-Item -ItemType Directory -Force -Path $propsDir | Out-Null

Write-Host "Moving assets from $srcDir to $dstBase...`n"

# Essential assets mapping
$moves = @{
    "Coin.glb" = "coin.glb"
    "Pipe.glb" = "pipe.glb"
    "Star.glb" = "star_coin.glb"
    "Rocks.glb" = "nature_pack\rock.glb"
    "Tree.glb" = "nature_pack\tree.glb"
    "Trees.glb" = "nature_pack\trees.glb"
    "Pine Trees.glb" = "nature_pack\pine_trees.glb"
    "Maple Trees.glb" = "nature_pack\maple_trees.glb"
    "Birch Trees.glb" = "nature_pack\birch_trees.glb"
    "Dead Trees-F5I0Q7TwO5.glb" = "nature_pack\dead_trees.glb"
    "Mushroom.glb" = "mushroom.glb"
    "Bushes.glb" = "nature_pack\bushes.glb"
    "Flower Bushes.glb" = "nature_pack\flower_bushes.glb"
    "Flowers.glb" = "nature_pack\flowers.glb"
    "Grass.glb" = "nature_pack\grass.glb"
}

# Move essential assets
foreach ($srcFile in $moves.Keys) {
    $srcPath = Join-Path $srcDir $srcFile
    $dstFile = $moves[$srcFile]
    $dstPath = Join-Path $dstBase $dstFile
    
    if (Test-Path $srcPath) {
        $dstDir = Split-Path $dstPath -Parent
        if (-not (Test-Path $dstDir)) {
            New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
        }
        Copy-Item -Path $srcPath -Destination $dstPath -Force
        Write-Host "✓ $srcFile -> $dstFile" -ForegroundColor Green
    }
}

# Move cloud files
$cloudFiles = Get-ChildItem -Path $srcDir -Filter "Cloud*.glb" -File -ErrorAction SilentlyContinue
foreach ($file in $cloudFiles) {
    $dst = Join-Path $natureDir $file.Name
    Copy-Item -Path $file.FullName -Destination $dst -Force
    Write-Host "✓ $($file.Name) -> nature_pack\$($file.Name)" -ForegroundColor Cyan
}

# Move GLB models from Models folder
$modelsGlbPath = Join-Path $srcDir "Models\GLB format"
if (Test-Path $modelsGlbPath) {
    $glbModels = Get-ChildItem -Path $modelsGlbPath -Filter "*.glb" -File -ErrorAction SilentlyContinue
    Write-Host "`nMoving $($glbModels.Count) additional models from Models folder..."
    foreach ($file in $glbModels) {
        $dst = Join-Path $propsDir $file.Name
        Copy-Item -Path $file.FullName -Destination $dst -Force
        Write-Host "✓ $($file.Name) -> props\$($file.Name)" -ForegroundColor Cyan
    }
}

# Summary
Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
$moved = (Get-ChildItem -Path $dstBase -Filter "*.glb" -File -Recurse -ErrorAction SilentlyContinue).Count
Write-Host "Total GLB files moved: $moved" -ForegroundColor Green

Write-Host "`nKey assets:" -ForegroundColor Yellow
$keyAssets = @("coin.glb", "pipe.glb", "star_coin.glb", "nature_pack\rock.glb", "nature_pack\tree.glb")
foreach ($asset in $keyAssets) {
    $path = Join-Path $dstBase $asset
    if (Test-Path $path) {
        Write-Host "  ✓ $asset" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $asset (missing)" -ForegroundColor Red
    }
}
