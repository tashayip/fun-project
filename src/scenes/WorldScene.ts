import Phaser from 'phaser'

// ─── NPC Configuration ──────────────────────────────────────────────────────
interface NpcConfig {
  id: string
  x: number
  y: number
  tint: number
  name: string
  role: string
  nameZh: string
  wanderRadius: number
  dialogues: string[]
}

const NPC_CONFIGS: NpcConfig[] = [
  {
    id: 'uncle-lee',
    x: 180, y: 210,
    tint: 0xff8844,
    name: 'Uncle Lee',
    role: 'Noodle Stall',
    nameZh: '李叔叔',
    wanderRadius: 24,
    dialogues: [
      '你好！要吃什么？(Nǐ hǎo! Yào chī shénme?)',
      '我这里有很好吃的面条！(Wǒ zhèlǐ yǒu hěn hào chī de miàntiáo!)',
      '干捞面还是汤面？(Gān lāo miàn háishi tāng miàn?)'
    ]
  },
  {
    id: 'auntie-tan',
    x: 390, y: 210,
    tint: 0xff44aa,
    name: 'Auntie Tan',
    role: 'Rice Stall',
    nameZh: '陈阿姨',
    wanderRadius: 20,
    dialogues: [
      '你好！要白饭还是炒饭？(Nǐ hǎo! Yào báifàn háishi chǎofàn?)',
      '我的鸡肉饭很受欢迎！(Wǒ de jīròu fàn hěn shòu huānyíng!)',
      '一份多少钱？三块五。(Yī fèn duōshao qián? Sān kuài wǔ.)'
    ]
  },
  {
    id: 'uncle-rajan',
    x: 600, y: 210,
    tint: 0x44aaff,
    name: 'Uncle Rajan',
    role: 'Drink Stall',
    nameZh: '拉詹叔叔',
    wanderRadius: 28,
    dialogues: [
      '你好！要喝什么？(Nǐ hǎo! Yào hē shénme?)',
      '我有糖水，豆浆，和咖啡！(Wǒ yǒu tángshuǐ, dòujiāng, hé kāfēi!)',
      '冰的还是热的？(Bīng de háishi rè de?)'
    ]
  },
  {
    id: 'grandma-wong',
    x: 810, y: 210,
    tint: 0xffee44,
    name: 'Grandma Wong',
    role: 'Dessert Stall',
    nameZh: '王奶奶',
    wanderRadius: 16,
    dialogues: [
      '你好啊小朋友！(Nǐ hǎo a xiǎo péngyǒu!)',
      '要吃汤圆吗？很甜很好吃！(Yào chī tāngyuán ma? Hěn tián hěn hào chī!)',
      '祖母给你打折！(Zǔmǔ gěi nǐ dǎzhé!)'
    ]
  },
  {
    id: 'uncle-hassan',
    x: 240, y: 500,
    tint: 0x44ff88,
    name: 'Uncle Hassan',
    role: 'Satay Stall',
    nameZh: '哈山叔叔',
    wanderRadius: 30,
    dialogues: [
      '你好！要沙爹吗？(Nǐ hǎo! Yào shādié ma?)',
      '鸡肉，牛肉，还是猪肉？(Jīròu, niúròu, háishi zhūròu?)',
      '我的沙爹是最好吃的！(Wǒ de shādié shì zuì hào chī de!)'
    ]
  },
  {
    id: 'auntie-siew',
    x: 450, y: 500,
    tint: 0xcc44ff,
    name: 'Auntie Siew',
    role: 'Soup Stall',
    nameZh: '小阿姨',
    wanderRadius: 22,
    dialogues: [
      '你好！今天要喝什么汤？(Nǐ hǎo! Jīntiān yào hē shénme tāng?)',
      '骨头汤很滋补！(Gǔtou tāng hěn zībǔ!)',
      '要加辣椒吗？(Yào jiā làjiāo ma?)'
    ]
  }
]

// ─── Animal Configuration ────────────────────────────────────────────────────
interface AnimalConfig {
  key: string
  x: number
  y: number
  scale: number
  wanderRadius: number
  speed: number
}

