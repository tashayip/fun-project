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
    this.add.tileSprite(W / 2, H / 2, W, H, 'grass').setDepth(0)
    this.add.tileSprite(W / 2, 340, W, 60, 'path').setDepth(1)
    this.add.tileSprite(W / 2, H / 2, 80, H, 'path').setDepth(1)
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
    const bg = this.add.graphics()
    bg.fillStyle(0x8B5E3C, 1).fillRect(x, y, W, H)
    bg.lineStyle(2, 0x5C3A1E, 1).strokeRect(x, y, W, H)
    bg.setDepth(2)

    const roofColors = [0xc0392b, 0xe67e22, 0x2980b9, 0x8e44ad, 0x27ae60, 0xd35400]
    const roof = this.add.graphics()
    roof.fillStyle(roofColors[index % roofColors.length], 1).fillRect(x-8, y-16, W+16, 22)
    roof.lineStyle(2, 0x2c3e50, 1).strokeRect(x-8, y-16, W+16, 22)
    roof.setDepth(3)
    for (let i = 0; i < 10; i++) {
      const s = this.add.graphics()
      s.fillStyle(0xffffff, 0.25).fillRect(x-8+i*18, y-16, 9, 22).setDepth(4)
    }

    const counter = this.add.graphics()
    counter.fillStyle(0xd4a96a, 1).fillRect(x+8, y+50, W-16, 24)
    counter.lineStyle(2, 0x8B5E3C, 1).strokeRect(x+8, y+50, W-16, 24)
    counter.setDepth(3)

    this.add.text(x+W/2, y+20, label, {
      fontFamily: 'Press Start 2P', fontSize: '10px', color: '#ffffff', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(5)

    if (this.textures.exists('spring-crops')) {
      const f1 = this.add.image(x+W/2-30, y+30, 'spring-crops').setScale(0.5).setDepth(4)
      const f2 = this.add.image(x+W/2+10, y+32, 'spring-crops').setScale(0.5).setDepth(4)
      f1.setCrop(0,0,32,16); f2.setCrop(32,0,32,16)
    }

    const wall = this.add.rectangle(x+W/2, y+H/2, W, H, 0, 0)
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
      g.fillStyle(0xc19a6b,1).fillRect(x-16,y-10,32,22)
      g.lineStyle(2,0x8B5E3C,1).strokeRect(x-16,y-10,32,22)
      g.fillStyle(0x8B5E3C,1).fillRect(x-14,y+12,4,6).fillRect(x+10,y+12,4,6)
      g.setDepth(5)
      ;[{dx:-24,dy:0},{dx:24,dy:0},{dx:0,dy:-20},{dx:0,dy:20}].forEach(({dx,dy}) => {
        const c = this.add.graphics()
        c.fillStyle(0x7a5230,1).fillRect(x+dx-7,y+dy-7,14,14)
        c.lineStyle(1,0x4a3010,1).strokeRect(x+dx-7,y+dy-7,14,14).setDepth(4)
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

      const labelBg = this.add.graphics()
      labelBg.fillStyle(0x000000,0.7).fillRoundedRect(-52,-30,104,20,3)
      const labelText = this.add.text(0,-21,`${cfg.nameZh} · ${cfg.name}`,{fontFamily:'VT323',fontSize:'12px',color:'#ffff88',align:'center'}).setOrigin(0.5)
      const hint = this.add.text(0,-8,'[ E / Space ]',{fontFamily:'VT323',fontSize:'10px',color:'#aaffaa',align:'center'}).setOrigin(0.5).setAlpha(0)
      const roleBg = this.add.graphics()
      roleBg.fillStyle(cfg.portraitColor,0.85).fillRoundedRect(-28,-46,56,14,2)
      const roleText = this.add.text(0,-39,cfg.role,{fontFamily:'VT323',fontSize:'10px',color:'#ffffff',align:'center'}).setOrigin(0.5)

      const container = this.add.container(cfg.x,cfg.y-20,[roleBg,roleText,labelBg,labelText,hint])
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
  // Box: 420w × 86h world → 840×172 canvas px, portrait 54w
  private createDialogueBox() {
    // Canvas target: x=40→920 (880px wide), y=362→538 (176px tall)
    // World: x=20, y=181, w=440, h=88
    // Hotbar barBg top is canvas 566 — gap = 566-538 = 28px. Clear.
    const boxW = 440, boxH = 88, portW = 50

    const bg = this.add.graphics()
    bg.fillStyle(0x050f0a,0.96).fillRoundedRect(0,0,boxW,boxH,5)
    bg.lineStyle(2,0x44dd44,1).strokeRoundedRect(0,0,boxW,boxH,5)
    bg.lineStyle(1,0x4aff4a,0.25).strokeRoundedRect(2,2,boxW-4,boxH-4,4)

    this.dialoguePortraitBg = this.add.graphics()

    this.dialoguePortraitChar = this.add.text(portW/2,boxH/2,'',{
      fontFamily:'VT323',fontSize:'18px',color:'#ffffff',stroke:'#000000',strokeThickness:2
    }).setOrigin(0.5)

    const sep = this.add.graphics()
    sep.lineStyle(1,0x1a4a1a,1)
    sep.beginPath().moveTo(portW+4,5).lineTo(portW+4,boxH-5).strokePath()

    // Name tab above box
    const nameBg = this.add.graphics()
    nameBg.fillStyle(0x0a2a0a,1).fillRoundedRect(portW+6,-14,170,18,3)
    nameBg.lineStyle(1.5,0x44dd44,1).strokeRoundedRect(portW+6,-14,170,18,3)

    const nameText = this.add.text(portW+10,-11,'',{fontFamily:'VT323',fontSize:'14px',color:'#88ff88'})
    const roleText = this.add.text(portW+180,-11,'',{fontFamily:'VT323',fontSize:'11px',color:'#888888'})

    const bodyText = this.add.text(portW+8,7,'',{
      fontFamily:'VT323, serif',fontSize:'15px',color:'#e8f8e8',
      wordWrap:{width:boxW-portW-16},lineSpacing:3
    })

    const hint = this.add.text(boxW-6,boxH-5,'Space / E',{fontFamily:'VT323',fontSize:'9px',color:'#336633'}).setOrigin(1,1)
    const cursor = this.add.text(boxW-6,boxH-16,'▼',{fontFamily:'VT323',fontSize:'11px',color:'#4aff4a'}).setOrigin(1,1)
    this.tweens.add({targets:cursor,alpha:0,duration:400,yoyo:true,repeat:-1})

    this.dialogueBox = this.add.container(0,0,[bg,this.dialoguePortraitBg,this.dialoguePortraitChar,sep,nameBg,nameText,roleText,bodyText,hint,cursor])
    this.dialogueBox.setDepth(100).setScrollFactor(0).setVisible(false)
    this.dialogueBox.setData('nameText',nameText).setData('roleText',roleText).setData('bodyText',bodyText)
  }

  // ─── Status Panel ─────────────────────────────────────────────────────────
  // Container at world (6,6) → canvas (12,12). Size: 130w×50h → 260×100 canvas px
  private createStatusPanel() {
    const W=130, H=50

    const panelBg = this.add.graphics()
    panelBg.fillStyle(0x0d1a0d,0.93).fillRoundedRect(0,0,W,H,4)
    panelBg.lineStyle(2,0xf5c842,1).strokeRoundedRect(0,0,W,H,4)

    // Level badge circle
    const lvlBg = this.add.graphics()
    lvlBg.fillStyle(0xf5c842,1).fillCircle(17,25,13)
    const lvlCaption = this.add.text(17,13,'LV',{fontFamily:'VT323',fontSize:'8px',color:'#5a2a00'}).setOrigin(0.5,0)
    this.levelBadgeText = this.add.text(17,26,'1',{fontFamily:'VT323',fontSize:'16px',color:'#1a0600'}).setOrigin(0.5,0.5)

    // HP row — bar sits at local (50,8) size (74,11) → canvas 148×22
    const hpLabel = this.add.text(35,7,'HP',{fontFamily:'VT323',fontSize:'13px',color:'#ff8888'})
    const hpBg = this.add.graphics()
    hpBg.fillStyle(0x3a0f0f,1).fillRoundedRect(50,8,74,11,2)
    this.hpBarFill = this.add.graphics()
    this.hpValueText = this.add.text(126,8,'',{fontFamily:'VT323',fontSize:'11px',color:'#ffcccc'}).setOrigin(1,0)

    // XP row
    const xpLabel = this.add.text(35,22,'XP',{fontFamily:'VT323',fontSize:'13px',color:'#f5c842'})
    const xpBg = this.add.graphics()
    xpBg.fillStyle(0x2a2000,1).fillRoundedRect(50,23,74,11,2)
    this.xpBarFill = this.add.graphics()
    this.xpValueText = this.add.text(126,23,'',{fontFamily:'VT323',fontSize:'11px',color:'#ffe088'}).setOrigin(1,0)

    // Gold
    this.goldText = this.add.text(35,37,'',{fontFamily:'VT323',fontSize:'13px',color:'#f5c842'})

    const panel = this.add.container(246,166,[panelBg,lvlBg,lvlCaption,this.levelBadgeText,hpLabel,hpBg,this.hpBarFill,this.hpValueText,xpLabel,xpBg,this.xpBarFill,this.xpValueText,this.goldText])
    panel.setScrollFactor(0).setDepth(100)
    this.redrawStatusBars()
  }

  private redrawStatusBars() {
    const gs = gameState
    this.hpBarFill.clear()
    const hp = gs.hp/gs.maxHp
    if (hp>0){
      const col = hp>0.5?0x44cc44:hp>0.25?0xf5c842:0xff4444
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
  // Container at world (360,6) → canvas (720,12). Panel 114w×72h → 228×144 canvas px
  private createQuestTracker() {
    const PW=114, PH=72

    const bg = this.add.graphics()
    bg.fillStyle(0x0d1a0d,0.93).fillRoundedRect(0,0,PW,PH,4)
    bg.lineStyle(2,0x44dd44,1).strokeRoundedRect(0,0,PW,PH,4)

    const header = this.add.text(PW/2,5,'QUEST',{fontFamily:'VT323',fontSize:'13px',color:'#44ff44',align:'center'}).setOrigin(0.5,0)
    this.questTitleEn = this.add.text(PW/2,18,'',{fontFamily:'VT323',fontSize:'14px',color:'#ffffff',align:'center',wordWrap:{width:PW-8}}).setOrigin(0.5,0)
    this.questTitleZh = this.add.text(PW/2,30,'',{fontFamily:'VT323',fontSize:'13px',color:'#f5c842',align:'center'}).setOrigin(0.5,0)

    const divider = this.add.graphics()
    divider.lineStyle(1,0x224422,1).beginPath().moveTo(6,43).lineTo(PW-6,43).strokePath()

    this.questObjTexts = []
    for (let i=0;i<4;i++){
      const t = this.add.text(6,47+i*6,'',{fontFamily:'VT323',fontSize:'10px',color:'#cccccc',wordWrap:{width:PW-12}})
      this.questObjTexts.push(t)
    }

    this.questContainer = this.add.container(600,166,[bg,header,this.questTitleEn,this.questTitleZh,divider,...this.questObjTexts])
    this.questContainer.setScrollFactor(0).setDepth(100)
    this.updateQuestTracker()
  }

  private updateQuestTracker() {
    const quest = gameState.getActiveQuest()
    if (!quest){this.questContainer.setVisible(false);return}
    this.questContainer.setVisible(true)
    this.questTitleEn.setText(quest.title)
    this.questTitleZh.setText(quest.titleZh)
    quest.objectives.forEach((obj,i)=>{
      if (i>=this.questObjTexts.length) return
      this.questObjTexts[i].setText(`${obj.complete?'✓':'○'} ${obj.description}`)
      this.questObjTexts[i].setColor(obj.complete?'#44ff44':'#aaaaaa')
    })
    for (let i=quest.objectives.length;i<this.questObjTexts.length;i++) this.questObjTexts[i].setText('')
  }

  // ─── Bottom Hotbar ────────────────────────────────────────────────────────
  // 6 slots × 24w world → 48px canvas each; container centered at y=293 world → y=586 canvas
  private createBottomHotbar() {
    const slotW=24, gap=3, slots=6
    const totalW = slots*slotW+(slots-1)*gap  // 159 world → 318 canvas

    const barBg = this.add.graphics()
    barBg.fillStyle(0x0d1a0d,0.90).fillRoundedRect(-6,-5,totalW+12,slotW+10,4)
    barBg.lineStyle(1.5,0x224422,1).strokeRoundedRect(-6,-5,totalW+12,slotW+10,4)

    const children: Phaser.GameObjects.GameObject[] = [barBg]
    for (let i=0;i<slots;i++){
      const sx=i*(slotW+gap)
      const s = this.add.graphics()
      s.fillStyle(0x0a1a0a,1).fillRoundedRect(sx,0,slotW,slotW,2)
      s.lineStyle(1,0x2a5a2a,1).strokeRoundedRect(sx,0,slotW,slotW,2)
      children.push(s)
      children.push(this.add.text(sx+slotW-2,slotW-2,`${i+1}`,{fontFamily:'VT323',fontSize:'8px',color:'#2a5a2a'}).setOrigin(1,1))
    }
    // y=288 world → canvas 576. barBg local offset -5 → canvas top 566. barBg height 34w → 68c → bottom 634. Within 640 canvas.
    const hotbar = this.add.container((480-totalW)/2 + 240, 448, children)
    hotbar.setScrollFactor(0).setDepth(100)

    const hint = this.add.text(480,441,'WASD / Arrows  ·  E or Space to talk',{fontFamily:'VT323',fontSize:'10px',color:'#446644',align:'center'}).setOrigin(0.5,1).setScrollFactor(0).setDepth(99)
    this.tweens.add({targets:hint,alpha:0,duration:1200,delay:5000})
  }

  // ─── Ambient Effects ──────────────────────────────────────────────────────
  private createAmbientEffects() {
    this.add.graphics().fillStyle(0xffcc66,0.03).fillRect(0,0,this.MAP_W,this.MAP_H).setDepth(1)

    const eBg = this.add.graphics()
    eBg.fillStyle(0xc0392b,1).fillRect(370,30,220,28)
    eBg.lineStyle(3,0xf5c842,1).strokeRect(370,30,220,28).setDepth(8)
    this.add.text(480,44,'小贩中心  HAWKER CENTRE',{fontFamily:'Press Start 2P',fontSize:'7px',color:'#ffffff',stroke:'#000000',strokeThickness:2}).setOrigin(0.5).setDepth(9)

    const xBg = this.add.graphics()
    xBg.fillStyle(0x8B4513,1).fillRect(496,680,8,40).fillStyle(0xf5c842,1).fillRect(470,660,60,24)
    xBg.lineStyle(2,0x8B4513,1).strokeRect(470,660,60,24).setDepth(8)
    this.add.text(500,672,'出口',{fontFamily:'Press Start 2P',fontSize:'7px',color:'#000000'}).setOrigin(0.5).setDepth(9)
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
    // Canvas target: x=40 (40px left margin), y=362 (box ends at 538, hotbar barBg starts at 566 → 28px gap)
    // World: x=20, y=181   (world = canvas / zoom2)
    this.dialogueBox.setPosition(260, 341)
  }

  private updateDialogueBox() {
    if (this.dialogueActive) this.positionDialogueBox()
  }

  // ─── Notifications (world coords, scrollFactor(0)) ────────────────────────
  private showXPGain(amount: number) {
    // Large gold "+N XP" floats up from center-screen
    const t = this.add.text(480,350,`+${amount} XP`,{
      fontFamily:'VT323',fontSize:'22px',color:'#f5c842',stroke:'#000000',strokeThickness:3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200)
    this.tweens.add({targets:t,y:320,alpha:0,duration:1600,ease:'Cubic.Out',onComplete:()=>t.destroy()})
  }

  private showObjectiveComplete(obj: QuestObjective) {
    // Green banner at top-center: canvas (120,80) size (720,44) → world (60,40) size (360,22)
    const bg=this.add.graphics().setScrollFactor(0).setDepth(200)
    bg.fillStyle(0x031a03,0.95).fillRoundedRect(300,200,360,22,3)
    bg.lineStyle(2,0x44ff44,1).strokeRoundedRect(300,200,360,22,3)
    const t=this.add.text(480,211,`✓  OBJECTIVE: ${obj.descZh}`,{
      fontFamily:'VT323',fontSize:'14px',color:'#44ff44',align:'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201)
    const all=[bg,t]
    this.tweens.add({targets:all,alpha:{from:0,to:1},duration:200,onComplete:()=>
      this.time.delayedCall(2500,()=>this.tweens.add({targets:all,alpha:0,duration:400,onComplete:()=>all.forEach(o=>o.destroy())}))})
  }

  private showQuestComplete(quest: Quest) {
    // Modal: canvas (140,180) size (680,160) → world (70,90) size (340,80)
    const bg=this.add.graphics().setScrollFactor(0).setDepth(202)
    bg.fillStyle(0x031a03,0.97).fillRoundedRect(310,250,340,80,6)
    bg.lineStyle(3,0xf5c842,1).strokeRoundedRect(310,250,340,80,6)
    bg.lineStyle(1,0xf5c842,0.3).strokeRoundedRect(313,253,334,74,5)
    const title=this.add.text(480,266,'✦  QUEST COMPLETE!  ✦',{
      fontFamily:'VT323',fontSize:'18px',color:'#f5c842',stroke:'#000000',strokeThickness:2,align:'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(203)
    const name=this.add.text(480,284,`${quest.titleZh} · ${quest.title}`,{
      fontFamily:'VT323',fontSize:'15px',color:'#ffffff',align:'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(203)
    const rew=this.add.text(480,303,`+${quest.xpReward} XP  +${quest.goldReward} Gold  ·  New quest unlocked!`,{
      fontFamily:'VT323',fontSize:'13px',color:'#aaffaa',align:'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(203)
    const all=[bg,title,name,rew]
    this.tweens.add({targets:all,alpha:{from:0,to:1},scaleX:{from:0.9,to:1},scaleY:{from:0.9,to:1},duration:350,ease:'Back.Out',onComplete:()=>
      this.time.delayedCall(3500,()=>this.tweens.add({targets:all,alpha:0,duration:500,onComplete:()=>all.forEach(o=>o.destroy())}))})
  }

  private showLevelUp(level: number) {
    // Exciting popup: canvas (160,220) size (640,100) → world (80,110) size (320,50)
    const bg=this.add.graphics().setScrollFactor(0).setDepth(204)
    bg.fillStyle(0x1a1000,0.97).fillRoundedRect(320,270,320,50,6)
    bg.lineStyle(3,0xf5c842,1).strokeRoundedRect(320,270,320,50,6)
    bg.lineStyle(1,0xf5c842,0.4).strokeRoundedRect(323,273,314,44,5)
    const t=this.add.text(480,286,`★  LEVEL UP!  Lv.${level}  ★`,{
      fontFamily:'VT323',fontSize:'20px',color:'#f5c842',stroke:'#000000',strokeThickness:3,align:'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(205)
    const s=this.add.text(480,306,'HP +10 · Max HP increased!',{
      fontFamily:'VT323',fontSize:'14px',color:'#ffffff',align:'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(205)
    const all=[bg,t,s]
    this.tweens.add({targets:all,alpha:{from:0,to:1},scaleX:{from:0.8,to:1},scaleY:{from:0.8,to:1},duration:350,ease:'Back.Out',onComplete:()=>
      this.time.delayedCall(2500,()=>this.tweens.add({targets:all,alpha:0,duration:450,onComplete:()=>all.forEach(o=>o.destroy())}))})
  }
}
