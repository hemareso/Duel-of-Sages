import Challenge from "./Challenge.js";
import Connection from "./Connection.js";
import Words from "./Words.js";

export default class DuelScene extends Phaser.Scene{

  constructor() {
    super('DuelScene');
  }

  preload ()
  {
    this.load.image('background', './src/assets/duel_of_sages_bacground.png');
    this.load.image('cloud_one', './src/assets/clouds/cloud_one.png');
    this.load.image('cloud_two', './src/assets/clouds/cloud_two.png');
    this.load.image('cloud_three', './src/assets/clouds/cloud_three.png');
    this.load.image('cloud_word', './src/assets/clouds/cloud_word.png');
    this.load.image('back_text_ballon', './src/assets/text-ballons/back_text_ballon.png');
    this.load.image('front_text_ballon', './src/assets/text-ballons/front_text_ballon.png');

    this.load.bitmapFont('black-sans', './src/assets/black-sans/black-sans.png', './src/assets/black-sans/black-sans.xml');

    this.load.spritesheet(
      'text-box',
      './src/assets/text-box/Rectangle_text_box_330:60_animation-sheet.png',
      {frameWidth: 330, frameHeight: 60}
    );

    this.load.spritesheet(
      'button',
      './src/assets/big-button/Button_150:60.png',
      {frameWidth: 150, frameHeight: 60}
    );

    this.load.aseprite(
      'wizard-back',
      './src/assets/wizards/back_wizard.png',
      './src/assets/wizards/back_wizard.json',
    );

    this.load.aseprite(
      'wizard-front',
      './src/assets/wizards/front_wizard.png',
      './src/assets/wizards/front_wizard.json',
    );

    this.load.audio('awaiting', './src/assets/audio/Orctimus_Prime_Drifting_Clouds_and_Rolling_Fields.mp3');
    this.load.audio('duel', './src/assets/audio/Orctimus_Prime_Bounty Hunter_Blues.mp3');
    this.load.audio('thunder', './src/assets/audio/Thunder.mp3');
  }

  init(data) {
    this.challenge = new Challenge(data.challenge, data.timer, data.oponentData, this);
  }

  loadAnimations() {
    this.anims.create({
      key: 'text-box-in',
      frames: this.anims.generateFrameNumbers('text-box', {frames: [1,2,3]}),
      frameRate: 16,
      repeat: 0
    });
    this.anims.create({
      key: 'text-box-out',
      frames: this.anims.generateFrameNumbers('text-box', {frames: [2,1,0]}),
      frameRate: 16,
      repeat: 0
    });

    this.anims.create({
      key: 'button-in',
      frames: this.anims.generateFrameNumbers('button', {frames: [2,3,4]}),
      frameRate: 16,
      repeat: 0
    });
    this.anims.create({
      key: 'button-out',
      frames: this.anims.generateFrameNumbers('button', {frames: [3,2,1]}),
      frameRate: 12,
      repeat: 0
    });
    this.anims.create({
      key: 'button-pressed',
      frames: this.anims.generateFrameNumbers('button', {frames: [0]}),
      frameRate: 12,
      repeat: 0
    });
    this.anims.create({
      key: 'button-unpressed',
      frames: this.anims.generateFrameNumbers('button', {frames: [4]}),
      frameRate: 12,
      repeat: 0
    });

    this.anims.createFromAseprite('wizard-back');
    this.anims.createFromAseprite('wizard-front');
  }

  create ()
  {
    // this.sound.pauseOnBlur = false;

    this.cameras.main.fadeIn(3000);
    this.add.image(320, 180, 'background');

    this.loadAnimations();

    this.playerWizard = this.add.sprite(320, 180, 'wizard-back');
    this.playerWizard.play({key: 'back-walk-in', repeat: 0});

    console.log("challenge type: " + this.challenge.type);

    switch (this.challenge.type) {
      case 'self': this.selfChallenge();
        break
      case 'host': this.hostChallenge();
        break
      case 'guest': this.guestChallenge();
        break
      default: console.log('Wrong challenge.type : ' + this.challenge.type)
    }
  }

  async selfChallenge()
  {
    this.sound.play('awaiting', {volume: 0.3, loop: true});

    await new Promise(resolve => setTimeout(() => resolve(), 4000));
    this.textBox = this.add.sprite(320, 60, 'text-box');
    this.textBox.play('text-box-in', true);
    await new Promise(resolve => setTimeout(() => resolve(), 200));

    const result = await this.challenge.start(Words.get());

    this.textBox.play('text-box-out', true);

    if (result <= this.challenge.timer) {
      this.add.text(320, 175, '  You Win!\nIt took you:\n' + result + ' seconds', { fontSize: '32px', fill: '#000000' })
        .setOrigin(0.5, 0.5)
        .setScale(0.65);
    } else {
      this.add.text(320, 175, 'You were late by :\n'+ (result - this.challenge.timer) +' seconds', { fontSize: '32px', fill: '#000000' })
        .setOrigin(0.5, 0.5)
        .setScale(0.65);
    }
  }

