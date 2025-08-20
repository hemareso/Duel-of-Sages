export default class MenuScene extends Phaser.Scene {

  constructor() {
    super('Menu');
  }

  preload ()
  {
    this.load.image('sky', './src/assets/sky.png');

    this.load.bitmapFont('green-sans', './src/assets/green-sans/green-sans.png', './src/assets/green-sans/green-sans.xml');
  }
  
  create ()
  {
    this.add.image(400, 300, 'sky')

    this.add.bitmapText(60, 50,  'green-sans', 'Duel Of Sages', 100);

    const pathParam = new URLSearchParams(window.location.search);

    if (!!pathParam.get('challenge')) {
      this.guestPlay(pathParam.get('challenge'));
    } else {
      this.hostPlay();
    }
  }

  hostPlay() {
    const challengeMode = this.add.text(100, 300, 'Start a challenge here!');
    challengeMode.setInteractive().on('pointerdown', () => this.scene.start('MainScene', {challenge: 'host'}));

    const start10sec = this.add.text(100, 350, 'Start the 10 seconds clock here!');
    start10sec.setInteractive().on('pointerdown', () => this.scene.start('MainScene', {challenge: 'self', timer: 10}));
    
    const start15sec = this.add.text(100, 400, 'Start the 15 seconds clock here!');
    start15sec.setInteractive().on('pointerdown', () => this.scene.start('MainScene', {challenge: 'self', timer: 15}));
  }

  guestPlay(challenge) {
    const readyButton = this.add.text(100, 400, 'Click here if you are ready!');
    readyButton.setInteractive().on('pointerdown', () => this.scene.start('MainScene', {challenge: 'guest', oponentData: challenge}));
  }
}