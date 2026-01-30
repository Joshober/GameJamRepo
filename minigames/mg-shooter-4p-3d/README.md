Shooter 4 Players Co-op (3D)

A 3D shooting mini-game for 4 players working as a team against waves of enemies. Players can use the keyboard on PC or connect from their phones via URL to control their character.

How to Play

On the computer: run the server to enable mobile control:

cd minigames/mg-shooter-4p-3d
npm install
npm start


Open in your browser: http://localhost:3847
 (or the IP shown in the console).

On your phone (same WiFi): open the URL shown on the start screen, for example:

Player 1: http://YOUR_IP:3847/controller?player=1

Player 2: http://YOUR_IP:3847/controller?player=2

etc.
Replace YOUR_IP with your computer’s IP (e.g. 192.168.1.10).

Controls

Keyboard:
P1: WASD + Space · P2: Arrow Keys + Enter · P3: IJKL + U · P4: TFGH + R

Mobile: D-pad + SHOOT button on the controller page.

Rules

All 4 players are on the same team. You must eliminate enemies that spawn in waves.

Enemies enter from the edges of the map and move toward the players; if they touch you, you lose health.

The team wins if you survive 5 waves or have more kills when the 2-minute timer ends.

If a player dies, they respawn after a few seconds in their corner.

Local Only (No Mobile)

You can open index.html directly in your browser; in that case, only keyboard controls will work (no mobile URL).
