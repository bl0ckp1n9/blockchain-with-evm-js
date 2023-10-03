const Bob = require("./node/light-node");
const readline = require("readline");
const Transaction = require("./chain/transaction");
const Blockchain = require("./chain/blockchain");
const { JOHN_PUBLIC_KEY, BOB_PUBLIC_KEY, BOB_KEY } = require("./config");
const Node = require("./node");

const lightNode = new Bob({
  port: 3003,
  address: "localhost",
  peers: ["ws://localhost:3002"],
});

lightNode.chain.push(Blockchain.getLastBlock().header);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "Enter a command:\n",
});

rl.on("line", (command) => {
  switch (command.toLowerCase()) {
    case "send":
      const transaction = new Transaction({
        from: BOB_PUBLIC_KEY,
        to: JOHN_PUBLIC_KEY,
        amount: 50,
        gas: 10,
        timestamp: Date.now(),
      });
      transaction.sign(BOB_KEY);
      lightNode.transaction_history.push(transaction);
      Node.sendMessage(
        lightNode.openSockets,
        Node.producedMessage("TYPE_CREATE_TRANSACTION", transaction),
      );
      break;
    case "balance":
      Node.sendMessage(
        lightNode.openSockets,
        Node.producedMessage("TYPE_BALANCE", [
          "ws://localhost:3003",
          BOB_PUBLIC_KEY,
        ]),
      );
      break;
    case "chain":
      console.log(lightNode.chain);
      break;
    case "verify":
      Node.sendMessage(
        lightNode.openSockets,
        Node.producedMessage("TYPE_VERIFY", ["ws://localhost:3003"]),
      );
      break;
    case "transaction_verify":
      const transactionToVerify = lightNode.getLastTransaction();
      Node.sendMessage(
        lightNode.openSockets,
        Node.producedMessage("TYPE_VERIFY_TRANSACTION", {
          transaction: transactionToVerify,
          address: "ws://localhost:3003",
        }),
      );
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

lightNode.init();
