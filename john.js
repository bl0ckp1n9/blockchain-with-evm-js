const FullNode = require("./node/full-node");
const readline = require("readline");
const Transaction = require("./chain/transaction");
const {
  JENIFER_PUBLIC_KEY,
  MINER_PUBLIC_KEY,
  JOHN_PUBLIC_KEY,
  JOHN_KEY,
} = require("./config");
const Node = require("./node");
const Blockchain = require("./chain/blockchain");
const fullNode = new FullNode({
  port: 3001,
  address: "localhost",
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "Enter a command:\n",
});

rl.on("line", (command) => {
  switch (command.toLowerCase()) {
    case "deploy_smart_contract":
      const myContract = `
        set a, %0
        set b, %1
        store result, 0
        set c, 0
        add c, $a
        add c, $b
        store result, $c
      `;

      const contractTransaction = new Transaction({
        from: JOHN_PUBLIC_KEY,
        to: "",
        amount: 20,
        timestamp: Date.now(),
        data: {
          smartContract: myContract,
        },
      });
      contractTransaction.sign(JOHN_KEY);
      Node.sendMessage(
        fullNode.openSockets,
        Node.producedMessage("TYPE_CREATE_TRANSACTION", contractTransaction),
      );
      break;

    case "execute_smart_contract":
      const txInfo = {
        additionalData: {
          txCallArgs: [10, 20],
        },
      };

      const executeTransaction = new Transaction({
        from: JOHN_PUBLIC_KEY,
        to: "273a42da0a1ae31558330827fea285fc485c4b75c51197146c2cbf7b57742397",
        amount: 0,
        gas: 20,
        timestamp: Date.now(),
        data: txInfo,
      });

      executeTransaction.sign(JOHN_KEY);
      Node.sendMessage(
        fullNode.openSockets,
        Node.producedMessage("TYPE_CREATE_TRANSACTION", executeTransaction),
      );
      break;
    case "send":
      const transaction = new Transaction({
        from: JOHN_PUBLIC_KEY,
        to: JENIFER_PUBLIC_KEY,
        amount: 200,
        gas: 10,
        timestamp: Date.now(),
      });
      transaction.sign(JOHN_KEY);
      Node.sendMessage(
        fullNode.openSockets,
        Node.producedMessage("TYPE_CREATE_TRANSACTION", transaction),
      );
      break;
    case "balance":
      console.log("JOHN Balance:", Blockchain.getBalance(JOHN_PUBLIC_KEY));
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
    case "header":
      console.log(Blockchain.chain[1].header);
      console.log(Blockchain.chain[2].header);
      console.log(Blockchain.chain[3].header);
      break;
    case "transactions":
      for (const block of Blockchain.chain) {
        for (const transaction of block.data) {
          console.log(transaction);
        }
      }
    case "smart":
      console.log(Blockchain.chain[2].data);
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

fullNode.init();
