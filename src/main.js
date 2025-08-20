import MainScene from './DuelScene.js';
import MenuScene from './MenuScene.js';

const config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    scene: [MenuScene, MainScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 }
        }
    }
};

new Phaser.Game(config);
