export default class Connection {

  constructor() {
    this.configuration = {
      'iceServers': [{'urls': 'stun:stun.l.google.com:19302', }, {'urls': 'stun:stun1.l.google.com:19302', }],
      'iceTransportPolicy': 'all'
    }

    this.peerConnection = new RTCPeerConnection(this.configuration);

    this.dataChannel = null;
    this.channelOpen = false;

    // this.channelChange = Phaser.Events.EventEmitter();
  }

  async hostConnection() {
    this.setupDataChannel(true);

    let gatheringCandidates = [];
    this.peerConnection.addEventListener('icecandidate', async event => {
        if (event.candidate) {
          gatheringCandidates.push({'new-ice-candidate': event.candidate})
        }
    });
    
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    let candidates = new Promise(resolve => {
      setTimeout(() => resolve(gatheringCandidates), 3000)
    });
    
    const hostData = new InternalConnectionData(offer, await candidates);
    console.log('hostData: ' + JSON.stringify(hostData));

    return hostData.encode64();
  }

  async guestConnection(hostData) {

    this.setupDataChannel(false);

    let gatheringCandidates = [];
    this.peerConnection.addEventListener('icecandidate', async event => {
        if (event.candidate) {
          gatheringCandidates.push({'new-ice-candidate': event.candidate})
        }
    });

    const connectionData = InternalConnectionData.decode64(hostData);    
    this.peerConnection.setRemoteDescription(connectionData.connectionDescription);
    for(const iceCand of connectionData.iceCandidates) {
      this.peerConnection.addIceCandidate(new RTCIceCandidate(iceCand["new-ice-candidate"]));
    }

    const answer = this.peerConnection.createAnswer();
    this.peerConnection.setLocalDescription(answer);
    console.log('answer: ' + answer);

    let candidates = new Promise(resolve => {
      setTimeout(() => resolve(gatheringCandidates), 3000)
    });

    const guestData = new InternalConnectionData(await answer, await candidates);
    console.log('guestData: ' + JSON.stringify(guestData));

    return guestData.encode64();
  }

  hostHandshake(guestData) {
    const handshakeData = InternalConnectionData.decode64(guestData);
    console.log('handshakeData: ' + JSON.stringify(handshakeData));

    this.peerConnection.setRemoteDescription(handshakeData.connectionDescription);

    for(const iceCand of handshakeData.iceCandidates) {
      this.peerConnection.addIceCandidate(new RTCIceCandidate(iceCand["new-ice-candidate"]));
    }
  }

  async setupDataChannel(isHost) {
    if (isHost){
      this.dataChannel = this.peerConnection.createDataChannel('data-channel');
    } else {
      this.dataChannel = await new Promise(resolve => 
        this.peerConnection.ondatachannel = (createChannelEvent) => {
          console.log("dataChannel event received: " + createChannelEvent);
          resolve(createChannelEvent.channel);
        }
      )
    }
    
    this.dataChannel.addEventListener('open', _ => 
      {
        this.channelOpen = true
        console.log("channel is open.")
      }
    );
    this.dataChannel.addEventListener('close', _ => 
      {
        this.channelOpen = false
        console.log("channel is closed.")
      }
    );
  }

  /**
   * Used to listen to a message trougth the dataChannel
   * TODO make a listenner instead of a single promise
   * 
   * @returns {Promise<String>} - a Promise of the message that only resolves when the dataChannel is open
   */
  listen() {
    return new Promise(async resolve => {

      this.dataChannel.addEventListener('message', (messageEvent) => {
        resolve(messageEvent.data);
      })

    });
  }

  /**
   * Sends message accross P2P connection to the other browser
   * 
   * @param {String} message - String with content to be interpreted in the other side
   */
  send(message) {
    this.dataChannel.send(message);
    console.log("sending message: " + message)
  }

  awaitOpenChannel(isHost)
  {
    return new Promise(resolve => {
      const intervalID = setInterval(() => {
        if (!!!this.dataChannel) {
          return;
        }

        if (!!!this.channelOpen) {
          return;
        }

        clearInterval(intervalID);

        let sendAckID;
        this.dataChannel.addEventListener('message', _ => {
          console.log('ack received');

          if ( ! isHost) {
            console.log('sending ack');
            this.dataChannel.send('ack');
          } else {
            console.log('removing interval of ack');
            clearInterval(sendAckID);
          }

          resolve(true);

        }, { once: true });

        if (isHost) {
          
          sendAckID = setInterval(() => {

            console.log('sending ack');
            this.send("ack");
          
          }, 1000);
          
        }

      }, 300)

    });
  }
}

class InternalConnectionData {
  constructor(
    connectionDescription,
    iceCandidates
  ) {
    this.connectionDescription = connectionDescription;
    this.iceCandidates = iceCandidates;
  }

  encode64() {
    return btoa(JSON.stringify(this));
  }

  static decode64(data)  {
    return JSON.parse(atob(data));
  }
}