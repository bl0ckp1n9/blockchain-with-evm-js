const FullNode = require("./node/full-node");
const readline = require("readline");
const Transaction = require("./chain/transaction");
const {
  JENIFER_PUBLIC_KEY,
  BOB_PUBLIC_KEY,
  JENIFER_KEY,
  MINER_PUBLIC_KEY,
  JOHN_PUBLIC_KEY,
} = require("./config");
const Node = require("./node");
const Blockchain = require("./chain/blockchain");
const fullNode = new FullNode({
  port: 3002,
  address: "localhost",
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "Enter a command:\n",
});

rl.on("line", (command) => {
  switch (command.toLowerCase()) {
    case "send":
      const transaction = new Transaction({
        from: JENIFER_PUBLIC_KEY,
        to: BOB_PUBLIC_KEY,
        amount: 80,
        gas: 10,
        timestamp: Date.now(),
      });
      transaction.sign(JENIFER_KEY);
      Node.sendMessage(
        fullNode.openSockets,
        Node.producedMessage("TYPE_CREATE_TRANSACTION", transaction),
      );
      break;
    case "balance":
      console.log(
        "JENIFER Balance:",
        Blockchain.getBalance(JENIFER_PUBLIC_KEY),
      );
      break;
    case "mine":
      if (Blockchain.transactions.length !== 0) {
        Blockchain.mineTransaction(MINER_PUBLIC_KEY);

        Node.sendMessage(
          fullNode.openSockets,
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
    case "transactions":
      for (const block of Blockchain.chain) {
        for (const transaction of block.data) {
          console.log(transaction);
        }
      }
    case "clear":
      console.clear();
      break;
  }
  rl.prompt();
}).on("close", () => {
  console.log("Exiting...");
  process.exit(0);
});

fullNode.init();
