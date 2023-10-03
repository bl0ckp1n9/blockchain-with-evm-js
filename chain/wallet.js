const EC = require("elliptic").ec;

class Wallet {
  constructor(privateKey) {
    const ec = new EC("secp256k1");

    if (privateKey) {
      this.key = ec.keyFromPrivate(privateKey);
      this.privateKey = privateKey;
    } else {
      this.key = ec.genKeyPair();
      this.privateKey = this.key.getPrivate("hex");
    }
    this.publicKey = this.key.getPublic("hex");
  }
}

module.exports = Wallet;
