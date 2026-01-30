# Merge Game Helper Script
# This script helps move game files to minigames/mg-[game-name]/ after merging a game branch

Write-Host "Merge Game Helper Script" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "Error: Not in a git repository!" -ForegroundColor Red
    exit 1
}

# Check if manifest.json exists
if (-not (Test-Path manifest.json)) {
    Write-Host "Error: manifest.json not found in current directory!" -ForegroundColor Red
    Write-Host "Make sure you've merged your game branch and are in the repository root." -ForegroundColor Yellow
    exit 1
}

# Read the game ID from manifest.json
try {
    $manifest = Get-Content manifest.json | ConvertFrom-Json
    $gameId = $manifest.id
    
    if (-not $gameId) {
        Write-Host "Error: Could not find 'id' field in manifest.json!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Found game ID: $gameId" -ForegroundColor Cyan
} catch {
    Write-Host "Error: Could not parse manifest.json!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Create the game directory
$gameDir = "minigames/$gameId"
Write-Host "Creating directory: $gameDir" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $gameDir | Out-Null

# Files and directories to exclude
$excludePatterns = @('.git', '.github', 'minigames', '.gitignore', 'TEMPLATE_WORKFLOW.md', 'merge-game.ps1', 'merge-game.sh')

# Move files
Write-Host "Moving files to $gameDir..." -ForegroundColor Cyan
$movedCount = 0

# Move files in root
Get-ChildItem -File | Where-Object {
    $shouldMove = $true
    foreach ($pattern in $excludePatterns) {
        if ($_.Name -like "$pattern*" -or $_.Name -eq $pattern) {
            $shouldMove = $false
            break
        }
    }
    return $shouldMove
} | ForEach-Object {
    Write-Host "  Moving: $($_.Name)" -ForegroundColor Gray
    Move-Item -Path $_.FullName -Destination $gameDir -Force
    $movedCount++
}

# Move directories in root
Get-ChildItem -Directory | Where-Object {
    $shouldMove = $true
    foreach ($pattern in $excludePatterns) {
        if ($_.Name -like "$pattern*" -or $_.Name -eq $pattern) {
            $shouldMove = $false
            break
        }
    }
    return $shouldMove
} | ForEach-Object {
    Write-Host "  Moving directory: $($_.Name)" -ForegroundColor Gray
    Move-Item -Path $_.FullName -Destination $gameDir -Force
    $movedCount++
}

if ($movedCount -eq 0) {
    Write-Host "Warning: No files were moved. Files may already be in the correct location." -ForegroundColor Yellow
} else {
    Write-Host "Moved $movedCount items to $gameDir" -ForegroundColor Green
}

# Stage the changes
Write-Host "Staging changes..." -ForegroundColor Cyan
git add .

Write-Host ""
Write-Host "Done! Files have been moved to $gameDir" -ForegroundColor Green
Write-Host "Review the changes with: git status" -ForegroundColor Yellow
Write-Host "Commit with: git commit -m 'Add $gameId to minigames directory'" -ForegroundColor Yellow
