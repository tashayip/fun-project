import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PreloadScene } from './scenes/PreloadScene'
import { MainMenuScene } from './scenes/MainMenuScene'
import { WorldScene } from './scenes/WorldScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 960,
  height: 640,
  pixelArt: true,
  backgroundColor: '#120c06',
  antialias: false,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.NONE,
    width: 960,
    height: 640
  },
  scene: [BootScene, PreloadScene, MainMenuScene, WorldScene]
}

const game = new Phaser.Game(config);
(window as any).__phaserGame = game;
