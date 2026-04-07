import Phaser from 'phaser'
import { gameState } from '../systems/GameState'
import type { Quest, QuestObjective } from '../systems/GameState'

// ─────────────────────────────────────────────────────────────────────────────
// COORDINATE NOTE: setScrollFactor(0) objects render at canvas_px = world_pos × zoom(2).
// All UI world positions are therefore half of the target canvas pixel values.
// Canvas: 960×640 px  →  UI world space: 480×320 units
// ─────────────────────────────────────────────────────────────────────────────

interface NpcConfig {
  id: string; x: number; y: number
  tint: number; portraitColor: number
  name: string; role: string; nameZh: string
  wanderRadius: number; dialogues: string[]
}

const NPC_CONFIGS: NpcConfig[] = [
  { id: 'uncle-lee',    x: 180, y: 210, tint: 0xffe0c8, portraitColor: 0xc0392b, name: 'Uncle Lee',    role: 'Noodle Stall',  nameZh: '李叔叔',   wanderRadius: 24, dialogues: [
    '你好！要吃什么？\nNǐ hǎo! Yào chī shénme?',
    '我这里有很好吃的面条！\nWǒ zhèlǐ yǒu hěn hào chī de miàntiáo!',
    '干捞面还是汤面？\nGān lāo miàn háishi tāng miàn?'] },
  { id: 'auntie-tan',   x: 390, y: 210, tint: 0xffd0e0, portraitColor: 0xe67e22, name: 'Auntie Tan',   role: 'Rice Stall',    nameZh: '陈阿姨',   wanderRadius: 20, dialogues: [
    '你好！要白饭还是炒饭？\nNǐ hǎo! Yào báifàn háishi chǎofàn?',
    '我的鸡肉饭很受欢迎！\nWǒ de jīròu fàn hěn shòu huānyíng!',
    '一份多少钱？三块五。\nYī fèn duōshao qián? Sān kuài wǔ.'] },
  { id: 'uncle-rajan',  x: 600, y: 210, tint: 0xd0e8ff, portraitColor: 0x2980b9, name: 'Uncle Rajan',  role: 'Drink Stall',   nameZh: '拉詹叔叔', wanderRadius: 28, dialogues: [
    '你好！要喝什么？\nNǐ hǎo! Yào hē shénme?',
    '我有糖水，豆浆，和咖啡！\nWǒ yǒu tángshuǐ, dòujiāng, hé kāfēi!',
    '冰的还是热的？\nBīng de háishi rè de?'] },
  { id: 'grandma-wong', x: 810, y: 210, tint: 0xfffff0, portraitColor: 0x8e44ad, name: 'Grandma Wong', role: 'Dessert Stall', nameZh: '王奶奶',   wanderRadius: 16, dialogues: [
    '你好啊小朋友！\nNǐ hǎo a xiǎo péngyǒu!',
    '要吃汤圆吗？很甜很好吃！\nYào chī tāngyuán ma? Hěn tián hěn hào chī!',
    '祖母给你打折！\nZǔmǔ gěi nǐ dǎzhé!'] },
  { id: 'uncle-hassan', x: 240, y: 500, tint: 0xd0ffe8, portraitColor: 0x27ae60, name: 'Uncle Hassan', role: 'Satay Stall',   nameZh: '哈山叔叔', wanderRadius: 30, dialogues: [
    '你好！要沙爹吗？\nNǐ hǎo! Yào shādié ma?',
    '鸡肉，牛肉，还是猪肉？\nJīròu, niúròu, háishi zhūròu?',
    '我的沙爹是最好吃的！\nWǒ de shādié shì zuì hào chī de!'] },
  { id: 'auntie-siew',  x: 450, y: 500, tint: 0xecd8ff, portraitColor: 0xd35400, name: 'Auntie Siew',  role: 'Soup Stall',    nameZh: '小阿姨',   wanderRadius: 22, dialogues: [
    '你好！今天要喝什么汤？\nNǐ hǎo! Jīntiān yào hē shénme tāng?',
    '骨头汤很滋补！\nGǔtou tāng hěn zībǔ!',
    '要加辣椒吗？\nYào jiā làjiāo ma?'] },
]

interface AnimalConfig { key: string; x: number; y: number; scale: number; wanderRadius: number; speed: number }
const ANIMAL_CONFIGS: AnimalConfig[] = [
  { key: 'chicken-red',    x: 160, y: 380, scale: 2.5, wanderRadius: 60, speed: 30 },
  { key: 'chicken-blonde', x: 320, y: 400, scale: 2.5, wanderRadius: 50, speed: 25 },
  { key: 'chicken-baby',   x: 260, y: 370, scale: 2.0, wanderRadius: 40, speed: 35 },
  { key: 'chicken-red',    x: 700, y: 390, scale: 2.5, wanderRadius: 55, speed: 28 },
  { key: 'chicken-blonde', x: 820, y: 380, scale: 2.5, wanderRadius: 65, speed: 32 },
  { key: 'chicken-baby',   x: 760, y: 420, scale: 2.0, wanderRadius: 45, speed: 38 },
]

export class WorldScene extends Phaser.Scene {
  private readonly MAP_W = 1024
  private readonly MAP_H = 768
  private readonly ZOOM = 2

