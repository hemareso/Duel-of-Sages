export default class Encryption {
   static async generateKey() {
    return crypto.subtle.generateKey({ name:'AES-GCM', length:128 }, true, ['encrypt', 'decrypt']);
  }

  static async exportableKey(key) {
    const byteKey = new Uint8Array(await crypto.subtle.exportKey("raw", key));
    return this.arrayBufferToBase64(byteKey);
  }

  static async importKey(key) {
    const byteKey = this.base64ToArraBuffer(key);
    return crypto.subtle.importKey("raw", byteKey, {name: 'AES-GCM'}, true, ['encrypt', 'decrypt']);
  }

  static async encrypt(key, original) {
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const originalAsBytes = new TextEncoder().encode(original);

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: nonce
      },
      key,
      originalAsBytes
    );

    return this.arrayBufferToBase64(new Uint8Array(encryptedData)) + '&' + this.arrayBufferToBase64(new Uint8Array(nonce));
  }

  static async decrypt(key, data64) {
    const data64Array = data64.split('&');
    const encryptedData = this.base64ToArraBuffer(data64Array[0]);
    const nonce = this.base64ToArraBuffer(data64Array[1]);

    const originalAsBytes = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: nonce
      },
      key,
      encryptedData
    );

    return new TextDecoder().decode(originalAsBytes);
  }

  static arrayBufferToBase64(arrayBuffer) {
    return btoa(String.fromCharCode(...arrayBuffer)).replace(/\//g, '_').replace(/\+/g, '-');
  }

  static base64ToArraBuffer(b64) {
    const stringBytes = atob(b64.replace(/_/g, '/').replace(/-/g, '+'));

    let byteKey = new Uint8Array(stringBytes.length);
    for (let i = 0; i < stringBytes.length; i++) {
      byteKey[i] = stringBytes.charCodeAt(i);
    }

    return byteKey;
  }
}