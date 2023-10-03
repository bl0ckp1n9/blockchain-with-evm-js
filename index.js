const Wallet = require("./chain/wallet");
const Transaction = require("./chain/transaction");
const Blockchain = require("./chain/blockchain");
const { JOHN_PUBLIC_KEY } = require("./config");

const miner = new Wallet();
const john = new Wallet();
const jane = new Wallet();
const bob = new Wallet();

const chain = new Blockchain();

const transaction1 = new Transaction({
  from: chain.wallet.publicKey,
  to: john.publicKey,
  amount: 1000,
  gas: 20,
});
transaction1.sign(chain.wallet.key);
chain.addTransaction(transaction1);
chain.mineTransaction(miner.publicKey);

const transaction2 = new Transaction({
  from: john.publicKey,
  to: jane.publicKey,
  amount: 50,
  gas: 10,
});
transaction2.sign(john.key);
chain.addTransaction(transaction2);
chain.mineTransaction(miner.publicKey);

console.log(chain.getBalance(chain.wallet.publicKey));
console.log(chain.getBalance(miner.publicKey));
console.log(chain.getBalance(JOHN_PUBLIC_KEY));
