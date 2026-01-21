# Asset Download & Organization Status

## ✅ Assets Already in Downloads Folder

### 1. Board Tiles (Kenney Hexagon Kit)
- **Location**: `downloads/kenney_hexagon-kit/Models/GLB format/`
- **Count**: 72 GLB files
- **Status**: ✅ Ready to use
- **Includes**: Grass, dirt, stone, water, paths, buildings, units
- **Archive**: Will be in `models/board_tiles.zip`

### 2. Dice Textures (Kenney Board Game Pack)
- **Location**: `downloads/kenney_boardgame-pack/PNG/Dice/`
- **Count**: 24 PNG files (red & white, with/without borders)
- **Status**: ✅ Already archived as `models/dice_textures.zip`

### 3. Dice Models (OpenGameArt)
- **Location**: `downloads/dice_opengameart/Dice/Dice Models (.dae)/`
- **Count**: 6 DAE files (d4, d6, d8, d10, d12, d20)
- **Status**: ⚠️ Needs conversion to GLB
- **Archive**: Will be in `models/dice_models.zip`

### 4. Character Models
- **Status**: ✅ Already in repo as `models/characters.tar.gz`

---

## ⚠️ Assets Still Needed (Manual Download Required)

### Collectibles
- [ ] **Coin** (poly.pizza): https://poly.pizza/m/7IrL01B97W
- [ ] **Star Coin** (poly.pizza): https://poly.pizza/m/n5nJIQAozN
- **Target**: `models/coin.glb`, `models/star_coin.glb`

### Props
- [ ] **Mushroom** (poly.pizza): https://poly.pizza/m/A2rwQyfqYG
- [ ] **Pipe** (poly.pizza, CC-BY): https://poly.pizza/m/f1A1MuUQfC3 (optional)
- **Target**: `models/mushroom.glb`, `models/pipe.glb`

### Environment Pack
- [ ] **Ultimate Stylized Nature Pack** (poly.pizza): https://poly.pizza/bundle/Ultimate-Stylized-Nature-Pack-zyIyYd9yGr
- [ ] **Ultimate Nature Pack** (quaternius.com): https://quaternius.com/packs/ultimatenature.html
- **Target**: `models/nature_pack/` (trees, rocks, props)

### UI Assets
- [ ] **UI Pack** (Kenney.nl): https://kenney.nl/assets/ui-pack
- [ ] **Game Icons** (Kenney.nl): https://kenney.nl/assets/game-icons
- [ ] **Board Game Icons** (Kenney.nl): https://kenney.nl/assets/board-game-icons
- **Target**: `ui/` directory

### Audio
- [ ] **Digital Audio** (Kenney.nl): https://kenney.nl/assets/digital-audio
- [ ] **Audio Category** (Kenney.nl): https://kenney.nl/assets/category%3AAudio
- **Target**: `audio/` directory (click.wav, dice.wav, move.wav, win.wav)

### Sky & Materials
- [ ] **Day Sky HDRI** (ambientcg.com): https://ambientcg.com/view?id=DaySkyHDRI001A
- [ ] **Grass Material** (ambientcg.com): https://ambientcg.com/view?id=Grass004
- **Target**: `hdr/day.hdr`, `materials/grass/`

---

## 📦 Organization Plan

Once all assets are downloaded:

1. **Archive board tiles**: Create `models/board_tiles.zip` from GLB files
2. **Archive dice models**: Create `models/dice_models.zip` from DAE files
3. **Organize collectibles**: Place coin.glb, star_coin.glb in `models/`
4. **Organize props**: Place mushroom.glb, pipe.glb in `models/`
5. **Organize nature pack**: Extract to `models/nature_pack/`
6. **Organize UI**: Extract to `ui/`
7. **Organize audio**: Extract to `audio/`
8. **Organize HDRI/materials**: Place in `hdr/` and `materials/grass/`

---

## 🚀 Next Steps

1. Download remaining assets manually from URLs above
2. Run `organize-assets.ps1` to organize downloaded files
3. Create archives for new assets
4. Update `extract-assets.sh` to handle new archives
5. Commit all assets to GitHub
