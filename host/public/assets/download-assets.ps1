# Asset Download Script for Mario Party Board Game
# Downloads free CC0 3D assets

$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'Continue'

Write-Host "Downloading 3D assets for board game..." -ForegroundColor Cyan
Write-Host ""

# Create directories if they don't exist
$dirs = @(
    "models/board",
    "models/characters", 
    "models/dice",
    "textures"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Function to download file
function Download-Asset {
    param(
        [string]$Url,
        [string]$OutputPath,
        [string]$Name
    )
    
    try {
        Write-Host "Downloading: $Name..." -NoNewline
        $outputDir = Split-Path -Parent $OutputPath
        if (-not (Test-Path $outputDir)) {
            New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
        }
        
        Invoke-WebRequest -Uri $Url -OutFile $OutputPath -ErrorAction Stop
        Write-Host " OK" -ForegroundColor Green
        return $true
    } catch {
        Write-Host " Failed" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

# Try downloading from Three.js examples (these are known to work)
$assets = @(
    @{
        Url = "https://threejs.org/examples/models/gltf/Duck/glTF-Binary/Duck.glb"
        Path = "models/characters/character_1.glb"
        Name = "Character 1 (Duck)"
    },
    @{
        Url = "https://threejs.org/examples/models/gltf/Flamingo/glTF-Binary/Flamingo.glb"
        Path = "models/characters/character_2.glb"
        Name = "Character 2 (Flamingo)"
    },
    @{
        Url = "https://threejs.org/examples/models/gltf/Parrot/glTF-Binary/Parrot.glb"
        Path = "models/characters/character_3.glb"
        Name = "Character 3 (Parrot)"
    },
    @{
        Url = "https://threejs.org/examples/models/gltf/Stork/glTF-Binary/Stork.glb"
        Path = "models/characters/character_4.glb"
        Name = "Character 4 (Stork)"
    }
)

$successCount = 0
foreach ($asset in $assets) {
    if (Download-Asset -Url $asset.Url -OutputPath $asset.Path -Name $asset.Name) {
        $successCount++
    }
}

Write-Host ""
Write-Host "Download Summary: $successCount/$($assets.Count) assets downloaded" -ForegroundColor Cyan
Write-Host ""

if ($successCount -eq 0) {
    Write-Host "No assets were downloaded automatically." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual Download Instructions:" -ForegroundColor Cyan
    Write-Host "1. Visit https://kenney.nl/assets and download:" -ForegroundColor White
    Write-Host "   - Board Game Kit" -ForegroundColor Gray
    Write-Host "   - 3D Game Kit" -ForegroundColor Gray
    Write-Host "   - 3D Characters (if available)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Visit https://polyhaven.com/textures for board textures" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Convert FBX/OBJ to GLTF/GLB using Blender:" -ForegroundColor White
    Write-Host "   - Import: File -> Import -> FBX/OBJ" -ForegroundColor Gray
    Write-Host "   - Export: File -> Export -> glTF 2.0 (Binary)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Place files in:" -ForegroundColor White
    Write-Host "   - models/board/ - Board models" -ForegroundColor Gray
    Write-Host "   - models/characters/ - Character models" -ForegroundColor Gray
    Write-Host "   - models/dice/ - Dice model" -ForegroundColor Gray
    Write-Host "   - textures/ - Texture images" -ForegroundColor Gray
} else {
    Write-Host "Assets downloaded successfully!" -ForegroundColor Green
    Write-Host "The game will automatically use these models when available." -ForegroundColor Green
}
