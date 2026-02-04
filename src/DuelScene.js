import Challenge from "./Challenge.js";
import Connection from "./Connection.js";
import Words from "./Words.js";

export default class MainScene extends Phaser.Scene{

  constructor() {
    super('MainScene');
  }

  preload ()
  {
    this.load.image('sky', './src/assets/sky.png');

    this.load.bitmapFont('black-sans', './src/assets/black-sans/black-sans.png', './src/assets/black-sans/black-sans.xml');
  }

  init(data) {
    this.challenge = new Challenge(data.challenge, data.timer, data.oponentData, this);
  }

  create ()
  {
    this.add.image(400, 300, 'sky');

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
    const result = await this.challenge.start();

    if (result <= this.challenge.timer) {
      this.add.text(100, 300, 'You Win! You took ' + result + ' seconds.', { fontSize: '32px', fill: '#f03ee7' });
    } else {
      this.add.text(100, 300, 'You took more then '+ this.challenge.timer +' seconds: \n' + result, { fontSize: '32px', fill: '#f03ee7' });
    }
  }

  async hostChallenge()
  {
    const connection = new Connection();
    const hostDataId = await connection.hostConnection();
    
    const clipboard = this.add.text(400, 300, 'Click here to copy the guest URL: \n'+ document.URL +'?challenge=(...)')
    clipboard.setInteractive().on('pointerdown', () => {
      clipboard.setTint('#f03ee7')
      navigator.clipboard.writeText(document.URL +'?challenge=' + hostDataId)
    })

    connection.hostHandshake();

    console.log("Await connection...")
    await connection.awaitOpenChannel(true);

    clipboard.destroy();

    const word = Words.get();
    connection.send(word);
    
    this.asyncChallenge(connection, word);
  }

  async guestChallenge() {
    const connection = new Connection();
    connection.guestConnection(this.challenge.oponentData);

    const awaitingMessage = this.add.text(400, 300, 'Await connection...')

    console.log("Await connection...")
    await connection.awaitOpenChannel(false);
    awaitingMessage.destroy();

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
      const finalDelta = results[0] - results[1];

      if (finalDelta === 0) {
        this.add.text(100, 300, 'Its a Draw! You both took ' + results[0] + ' seconds.', { fontSize: '32px', fill: '#f03ee7' });
      } else if (finalDelta < 0) {
        this.add.text(100, 300, 'You won! You took ' + results[0] + ' seconds.\nYou were faster by ' + (-finalDelta) + ' seconds.', { fontSize: '32px', fill: '#f03ee7' });
      } else {
        this.add.text(100, 300, 'You lost... You took ' + results[0] + ' seconds.\nYou were slower by ' + finalDelta + ' seconds.', { fontSize: '32px', fill: '#f03ee7' });
      }
    })
  }
}