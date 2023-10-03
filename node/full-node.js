const Block = require("../chain/block");
const Blockchain = require("../chain/blockchain");
const Node = require("./index");
const SHA256 = require("crypto-js/sha256");
const Merkle = require("../utils/merkle");
class FullNode extends Node {
  constructor({ port, address, peers }) {
    super({ port, address, peers });
  }
  init() {
    this.server.on("connection", (socket) => {
      socket.on("message", (message) => {
        const { type, data } = JSON.parse(message);
        console.log(data);
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
          case "TYPE_BALANCE":
            const [address, publicKey] = data;
            this.openSockets.forEach((node) => {
              if (node.address === address) {
                const balance = Blockchain.getBalance(publicKey);
                node.socket.send(
                  JSON.stringify(Node.producedMessage("TYPE_BALANCE", balance)),
                );
              }
            });
            break;
          case "TYPE_VERIFY_TRANSACTION":
            const { from, to, amount, gas, timestamp, signature } =
              data.transaction;
            const block = Blockchain.getTransactionBlock({
              from,
              to,
              amount,
              gas,
              timestamp,
              signature,
            });

            if (block) {
              const leaves = block.data.map((transaction) =>
                SHA256(JSON.stringify(transaction)),
              );

              const proof = Merkle.getMerkleProof({
                leaves,
                transaction: data.transaction,
              });

              console.log(proof);
              this.openSockets.forEach((node) => {
                if (node.address === data.address) {
                  node.socket.send(
                    JSON.stringify(
                      Node.producedMessage("TYPE_VERIFY_TRANSACTION", {
                        merkleRoot: block.header.merkleRoot,
                        proof,
                        leaves,
                      }),
                    ),
                  );
                }
              });
            }

            break;
          case "TYPE_VERIFY":
            const peer_address = data[0];
            const isValid = Blockchain.isValid();
            this.openSockets.forEach((node) => {
              if (node.address === peer_address) {
                node.socket.send(
                  JSON.stringify(Node.producedMessage("TYPE_VERIFY", isValid)),
                );
              }
            });
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

module.exports = FullNode;
