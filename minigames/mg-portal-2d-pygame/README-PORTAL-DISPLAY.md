# Running Portal 2D with Display Output

## Quick Start (Headless - No Display)

The game works headless through the API. To test it:

```powershell
.\run-portal-simple.ps1
```

Or through the board game interface at http://localhost:8080/board.html

## Display Output on Windows

To see the pygame window on Windows, you need an X server:

### Option 1: VcXsrv (Recommended)

1. **Download VcXsrv**: https://sourceforge.net/projects/vcxsrv/
2. **Install and run VcXsrv**:
   - Start "XLaunch"
   - Select "Multiple windows"
   - Select "Start no client"
   - **Important**: Check "Disable access control" (allows Docker to connect)
   - Click "Finish"

3. **Get your Windows IP**:
   ```powershell
   ipconfig | findstr IPv4
   ```

4. **Run the game**:
   ```powershell
   $env:DISPLAY = "YOUR_IP:0.0"
   .\run-portal-game.ps1
   ```

### Option 2: Use WSL2 (If Available)

If you have WSL2, you can use its X server:
```powershell
$env:DISPLAY = "$(wsl hostname -I).Trim():0.0"
.\run-portal-game.ps1
```

## Current Status

✅ Game runs successfully  
✅ All 4 players supported  
✅ Portal mechanics working  
✅ Scoring system working  
⚠️ Display requires X server setup (VcXsrv)

The game is fully functional and can be played through the board game interface even without display output!
