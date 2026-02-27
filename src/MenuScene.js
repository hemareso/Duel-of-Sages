export default class MenuScene extends Phaser.Scene {

  constructor() {
    super('Menu');
  }

  preload ()
  {
    this.load.image('sky', './src/assets/sky.png');

    this.load.bitmapFont('red-sans', './src/assets/red-sans/red-sans.png', './src/assets/red-sans/red-sans.xml');
  }
  
  create ()
  {
    // this.add.image(400, 300, 'sky')
    this.add.image(320, 180, 'sky');

    this.add.bitmapText(160, 50, 'red-sans', 'Duel Of Sages', 50);
    const orctimusButton = this.add.text(640, 360, 'Music by Orctimus Prime (Click here for Yt channel)').setColor('#000000').setOrigin(1,1);
    orctimusButton.setInteractive().on('pointerdown', () => window.open('https://www.youtube.com/@orctimusprime9029'));

    const pathParam = new URLSearchParams(window.location.search);

    if (!!pathParam.get('challenge')) {
      this.guestPlay(pathParam.get('challenge'));
    } else {
      this.hostPlay();
    }
  }

  hostPlay() {
    const challengeMode = this.add.text(60, 170, 'Start a duel here!');
    challengeMode.setColor('#000000');
    challengeMode.setInteractive().on('pointerdown', () => this.fadeIntoScene('DuelScene', {challenge: 'host'}));

    const start10sec = this.add.text(60, 220, 'Start the 10 seconds challenge here!');
    start10sec.setColor('#000000');
    start10sec.setInteractive().on('pointerdown', () => this.fadeIntoScene('DuelScene', {challenge: 'self', timer: 10}));
    
    const start15sec = this.add.text(60, 270, 'Start the 15 seconds challenge here!');
    start15sec.setColor('#000000');
    start15sec.setInteractive().on('pointerdown', () => this.fadeIntoScene('DuelScene', {challenge: 'self', timer: 15}));
  }

  guestPlay(challenge) {
    const readyButton = this.add.text(320, 220, 'You have been challenged for your prowess...\nClick here to accept the challenge and meet your rival!');
    readyButton.setColor('#000000');
    readyButton.setOrigin(0.5, 0.5);
    readyButton.setAlign('center');
    readyButton.setInteractive().on('pointerdown', () => this.fadeIntoScene('DuelScene', {challenge: 'guest', oponentData: challenge}));
  }

  fadeIntoScene(sceneName, data) {
    this.cameras.main.fadeOut(2000);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(sceneName, data));
  }
}