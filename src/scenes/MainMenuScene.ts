import Phaser from 'phaser'

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' })
  }

  create() {
    const cx = 480
    const cy = 320

    // Background gradient effect
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x1a4a2a, 0x1a4a2a, 0x0d2a10, 0x0d2a10, 1)
    bg.fillRect(0, 0, 960, 640)

    // Decorative pixel border
    const border = this.add.graphics()
    border.lineStyle(4, 0x4aaa4a, 1)
    border.strokeRect(16, 16, 928, 608)
    border.lineStyle(2, 0x2a7a2a, 1)
    border.strokeRect(24, 24, 912, 592)

    // Stars in background
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(30, 930)
      const y = Phaser.Math.Between(30, 610)
      const size = Phaser.Math.Between(1, 3)
      const alpha = Phaser.Math.FloatBetween(0.3, 1.0)
      this.add.rectangle(x, y, size, size, 0xffffff, alpha)
    }

    // Twinkling stars animation
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(50, 910)
      const y = Phaser.Math.Between(50, 590)
      const star = this.add.rectangle(x, y, 2, 2, 0xffff88, 1)
      this.tweens.add({
        targets: star,
        alpha: { from: 1, to: 0.1 },
        duration: Phaser.Math.Between(800, 2000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      })
    }

    // Game logo / title
    const titleBg = this.add.graphics()
    titleBg.fillStyle(0x000000, 0.6)
    titleBg.fillRoundedRect(cx - 300, cy - 180, 600, 100, 8)
    titleBg.lineStyle(3, 0xf5c842, 1)
    titleBg.strokeRoundedRect(cx - 300, cy - 180, 600, 100, 8)

    // Chinese title
    this.add.text(cx, cy - 148, '学中文', {
      fontFamily: 'Press Start 2P',
      fontSize: '40px',
      color: '#f5c842',
      stroke: '#7c3a00',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0).setY(cy - 170)

    const chineseTitle = this.children.list[this.children.list.length - 1] as Phaser.GameObjects.Text
    this.tweens.add({
      targets: chineseTitle,
      alpha: 1,
      y: cy - 148,
      duration: 600,
      ease: 'Back.Out'
    })

    // Subtitle
    const subtitle = this.add.text(cx, cy - 115, 'LangBuddy RPG', {
      fontFamily: 'Press Start 2P',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#1a4a2a',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 500,
      delay: 200
    })

    // Decorative pixel trees on sides
    if (this.textures.exists('oak-tree')) {
      for (let i = 0; i < 3; i++) {
        const tree = this.add.image(80 + i * 60, 480, 'oak-tree').setScale(1.5)
        this.tweens.add({
          targets: tree,
          y: 475,
          duration: 1500 + i * 300,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut'
        })
      }
      for (let i = 0; i < 3; i++) {
        const tree = this.add.image(880 - i * 60, 480, 'oak-tree').setScale(1.5)
        this.tweens.add({
          targets: tree,
          y: 475,
          duration: 1500 + i * 300,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
          delay: 500
        })
      }
    }

    // Main description box
    const descBg = this.add.graphics()
    descBg.fillStyle(0x000000, 0.5)
    descBg.fillRoundedRect(cx - 260, cy - 80, 520, 110, 6)

    this.add.text(cx, cy - 52, 'Explore the Hawker Centre,\nmeet characters & learn Chinese!', {
      fontFamily: 'VT323',
      fontSize: '22px',
      color: '#ccffcc',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5)

    this.add.text(cx, cy + 8, 'Arrow keys / WASD to move  |  Space to interact', {
      fontFamily: 'VT323',
      fontSize: '18px',
      color: '#888888',
      align: 'center'
    }).setOrigin(0.5)

    // Start button
    const btnBg = this.add.graphics()
    btnBg.fillStyle(0x2a7a2a, 1)
    btnBg.fillRoundedRect(cx - 140, cy + 60, 280, 60, 6)
    btnBg.lineStyle(3, 0x4aff4a, 1)
    btnBg.strokeRoundedRect(cx - 140, cy + 60, 280, 60, 6)

    const btnText = this.add.text(cx, cy + 90, '▶  START GAME', {
      fontFamily: 'Press Start 2P',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: btnText,
      alpha: 1,
      duration: 400,
      delay: 600
    })

    // Button pulse animation
    this.tweens.add({
      targets: [btnBg, btnText],
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
      delay: 1000
    })

    // Interactive button zone
    const btnZone = this.add.zone(cx, cy + 90, 280, 60).setInteractive({ useHandCursor: true })
    btnZone.on('pointerdown', () => this.startGame())
    btnZone.on('pointerover', () => { btnBg.clear(); btnBg.fillStyle(0x3a9a3a, 1); btnBg.fillRoundedRect(cx - 140, cy + 60, 280, 60, 6); btnBg.lineStyle(3, 0x88ff88, 1); btnBg.strokeRoundedRect(cx - 140, cy + 60, 280, 60, 6) })
    btnZone.on('pointerout', () => { btnBg.clear(); btnBg.fillStyle(0x2a7a2a, 1); btnBg.fillRoundedRect(cx - 140, cy + 60, 280, 60, 6); btnBg.lineStyle(3, 0x4aff4a, 1); btnBg.strokeRoundedRect(cx - 140, cy + 60, 280, 60, 6) })

    // Keyboard start — delay to avoid swallowing keypress from previous scene
    this.time.delayedCall(400, () => {
      this.input.keyboard?.once('keydown-SPACE', () => this.startGame())
      this.input.keyboard?.once('keydown-ENTER', () => this.startGame())
    })

    // Version / credits
    this.add.text(cx, 615, 'LangBuddy RPG • POC v0.1 • Learn Chinese the fun way', {
      fontFamily: 'VT323',
      fontSize: '16px',
      color: '#446644',
      align: 'center'
    }).setOrigin(0.5)

    // Animated chickens walking on the bottom
    if (this.textures.exists('chicken-red')) {
      this.createMenuChicken(200, 560)
      this.createMenuChicken(750, 550)
    }
  }

  private createMenuChicken(x: number, y: number) {
    // If chicken animations aren't defined yet, define them
    if (!this.anims.exists('chicken-menu-walk')) {
      this.anims.create({
        key: 'chicken-menu-walk',
        frames: this.anims.generateFrameNumbers('chicken-red', { start: 0, end: 1 }),
        frameRate: 4,
        repeat: -1
      })
    }
    const chicken = this.add.sprite(x, y, 'chicken-red').setScale(2)
    chicken.play('chicken-menu-walk')
    this.tweens.add({
      targets: chicken,
      x: x + 80,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Linear'
    })
  }

  private startGame() {
    this.cameras.main.fadeOut(400, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('WorldScene')
    })
  }
}
