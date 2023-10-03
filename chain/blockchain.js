const Block = require("./block");
const Wallet = require("./wallet");
const Transaction = require("./transaction");
const SmartContract = require("../utils/smart-contract");
const Merkle = require("../utils/merkle");
const {
  MINT_PRIVATE_KEY,
  MINING_REWARD,
  JOHN_PUBLIC_KEY,
} = require("../config");
class Blockchain {
  constructor() {
    this.difficulty = 2;
    this.blockTime = 3000; // Block time in milliseconds
    this.transactions = [];
    this.reward = MINING_REWARD;
    this.wallet = new Wallet(MINT_PRIVATE_KEY);

    const initialTransaction = new Transaction({
      from: this.wallet.publicKey,
      to: JOHN_PUBLIC_KEY,
      amount: 10000,
      gas: 0,
      timestamp: "initial genesis",
    });

    this.chain = [
      new Block({
        timestamp: "",
        data: [initialTransaction],
        transactionCount: 1,
        difficulty: this.difficulty,
      }),
    ];
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }
  getBalance(address) {
    let balance = 0;

    this.chain.forEach((block) => {
      block.data.forEach((transaction) => {
        if (transaction.from === address)
          balance -= transaction.amount + transaction.gas;
        if (transaction.to === address) balance += transaction.amount;
      });
    });

    return balance;
  }
  addBlock(block) {
    block.header.prevHash = this.getLastBlock().hash;
    block.header.merkleRoot = Merkle.getMerkleRoot(block);
    block.mine(this.difficulty);

    this.difficulty +=
      Date.now() - parseInt(this.getLastBlock().header.timestamp) >
      this.blockTime
        ? -1
        : 1;
    this.chain.push(block);
  }

  addTransaction(transaction) {
    console.log("transaction", transaction);
    if (
      !Transaction.isValid({
        transaction,
        chain: this,
      })
    )
      return;
    console.log("add transaction");
    this.transactions.push(transaction);
  }

  isTransactionDuplicate(transaction) {
    return this.transactions.some(
      (tx) => JSON.stringify(tx) === JSON.stringify(transaction),
    );
  }

  isTransactionIncluded(transaction) {
    return this.chain.some((block) =>
      block.data.some(
        (tx) => JSON.stringify(tx) === JSON.stringify(transaction),
      ),
    );
  }

  mineTransaction(rewardAddress) {
    let gas = 0;

    this.transactions.forEach((transaction) => {
      gas += transaction.gas;
    });

    SmartContract.execute(this, this.transactions);
    const rewardTransaction = new Transaction({
      from: this.wallet.publicKey,
      to: rewardAddress,
      amount: this.reward + gas,
      gas: 0,
      timestamp: Date.now(),
    });
    rewardTransaction.sign(this.wallet.key);

    this.addBlock(
      new Block({
        timestamp: Date.now(),
        data: [rewardTransaction, ...this.transactions],
        transactionCount: this.transactions.length + 1,
        difficulty: this.difficulty,
      }),
    );

    this.transactions = [];
  }

  getTransactionBlock({ from, to, amount, gas, timestamp, signature }) {
    for (const block of this.chain) {
      for (const transaction of block.data) {
        if (
          transaction.from === from &&
          transaction.to === to &&
          transaction.amount === amount &&
          transaction.gas === gas &&
          transaction.timestamp === timestamp &&
          JSON.stringify(transaction.signature) === JSON.stringify(signature)
        ) {
          return block;
        }
      }
    }
    return null;
  }

  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const prevBlock = this.chain[i - 1];

      if (
        currentBlock.hash !== Block.getHash(currentBlock.header) ||
        currentBlock.header.prevHash !== prevBlock.hash ||
        !Block.isValid({ block: currentBlock, chain: this })
      )
        return false;
    }
    return true;
  }
}

const blockchain = new Blockchain();

module.exports = blockchain;
