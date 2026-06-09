import { hashData } from '../utils/crypto.js';

class Block {
    constructor(index, timestamp, transactions, previousHash, validator) {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.validator = validator;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return hashData({
            index: this.index,
            timestamp: this.timestamp,
            transactions: this.transactions.map(tx => tx.hash),
            previousHash: this.previousHash,
            validator: this.validator
        });
    }
}

export class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
    }

    createGenesisBlock() {
        return new Block(0, Date.now(), [], '0', 'genesis');
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(transactions, validator) {
        const newBlock = new Block(
            this.chain.length,
            Date.now(),
            transactions,
            this.getLatestBlock().hash,
            validator
        );

        this.chain.push(newBlock);
        return newBlock;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }
        }
        return true;
    }

    getBlockCount() {
        return this.chain.length;
    }
}