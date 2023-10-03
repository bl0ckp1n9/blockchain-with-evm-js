const { runtime } = require("../runtime");

class SmartContract {
  static execute(blockchain, transactions) {
    transactions.forEach((transaction) => {
      // execute smart contract, to is 32 bytes when it is a smart contract
      if (transaction.to.length === 64) {
        const { smartContract, deployedBy } = SmartContract.getSmartContract({
          blockchain,
          address: transaction.to,
        });

        const { result } = runtime(
          smartContract,
          transaction.gas,
          transaction.data,
        );
      }
    });
  }

  static getSmartContract({ blockchain, address }) {
    for (const block of blockchain.chain) {
      for (const transaction of block.data) {
        if (address === transaction.data.smartContractAddress) {
          return {
            smartContract: transaction.data.smartContract,
            deployedBy: transaction.from,
          };
        }
      }
    }

    return null;
  }
}

module.exports = SmartContract;
