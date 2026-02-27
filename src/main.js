import DuelScene from './DuelScene.js';
import MenuScene from './MenuScene.js';

const config = {
    type: Phaser.WEBGL,
    width: 640,
    height: 360,
    scale: {
      zoom: 2
    },
    scene: [MenuScene, DuelScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 }
        }
    }
};

new Phaser.Game(config);
