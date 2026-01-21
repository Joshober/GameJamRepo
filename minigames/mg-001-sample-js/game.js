const params = new URLSearchParams(location.search);
const gameId = params.get("gameId") || "mg-001";

// Example: Use player controls
// playerControls.isPressed(1, 'action') - check if P1 pressed action button
// playerControls.getPlayerState(1) - get all buttons for P1

// Example game loop (if needed)
function gameLoop() {
  // Check player inputs
  const p1 = playerControls.getPlayerState(1);
  const p2 = playerControls.getPlayerState(2);
  const p3 = playerControls.getPlayerState(3);
  const p4 = playerControls.getPlayerState(4);
  
  // Your game logic here
  // Example: if (p1.action) { ... }
  
  // requestAnimationFrame(gameLoop);
}

document.getElementById("finish").onclick = () => {
  // Example: Generate random scores for each player
  // In a real game, calculate scores based on player performance
  const scores = [0,0,0,0].map(()=>Math.floor(Math.random()*100));
  const winner = scores.indexOf(Math.max(...scores));
  
  // Send result - host will automatically calculate prizes (coins/stars) based on rankings
  window.parent.postMessage({
    type: "RESULT",
    payload: { 
      gameId, 
      scores,  // Array of 4 scores - higher is better
      winner   // Optional: index of winner
    }
  }, "*");
};
