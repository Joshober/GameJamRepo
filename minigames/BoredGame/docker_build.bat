@echo off
echo Building Docker image for Stardew Valley Style Game...
docker build -t stardew-game .
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build successful!
    echo.
    echo To run the game in Docker:
    echo   docker run --rm stardew-game
    echo.
    echo To run with custom settings:
    echo   docker run --rm stardew-game python main.py --players 1 --seed 456 --mode jam
) else (
    echo.
    echo Build failed! Make sure Docker is running.
)
pause
