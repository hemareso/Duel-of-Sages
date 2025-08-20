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
    this.wordDisplay = this.scene.add.bitmapText(100, 150, 'black-sans', this.word, null);
    this.wordDisplay.setScale(0.7);
    this.answer = '';

    this.scene.input.keyboard.on('keydown', this.verifyKey, this);

    this.startingTime = new Date().getTime();

    return new Promise(resolve => {
      this.resultEmitter.on('calculated',
         (r) => resolve(r)
      );
    });
  }

  countDownStart()
  {
    var countdown = this.scene.add.text(400, 300, 'Starts in: ' + 4);
    for(let i = 1; i <= 3 ; i++) {
      setTimeout(() => {
        countdown.setText('Starts in: ' + (4-i))
      }, i*1000)
    }

    return new Promise(resolve => 
      setTimeout(() => {
        countdown.destroy(true);
        resolve(true);
      }, 4000)
    );
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