const ANIMAL_CONFIGS: AnimalConfig[] = [
  { key: 'chicken-red',    x: 160,  y: 380, scale: 2.5, wanderRadius: 60, speed: 30 },
  { key: 'chicken-blonde', x: 320,  y: 400, scale: 2.5, wanderRadius: 50, speed: 25 },
  { key: 'chicken-baby',   x: 260,  y: 370, scale: 2.0, wanderRadius: 40, speed: 35 },
  { key: 'chicken-red',    x: 700,  y: 390, scale: 2.5, wanderRadius: 55, speed: 28 },
  { key: 'chicken-blonde', x: 820,  y: 380, scale: 2.5, wanderRadius: 65, speed: 32 },
  { key: 'chicken-baby',   x: 760,  y: 420, scale: 2.0, wanderRadius: 45, speed: 38 },
]

// ─── WorldScene ───────────────────────────────────────────────────────────────
export class WorldScene extends Phaser.Scene {
  // Map dimensions (world pixels)
  private readonly MAP_W = 1024
  private readonly MAP_H = 768
  private readonly ZOOM = 2

  // Player
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key }
  private playerDirection = 'down'
  private playerMoving = false

  // NPCs
  private npcs: Phaser.Physics.Arcade.Sprite[] = []
  private npcLabels: Phaser.GameObjects.Container[] = []

  // Animals
  private animals: Phaser.Physics.Arcade.Sprite[] = []
  private animalTargets: { x: number; y: number; originX: number; originY: number }[] = []

  // Dialogue
  private dialogueBox!: Phaser.GameObjects.Container
  private dialogueActive = false
  private currentNpcIndex = -1
  private dialogueLine = 0
  private spaceKey!: Phaser.Input.Keyboard.Key
  private interactKey!: Phaser.Input.Keyboard.Key

  // Collision objects
  private walls!: Phaser.Physics.Arcade.StaticGroup
  private stallZones: { x: number; y: number; w: number; h: number }[] = []

  constructor() {
    super({ key: 'WorldScene' })
  }

  create() {
    this.cameras.main.fadeIn(600, 0, 0, 0)
    this.cameras.main.setZoom(this.ZOOM)
    this.cameras.main.setBounds(0, 0, this.MAP_W, this.MAP_H)

    this.buildMap()
    this.createAnimations()
    this.spawnPlayer()
    this.spawnNPCs()
    this.spawnAnimals()
    this.setupInput()
    this.setupCollisions()
    this.createDialogueBox()
    this.createHUD()
    this.createAmbientEffects()

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
  }

  // ─── Map Building ────────────────────────────────────────────────────────────
  private buildMap() {
    const W = this.MAP_W
    const H = this.MAP_H

    // ── Grass floor (full map tiled background)
    const grassTile = this.add.tileSprite(W / 2, H / 2, W, H, 'grass')
    grassTile.setTileScale(1, 1)
    grassTile.setDepth(0)

    // ── Central path (horizontal) between stall rows
    const pathH = this.add.tileSprite(W / 2, 340, W, 60, 'path')
    pathH.setDepth(1)
    // ── Vertical entrance path
    const pathV = this.add.tileSprite(W / 2, H / 2, 80, H, 'path')
    pathV.setDepth(1)

    this.walls = this.physics.add.staticGroup()
    this.stallZones = []

    // ── Build 4 top stalls (row 1)
    const topStallPositions = [100, 290, 490, 680]
    const stallNames = ['面条', '米饭', '饮料', '甜品']

    topStallPositions.forEach((sx, i) => {
      this.buildStall(sx, 80, stallNames[i], i)
    })

    // ── Build 2 bottom stalls (row 2)
    this.buildStall(140, 430, '沙爹', 4)
    this.buildStall(370, 430, '汤', 5)

    // ── Add trees around perimeter
    this.addTrees()

    // ── Add seating (tables + chairs)
    this.addSeating()

    // ── Outer boundary walls (invisible)
    this.walls.add(this.add.rectangle(W / 2, 4, W, 8, 0x000000, 0).setDepth(0))
    this.walls.add(this.add.rectangle(W / 2, H - 4, W, 8, 0x000000, 0).setDepth(0))
    this.walls.add(this.add.rectangle(4, H / 2, 8, H, 0x000000, 0).setDepth(0))
    this.walls.add(this.add.rectangle(W - 4, H / 2, 8, H, 0x000000, 0).setDepth(0))

    this.physics.world.setBounds(0, 0, W, H)
  }

  private buildStall(x: number, y: number, label: string, index: number) {
    const stallW = 160
    const stallH = 100

    // Stall background
    const bg = this.add.graphics()
    bg.fillStyle(0x8B5E3C, 1)
    bg.fillRect(x, y, stallW, stallH)
    bg.lineStyle(2, 0x5C3A1E, 1)
    bg.strokeRect(x, y, stallW, stallH)
    bg.setDepth(2)

    // Stall roof (awning)
    const roofColors = [0xe74c3c, 0xe67e22, 0x3498db, 0x9b59b6, 0x27ae60, 0xf39c12]
    const roof = this.add.graphics()
    roof.fillStyle(roofColors[index % roofColors.length], 1)
    roof.fillRect(x - 8, y - 16, stallW + 16, 22)
    roof.lineStyle(2, 0x2c3e50, 1)
    roof.strokeRect(x - 8, y - 16, stallW + 16, 22)
    roof.setDepth(3)

    // Awning stripes
    for (let i = 0; i < 10; i++) {
      const stripX = x - 8 + i * 18
      const strip = this.add.graphics()
      strip.fillStyle(0xffffff, 0.25)
      strip.fillRect(stripX, y - 16, 9, 22)
      strip.setDepth(4)
    }

    // Counter
    const counter = this.add.graphics()
    counter.fillStyle(0xd4a96a, 1)
    counter.fillRect(x + 8, y + 50, stallW - 16, 24)
    counter.lineStyle(2, 0x8B5E3C, 1)
    counter.strokeRect(x + 8, y + 50, stallW - 16, 24)
    counter.setDepth(3)

    // Chinese label on stall
    this.add.text(x + stallW / 2, y + 20, label, {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(5)

    // Food display (use spring-crops as food items)
    if (this.textures.exists('spring-crops')) {
      const food = this.add.image(x + stallW / 2 - 30, y + 30, 'spring-crops')
        .setScale(0.5)
        .setDepth(4)
      const food2 = this.add.image(x + stallW / 2 + 10, y + 32, 'spring-crops')
        .setScale(0.5)
        .setDepth(4)
      food.setCrop(0, 0, 32, 16)
      food2.setCrop(32, 0, 32, 16)
    }

    // Physics wall for stall
    const wallRect = this.add.rectangle(x + stallW / 2, y + stallH / 2, stallW, stallH, 0x000000, 0)
    this.physics.add.existing(wallRect, true)
    this.walls.add(wallRect)
    this.stallZones.push({ x, y, w: stallW, h: stallH })
  }

  private addTrees() {
    const treePositions = [
      { x: 32, y: 32 }, { x: 80, y: 20 }, { x: 150, y: 24 }, { x: 260, y: 20 },
      { x: 380, y: 24 }, { x: 500, y: 20 }, { x: 620, y: 24 }, { x: 740, y: 20 },
      { x: 860, y: 24 }, { x: 960, y: 32 },
      // bottom row
      { x: 32, y: 730 }, { x: 120, y: 740 }, { x: 280, y: 735 }, { x: 500, y: 738 },
      { x: 700, y: 736 }, { x: 850, y: 740 }, { x: 980, y: 730 },
      // left column
      { x: 20, y: 150 }, { x: 20, y: 300 }, { x: 20, y: 450 }, { x: 20, y: 600 },
      // right column
      { x: 1005, y: 150 }, { x: 1005, y: 300 }, { x: 1005, y: 450 }, { x: 1005, y: 600 },
    ]

    treePositions.forEach(({ x, y }) => {
      const key = Math.random() > 0.5 ? 'oak-tree' : 'oak-tree-small'
      if (this.textures.exists(key)) {
        const scale = 1.2 + Math.random() * 0.6
        const tree = this.add.image(x, y, key).setScale(scale).setDepth(10)
        tree.setOrigin(0.5, 1)

        // Gentle sway
        this.tweens.add({
          targets: tree,
          scaleX: scale * 1.03,
          duration: 2000 + Math.random() * 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
          delay: Math.random() * 2000
        })
      }
    })

    // Maple trees in open areas
    const maplePositions = [{ x: 600, y: 380 }, { x: 680, y: 390 }, { x: 760, y: 375 }, { x: 840, y: 385 }]
    maplePositions.forEach(({ x, y }) => {
      if (this.textures.exists('maple-tree')) {
        const tree = this.add.image(x, y, 'maple-tree').setScale(1.4).setDepth(10).setOrigin(0.5, 1)
        this.tweens.add({
          targets: tree,
          scaleX: 1.4 * 1.02,
          duration: 2500,
          yoyo: true, repeat: -1, ease: 'Sine.InOut',
          delay: Math.random() * 1500
        })
      }
    })
  }

  private addSeating() {
    // Tables and chairs using interior.png as atlas
    const tablePositions = [
      { x: 160, y: 310 }, { x: 300, y: 310 }, { x: 440, y: 310 },
      { x: 580, y: 310 }, { x: 720, y: 310 }, { x: 860, y: 310 },
      { x: 220, y: 380 }, { x: 380, y: 380 }, { x: 540, y: 380 },
      { x: 700, y: 375 }, { x: 860, y: 382 },
      { x: 650, y: 510 }, { x: 780, y: 520 }, { x: 910, y: 510 },
    ]

    tablePositions.forEach(({ x, y }) => {
      // Draw a simple pixel-art table
      const g = this.add.graphics()
      g.fillStyle(0xc19a6b, 1)
      g.fillRect(x - 16, y - 10, 32, 22)
      g.lineStyle(2, 0x8B5E3C, 1)
      g.strokeRect(x - 16, y - 10, 32, 22)
      // Table legs
      g.fillStyle(0x8B5E3C, 1)
      g.fillRect(x - 14, y + 12, 4, 6)
      g.fillRect(x + 10, y + 12, 4, 6)
      g.setDepth(5)

      // Chairs around table
      const chairOffsets = [
        { dx: -24, dy: 0 }, { dx: 24, dy: 0 },
        { dx: 0, dy: -20 }, { dx: 0, dy: 20 }
      ]
      chairOffsets.forEach(({ dx, dy }) => {
        const c = this.add.graphics()
        c.fillStyle(0x7a5230, 1)
        c.fillRect(x + dx - 7, y + dy - 7, 14, 14)
        c.lineStyle(1, 0x4a3010, 1)
        c.strokeRect(x + dx - 7, y + dy - 7, 14, 14)
        c.setDepth(4)
      })
    })

    // Outdoor decor objects
    const decorPositions = [
      { x: 120, y: 620 }, { x: 240, y: 635 }, { x: 580, y: 625 },
      { x: 730, y: 618 }, { x: 920, y: 630 }
    ]
    decorPositions.forEach(({ x, y }) => {
      if (this.textures.exists('outdoor-decor')) {
        this.add.image(x, y, 'outdoor-decor').setScale(0.9).setDepth(6).setOrigin(0.5, 1)
          .setCrop(0, 0, 16, 32)
      }
    })

    // Chest treasure
    if (this.textures.exists('chest')) {
      const chest = this.add.image(900, 600, 'chest').setScale(2).setDepth(7)
      this.tweens.add({
        targets: chest,
        y: 596,
        duration: 1000,
        yoyo: true, repeat: -1, ease: 'Sine.InOut'
      })
    }
  }

  // ─── Animation Definitions ───────────────────────────────────────────────────
  private createAnimations() {
    // ── Player Walk animations (Farm RPG Walk.png: 6 cols x 3 rows, 32x32)
    // Row 0 = walk down, Row 1 = walk up, Row 2 = walk right
    if (!this.anims.exists('player-walk-down')) {
      this.anims.create({ key: 'player-walk-down',  frames: this.anims.generateFrameNumbers('player-walk', { start: 0,  end: 5  }), frameRate: 8, repeat: -1 })
      this.anims.create({ key: 'player-walk-up',    frames: this.anims.generateFrameNumbers('player-walk', { start: 6,  end: 11 }), frameRate: 8, repeat: -1 })
      this.anims.create({ key: 'player-walk-right', frames: this.anims.generateFrameNumbers('player-walk', { start: 12, end: 17 }), frameRate: 8, repeat: -1 })
    }

    // ── Player Idle animations (Farm RPG Idle.png: 4 cols x 3 rows, 32x32)
    if (!this.anims.exists('player-idle-down')) {
      this.anims.create({ key: 'player-idle-down',  frames: this.anims.generateFrameNumbers('player-idle', { start: 0, end: 3 }), frameRate: 4, repeat: -1 })
      this.anims.create({ key: 'player-idle-up',    frames: this.anims.generateFrameNumbers('player-idle', { start: 4, end: 7 }), frameRate: 4, repeat: -1 })
      this.anims.create({ key: 'player-idle-right', frames: this.anims.generateFrameNumbers('player-idle', { start: 8, end: 11 }), frameRate: 4, repeat: -1 })
    }

    // ── NPC animations (Cute Fantasy Player.png: 6 cols x 10 rows, 32x32)
    if (!this.anims.exists('npc-walk-down')) {
      this.anims.create({ key: 'npc-walk-down',  frames: this.anims.generateFrameNumbers('npc-base', { start: 0,  end: 5  }), frameRate: 6, repeat: -1 })
      this.anims.create({ key: 'npc-walk-right', frames: this.anims.generateFrameNumbers('npc-base', { start: 6,  end: 11 }), frameRate: 6, repeat: -1 })
      this.anims.create({ key: 'npc-walk-up',    frames: this.anims.generateFrameNumbers('npc-base', { start: 12, end: 17 }), frameRate: 6, repeat: -1 })
      this.anims.create({ key: 'npc-idle',       frames: this.anims.generateFrameNumbers('npc-base', { start: 0,  end: 2  }), frameRate: 3, repeat: -1 })
    }

    // ── Skeleton animations (battle opponent)
    if (!this.anims.exists('skeleton-walk')) {
      this.anims.create({ key: 'skeleton-walk', frames: this.anims.generateFrameNumbers('skeleton', { start: 0, end: 5 }), frameRate: 6, repeat: -1 })
    }

    // ── Chicken animations  (each chicken sheet: 64x32, 4 cols x 2 rows, 16x16)
    const chickenKeys = ['chicken-red', 'chicken-blonde', 'chicken-baby']
    chickenKeys.forEach(key => {
      if (this.textures.exists(key) && !this.anims.exists(`${key}-walk`)) {
        this.anims.create({ key: `${key}-walk`, frames: this.anims.generateFrameNumbers(key, { start: 0, end: 1 }), frameRate: 4, repeat: -1 })
        this.anims.create({ key: `${key}-idle`, frames: this.anims.generateFrameNumbers(key, { start: 0, end: 0 }), frameRate: 2, repeat: -1 })
      }
    })
  }

  // ─── Player Spawning ─────────────────────────────────────────────────────────
  private spawnPlayer() {
    this.player = this.physics.add.sprite(512, 340, 'player-idle')
    this.player.setDepth(20)
    this.player.setScale(1.5)
    this.player.setCollideWorldBounds(true)
    this.player.body.setSize(16, 16)
    this.player.body.setOffset(8, 14)
    this.player.play('player-idle-down')

    // Shadow
    const shadow = this.add.ellipse(0, 0, 18, 8, 0x000000, 0.25)
    shadow.setDepth(19)
    this.events.on('update', () => {
      shadow.setPosition(this.player.x, this.player.y + 12)
    })
  }

  // ─── NPC Spawning ────────────────────────────────────────────────────────────
  private spawnNPCs() {
    NPC_CONFIGS.forEach((cfg, i) => {
      const npc = this.physics.add.sprite(cfg.x, cfg.y, 'npc-base')
      npc.setTint(cfg.tint)
      npc.setDepth(20)
      npc.setScale(1.4)
      npc.setImmovable(true)
      npc.body.setSize(16, 20)
      npc.body.setOffset(8, 10)
      npc.play('npc-idle')
      npc.setData('config', cfg)
      npc.setData('originX', cfg.x)
      npc.setData('originY', cfg.y)
      this.npcs.push(npc)

      // NPC shadow
      const npcShadow = this.add.ellipse(cfg.x, cfg.y + 12, 18, 8, 0x000000, 0.2)
      npcShadow.setDepth(19)
      this.events.on('update', () => {
        npcShadow.setPosition(npc.x, npc.y + 12)
      })

      // Name label above NPC
      const labelBg = this.add.graphics()
      labelBg.fillStyle(0x000000, 0.7)
      labelBg.fillRoundedRect(-48, -28, 96, 18, 3)
      const labelText = this.add.text(0, -20, cfg.nameZh + ' · ' + cfg.name, {
        fontFamily: 'VT323', fontSize: '12px', color: '#ffff88', align: 'center'
      }).setOrigin(0.5)

      const interactHint = this.add.text(0, -10, '[Space]', {
        fontFamily: 'VT323', fontSize: '10px', color: '#aaffaa', align: 'center'
      }).setOrigin(0.5).setAlpha(0)

      const container = this.add.container(cfg.x, cfg.y - 20, [labelBg, labelText, interactHint])
      container.setDepth(30)
      container.setData('interactHint', interactHint)
      this.npcLabels.push(container)

      // NPC wander behavior
      this.scheduleNpcWander(npc, i)
    })
  }

  private scheduleNpcWander(npc: Phaser.Physics.Arcade.Sprite, index: number) {
    const cfg = npc.getData('config') as NpcConfig
    const originX = npc.getData('originX') as number
    const originY = npc.getData('originY') as number

    const wander = () => {
      if (this.dialogueActive && this.currentNpcIndex === index) return
      const tx = originX + Phaser.Math.Between(-cfg.wanderRadius, cfg.wanderRadius)
      const ty = originY + Phaser.Math.Between(-cfg.wanderRadius / 2, cfg.wanderRadius / 2)
      const dx = tx - npc.x
      const dy = ty - npc.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 4) { scheduleNext(); return }

      const speed = 28
      const dur = (dist / speed) * 1000

      // Pick animation based on direction
      let anim = 'npc-walk-down'
      if (Math.abs(dx) > Math.abs(dy)) {
        anim = dx > 0 ? 'npc-walk-right' : 'npc-walk-right'
        npc.setFlipX(dx < 0)
      } else {
        anim = dy > 0 ? 'npc-walk-down' : 'npc-walk-up'
        npc.setFlipX(false)
      }
      npc.play(anim, true)

      this.tweens.add({
        targets: npc,
        x: tx, y: ty,
        duration: dur,
        ease: 'Linear',
        onComplete: () => {
          npc.play('npc-idle', true)
          scheduleNext()
        }
      })
    }

    const scheduleNext = () => {
      this.time.delayedCall(Phaser.Math.Between(1500, 4000), wander)
    }

    this.time.delayedCall(Phaser.Math.Between(0, 2000) + index * 300, wander)
  }

  // ─── Animal Spawning ─────────────────────────────────────────────────────────
  private spawnAnimals() {
    ANIMAL_CONFIGS.forEach((cfg, i) => {
      if (!this.textures.exists(cfg.key)) return
      const animal = this.physics.add.sprite(cfg.x, cfg.y, cfg.key)
      animal.setScale(cfg.scale)
      animal.setDepth(18)
      animal.body.setSize(12, 10)
      animal.body.setOffset(2, 6)
      animal.play(`${cfg.key}-walk`, true)
      this.animals.push(animal)
      this.animalTargets.push({ x: cfg.x, y: cfg.y, originX: cfg.x, originY: cfg.y })

      this.scheduleAnimalWander(animal, i, cfg)
    })
  }

  private scheduleAnimalWander(animal: Phaser.Physics.Arcade.Sprite, index: number, cfg: AnimalConfig) {
    const wander = () => {
      const tx = cfg.x + Phaser.Math.Between(-cfg.wanderRadius, cfg.wanderRadius)
      const ty = cfg.y + Phaser.Math.Between(-cfg.wanderRadius / 2, cfg.wanderRadius / 2)
      const dx = tx - animal.x
      animal.setFlipX(dx < 0)
      animal.play(`${cfg.key}-walk`, true)

      const dist = Math.hypot(tx - animal.x, ty - animal.y)
      const dur = (dist / cfg.speed) * 1000

      this.tweens.add({
        targets: animal,
        x: tx, y: ty,
        duration: Math.max(dur, 400),
        ease: 'Linear',
        onComplete: () => {
          animal.play(`${cfg.key}-idle`, true)
          this.time.delayedCall(Phaser.Math.Between(800, 2500), wander)
        }
      })
    }

    this.time.delayedCall(Phaser.Math.Between(200, 2000) + index * 150, wander)
  }

  // ─── Input Setup ─────────────────────────────────────────────────────────────
  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    }
    this.spaceKey  = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E)

    Phaser.Input.Keyboard.JustDown(this.spaceKey) // arm it
    Phaser.Input.Keyboard.JustDown(this.interactKey)
  }

  // ─── Collision Setup ─────────────────────────────────────────────────────────
  private setupCollisions() {
    this.physics.add.collider(this.player, this.walls)
    this.npcs.forEach(npc => {
      this.physics.add.collider(this.player, npc)
    })
  }

  // ─── Dialogue Box ────────────────────────────────────────────────────────────
  private createDialogueBox() {
    // Position in camera space (fixed on screen) — will be moved in update
    const boxW = 420
    const boxH = 110

    const bg = this.add.graphics()
    bg.fillStyle(0x0d1a0d, 0.92)
    bg.fillRoundedRect(0, 0, boxW, boxH, 8)
    bg.lineStyle(3, 0x4aff4a, 1)
    bg.strokeRoundedRect(0, 0, boxW, boxH, 8)

    const nameBg = this.add.graphics()
    nameBg.fillStyle(0x1a4a1a, 1)
    nameBg.fillRoundedRect(10, -14, 120, 22, 4)
    nameBg.lineStyle(2, 0x4aff4a, 1)
    nameBg.strokeRoundedRect(10, -14, 120, 22, 4)

    const nameText = this.add.text(16, -11, '', {
      fontFamily: 'VT323', fontSize: '16px', color: '#88ff88'
    })

    const bodyText = this.add.text(14, 12, '', {
      fontFamily: 'VT323', fontSize: '17px', color: '#ffffff',
      wordWrap: { width: boxW - 28 }, lineSpacing: 2
    })

    const hint = this.add.text(boxW - 12, boxH - 12, '▶ Space / E', {
      fontFamily: 'VT323', fontSize: '12px', color: '#888888'
    }).setOrigin(1, 1)

    // Blinking cursor
    const cursor = this.add.text(boxW - 30, boxH - 12, '▼', {
      fontFamily: 'VT323', fontSize: '14px', color: '#4aff4a'
    }).setOrigin(1, 1)
    this.tweens.add({ targets: cursor, alpha: 0, duration: 400, yoyo: true, repeat: -1 })

    this.dialogueBox = this.add.container(0, 0, [bg, nameBg, nameText, bodyText, hint, cursor])
    this.dialogueBox.setDepth(100)
    this.dialogueBox.setScrollFactor(0)
    this.dialogueBox.setVisible(false)

    // Store refs
    this.dialogueBox.setData('nameText', nameText)
    this.dialogueBox.setData('bodyText', bodyText)
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────────
  private createHUD() {
    // Map label
    const mapLabel = this.add.text(8, 8, '🍜 Hawker Centre  •  小贩中心', {
      fontFamily: 'VT323', fontSize: '18px', color: '#ffff88',
      stroke: '#000000', strokeThickness: 3
    }).setScrollFactor(0).setDepth(100)
    mapLabel.setAlpha(0)
    this.tweens.add({ targets: mapLabel, alpha: 1, duration: 600, delay: 800 })

    // Controls hint (fades out)
    const controlsHint = this.add.text(480, 625, 'Arrow keys / WASD to move  ·  Space / E to talk to NPCs', {
      fontFamily: 'VT323', fontSize: '15px', color: '#aaaaaa', align: 'center'
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(100)

    this.tweens.add({
      targets: controlsHint,
      alpha: 0,
      duration: 1000,
      delay: 5000,
      ease: 'Linear'
    })
  }

  // ─── Ambient Effects ─────────────────────────────────────────────────────────
  private createAmbientEffects() {
    // Floating dust particles
    const particles = this.add.particles(0, 0, 'grass', {
      x: { min: 0, max: this.MAP_W },
      y: { min: 0, max: this.MAP_H },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.4, end: 0 },
      speed: { min: 5, max: 15 },
      angle: { min: 260, max: 280 },
      lifespan: 4000,
      frequency: 300,
      quantity: 1
    })
    particles.setDepth(50)

    // Ambient light overlay (warm hawker centre glow)
    const lightOverlay = this.add.graphics()
    lightOverlay.fillStyle(0xffcc66, 0.04)
    lightOverlay.fillRect(0, 0, this.MAP_W, this.MAP_H)
    lightOverlay.setDepth(1)
    lightOverlay.setScrollFactor(1)

    // Sign post
    const sign = this.add.graphics()
    sign.fillStyle(0x8B4513, 1)
    sign.fillRect(496, 680, 8, 40)
    sign.fillStyle(0xf5c842, 1)
    sign.fillRect(470, 660, 60, 24)
    sign.lineStyle(2, 0x8B4513, 1)
    sign.strokeRect(470, 660, 60, 24)
    sign.setDepth(8)
    this.add.text(500, 672, '出口', {
      fontFamily: 'Press Start 2P', fontSize: '7px', color: '#000000'
    }).setOrigin(0.5).setDepth(9)

    // Entrance sign at top
    const entranceSign = this.add.graphics()
    entranceSign.fillStyle(0xe74c3c, 1)
    entranceSign.fillRect(380, 30, 200, 28)
    entranceSign.lineStyle(3, 0xf5c842, 1)
    entranceSign.strokeRect(380, 30, 200, 28)
    entranceSign.setDepth(8)
    this.add.text(480, 44, '小贩中心  HAWKER CENTRE', {
      fontFamily: 'Press Start 2P', fontSize: '7px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(9)
  }

  // ─── Update Loop ─────────────────────────────────────────────────────────────
  update() {
    this.handlePlayerMovement()
    this.updateNPCLabels()
    this.checkNPCInteraction()
    this.updateDialogueBox()
  }

  private handlePlayerMovement() {
    if (this.dialogueActive) {
      this.player.setVelocity(0, 0)
      if (!this.playerMoving) return
      this.playerMoving = false
      this.player.play(`player-idle-${this.playerDirection}`, true)
      return
    }

    const speed = 80
    let vx = 0, vy = 0

    const left  = this.cursors.left.isDown  || this.wasd.left.isDown
    const right = this.cursors.right.isDown || this.wasd.right.isDown
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown

    if (left)  { vx = -speed; this.playerDirection = 'right'; this.player.setFlipX(true) }
    if (right) { vx =  speed; this.playerDirection = 'right'; this.player.setFlipX(false) }
    if (up)    { vy = -speed; this.playerDirection = 'up' }
    if (down)  { vy =  speed; this.playerDirection = 'down' }

    // Diagonal normalisation
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707
      vy *= 0.707
    }

    this.player.setVelocity(vx, vy)

    const moving = vx !== 0 || vy !== 0
    if (moving !== this.playerMoving) {
      this.playerMoving = moving
      if (moving) {
        const anim = `player-walk-${this.playerDirection}`
        this.player.play(anim, true)
      } else {
        this.player.play(`player-idle-${this.playerDirection}`, true)
      }
    } else if (moving) {
      // update direction animation mid-movement
      const anim = `player-walk-${this.playerDirection}`
      if (this.player.anims.currentAnim?.key !== anim) {
        this.player.play(anim, true)
      }
    }

    // Sort depth by Y position for pseudo-3D
    this.player.setDepth(20 + this.player.y * 0.01)
  }

  private updateNPCLabels() {
    this.npcs.forEach((npc, i) => {
      const label = this.npcLabels[i]
      label.setPosition(npc.x, npc.y - 26)

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y)
      const hint = label.getData('interactHint') as Phaser.GameObjects.Text
      hint.setAlpha(dist < 40 ? 1 : 0)
    })
  }

  private checkNPCInteraction() {
    if (this.dialogueActive) {
      // Handle dialogue advance
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.advanceDialogue()
      }
      return
    }

    // Check proximity to NPCs
    for (let i = 0; i < this.npcs.length; i++) {
      const npc = this.npcs[i]
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y)
      if (dist < 40) {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.interactKey)) {
          this.openDialogue(i)
          break
        }
      }
    }
  }

  private openDialogue(npcIndex: number) {
    this.dialogueActive = true
    this.currentNpcIndex = npcIndex
    this.dialogueLine = 0

    const cfg = this.npcs[npcIndex].getData('config') as NpcConfig
    const nameText = this.dialogueBox.getData('nameText') as Phaser.GameObjects.Text
    const bodyText = this.dialogueBox.getData('bodyText') as Phaser.GameObjects.Text

    nameText.setText(`${cfg.nameZh} (${cfg.name})`)
    bodyText.setText(cfg.dialogues[0])

    // Face player
    const npc = this.npcs[npcIndex]
    const dx = this.player.x - npc.x
    if (Math.abs(dx) > 8) {
      npc.setFlipX(dx > 0)
      npc.play('npc-idle', true)
    }

    this.dialogueBox.setVisible(true)
    this.positionDialogueBox()

    // Entrance animation
    this.tweens.add({
      targets: this.dialogueBox,
      alpha: { from: 0, to: 1 },
      y: { from: this.dialogueBox.y + 10, to: this.dialogueBox.y },
      duration: 200,
      ease: 'Back.Out'
    })
  }

  private advanceDialogue() {
    const cfg = this.npcs[this.currentNpcIndex].getData('config') as NpcConfig
    this.dialogueLine++

    if (this.dialogueLine >= cfg.dialogues.length) {
      this.closeDialogue()
    } else {
      const bodyText = this.dialogueBox.getData('bodyText') as Phaser.GameObjects.Text
      bodyText.setText(cfg.dialogues[this.dialogueLine])
    }
  }

  private closeDialogue() {
    this.tweens.add({
      targets: this.dialogueBox,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        this.dialogueBox.setVisible(false)
        this.dialogueBox.setAlpha(1)
        this.dialogueActive = false
        this.currentNpcIndex = -1
      }
    })
  }

  private positionDialogueBox() {
    // Bottom of screen in camera-space
    this.dialogueBox.setPosition(
      (960 / this.ZOOM - 420) / 2,
      640 / this.ZOOM - 120
    )
  }

  private updateDialogueBox() {
    if (this.dialogueActive) {
      this.positionDialogueBox()
    }
  }
}
