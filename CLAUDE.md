# LangBuddy RPG — CLAUDE.md

## Project Summary
Browser-based Pokemon-style RPG for Chinese language learning. Singapore secondary school students (13-18) explore a pixel-art Hawker Centre, converse with NPCs in Chinese, and complete quests through quiz battles.

**Repo**: https://github.com/tashayip/fun-project
**Reference**: https://github.com/hbshih/PokeLenny
**Stack**: Phaser 3.87 · TypeScript · Vite 8 · Supabase (planned)
**Deploy**: Vercel (static site)

---

## Running the Project

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
cd fun-project
npm run dev      # dev server on :5173
npm run build    # production build → dist/
```

**Preview server** (for Claude Code preview panel):
```json
// .claude/launch.json (in workspace root /Users/tasha/Documents/Claude_Work/)
{
  "name": "langbuddy-rpg",
  "runtimeExecutable": "/Users/tasha/.nvm/versions/node/v20.20.2/bin/node",
  "runtimeArgs": ["/Users/tasha/Documents/Claude_Work/fun-project/node_modules/.bin/vite",
                  "/Users/tasha/Documents/Claude_Work/fun-project", "--port", "5173"],
  "port": 5173
}
```

---

## Project Structure

```
src/
  main.ts                    # Phaser config (960x640, zoom 2, pixelArt: true)
  scenes/
    BootScene.ts             # → PreloadScene
    PreloadScene.ts          # Loads all assets, → MainMenuScene
    MainMenuScene.ts         # Title screen with trees + chickens
    WorldScene.ts            # MAIN SCENE: Hawker Centre map + player + NPCs
  systems/                   # (planned) PlayerController, NPCManager, etc.
public/assets/
  sprites/  player-walk.png (192×96, 6×3 grid, 32×32 frames)
            player-idle.png (128×96, 4×3 grid, 32×32 frames)
            npc-base.png    (192×320, 6×10 grid, 32×32 frames)
  tilesets/ tileset-spring.png
  tiles/    grass.png (16×16)  path.png (16×16)  water.png (16×16)
  objects/  house.png  interior.png  spring-crops.png  maple-tree.png
            oak-tree.png  oak-tree-small.png  outdoor-decor.png  fence.png
  enemies/  skeleton.png (192×320, 6×10 grid)  slime.png
  animals/  chicken-red.png (64×32, 4×2 grid, 16×16 frames)
            chicken-blonde.png  chicken-baby.png  cow-female.png  cow-male.png
