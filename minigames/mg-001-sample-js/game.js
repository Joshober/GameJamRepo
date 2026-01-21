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
  const scores = [0,0,0,0].map(()=>Math.floor(Math.random()*11));
  window.parent.postMessage({
    type: "RESULT",
    payload: { gameId, scores, winner: scores.indexOf(Math.max(...scores)) }
  }, "*");
};
