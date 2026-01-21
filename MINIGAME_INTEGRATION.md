# Minigame Integration with Board Game ✅

## How It Works

### ✅ Automatic Minigame Placement

**Minigame spaces are automatically placed on the board** based on `board.json`:

- Nodes with `type: "mini"` become **minigame spaces**
- Currently placed at nodes: **4, 10, 18, 26** (from board.json)
- These spaces are visually distinct (orange color, pulsing glow)

### ✅ Landing on Minigame Space

When a player lands on a minigame space:

1. **Space effect triggers** → `handleSpaceEffect()` is called
2. **Minigame selection UI appears** → Shows all available minigames
3. **Player selects a minigame** → Clicks on a game from the list
4. **Minigame runs** → Either in iframe (JS) or via API (Pygame/Node)

### ✅ Automatic Prize Distribution

After the minigame completes:

1. **Server calculates prizes** → Based on minigame scores
   - Winner gets: **10 coins + 1 star**
   - 2nd place: **5 coins**
   - 3rd place: **3 coins**
   - 4th place: **1 coin**

2. **Prizes automatically applied** → Server updates `state.coins` and `state.stars`

3. **Board state syncs** → Board game receives `PRIZES_AWARDED` WebSocket message

4. **Prize breakdown displayed** → Shows who won what

5. **Next turn begins** → After 4 seconds

### ✅ Full Integration Flow

```
Player lands on minigame space
    ↓
Select minigame from list
    ↓
Minigame runs (JS/Pygame/Node)
    ↓
Minigame returns scores
    ↓
Server calculates prizes
    ↓
Prizes automatically awarded
    ↓
Prize breakdown shown
    ↓
Board state updated
    ↓
Next player's turn
```

## Current Minigame Spaces

From `board.json`:
- **Node 4** (position 4): Minigame space
- **Node 10** (position 10): Minigame space  
- **Node 18** (position 18): Minigame space
- **Node 26** (position 26): Minigame space

## Prize System

Prizes are automatically calculated based on ranking:

| Rank | Coins | Stars |
|------|-------|-------|
| 1st  | 10    | 1     |
| 2nd  | 5     | 0     |
| 3rd  | 3     | 0     |
| 4th  | 1     | 0     |

These are **automatically added** to the player's total and displayed in the scoreboard!

## Testing

1. Start the board game: http://localhost:8080/board.html
2. Roll dice and move around
3. Land on an orange minigame space
4. Select a minigame
5. Play the minigame
6. See prizes automatically awarded!

---

**Everything is fully automated!** 🎉
