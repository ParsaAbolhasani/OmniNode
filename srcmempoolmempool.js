export class Mempool {
    constructor(maxSize = 10000) {
        this.transactions = new Map(); // hash -> transaction
        this.maxSize = maxSize;
    }

    addTransaction(transaction) {
        if (this.transactions.has(transaction.hash)) {
            return false;
        }

        if (!transaction.isValid()) {
            throw new Error('Invalid transaction signature');
        }

        if (this.transactions.size >= this.maxSize) {
            this.removeOldestTransaction();
        }

        this.transactions.set(transaction.hash, transaction);
        return true;
    }

    getTransaction(hash) {
        return this.transactions.get(hash);
    }

    getAllTransactions() {
        return Array.from(this.transactions.values());
    }

    removeTransaction(hash) {
        return this.transactions.delete(hash);
    }

    removeTransactions(transactionHashes) {
        for (const hash of transactionHashes) {
            this.transactions.delete(hash);
        }
    }

    removeOldestTransaction() {
        const firstKey = this.transactions.keys().next().value;
        this.transactions.delete(firstKey);
    }

    getSize() {
        return this.transactions.size;
    }

    clear() {
        this.transactions.clear();
    }
}