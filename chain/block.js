const SmartContract = require("../utils/smart-contract");
const SHA256 = require("crypto-js/sha256");
const Transaction = require("./transaction");

class Block {
  constructor({
    timestamp,
    data = [],
    transactionCount,
    difficulty,
    merkleRoot = 0,
  }) {
    this.data = data;
    this.header = {
      nonce: 0,
      prevHash: "",
      merkleRoot,
      timestamp,
      difficulty,
    };
    this.transactionCount = transactionCount;
    this.blockSize = JSON.stringify(this).length;
    this.hash = Block.getHash(this.header);
  }

  mine(difficulty) {
    while (!this.hash.startsWith(Array(difficulty + 1).join("0"))) {
      this.header.nonce++;
      this.hash = Block.getHash(this.header);
    }
  }

  static getHash(blockHeader) {
    return SHA256(
      blockHeader.nonce +
        blockHeader.prevHash +
        blockHeader.merkleRoot +
        blockHeader.timestamp +
        blockHeader.difficulty,
    ).toString();
  }

  static isValid({ block, chain }) {
    const blockValidity = block.data.every((transaction) =>
      Transaction.isValid({
        transaction,
        chain,
      }),
    );

    if (!blockValidity) return false;

    SmartContract.execute(chain, block.data);
    return true;
  }
}

module.exports = Block;
