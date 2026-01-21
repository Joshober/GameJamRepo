const params = new URLSearchParams(location.search);
const gameId = params.get("gameId") || "mg-XXX";

document.getElementById("finish").onclick = () => {
  const scores = [0,0,0,0].map(()=>Math.floor(Math.random()*11));
  window.parent.postMessage({
    type: "RESULT",
    payload: { gameId, scores, winner: scores.indexOf(Math.max(...scores)) }
  }, "*");
};
