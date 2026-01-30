# Scoring and Prize System

The game jam host automatically calculates prizes and awards coins/stars based on minigame results.

## How It Works

1. **Minigame Returns Scores**: Each minigame must return a `scores` array with 4 numbers (one per player)
2. **Automatic Ranking**: The host calculates rankings (1st, 2nd, 3rd, 4th place) based on scores
3. **Prize Distribution**: Coins and stars are automatically awarded based on ranking
4. **Scoreboard Update**: All totals are updated automatically

## Prize Distribution

### Coins (🪙)
- **1st Place**: 10 coins
- **2nd Place**: 5 coins
- **3rd Place**: 3 coins
- **4th Place**: 1 coin

### Stars (⭐)
- **1st Place**: 1 star
- **2nd-4th Place**: 0 stars

## Result Format

Your minigame must return results in this format:

### JavaScript Games
```javascript
window.parent.postMessage({
  type: "RESULT",
  payload: {
    gameId: "mg-001",
    scores: [100, 80, 60, 40],  // Scores for P1, P2, P3, P4
    winner: 0  // Optional: index of winner
  }
}, "*");
```

### Node.js Games
```javascript
console.log("RESULT:", JSON.stringify({
  scores: [100, 80, 60, 40],
  winner: 0,
  meta: { mode: "jam" }
}));
```

### Pygame Games
```python
print("RESULT:", json.dumps({
  "scores": [100, 80, 60, 40],
  "winner": 0,
  "meta": {"mode": "jam"}
}))
```

## Score Interpretation

- **Higher scores = Better performance**
- Scores are compared directly (100 beats 80)
- Ties are handled (players with same score get same rank)
- Rankings determine prize distribution

## Display

The scoreboard shows:
- **Points**: Total accumulated scores from all games
- **Coins**: Total coins earned (🪙)
- **Stars**: Total stars earned (⭐)
- **Prize Breakdown**: Shows after each game (auto-hides after 10 seconds)

## Example

If a game returns `scores: [100, 80, 60, 40]`:
- Player 1 (100): 🥇 1st place → +10 🪙 +1 ⭐
- Player 2 (80): 🥈 2nd place → +5 🪙
- Player 3 (60): 🥉 3rd place → +3 🪙
- Player 4 (40): 4th place → +1 🪙

## Customization

To customize prize amounts, edit `calculatePrizes()` in `host/server.js`:

```javascript
const prizeCoins = [10, 5, 3, 1];  // Adjust these values
const prizeStars = [1, 0, 0, 0];   // Adjust star distribution
```
