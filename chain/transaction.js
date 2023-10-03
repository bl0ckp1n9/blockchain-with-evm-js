const SHA256 = require("crypto-js/sha256");
const { MINT_PUBLIC_KEY } = require("../config");
const EC = require("elliptic").ec;

class Transaction {
  constructor({ from, to, amount, gas = 0, timestamp, data = {} }) {
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.signature = "";
    this.gas = gas;
    this.timestamp = timestamp;
    this.data = data;
    if (data.smartContract && to === "") {
      this.data.smartContractAddress = SHA256(
        this.from + this.amount + this.gas + JSON.stringify(data),
      ).toString();
    }
  }

  sign(keyPair) {
    if (keyPair.getPublic("hex") !== this.from) return;
    this.signature = keyPair.sign(
      SHA256(
        this.from +
          this.to +
          this.amount +
          this.gas +
          JSON.stringify(this.data),
      ).toString(),
    );
  }

  static isValid({ transaction, chain }) {
    const ec = new EC("secp256k1");

    return (
      transaction.from &&
      transaction.amount >= 0 &&
      (chain.getBalance(transaction.from) >=
        transaction.amount + transaction.gas ||
        transaction.from === MINT_PUBLIC_KEY) &&
      ec
        .keyFromPublic(transaction.from, "hex")
        .verify(
          SHA256(
            transaction.from +
              transaction.to +
              transaction.amount +
              transaction.gas +
              JSON.stringify(transaction.data),
          ).toString(),
          transaction.signature,
        )
    );
  }
}

module.exports = Transaction;
