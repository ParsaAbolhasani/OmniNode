import { hashData, verifySignature } from '../utils/crypto.js';

export class Transaction {
    constructor(from, to, amount, nonce, signature = null) {
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.nonce = nonce;
        this.signature = signature;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return hashData({
            from: this.from,
            to: this.to,
            amount: this.amount,
            nonce: this.nonce
        });
    }

    isValid() {
        if (!this.signature) return false;
        return verifySignature(
            this.from,
            this.hash,
            this.signature
        );
    }

    static fromJSON(data) {
        const tx = new Transaction(data.from, data.to, data.amount, data.nonce, data.signature);
        tx.hash = data.hash;
        return tx;
    }

    toJSON() {
        return {
            from: this.from,
            to: this.to,
            amount: this.amount,
            nonce: this.nonce,
            signature: this.signature,
            hash: this.hash
        };
    }
}