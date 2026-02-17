import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"
import Encryption from "./Encryption.js";

export default class Connection {
  constructor() {
    const rtcConfig = {
      'iceServers': [{'urls': 'stun:stun.l.google.com:19302', }, {'urls': 'stun:stun1.l.google.com:19302', }],
      'iceTransportPolicy': 'all'
    }

    const firebaseConfig = {
      apiKey: "AIzaSyChBEI28RPqGyEBAq2g6awnJdPVcscFT_U",
      authDomain: "duel-of-sages.firebaseapp.com",
      projectId: "duel-of-sages",
      storageBucket: "duel-of-sages.firebasestorage.app",
      messagingSenderId: "192662612649",
      appId: "1:192662612649:web:25f92c013e2820328a17b8"
    };

    const firebase = initializeApp(firebaseConfig);

    this.db = getFirestore(firebase);

    this.peerConnection = new RTCPeerConnection(rtcConfig);

    this.encryptionKey = null;
    this.dataChannel = null;
    this.channelOpen = false;
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

    // todo maybe later change to live negotiation
    let candidates = new Promise(resolve => {
      setTimeout(() => resolve(gatheringCandidates), 3000)
    });

    this.encryptionKey = await Encryption.generateKey();
    
    let docRef;
    try {
      docRef = await addDoc(
        collection(this.db, "connection"),
        {
         offer: await Encryption.encrypt(this.encryptionKey, JSON.stringify(offer)),
         hostCandidates: await Encryption.encrypt(this.encryptionKey, JSON.stringify(await candidates))
        }
      );
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }

    const key64 = await Encryption.exportableKey(this.encryptionKey);
    const hostDataToken = docRef.id + '@' + key64;

    this.hostHandshake(docRef.id);

    return hostDataToken;
  }

  hostHandshake(connectionDocumentId) {
    let unsubscribe;
    unsubscribe = onSnapshot(doc(this.db, "connection", connectionDocumentId), async (doc) => {
      if (doc.data().answer == null || doc.data().guestCandidates == null) {
        return;
      }

      const answer = JSON.parse(await Encryption.decrypt(this.encryptionKey, doc.data().answer));
      const guestCandidates = JSON.parse(await Encryption.decrypt(this.encryptionKey, doc.data().guestCandidates));

      // console.log("answer: " + JSON.stringify(answer));
      // console.log("guestCandidates: " + JSON.stringify(guestCandidates));

      this.peerConnection.setRemoteDescription(answer);

      for(const iceCand of guestCandidates) {
        this.peerConnection.addIceCandidate(new RTCIceCandidate(iceCand["new-ice-candidate"]));
      }

      unsubscribe();
    });
  }

  async guestConnection(hostDataToken) {
    const hostArray = hostDataToken.split('@');
    const hostDataId = hostArray[0];
    const key64 = hostArray[1];

    this.encryptionKey = await Encryption.importKey(key64);

    this.setupDataChannel(false);

    let gatheringCandidates = [];
    this.peerConnection.addEventListener('icecandidate', async event => {
        if (event.candidate) {
          gatheringCandidates.push({'new-ice-candidate': event.candidate})
        }
    });

    const docRef = doc(this.db, "connection", hostDataId);
    const document = await getDoc(docRef);
    if (document.exists()) {
      console.log("Got hostDoc: " + document.id);
    } else {
      console.log("Didnt found target document: " + hostDataId);
    }

    const offer = JSON.parse(
      await Encryption.decrypt(this.encryptionKey, document.data().offer)
    );
    const hostCandidates = JSON.parse(
      await Encryption.decrypt(this.encryptionKey, document.data().hostCandidates)
    );

    this.peerConnection.setRemoteDescription(offer);
    for(const iceCand of hostCandidates) {
      this.peerConnection.addIceCandidate(new RTCIceCandidate(iceCand["new-ice-candidate"]));
    }

    const answer = await this.peerConnection.createAnswer();
    this.peerConnection.setLocalDescription(answer);

    let candidates = new Promise(resolve => {
      setTimeout(() => resolve(gatheringCandidates), 3000)
    });

    // console.log("guest Data (answer): " + JSON.stringify(answer));
    // console.log("guest Data (candidates): " + JSON.stringify(await candidates));

    try {
       await updateDoc(docRef,
        {
         answer: await Encryption.encrypt(this.encryptionKey, JSON.stringify(answer)),
         guestCandidates: await Encryption.encrypt(this.encryptionKey, JSON.stringify(await candidates)),
        }
      );
      console.log("Document updated with ID: ", docRef.id);
    } catch (e) {
      console.error("Error updating document: ", e);
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

  awaitOpenChannel(isHost) // todo refactor this method so it doesnt need a boolean flag
  {
    return new Promise(resolve => {
      const intervalID = setInterval(() => {
        console.log("awaiting channel loop")
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