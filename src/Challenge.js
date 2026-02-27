export default class Challenge {
  constructor(
    type, // 'host' or 'self' or 'guest'
    timer, // int or undefined
    oponentData, // undefined or ID-string
    scene // Phaser.Scene (DuelScene)
  ) {
    this.type = type;
    this.timer = timer;
    this.oponentData = oponentData;
    this.scene = scene;
    this.clouds = new Array(4);

    this.word;
    this.wordDisplay;
    this.answer;
    this.startingTime;

    this.resultEmitter = new Phaser.Events.EventEmitter();
  }

  async start(challengeWord)
  {
    await this.countDownStart();

    this.word = challengeWord;
    this.wordDisplay = this.type ==='self' ?
      this.scene.add.bitmapText(320, 47, 'black-sans', this.word, null) :
      this.scene.add.bitmapText(350, 25, 'black-sans', this.word, null);
    this.wordDisplay.setOrigin(0.5, 0,5);
    this.wordDisplay.setScale(0.35);
    this.wordDisplay.setDepth(1);
    this.answer = '';

    this.scene.input.keyboard.on('keydown', this.verifyKey, this);

    this.startingTime = new Date().getTime();

    return new Promise(resolve => {
      this.resultEmitter.on('calculated',
        (r) => {
          if (this.type === 'self') {this.wordDisplay.destroy()}

          resolve(r);
        }
      );
    });
  }

  countDownStart()
  {
    if (this.type === 'self') {
      var countdown = this.scene.add.text(260, 50, 'Starts in: ' + 3).setColor('#000000');
      for(let i = 1; i <= 2 ; i++) {
        setTimeout(() => {
          countdown.setText('Starts in: ' + (3-i));
        }, i*1000)
      };

      setTimeout(() => {
        countdown.destroy();
      }, 3000);
    }

    if (this.type === 'host' || this.type === 'guest') {
      this.clouds[0] = this.scene.add.image(320, 180, 'cloud_one');

      setTimeout(() => {
        this.clouds[1] = this.scene.add.image(320, 180, 'cloud_two');
      }, 1000);
      setTimeout(() => {
        this.clouds[2] = this.scene.add.image(320, 180, 'cloud_three');
      }, 2000);
      setTimeout(() => {
        this.clouds[3] = this.scene.add.image(320, 180, 'cloud_word');
      }, 3000);
    }

    return new Promise(resolve => setTimeout(() => resolve(), 3000));
  }

  verifyKey(keyEvent)
  {
    if (keyEvent.key == 'Backspace') {
      this.answer = this.answer.substring(0, this.answer.length - 1);
      this.wordDisplay.setCharacterTint(this.answer.length, 1, true, 0x000000);
      return;
    }

    if(this.answer.length == this.word.length || this.isInvalidKey(keyEvent.which)) {
      return;
    }

    this.answer = this.answer.concat(keyEvent.key);

    if (keyEvent.key == this.word[this.answer.length - 1]) {
      this.wordDisplay.setCharacterTint(this.answer.length - 1, 1, true, 0x08990a);

      this.verifyWin();

    } else {
      this.wordDisplay.setCharacterTint(this.answer.length - 1, 1, true, 0xc93210);
    }
  }

  isInvalidKey(keyCode)
  {
    if (keyCode < 65 || keyCode > 90) {
      return true;
    }
  }

  verifyWin()
  {
    if (this.word === this.answer) {
      
      this.endTime = new Date().getTime();
      const deltaTime = ((this.endTime - this.startingTime)/1000);

      this.resultEmitter.emit('calculated', Math.round(deltaTime * 100) / 100);
    }
  }
}