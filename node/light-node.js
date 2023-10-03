const Node = require("./index");
const SHA256 = require("crypto-js/sha256");
const Merkle = require("../utils/merkle");
const Blockchain = require("../chain/blockchain");
class LightNode extends Node {
  constructor({ port, address, peers }) {
    super({ port, address, peers });
    this.chain = [];
    this.transaction_history = [];
  }

  init() {
    this.server.on("connection", (socket) => {
      socket.on("message", (message) => {
        const { type, data } = JSON.parse(message);
        console.log(data);
        switch (type) {
          case "TYPE_REPLACE_CHAIN":
            if (
              data[0].header.prevHash === this.getLastBlockHash() &&
              data[0].transactionCount > 1 &&
              data[0].header.timestamp >
                this.chain[this.chain.length - 1].timestamp
            ) {
              this.chain.push(data[0].header);
            }
            break;
          case "TYPE_VERIFY_TRANSACTION":
            const { merkleRoot, proof, leaves } = data;
            const validProof = [
              {
                position: proof[0].position,
                data: Buffer.from(proof[0].data),
              },
            ];
            if (this.isMerkleRootFound(merkleRoot)) {
              const isTransactionIncluded = Merkle.verifyTransaction(
                validProof,
                leaves,
                merkleRoot,
                this.getLastTransaction(),
              );

              console.log("is Transaction Included", isTransactionIncluded);
            } else {
              console.log("Merkle Root not found");
            }
            break;
          case "TYPE_BALANCE":
            console.log("my balance", data);
            break;
          case "TYPE_VERIFY":
            console.log("Blockchain isValid", data);
            break;
        }
      });
    });
  }

  getLastBlockHash() {
    const lastHeader = this.chain[this.chain.length - 1];
    return SHA256(
      lastHeader.nonce +
        lastHeader.prevHash +
        lastHeader.merkleRoot +
        lastHeader.timestamp +
        lastHeader.difficulty,
    ).toString();
  }

  isMerkleRootFound(merkleRoot) {
    let found = false;
    for (const block of this.chain) {
      if (block.merkleRoot === merkleRoot) {
        found = true;
        break;
      }
    }
    return found;
  }

  getLastTransaction() {
    return this.transaction_history[this.transaction_history.length - 1];
  }
}

module.exports = LightNode;
