const { MerkleTree } = require("merkletreejs");
const SHA256 = require("crypto-js/sha256");
function getMerkleRoot(block) {
  const leaves = block.data.map((transaction) =>
    SHA256(JSON.stringify(transaction)).toString(),
  );
  const tree = new MerkleTree(leaves, SHA256);
  return tree.getRoot().toString("hex");
}

function getMerkleProof({ leaves, transaction }) {
  const tree = new MerkleTree(leaves, SHA256);
  return tree.getProof(SHA256(JSON.stringify(transaction)));
}

function verifyTransaction(proof, leaves, merkleRoot, transaction) {
  const tree = new MerkleTree(leaves, SHA256);
  const leaf = SHA256(JSON.stringify(transaction));
  return tree.verify(proof, leaf, merkleRoot);
}

module.exports = { getMerkleRoot, getMerkleProof, verifyTransaction };