```

---

## Sprite Frame Reference

| Sprite | Sheet Size | Grid | Frame Size | Animations |
|--------|-----------|------|------------|-----------|
| player-walk | 192×96 | 6×3 | 32×32 | row0=walk-down(0-5), row1=walk-up(6-11), row2=walk-right(12-17); flip for left |
| player-idle | 128×96 | 4×3 | 32×32 | row0=idle-down(0-3), row1=idle-up(4-7), row2=idle-right(8-11) |
| npc-base | 192×320 | 6×10 | 32×32 | row0=walk-down(0-5), row1=walk-right(6-11), row2=walk-up(12-17), idle(0-2) |
| skeleton | 192×320 | 6×10 | 32×32 | row0=walk(0-5) |
| chicken-* | 64×32 | 4×2 | 16×16 | walk(0-1), idle(0-0) |

---

## WorldScene Architecture

**Map**: 1024×768 world pixels, camera zoom 2× (player sees ~480×320 world pixels)

**NPC System** (`NPC_CONFIGS` array in WorldScene.ts):
- 6 NPCs: Uncle Lee (noodles), Auntie Tan (rice), Uncle Rajan (drinks), Grandma Wong (dessert), Uncle Hassan (satay), Auntie Siew (soup)
- Each has: position, tint colour, Chinese/English name, wanderRadius, dialogues[]
- Wander: tweens to random points within wanderRadius, random 1.5–4s pause between moves
- Tinting: Phaser `npc.setTint(0xff8844)` — reuses single npc-base.png with colour variation

**Animal System** (`ANIMAL_CONFIGS` array):
- 6 chickens using chicken-red, chicken-blonde, chicken-baby spritesheets
- Random wander with configurable wanderRadius and speed

**Collision**: `this.physics.add.staticGroup()` (walls), arcade physics on player + NPCs

**Dialogue System**:
- Press Space/E within 40px of NPC to open dialogue box
- Dialogue box is a Container with setScrollFactor(0) — stays fixed on screen
- Position: `(960/ZOOM - 420) / 2, 640/ZOOM - 120` (bottom-centre in camera space)
- Advance: press Space/E again; close after last line

---

## NPC Dialogue Data (Chinese with Pinyin)

All 6 NPCs have 3 dialogue lines each in `NPC_CONFIGS`. Format:
```
'你好！要吃什么？(Nǐ hǎo! Yào chī shénme?)'
```

---

## Systems Added (Phase 3 partial)

### `src/systems/GameState.ts` (singleton: `gameState`)
- `level`, `xp`, `xpToNext`, `hp`, `maxHp`, `gold`, `talkedTo: Set<string>`
- `quests[]` — 2 quests: `order-meal` (active), `meet-everyone` (unlocks after)
- `talkToNPC(id)` → `{ xpGained, objectiveComplete, questComplete, leveledUp, newLevel }`
- Objective IDs match NPC IDs (e.g. `'uncle-lee'` → objective `'uncle-lee'`)

### HUD elements (all `setScrollFactor(0)`, depth 100)
- **Status panel** (8,8): level badge circle, HP bar (red→yellow→green), XP bar (gold), gold counter
- **Quest tracker** (790,8): active quest title + up to 4 objective rows with ○/✓ indicators
- **Bottom hotbar** (centered, y=588): 6 placeholder item slots

### Dialogue box (redesigned)
- Size: 600×118px at (180, 464) — above hotbar
- Left panel (80px): NPC portrait — coloured bg + Chinese name character (`portraitColor` per NPC)
- Right panel: name tab, role label, body text
- `openDialogue(i)` draws portrait dynamically with `portraitColor` from NpcConfig

### NPC portrait colours
| NPC | portraitColor |
|-----|--------------|
| Uncle Lee | 0xc0392b (dark red) |
| Auntie Tan | 0xe67e22 (orange) |
| Uncle Rajan | 0x2980b9 (blue) |
| Grandma Wong | 0x8e44ad (purple) |
| Uncle Hassan | 0x27ae60 (green) |
| Auntie Siew | 0xd35400 (burnt orange) |

### Notification popups (depth 200–205)
- `showXPGain(n)` — floating "+N XP" text
- `showObjectiveComplete(obj)` — green banner at top
- `showQuestComplete(quest)` — centred modal with rewards
- `showLevelUp(level)` — animated level-up popup

---

## Next Development Phases

### Phase 3 (remaining): Battle trigger from dialogue
- File: `src/systems/QuestManager.ts`
- Quest types: `talk_to_npc`, `win_battle`, `collect_item`, `enter_zone`
- 3 starter quests: "Order a meal", "Find the best drink", "Help the auntie"
- Wire into dialogue choices with action: `{ type: 'startQuest', questId: 'order-meal' }`

### Phase 4: Battle System
- File: `src/scenes/BattleScene.ts` + `src/systems/BattleManager.ts`
- Turn-based, Pokemon-style battle screen
- Player vs Skeleton/Slime sprites (from enemies/ folder)
- Quiz: 4 multiple-choice Chinese language questions
- Damage: correct = -25–30 to enemy HP; wrong = -20 to player HP
- Streak bonus: 3+ correct = bonus damage
- Data: `src/data/questions.ts` — 50+ questions needed

### Phase 5: Support Items
- `src/systems/ItemManager.ts`
- 3 types: Vocabulary Hint, Translation Helper, 50/50
- Max 2 uses per type per battle

### Phase 6: Supabase Integration
- `src/supabase/client.ts` — `createClient<Database>(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`
- Tables: profiles, player_progress, vocabulary_learned, quiz_questions, battle_log, leaderboard
- See full schema in plan file at `/Users/tasha/.claude/plans/dapper-wibbling-hanrahan.md`

---

## Key Design Decisions

1. **No Tiled editor** — map built programmatically in `WorldScene.buildMap()`
2. **NPC variety via tinting** — single npc-base.png spritesheet, `setTint()` per NPC
3. **Dialogue in camera-space** — `dialogueBox.setScrollFactor(0)` + manual position update in `update()`
4. **DialogueProvider interface** — `StaticDialogueProvider` now, ready for `LLMDialogueProvider` swap
5. **Depth sorting** — `player.setDepth(20 + player.y * 0.01)` for pseudo-3D effect
6. **Camera**: `startFollow(player, true, 0.1, 0.1)` with lerp for smooth movement

---

## Assets Attribution

- **Farm RPG FREE 16x16**: Player sprites, Spring tileset, House, Interior, Crops, Trees, Animals
- **Cute_Fantasy_Free**: NPC sprites, Enemy sprites, Outdoor decor, Tiles (non-commercial use)

---

## Git Workflow

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
cd /Users/tasha/Documents/Claude_Work/fun-project
git add -A
git commit -m "message"
git push origin main   # SSH key must be set up; or use GitHub CLI
```

> SSH keys not configured — user needs to push manually or set up SSH key in ~/.ssh/
