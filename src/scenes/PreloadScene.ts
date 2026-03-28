import Phaser from 'phaser'

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics
  private progressBox!: Phaser.GameObjects.Graphics
  private loadingText!: Phaser.GameObjects.Text
  private percentText!: Phaser.GameObjects.Text
  _loadComplete = false

  constructor() {
    super({ key: 'PreloadScene' })
  }

  create() {
    console.log('[PreloadScene] create() called!')
    ;(window as any).__preloadCreateCalled = true
    this.scene.start('MainMenuScene')
  }

  preload() {
    this.createLoadingUI()

    // Player sprites (Farm RPG 16x16 pack)
    this.load.spritesheet('player-walk', 'assets/sprites/player-walk.png', {
      frameWidth: 32, frameHeight: 32
    })
    this.load.spritesheet('player-idle', 'assets/sprites/player-idle.png', {
      frameWidth: 32, frameHeight: 32
    })

    // NPC base sprite (Cute Fantasy)
    this.load.spritesheet('npc-base', 'assets/sprites/npc-base.png', {
      frameWidth: 32, frameHeight: 32
    })
    this.load.spritesheet('npc-actions', 'assets/sprites/npc-actions.png', {
      frameWidth: 32, frameHeight: 32
    })

    // Enemies (for battles)
    this.load.spritesheet('skeleton', 'assets/enemies/skeleton.png', {
      frameWidth: 32, frameHeight: 32
    })
    this.load.image('slime', 'assets/enemies/slime.png')

    // Tiles
    this.load.image('grass', 'assets/tiles/grass.png')
    this.load.image('path', 'assets/tiles/path.png')
    this.load.image('water', 'assets/tiles/water.png')
    this.load.image('path-tile', 'assets/tiles/path-tile.png')

    // Objects / environment
    this.load.image('house', 'assets/objects/house.png')
    this.load.image('house-blue', 'assets/objects/house-blue.png')
    this.load.image('interior', 'assets/objects/interior.png')
    this.load.image('spring-crops', 'assets/objects/spring-crops.png')
    this.load.image('maple-tree', 'assets/objects/maple-tree.png')
    this.load.image('oak-tree', 'assets/objects/oak-tree.png')
    this.load.image('oak-tree-small', 'assets/objects/oak-tree-small.png')
    this.load.image('outdoor-decor', 'assets/objects/outdoor-decor.png')
    this.load.image('fence', 'assets/objects/fence.png')
    this.load.image('fences-cf', 'assets/objects/fences-cf.png')
    this.load.image('bridge', 'assets/objects/bridge.png')
    this.load.image('chest', 'assets/objects/chest.png')
    this.load.image('chest-cf', 'assets/objects/chest-cf.png')
    this.load.image('road', 'assets/objects/road.png')

    // Animals
    this.load.spritesheet('chicken-red', 'assets/animals/chicken-red.png', {
      frameWidth: 16, frameHeight: 16
    })
    this.load.spritesheet('chicken-blonde', 'assets/animals/chicken-blonde.png', {
      frameWidth: 16, frameHeight: 16
    })
    this.load.spritesheet('chicken-baby', 'assets/animals/chicken-baby.png', {
      frameWidth: 16, frameHeight: 16
    })
    this.load.image('cow-female', 'assets/animals/cow-female.png')
    this.load.image('cow-male', 'assets/animals/cow-male.png')

    // Progress events
    this.load.on('progress', (value: number) => {
      this.percentText.setText(`${Math.floor(value * 100)}%`)
      this.progressBar.clear()
      this.progressBar.fillStyle(0xf5c842, 1)
      this.progressBar.fillRect(280, 310, 400 * value, 20)
    })

    this.load.on('complete', () => {
      this.loadingText.setText('Ready!')
      this._loadComplete = true
    })
  }

  private createLoadingUI() {
    const cx = 480
    const cy = 320

    // Dark overlay
    this.add.rectangle(cx, cy, 960, 640, 0x0d1117)

    // Title
    this.add.text(cx, cy - 100, '学中文', {
      fontFamily: 'Press Start 2P',
      fontSize: '48px',
      color: '#f5c842',
      stroke: '#7c3a00',
      strokeThickness: 6
    }).setOrigin(0.5)

    this.add.text(cx, cy - 48, 'LangBuddy RPG', {
      fontFamily: 'Press Start 2P',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    // Progress box background
    this.progressBox = this.add.graphics()
    this.progressBox.fillStyle(0x1a2a1a, 1)
    this.progressBox.fillRect(270, 300, 420, 40)
    this.progressBox.lineStyle(2, 0x4a8a3a, 1)
    this.progressBox.strokeRect(270, 300, 420, 40)

    // Progress bar
    this.progressBar = this.add.graphics()

    // Loading text
    this.loadingText = this.add.text(cx, cy + 60, 'Loading...', {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#aaaaaa'
    }).setOrigin(0.5)

    this.percentText = this.add.text(cx, cy + 14, '0%', {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#ffffff'
    }).setOrigin(0.5)

    // Animated dots
    let dots = 0
    this.time.addEvent({
      delay: 400,
      repeat: -1,
      callback: () => {
        dots = (dots + 1) % 4
        if (this.loadingText.text !== 'Ready!') {
          this.loadingText.setText('Loading' + '.'.repeat(dots))
        }
      }
    })
  }
}
