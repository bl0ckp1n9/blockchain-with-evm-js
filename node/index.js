const WebSocket = require("ws");

class Node {
  constructor({ port, address, peers = [] }) {
    this.server = new WebSocket.WebSocketServer({ port });
    this.openSockets = [];
    this.connectedSockets = [];
    this.address = `ws://${address}:${port}`;
    if (peers.length > 0) {
      peers.forEach((peer) => this.connect(peer));
    }
  }

  connect(address) {
    if (
      !this.connectedSockets.find((peerAddress) => peerAddress === address) &&
      address !== this.address
    ) {
      const socket = new WebSocket(address);

      socket.on("open", () => {
        socket.send(
          JSON.stringify(
            Node.producedMessage("TYPE_HANDSHAKE", [
              this.address,
              ...this.connectedSockets,
            ]),
          ),
        );

        this.openSockets.forEach((node) =>
          node.socket.send(
            JSON.stringify(Node.producedMessage("TYPE_HANDSHAKE", [address])),
          ),
        );

        if (
          !this.openSockets.find((peer) => peer.address === address) &&
          address !== this.address
        ) {
          this.openSockets.push({ address, socket });
          this.connectedSockets.push(address);
        }
      });

      socket.on("close", () => {
        this.openSockets.splice(this.connectedSockets.indexOf(address), 1);
        this.connectedSockets.splice(this.connectedSockets.indexOf(address), 1);
      });
    }
  }

  static sendMessage(openSocket, message) {
    openSocket.forEach((node) => node.socket.send(JSON.stringify(message)));
  }

  static producedMessage(type, data) {
    return {
      type,
      data,
    };
  }

  static broadcastTransactions({ chain, socket }) {
    chain.transactions.forEach((transaction, index) => {
      if (chain.isTransactionIncluded(transaction)) {
        chain.transactions.splice(index, 1);
      } else {
        Node.sendMessage(
          socket,
          Node.producedMessage("TYPE_CREATE_TRANSACTION", transaction),
        );
      }
    });

    setTimeout(() => Node.broadcastTransactions({ chain, socket }), 10000);
  }
}

module.exports = Node;