  // Player
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key }
  private playerDirection = 'down'
  private playerMoving = false

  // NPCs / Animals
  private npcs: Phaser.Physics.Arcade.Sprite[] = []
  private npcLabels: Phaser.GameObjects.Container[] = []
  private animals: Phaser.Physics.Arcade.Sprite[] = []
  private walls!: Phaser.Physics.Arcade.StaticGroup

  // Dialogue
  private dialogueBox!: Phaser.GameObjects.Container
  private dialoguePortraitBg!: Phaser.GameObjects.Graphics
  private dialoguePortraitChar!: Phaser.GameObjects.Text
  private dialogueActive = false
  private currentNpcIndex = -1
  private dialogueLine = 0
  private spaceKey!: Phaser.Input.Keyboard.Key
  private interactKey!: Phaser.Input.Keyboard.Key

  // HUD — status bars
  private hpBarFill!: Phaser.GameObjects.Graphics
  private xpBarFill!: Phaser.GameObjects.Graphics
  private levelBadgeText!: Phaser.GameObjects.Text
  private hpValueText!: Phaser.GameObjects.Text
  private xpValueText!: Phaser.GameObjects.Text
  private goldText!: Phaser.GameObjects.Text

  // HUD — quest tracker
  private questContainer!: Phaser.GameObjects.Container
  private questTitleEn!: Phaser.GameObjects.Text
  private questTitleZh!: Phaser.GameObjects.Text
  private questObjTexts: Phaser.GameObjects.Text[] = []

  constructor() { super({ key: 'WorldScene' }) }

  create() {
    this.cameras.main.fadeIn(600, 0, 0, 0)
    this.cameras.main.setZoom(this.ZOOM)
    this.cameras.main.setBounds(0, 0, this.MAP_W, this.MAP_H)
    this.cameras.main.roundPixels = true

    this.buildMap()
    this.createAnimations()
    this.spawnPlayer()
    this.spawnNPCs()
    this.spawnAnimals()
    this.setupInput()
    this.setupCollisions()

    // UI — all scrollFactor(0), world pos = canvas_px / zoom
    this.createDialogueBox()
    this.createStatusPanel()
    this.createQuestTracker()
    this.createBottomHotbar()
    this.createAmbientEffects()

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
  }

  // ─── Map ──────────────────────────────────────────────────────────────────
  private buildMap() {
    const W = this.MAP_W, H = this.MAP_H
    // Warm concrete floor — tinted grass as base tile
    this.add.tileSprite(W / 2, H / 2, W, H, 'grass').setDepth(0).setTint(0xb09878)
    // Main pedestrian aisles — slightly darker warm stone
    this.add.tileSprite(W / 2, 340, W, 60, 'path').setDepth(1).setTint(0x8a7860)
    this.add.tileSprite(W / 2, H / 2, 80, H, 'path').setDepth(1).setTint(0x8a7860)
    if (this.textures.exists('water')) {
      this.add.tileSprite(900, 600, 80, 60, 'water').setDepth(1).setAlpha(0.85)
    }

    this.walls = this.physics.add.staticGroup()
    const topStalls = [100, 290, 490, 680]
    const stallNames = ['面条', '米饭', '饮料', '甜品']
    topStalls.forEach((sx, i) => this.buildStall(sx, 80, stallNames[i], i))
    this.buildStall(140, 430, '沙爹', 4)
    this.buildStall(370, 430, '汤', 5)
    this.addTrees()
    this.addSeating()

    ;[[W/2,4,W,8],[W/2,H-4,W,8],[4,H/2,8,H],[W-4,H/2,8,H]].forEach(([x,y,w,h]) =>
      this.walls.add(this.add.rectangle(x,y,w,h,0,0).setDepth(0)))
    this.physics.world.setBounds(0, 0, W, H)
  }

  private buildStall(x: number, y: number, label: string, index: number) {
    const W = 160, H = 100

    // Back wall — warm dark wood planks
    const bg = this.add.graphics()
    bg.fillStyle(0x5c3218, 1).fillRect(x, y, W, H)
    for (let p = 0; p < 5; p++) {
      bg.fillStyle(0x3a1e0c, 0.5).fillRect(x, y + p * 20, W, 1)
      bg.fillStyle(0xffffff, 0.04).fillRect(x, y + p * 20 + 2, W, 1)
    }
    bg.lineStyle(2, 0x2a0e04, 1).strokeRect(x, y, W, H)
    bg.setDepth(2)

    // Coloured awning — festive hawker stall colours
    const roofColors = [0xc83020, 0xd87028, 0x1a6878, 0x6030a0, 0x205838, 0xc85020]
    const rColor = roofColors[index % roofColors.length]
    const roof = this.add.graphics()
    roof.fillStyle(rColor, 1).fillRect(x - 10, y - 22, W + 20, 28)
    roof.fillStyle(0xffffff, 0.12).fillRect(x - 10, y - 22, W + 20, 8)
    roof.fillStyle(0x000000, 0.2).fillRect(x - 10, y + 4, W + 20, 2)
    roof.lineStyle(2, 0x180804, 1).strokeRect(x - 10, y - 22, W + 20, 28)
    roof.setDepth(3)

    // Awning fringe — alternating colour/white triangles
    const fw = (W + 20) / 8
    for (let f = 0; f < 8; f++) {
      const fr = this.add.graphics()
      if (f % 2 === 0) {
        fr.fillStyle(0xffffff, 0.22)
      } else {
        fr.fillStyle(rColor, 0.7)
      }
      fr.fillTriangle(
        x - 10 + f * fw, y + 6,
        x - 10 + (f + 0.5) * fw, y + 16,
        x - 10 + (f + 1) * fw, y + 6
      ).setDepth(4)
    }

    // Counter / serving surface
    const counter = this.add.graphics()
    counter.fillStyle(0xc89060, 1).fillRect(x + 6, y + 52, W - 12, 26)
    counter.fillStyle(0xe8b080, 1).fillRect(x + 6, y + 52, W - 12, 4)
    counter.fillStyle(0x7a4820, 1).fillRect(x + 6, y + 74, W - 12, 4)
    counter.lineStyle(1.5, 0x6a3818, 1).strokeRect(x + 6, y + 52, W - 12, 26)
    counter.setDepth(3)

    // Sign board — yellow with Chinese label
    const sign = this.add.graphics()
    sign.fillStyle(0xf8e840, 1).fillRoundedRect(x + W / 2 - 38, y + 10, 76, 22, 3)
    sign.lineStyle(1.5, 0xb88820, 1).strokeRoundedRect(x + W / 2 - 38, y + 10, 76, 22, 3)
    sign.setDepth(5)

    this.add.text(x + W / 2, y + 21, label, {
      fontFamily: 'Press Start 2P', fontSize: '9px', color: '#3a1800', stroke: '#f8e840', strokeThickness: 1
    }).setOrigin(0.5).setDepth(6)

    // Collision body
    const wall = this.add.rectangle(x + W / 2, y + H / 2, W, H, 0, 0)
    this.physics.add.existing(wall, true)
    this.walls.add(wall)
  }

  private addTrees() {
    const pos = [
      {x:32,y:32},{x:80,y:20},{x:150,y:24},{x:260,y:20},{x:380,y:24},{x:500,y:20},{x:620,y:24},{x:740,y:20},{x:860,y:24},{x:960,y:32},
      {x:32,y:730},{x:120,y:740},{x:280,y:735},{x:500,y:738},{x:700,y:736},{x:850,y:740},{x:980,y:730},
      {x:20,y:150},{x:20,y:300},{x:20,y:450},{x:20,y:600},
      {x:1005,y:150},{x:1005,y:300},{x:1005,y:450},{x:1005,y:600},
    ]
    pos.forEach(({x,y}) => {
      const key = Math.random()>0.5 ? 'oak-tree' : 'oak-tree-small'
      if (!this.textures.exists(key)) return
      const s = 1.2+Math.random()*0.6
      const t = this.add.image(x,y,key).setScale(s).setDepth(10).setOrigin(0.5,1)
      this.tweens.add({targets:t,scaleX:s*1.03,duration:2000+Math.random()*1000,yoyo:true,repeat:-1,ease:'Sine.InOut',delay:Math.random()*2000})
    })
    const maples = [{x:600,y:380},{x:680,y:390},{x:760,y:375},{x:840,y:385}]
    maples.forEach(({x,y}) => {
      if (!this.textures.exists('maple-tree')) return
      const t = this.add.image(x,y,'maple-tree').setScale(1.4).setDepth(10).setOrigin(0.5,1)
      this.tweens.add({targets:t,scaleX:1.4*1.02,duration:2500,yoyo:true,repeat:-1,ease:'Sine.InOut',delay:Math.random()*1500})
    })
  }

  private addSeating() {
    const tables = [
      {x:160,y:310},{x:300,y:310},{x:440,y:310},{x:580,y:310},{x:720,y:310},{x:860,y:310},
      {x:220,y:380},{x:380,y:380},{x:540,y:380},{x:650,y:510},{x:780,y:520},{x:910,y:510},
    ]
    tables.forEach(({x,y}) => {
      const g = this.add.graphics()
      g.fillStyle(0xa87848, 1).fillRect(x - 16, y - 10, 32, 22)
      g.fillStyle(0xffffff, 0.08).fillRect(x - 16, y - 10, 32, 4)
      g.lineStyle(1.5, 0x6a3a18, 1).strokeRect(x - 16, y - 10, 32, 22)
      g.fillStyle(0x6a3a18, 1).fillRect(x - 14, y + 12, 4, 6).fillRect(x + 10, y + 12, 4, 6)
      g.setDepth(5)
      ;[{dx:-24,dy:0},{dx:24,dy:0},{dx:0,dy:-20},{dx:0,dy:20}].forEach(({dx,dy}) => {
        const c = this.add.graphics()
        c.fillStyle(0x905838, 1).fillRect(x + dx - 7, y + dy - 7, 14, 14)
        c.fillStyle(0xffffff, 0.07).fillRect(x + dx - 7, y + dy - 7, 14, 3)
        c.lineStyle(1, 0x5a2e10, 1).strokeRect(x + dx - 7, y + dy - 7, 14, 14).setDepth(4)
      })
    })
    const decor = [{x:120,y:620},{x:240,y:635},{x:580,y:625},{x:730,y:618}]
    decor.forEach(({x,y}) => {
      if (this.textures.exists('outdoor-decor'))
        this.add.image(x,y,'outdoor-decor').setScale(0.9).setDepth(6).setOrigin(0.5,1).setCrop(0,0,16,32)
    })
    if (this.textures.exists('chest')) {
      const chest = this.add.image(900,600,'chest').setScale(2).setDepth(7)
      this.tweens.add({targets:chest,y:596,duration:1000,yoyo:true,repeat:-1,ease:'Sine.InOut'})
    }
  }

  // ─── Animations ───────────────────────────────────────────────────────────
  private createAnimations() {
    if (!this.anims.exists('player-walk-down')) {
      this.anims.create({key:'player-walk-down', frames:this.anims.generateFrameNumbers('player-walk',{start:0,end:5}),   frameRate:8,repeat:-1})
      this.anims.create({key:'player-walk-up',   frames:this.anims.generateFrameNumbers('player-walk',{start:6,end:11}),  frameRate:8,repeat:-1})
      this.anims.create({key:'player-walk-right',frames:this.anims.generateFrameNumbers('player-walk',{start:12,end:17}), frameRate:8,repeat:-1})
    }
    if (!this.anims.exists('player-idle-down')) {
      this.anims.create({key:'player-idle-down', frames:this.anims.generateFrameNumbers('player-idle',{start:0,end:3}),  frameRate:4,repeat:-1})
      this.anims.create({key:'player-idle-up',   frames:this.anims.generateFrameNumbers('player-idle',{start:4,end:7}),  frameRate:4,repeat:-1})
      this.anims.create({key:'player-idle-right',frames:this.anims.generateFrameNumbers('player-idle',{start:8,end:11}), frameRate:4,repeat:-1})
    }
    if (!this.anims.exists('npc-walk-down')) {
      this.anims.create({key:'npc-walk-down', frames:this.anims.generateFrameNumbers('npc-base',{start:0,end:5}),   frameRate:6,repeat:-1})
      this.anims.create({key:'npc-walk-right',frames:this.anims.generateFrameNumbers('npc-base',{start:6,end:11}),  frameRate:6,repeat:-1})
      this.anims.create({key:'npc-walk-up',   frames:this.anims.generateFrameNumbers('npc-base',{start:12,end:17}), frameRate:6,repeat:-1})
      this.anims.create({key:'npc-idle',      frames:this.anims.generateFrameNumbers('npc-base',{start:0,end:2}),   frameRate:3,repeat:-1})
    }
    if (!this.anims.exists('skeleton-walk'))
      this.anims.create({key:'skeleton-walk',frames:this.anims.generateFrameNumbers('skeleton',{start:0,end:5}),frameRate:6,repeat:-1})
    ;['chicken-red','chicken-blonde','chicken-baby'].forEach(k => {
      if (this.textures.exists(k) && !this.anims.exists(`${k}-walk`)) {
        this.anims.create({key:`${k}-walk`,frames:this.anims.generateFrameNumbers(k,{start:0,end:1}),frameRate:4,repeat:-1})
        this.anims.create({key:`${k}-idle`,frames:this.anims.generateFrameNumbers(k,{start:0,end:0}),frameRate:2,repeat:-1})
      }
    })
  }

  // ─── Player ───────────────────────────────────────────────────────────────
  private spawnPlayer() {
    this.player = this.physics.add.sprite(512,340,'player-idle')
    this.player.setDepth(20).setScale(1.5).setCollideWorldBounds(true)
    this.player.body.setSize(16,16).setOffset(8,14)
    this.player.play('player-idle-down')
    const shadow = this.add.ellipse(0,0,18,8,0x000000,0.25).setDepth(19)
    this.events.on('update',()=>shadow.setPosition(this.player.x,this.player.y+12))
  }

  // ─── NPCs ─────────────────────────────────────────────────────────────────
  private spawnNPCs() {
    NPC_CONFIGS.forEach((cfg,i)=>{
      const npc = this.physics.add.sprite(cfg.x,cfg.y,'npc-base')
      npc.setTint(cfg.tint).setDepth(20).setScale(1.4).setImmovable(true)
      npc.body.setSize(16,20).setOffset(8,10)
      npc.play('npc-idle').setData('config',cfg).setData('originX',cfg.x).setData('originY',cfg.y)
      this.npcs.push(npc)

      const shadow = this.add.ellipse(cfg.x,cfg.y+12,18,8,0x000000,0.2).setDepth(19)
      this.events.on('update',()=>shadow.setPosition(npc.x,npc.y+12))

      // Name plate — warm dark with gold border
      const labelBg = this.add.graphics()
      labelBg.fillStyle(0x0e0906, 0.92).fillRoundedRect(-50, -28, 100, 18, 3)
      labelBg.lineStyle(1, 0xd4961e, 0.85).strokeRoundedRect(-50, -28, 100, 18, 3)
      const labelText = this.add.text(0, -19, `${cfg.nameZh}  ${cfg.name}`, { fontFamily: 'VT323', fontSize: '11px', color: '#fff0d0', align: 'center' }).setOrigin(0.5)
      // Interact hint — warm gold, compact
      const hint = this.add.text(0, -6, '[ E ]', { fontFamily: 'VT323', fontSize: '9px', color: '#f0c840', align: 'center' }).setOrigin(0.5).setAlpha(0)
      // Role badge — per-NPC portrait colour
      const roleBg = this.add.graphics()
      roleBg.fillStyle(cfg.portraitColor, 0.92).fillRoundedRect(-30, -44, 60, 13, 2)
      const roleText = this.add.text(0, -38, cfg.role, { fontFamily: 'VT323', fontSize: '9px', color: '#ffffff', align: 'center' }).setOrigin(0.5)

      const container = this.add.container(cfg.x, cfg.y - 20, [roleBg, roleText, labelBg, labelText, hint])
      container.setDepth(30).setData('interactHint',hint)
      this.npcLabels.push(container)
      this.scheduleNpcWander(npc,i)
    })
  }

  private scheduleNpcWander(npc: Phaser.Physics.Arcade.Sprite, index: number) {
    const cfg = npc.getData('config') as NpcConfig
    const ox = npc.getData('originX') as number, oy = npc.getData('originY') as number
    const wander = () => {
      if (this.dialogueActive && this.currentNpcIndex===index) return
      const tx = ox+Phaser.Math.Between(-cfg.wanderRadius,cfg.wanderRadius)
      const ty = oy+Phaser.Math.Between(-cfg.wanderRadius/2,cfg.wanderRadius/2)
      const dx=tx-npc.x, dy=ty-npc.y, dist=Math.sqrt(dx*dx+dy*dy)
      if (dist<4){scheduleNext();return}
      let anim='npc-walk-down'
      if (Math.abs(dx)>Math.abs(dy)){anim='npc-walk-right';npc.setFlipX(dx<0)}
      else{anim=dy>0?'npc-walk-down':'npc-walk-up';npc.setFlipX(false)}
      npc.play(anim,true)
      this.tweens.add({targets:npc,x:tx,y:ty,duration:(dist/28)*1000,ease:'Linear',onComplete:()=>{npc.play('npc-idle',true);scheduleNext()}})
    }
    const scheduleNext=()=>this.time.delayedCall(Phaser.Math.Between(1500,4000),wander)
    this.time.delayedCall(Phaser.Math.Between(0,2000)+index*300,wander)
  }

  // ─── Animals ──────────────────────────────────────────────────────────────
  private spawnAnimals() {
    ANIMAL_CONFIGS.forEach((cfg,i)=>{
      if (!this.textures.exists(cfg.key)) return
      const a = this.physics.add.sprite(cfg.x,cfg.y,cfg.key)
      a.setScale(cfg.scale).setDepth(18).body.setSize(12,10).setOffset(2,6)
      a.play(`${cfg.key}-walk`,true)
      this.animals.push(a)
      const wander=()=>{
        const tx=cfg.x+Phaser.Math.Between(-cfg.wanderRadius,cfg.wanderRadius)
        const ty=cfg.y+Phaser.Math.Between(-cfg.wanderRadius/2,cfg.wanderRadius/2)
        a.setFlipX(tx<a.x);a.play(`${cfg.key}-walk`,true)
        const dist=Math.hypot(tx-a.x,ty-a.y)
        this.tweens.add({targets:a,x:tx,y:ty,duration:Math.max((dist/cfg.speed)*1000,400),ease:'Linear',
          onComplete:()=>{a.play(`${cfg.key}-idle`,true);this.time.delayedCall(Phaser.Math.Between(800,2500),wander)}})
      }
      this.time.delayedCall(Phaser.Math.Between(200,2000)+i*150,wander)
    })
  }

  // ─── Input / Collisions ───────────────────────────────────────────────────
  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      up:   this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right:this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }
    this.spaceKey    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    Phaser.Input.Keyboard.JustDown(this.spaceKey)
    Phaser.Input.Keyboard.JustDown(this.interactKey)
  }

  private setupCollisions() {
    this.physics.add.collider(this.player, this.walls)
    this.npcs.forEach(npc=>this.physics.add.collider(this.player,npc))
  }

  // ─── Dialogue Box ─────────────────────────────────────────────────────────
  // Box: 360w × 90h world → 720×180 canvas px, portrait 52w
  // Centered: world x=60 → canvas x=120..840 (120px margins both sides)
  private createDialogueBox() {
    const boxW = 360, boxH = 90, portW = 52

    // Main panel — warm dark with gold border
    const bg = this.add.graphics()
    bg.fillStyle(0x0c0806, 0.97).fillRoundedRect(0, 0, boxW, boxH, 5)
    bg.lineStyle(2, 0xd4961e, 1).strokeRoundedRect(0, 0, boxW, boxH, 5)
    bg.lineStyle(1, 0xd4961e, 0.22).strokeRoundedRect(2, 2, boxW - 4, boxH - 4, 4)

    this.dialoguePortraitBg = this.add.graphics()

    this.dialoguePortraitChar = this.add.text(portW / 2, boxH / 2, '', {
      fontFamily: 'VT323', fontSize: '20px', color: '#ffffff', stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5)

    const sep = this.add.graphics()
    sep.lineStyle(1, 0x3a2010, 1)
    sep.beginPath().moveTo(portW + 4, 5).lineTo(portW + 4, boxH - 5).strokePath()

    // Name tab above box — warm gold border
    const nameBg = this.add.graphics()
    nameBg.fillStyle(0x180e06, 1).fillRoundedRect(portW + 6, -17, 190, 20, 3)
    nameBg.lineStyle(1.5, 0xd4961e, 1).strokeRoundedRect(portW + 6, -17, 190, 20, 3)

    const nameText = this.add.text(portW + 12, -13, '', { fontFamily: 'VT323', fontSize: '14px', color: '#fff0d0' })
    const roleText = this.add.text(portW + 200, -13, '', { fontFamily: 'VT323', fontSize: '11px', color: '#907868' })

    // Body text — larger for Chinese readability
    const bodyText = this.add.text(portW + 8, 8, '', {
      fontFamily: 'VT323, serif', fontSize: '16px', color: '#ffe8d0',
      wordWrap: { width: boxW - portW - 16 }, lineSpacing: 4
    })

    const hint = this.add.text(boxW - 6, boxH - 5, 'Space / E', { fontFamily: 'VT323', fontSize: '9px', color: '#4a3018' }).setOrigin(1, 1)
    const cursor = this.add.text(boxW - 6, boxH - 16, '▼', { fontFamily: 'VT323', fontSize: '11px', color: '#d4961e' }).setOrigin(1, 1)
    this.tweens.add({ targets: cursor, alpha: 0, duration: 400, yoyo: true, repeat: -1 })

    this.dialogueBox = this.add.container(0, 0, [bg, this.dialoguePortraitBg, this.dialoguePortraitChar, sep, nameBg, nameText, roleText, bodyText, hint, cursor])
    this.dialogueBox.setDepth(100).setScrollFactor(0).setVisible(false)
    this.dialogueBox.setData('nameText', nameText).setData('roleText', roleText).setData('bodyText', bodyText)
  }

  // ─── Status Panel ─────────────────────────────────────────────────────────
  // Container at world (30,10) → canvas (60,20). Size: 138w×52h → 276×104 canvas px
  private createStatusPanel() {
    const W = 138, H = 52

    const panelBg = this.add.graphics()
    panelBg.fillStyle(0x0e0a06, 0.95).fillRoundedRect(0, 0, W, H, 4)
    panelBg.lineStyle(2, 0xd4961e, 1).strokeRoundedRect(0, 0, W, H, 4)
    panelBg.lineStyle(1, 0xd4961e, 0.22).strokeRoundedRect(2, 2, W - 4, H - 4, 3)

    // Level badge — warm gold circle
    const lvlBg = this.add.graphics()
    lvlBg.fillStyle(0xd4961e, 1).fillCircle(17, 26, 13)
    lvlBg.fillStyle(0xffd060, 1).fillCircle(17, 25, 11)
    const lvlCaption = this.add.text(17, 15, 'LV', { fontFamily: 'VT323', fontSize: '8px', color: '#4a2200' }).setOrigin(0.5, 0)
    this.levelBadgeText = this.add.text(17, 27, '1', { fontFamily: 'VT323', fontSize: '16px', color: '#1e0800' }).setOrigin(0.5, 0.5)

    // HP row
    const hpLabel = this.add.text(36, 8, 'HP', { fontFamily: 'VT323', fontSize: '13px', color: '#ff9888' })
    const hpBg = this.add.graphics()
    hpBg.fillStyle(0x2a0808, 1).fillRoundedRect(52, 9, 74, 10, 2)
    this.hpBarFill = this.add.graphics()
    this.hpValueText = this.add.text(128, 9, '', { fontFamily: 'VT323', fontSize: '10px', color: '#ffb8a8' }).setOrigin(1, 0)

    // XP row
    const xpLabel = this.add.text(36, 23, 'XP', { fontFamily: 'VT323', fontSize: '13px', color: '#f0c040' })
    const xpBg = this.add.graphics()
    xpBg.fillStyle(0x201400, 1).fillRoundedRect(52, 24, 74, 10, 2)
    this.xpBarFill = this.add.graphics()
    this.xpValueText = this.add.text(128, 24, '', { fontFamily: 'VT323', fontSize: '10px', color: '#ffd870' }).setOrigin(1, 0)

    // Gold counter
    this.goldText = this.add.text(36, 38, '', { fontFamily: 'VT323', fontSize: '13px', color: '#f0c840' })

    const panel = this.add.container(30 * this.ZOOM, 10 * this.ZOOM, [
      panelBg, lvlBg, lvlCaption, this.levelBadgeText,
      hpLabel, hpBg, this.hpBarFill, this.hpValueText,
      xpLabel, xpBg, this.xpBarFill, this.xpValueText,
      this.goldText
    ])
    panel.setScrollFactor(0).setDepth(100)
    this.redrawStatusBars()
  }

  private redrawStatusBars() {
    const gs = gameState
    this.hpBarFill.clear()
    const hp = gs.hp/gs.maxHp
    if (hp>0){
      const col = hp>0.5?0x50c850:hp>0.25?0xf0c040:0xe03030
      this.hpBarFill.fillStyle(col,1).fillRoundedRect(50,8,74*hp,11,2)
    }
    this.hpValueText.setText(`${gs.hp}/${gs.maxHp}`)

    this.xpBarFill.clear()
    const xp = gs.xp/gs.xpToNext
    if (xp>0){
      this.xpBarFill.fillStyle(0xf5c842,1).fillRoundedRect(50,23,74*xp,11,2)
    }
    this.xpValueText.setText(`${gs.xp}/${gs.xpToNext}`)
    this.levelBadgeText.setText(`${gs.level}`)
    this.goldText.setText(`G  ${gs.gold}`)
  }

  // ─── Quest Tracker ────────────────────────────────────────────────────────
  // Container at world (335,10) → canvas (670,20). Panel 118w×76h → 236×152 canvas px
  private createQuestTracker() {
    const PW = 118, PH = 76

    const bg = this.add.graphics()
    bg.fillStyle(0x0e0a06, 0.95).fillRoundedRect(0, 0, PW, PH, 4)
    bg.lineStyle(2, 0xd4961e, 1).strokeRoundedRect(0, 0, PW, PH, 4)
    bg.lineStyle(1, 0xd4961e, 0.22).strokeRoundedRect(2, 2, PW - 4, PH - 4, 3)

    const header = this.add.text(PW / 2, 6, '任务 QUEST', {
      fontFamily: 'VT323', fontSize: '11px', color: '#f0c840', align: 'center'
    }).setOrigin(0.5, 0)
    const hdrLine = this.add.graphics()
    hdrLine.lineStyle(1, 0x5a3810, 1).beginPath().moveTo(4, 18).lineTo(PW - 4, 18).strokePath()

    this.questTitleEn = this.add.text(PW / 2, 22, '', {
      fontFamily: 'VT323', fontSize: '13px', color: '#fff0d0', align: 'center', wordWrap: { width: PW - 8 }
    }).setOrigin(0.5, 0)
    this.questTitleZh = this.add.text(PW / 2, 34, '', {
      fontFamily: 'VT323', fontSize: '12px', color: '#f0c840', align: 'center'
    }).setOrigin(0.5, 0)

    const divider = this.add.graphics()
    divider.lineStyle(1, 0x3a2408, 1).beginPath().moveTo(4, 46).lineTo(PW - 4, 46).strokePath()

    this.questObjTexts = []
    for (let i = 0; i < 4; i++) {
      const t = this.add.text(6, 50 + i * 7, '', {
        fontFamily: 'VT323', fontSize: '10px', color: '#a08870', wordWrap: { width: PW - 12 }
      })
      this.questObjTexts.push(t)
    }

    this.questContainer = this.add.container(335 * this.ZOOM, 10 * this.ZOOM, [bg, header, hdrLine, this.questTitleEn, this.questTitleZh, divider, ...this.questObjTexts])
    this.questContainer.setScrollFactor(0).setDepth(100)
    this.updateQuestTracker()
  }

  private updateQuestTracker() {
    const quest = gameState.getActiveQuest()
    if (!quest) { this.questContainer.setVisible(false); return }
    this.questContainer.setVisible(true)
    this.questTitleEn.setText(quest.title)
    this.questTitleZh.setText(quest.titleZh)
    quest.objectives.forEach((obj, i) => {
      if (i >= this.questObjTexts.length) return
      this.questObjTexts[i].setText(`${obj.complete ? '✓' : '○'} ${obj.description}`)
      this.questObjTexts[i].setColor(obj.complete ? '#80d860' : '#a08870')
    })
    for (let i = quest.objectives.length; i < this.questObjTexts.length; i++) this.questObjTexts[i].setText('')
  }

  // ─── Bottom Hotbar ────────────────────────────────────────────────────────
  // 6 slots × 24w world → 48px canvas each; container centered at y=293 world → y=586 canvas
  private createBottomHotbar() {
    const slotW = 24, gap = 3, slots = 6
    const totalW = slots * slotW + (slots - 1) * gap  // 159 world → 318 canvas

    const barBg = this.add.graphics()
    barBg.fillStyle(0x0e0a06, 0.92).fillRoundedRect(-6, -5, totalW + 12, slotW + 10, 4)
    barBg.lineStyle(1.5, 0x5a3810, 1).strokeRoundedRect(-6, -5, totalW + 12, slotW + 10, 4)
    barBg.lineStyle(1, 0xd4961e, 0.18).strokeRoundedRect(-4, -3, totalW + 8, slotW + 6, 3)

    const children: Phaser.GameObjects.GameObject[] = [barBg]
    for (let i = 0; i < slots; i++) {
      const sx = i * (slotW + gap)
      const s = this.add.graphics()
      s.fillStyle(0x180e06, 1).fillRoundedRect(sx, 0, slotW, slotW, 2)
      s.lineStyle(1, 0x4a2c10, 1).strokeRoundedRect(sx, 0, slotW, slotW, 2)
      children.push(s)
      children.push(this.add.text(sx + slotW - 2, slotW - 2, `${i + 1}`, { fontFamily: 'VT323', fontSize: '8px', color: '#3a2010' }).setOrigin(1, 1))
    }
    const hotbar = this.add.container((480 - totalW) / 2 * this.ZOOM, 288 * this.ZOOM, children)
    hotbar.setScrollFactor(0).setDepth(100)

    const hint = this.add.text(240 * this.ZOOM, 281 * this.ZOOM, 'WASD / Arrows  ·  E or Space to talk', {
      fontFamily: 'VT323', fontSize: '10px', color: '#6a4828', align: 'center'
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(99)
    this.tweens.add({ targets: hint, alpha: 0, duration: 1200, delay: 5000 })
  }

  // ─── Ambient Effects ──────────────────────────────────────────────────────
  private createAmbientEffects() {
    // Warm ambient light wash over entire map
    this.add.graphics().fillStyle(0xff9040, 0.025).fillRect(0, 0, this.MAP_W, this.MAP_H).setDepth(1)

    // Main entrance sign — Singapore-style blue + red top band
    const signX = 432, signY = 24, signW = 256, signH = 34
    const eBg = this.add.graphics()
    eBg.fillStyle(0x0a2860, 1).fillRect(signX, signY, signW, signH)
    eBg.fillStyle(0xc02820, 1).fillRect(signX, signY, signW, 8)        // red top band
    eBg.fillStyle(0xffffff, 0.06).fillRect(signX, signY + 8, signW, 4)  // subtle sheen
    eBg.lineStyle(2, 0xd4a020, 1).strokeRect(signX, signY, signW, signH)
    eBg.lineStyle(1, 0xd4a020, 0.35).strokeRect(signX + 2, signY + 10, signW - 4, signH - 12)
    eBg.setDepth(8)
    this.add.text(signX + signW / 2, signY + signH / 2 + 3, '小贩中心  HAWKER CENTRE', {
      fontFamily: 'Press Start 2P', fontSize: '6px', color: '#ffffff', stroke: '#000000', strokeThickness: 1
    }).setOrigin(0.5).setDepth(9)

    // Exit sign — green safety sign style
    const xBg = this.add.graphics()
    xBg.fillStyle(0x0c5828, 1).fillRect(478, 670, 68, 24)
    xBg.lineStyle(1.5, 0x38c068, 1).strokeRect(478, 670, 68, 24)
    xBg.setDepth(8)
    this.add.text(512, 682, '出口  EXIT', {
      fontFamily: 'Press Start 2P', fontSize: '5px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(9)
  }

  // ─── Update Loop ──────────────────────────────────────────────────────────
  update() {
    this.handlePlayerMovement()
    this.updateNPCLabels()
    this.checkNPCInteraction()
    this.updateDialogueBox()
  }

  private handlePlayerMovement() {
    if (this.dialogueActive){
      this.player.setVelocity(0,0)
      if (this.playerMoving){this.playerMoving=false;this.player.play(`player-idle-${this.playerDirection}`,true)}
      return
    }
    const speed=80
    let vx=0,vy=0
    const L=this.cursors.left.isDown||this.wasd.left.isDown
    const R=this.cursors.right.isDown||this.wasd.right.isDown
    const U=this.cursors.up.isDown||this.wasd.up.isDown
    const D=this.cursors.down.isDown||this.wasd.down.isDown
    if (L){vx=-speed;this.playerDirection='right';this.player.setFlipX(true)}
    if (R){vx=speed;this.playerDirection='right';this.player.setFlipX(false)}
    if (U){vy=-speed;this.playerDirection='up'}
    if (D){vy=speed;this.playerDirection='down'}
    if (vx&&vy){vx*=0.707;vy*=0.707}
    this.player.setVelocity(vx,vy)
    const moving=vx!==0||vy!==0
    if (moving!==this.playerMoving){
      this.playerMoving=moving
      this.player.play(moving?`player-walk-${this.playerDirection}`:`player-idle-${this.playerDirection}`,true)
    } else if (moving){
      const a=`player-walk-${this.playerDirection}`
      if (this.player.anims.currentAnim?.key!==a) this.player.play(a,true)
    }
    this.player.setDepth(20+this.player.y*0.01)
  }

  private updateNPCLabels() {
    this.npcs.forEach((npc,i)=>{
      this.npcLabels[i].setPosition(npc.x,npc.y-26)
      const dist=Phaser.Math.Distance.Between(this.player.x,this.player.y,npc.x,npc.y)
      ;(this.npcLabels[i].getData('interactHint') as Phaser.GameObjects.Text).setAlpha(dist<40?1:0)
    })
  }

  private checkNPCInteraction() {
    if (this.dialogueActive){
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)||Phaser.Input.Keyboard.JustDown(this.interactKey)) this.advanceDialogue()
      return
    }
    for (let i=0;i<this.npcs.length;i++){
      const dist=Phaser.Math.Distance.Between(this.player.x,this.player.y,this.npcs[i].x,this.npcs[i].y)
      if (dist<40&&(Phaser.Input.Keyboard.JustDown(this.spaceKey)||Phaser.Input.Keyboard.JustDown(this.interactKey))){
        this.openDialogue(i);break
      }
    }
  }

  openDialogue(npcIndex: number) {
    this.dialogueActive=true; this.currentNpcIndex=npcIndex; this.dialogueLine=0
    const cfg = this.npcs[npcIndex].getData('config') as NpcConfig
    ;(this.dialogueBox.getData('nameText') as Phaser.GameObjects.Text).setText(`${cfg.nameZh}  ${cfg.name}`)
    ;(this.dialogueBox.getData('roleText') as Phaser.GameObjects.Text).setText(cfg.role)
    ;(this.dialogueBox.getData('bodyText') as Phaser.GameObjects.Text).setText(cfg.dialogues[0])

    // Portrait
    const portW=54, boxH=86
    this.dialoguePortraitBg.clear()
    this.dialoguePortraitBg.fillStyle(cfg.portraitColor,1).fillRoundedRect(3,3,portW-2,boxH-6,4)
    this.dialoguePortraitBg.fillStyle(0xffffff,0.14).fillRoundedRect(3,3,portW-2,(boxH-6)*0.4,3)
    this.dialoguePortraitBg.fillStyle(0x000000,0.22).fillRoundedRect(3,boxH-6-(boxH-6)*0.28,portW-2,(boxH-6)*0.28,3)
    this.dialoguePortraitChar.setText(cfg.nameZh[0]).setPosition(portW/2,boxH/2)

    const npc=this.npcs[npcIndex]
    if (Math.abs(this.player.x-npc.x)>8){npc.setFlipX(this.player.x>npc.x);npc.play('npc-idle',true)}

    this.dialogueBox.setVisible(true).setAlpha(0)
    this.positionDialogueBox()
    this.tweens.add({targets:this.dialogueBox,alpha:1,duration:200})
  }

  private advanceDialogue() {
    const cfg=this.npcs[this.currentNpcIndex].getData('config') as NpcConfig
    this.dialogueLine++
    if (this.dialogueLine>=cfg.dialogues.length) this.closeDialogue()
    else (this.dialogueBox.getData('bodyText') as Phaser.GameObjects.Text).setText(cfg.dialogues[this.dialogueLine])
  }

  private closeDialogue() {
    const npcIdx=this.currentNpcIndex
    const cfg=this.npcs[npcIdx].getData('config') as NpcConfig
    this.tweens.add({targets:this.dialogueBox,alpha:0,duration:150,onComplete:()=>{
      this.dialogueBox.setVisible(false).setAlpha(1)
      this.dialogueActive=false; this.currentNpcIndex=-1
      const result=gameState.talkToNPC(cfg.id)
      this.redrawStatusBars(); this.updateQuestTracker()
      this.showXPGain(result.xpGained)
      if (result.objectiveComplete) this.time.delayedCall(400,()=>this.showObjectiveComplete(result.objectiveComplete!))
      if (result.questComplete) this.time.delayedCall(result.objectiveComplete?1000:400,()=>this.showQuestComplete(result.questComplete!))
      if (result.leveledUp) this.time.delayedCall(result.questComplete?2200:result.objectiveComplete?1600:500,()=>this.showLevelUp(result.newLevel))
    }})
  }

  private positionDialogueBox() {
    // scrollFactor(0): position is direct (no zoom), but children are scaled by camera zoom.
    // So rendered size = local_size × zoom. Position in canvas px needs / zoom.
    const uiW = this.cameras.main.width / this.ZOOM   // 480
    const uiH = this.cameras.main.height / this.ZOOM  // 320
    const boxW = 360, boxH = 88
    const x = (uiW - boxW) / 2              // centered horizontally
    const y = uiH - boxH - 30               // 30 units above bottom
    this.dialogueBox.setPosition(x, y)
  }

  private updateDialogueBox() {
    if (this.dialogueActive) this.positionDialogueBox()
  }

  // ─── Notifications (world coords, scrollFactor(0)) ────────────────────────
  private showXPGain(amount: number) {
    const Z = this.ZOOM
    const t = this.add.text(240*Z,190*Z,`+${amount} XP`,{
      fontFamily:'VT323',fontSize:'22px',color:'#f5c842',stroke:'#000000',strokeThickness:3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200)
    this.tweens.add({targets:t,y:160*Z,alpha:0,duration:1600,ease:'Cubic.Out',onComplete:()=>t.destroy()})
  }

  private showObjectiveComplete(obj: QuestObjective) {
    const Z = this.ZOOM
    const bg = this.add.graphics().setScrollFactor(0).setDepth(200)
    bg.fillStyle(0x0c0806, 0.96).fillRoundedRect(60, 40, 360, 22, 3)
    bg.lineStyle(2, 0xd4961e, 1).strokeRoundedRect(60, 40, 360, 22, 3)
    const t = this.add.text(240*Z, 51*Z, `✓  OBJECTIVE: ${obj.descZh}`, {
      fontFamily:'VT323', fontSize:'14px', color:'#f0c840', align:'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201)
    const all = [bg, t]
    this.tweens.add({targets:all,alpha:{from:0,to:1},duration:200,onComplete:()=>
      this.time.delayedCall(2500,()=>this.tweens.add({targets:all,alpha:0,duration:400,onComplete:()=>all.forEach(o=>o.destroy())}))})
  }

  private showQuestComplete(quest: Quest) {
    const Z = this.ZOOM
    const bg = this.add.graphics().setScrollFactor(0).setDepth(202)
    bg.fillStyle(0x0c0806, 0.97).fillRoundedRect(70, 90, 340, 80, 6)
    bg.lineStyle(3, 0xd4961e, 1).strokeRoundedRect(70, 90, 340, 80, 6)
    bg.lineStyle(1, 0xd4961e, 0.3).strokeRoundedRect(73, 93, 334, 74, 5)
    const title = this.add.text(240*Z, 106*Z, '✦  QUEST COMPLETE!  ✦', {
      fontFamily:'VT323', fontSize:'18px', color:'#f0c840', stroke:'#000000', strokeThickness:2, align:'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(203)
    const name = this.add.text(240*Z, 124*Z, `${quest.titleZh} · ${quest.title}`, {
      fontFamily:'VT323', fontSize:'15px', color:'#fff0d0', align:'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(203)
    const rew = this.add.text(240*Z, 143*Z, `+${quest.xpReward} XP  +${quest.goldReward} Gold  ·  New quest unlocked!`, {
      fontFamily:'VT323', fontSize:'13px', color:'#c8e8a8', align:'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(203)
    const all = [bg, title, name, rew]
    this.tweens.add({targets:all,alpha:{from:0,to:1},scaleX:{from:0.9,to:1},scaleY:{from:0.9,to:1},duration:350,ease:'Back.Out',onComplete:()=>
      this.time.delayedCall(3500,()=>this.tweens.add({targets:all,alpha:0,duration:500,onComplete:()=>all.forEach(o=>o.destroy())}))})
  }

  private showLevelUp(level: number) {
    const Z = this.ZOOM
    const bg = this.add.graphics().setScrollFactor(0).setDepth(204)
    bg.fillStyle(0x0e0a06, 0.97).fillRoundedRect(80, 110, 320, 50, 6)
    bg.lineStyle(3, 0xd4961e, 1).strokeRoundedRect(80, 110, 320, 50, 6)
    bg.lineStyle(1, 0xd4961e, 0.4).strokeRoundedRect(83, 113, 314, 44, 5)
    const t = this.add.text(240*Z, 126*Z, `★  LEVEL UP!  Lv.${level}  ★`, {
      fontFamily:'VT323', fontSize:'20px', color:'#f0c840', stroke:'#000000', strokeThickness:3, align:'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(205)
    const s = this.add.text(240*Z, 146*Z, 'HP +10 · Max HP increased!', {
      fontFamily:'VT323', fontSize:'14px', color:'#fff0d0', align:'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(205)
    const all = [bg, t, s]
    this.tweens.add({targets:all,alpha:{from:0,to:1},scaleX:{from:0.8,to:1},scaleY:{from:0.8,to:1},duration:350,ease:'Back.Out',onComplete:()=>
      this.time.delayedCall(2500,()=>this.tweens.add({targets:all,alpha:0,duration:450,onComplete:()=>all.forEach(o=>o.destroy())}))})
  }
}