  async hostChallenge()
  {
    this.sound.play('awaiting', {volume: 0.3, loop: true});

    const connection = new Connection();
    const hostDataId = await connection.hostConnection();
    
    const linkButton = this.add.sprite(515, 115, 'button');
    linkButton.play('button-in', true);
    await new Promise(resolve => setTimeout(() => resolve(), 200));

    const buttonText = this.add.text(515, 115, ' Copy invite\nto Clipboard🧙');
    buttonText.setOrigin(0.5, 0.5);
    buttonText.setColor('#000000');

    linkButton.setInteractive();
    linkButton.on('pointerdown', () => {
      linkButton.play('button-pressed', true);
      navigator.clipboard.writeText(document.URL +'?challenge=' + hostDataId);
    });

    linkButton.on('pointerup', () => linkButton.play('button-unpressed', true));
    linkButton.on('pointerout', () => linkButton.play('button-unpressed', true));

    console.log("Await connection...");
    await connection.awaitOpenChannel(true);

    this.sound.stopByKey('awaiting');
    this.sound.play('duel', {volume: 0.2});

    this.oponentWizard = this.add.sprite(320, 180, 'wizard-front');
    this.oponentWizard.play({key: 'front-walk-in', repeat: 0});

    buttonText.destroy();
    linkButton.play('button-out', true);
    setTimeout(() => linkButton.destroy(), 500);

    this.textBox = this.add.sprite(320, 60, 'text-box');
    this.textBox.play('text-box-in', true);
    let textInBox;
    setTimeout(() => textInBox =this.add.text(320, 60, 'Your oponent is here! Get Ready!')
      .setOrigin(0.5, 0.5)
      .setColor('#000000'), 200);

    const word = Words.get();
    connection.send(word);
    
    await new Promise(resolve => setTimeout(() => {
      this.textBox.play('text-box-out', true);
      textInBox.destroy();
      resolve()
    }, 5000));

    this.asyncChallenge(connection, word);
  }

  async guestChallenge() {
    this.sound.play('duel', {volume: 0.2});

    const connection = new Connection();
    connection.guestConnection(this.challenge.oponentData);

    this.oponentWizard = this.add.sprite(320, 180, 'wizard-front');
    this.oponentWizard.play({key: 'standing', repeat: 0});

    await new Promise(resolve => setTimeout(() => resolve(), 3000));

    console.log("Await connection...");
    await connection.awaitOpenChannel(false);

    const word = connection.listen();

    this.asyncChallenge(connection, await word);
  }

  async asyncChallenge(connection, word)
  {
    const oponetResult = connection.listen();
    const result = this.challenge.start(word);

    result.then((res) => {
      connection.send(res);
    });

    Promise.all([result, oponetResult]).then(results => {
      this.duelOver(results[0], results[1]);
    })
  }

  async duelOver(playerTime, oponentTime)
  {
    if (playerTime === oponentTime) {
      this.drawScreen(playerTime);
      return;
    }

    const playerWon = playerTime < oponentTime;

    const textBallonType = playerWon ? 'back_text_ballon' : 'front_text_ballon';
    const textBallon = this.add.image(320, 180, textBallonType);
    textBallon.setDepth(0)

    for (const c of this.challenge.clouds) {
      c.destroy();
    }
    this.cameras.main.shake(200, 0.01);
    await new Promise(resolve => setTimeout(() => resolve(), 2000));

    textBallon.destroy();
    this.challenge.wordDisplay.destroy();
    await new Promise(resolve => setTimeout(() => resolve(), 1000));

    this.sound.play('thunder', {volume: 0.5});
    await new Promise(resolve => setTimeout(() => resolve(), 500));

    if (playerWon) {
      this.oponentWizard.play({key: 'front-lightning-strike', repeat: 0});
    } else {
      this.playerWizard.play({key: 'back-lightning-strike', repeat: 0});
    }

    await new Promise(resolve => setTimeout(() => resolve(), 3000));

    const leaderboard = this.add.sprite(320, 80, 'button').setScale(2);
    leaderboard.play('button-in', true);
    await new Promise(resolve => setTimeout(() => resolve(), 200));

    // express time results
    const resultsString =
     (playerWon ? "You Won!\n" : "You Lost!\n") +
     "Your time:" + Math.round(playerTime * 100)/100 + " seconds\n" + 
     "Oponent's time:" + Math.round(oponentTime * 100)/100 + " seconds";
    const resultText = this.add.text(320, 80, resultsString);
    resultText.setAlign('center')
    resultText.setOrigin(0.5, 0.5);
    resultText.setColor('#000000');
  }

  async drawScreen(time)
  {
    const leaderboard = this.add.sprite(320, 80, 'button').setScale(2);
    leaderboard.play('button-in', true);
    await new Promise(resolve => setTimeout(() => resolve(), 200));

    // express time results
    const resultText = this.add.text(320, 80, "Somehow...\nIts a draw!\nYou are evenly matched!\nBy " + time + " seconds");
    resultText.setAlign('center')
    resultText.setOrigin(0.5, 0.5);
    resultText.setColor('#000000');
  }
}