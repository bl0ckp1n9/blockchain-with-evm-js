const Miner = require("./node/miner-node.js");
const readline = require("readline");
const Blockchain = require("./chain/blockchain");
const { MINER_PUBLIC_KEY } = require("./config");
const Node = require("./node");

const miner = new Miner({
  port: 3000,
  address: "localhost",
  peers: ["ws://localhost:3001", "ws://localhost:3002"],
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "Enter a command:\n",
});
rl.on("line", (command) => {
  switch (command.toLowerCase()) {
    case "balance":
      console.log("Miner Balance:", Blockchain.getBalance(MINER_PUBLIC_KEY));
      break;
    case "mine":
      if (Blockchain.transactions.length !== 0) {
        Blockchain.mineTransaction(MINER_PUBLIC_KEY);

        Node.sendMessage(
          miner.openSockets,
          Node.producedMessage("TYPE_REPLACE_CHAIN", [
            Blockchain.getLastBlock(),
            Blockchain.difficulty,
          ]),
        );
      }
      break;
    case "blockchain":
      console.log(Blockchain);
      break;
    case "clear":
      console.clear();
      break;
  }
  rl.prompt();
}).on("close", () => {
  console.log("Exiting...");
  process.exit(0);
});

miner.init();
