const Block = require("../chain/block");
const Blockchain = require("../chain/blockchain");
const Node = require("./index");

class MinerNode extends Node {
  constructor({ port, address, peers }) {
    super({ port, address, peers });
  }
  init() {
    this.server.on("connection", (socket) => {
      socket.on("message", (message) => {
        const { type, data } = JSON.parse(message);

        switch (type) {
          case "TYPE_REPLACE_CHAIN":
            const [newBlock, newDiff] = data;
            if (
              newBlock.header.prevHash !==
                Blockchain.getLastBlock().header.prevHash &&
              Blockchain.getLastBlock().hash === newBlock.header.prevHash &&
              Block.isValid({ block: newBlock, chain: Blockchain })
            ) {
              Blockchain.chain.push(newBlock);
              Blockchain.difficulty = newDiff;
            }
            break;
          case "TYPE_CREATE_TRANSACTION":
            if (!Blockchain.isTransactionDuplicate(data)) {
              Blockchain.addTransaction(data);
            }
            break;
          case "TYPE_HANDSHAKE":
            data.forEach((node) => this.connect(node));
        }
      });
    });

    Node.broadcastTransactions({
      chain: Blockchain,
      socket: this.openSockets,
    });
  }
}

module.exports = MinerNode;
