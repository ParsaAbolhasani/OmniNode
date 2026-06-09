import { Level } from 'level';

export class NodeDB {
    constructor(dbPath = './data') {
        this.db = new Level(dbPath, { valueEncoding: 'json' });
    }

    async putBlock(blockHash, blockData) {
        await this.db.put(`block:${blockHash}`, blockData);
        await this.db.put(`latestBlock`, blockData);
        await this.db.put(`blockIndex:${blockData.index}`, blockHash);
    }

    async getBlock(hash) {
        try {
            return await this.db.get(`block:${hash}`);
        } catch {
            return null;
        }
    }

    async getBlockByIndex(index) {
        try {
            const hash = await this.db.get(`blockIndex:${index}`);
            return await this.getBlock(hash);
        } catch {
            return null;
        }
    }

    async getLatestBlock() {
        try {
            return await this.db.get(`latestBlock`);
        } catch {
            return null;
        }
    }

    async putTransaction(txHash, txData) {
        await this.db.put(`tx:${txHash}`, txData);
    }

    async getTransaction(txHash) {
        try {
            return await this.db.get(`tx:${txHash}`);
        } catch {
            return null;
        }
    }

    async putMempoolTx(txHash, txData) {
        await this.db.put(`mempool:${txHash}`, txData);
    }

    async getMempoolTx(txHash) {
        try {
            return await this.db.get(`mempool:${txHash}`);
        } catch {
            return null;
        }
    }

    async getAllMempoolTxs() {
        const txs = [];
        for await (const [key, value] of this.db.iterator({ gt: 'mempool:', lt: 'mempool:~' })) {
            txs.push(value);
        }
        return txs;
    }

    async deleteMempoolTx(txHash) {
        await this.db.del(`mempool:${txHash}`);
    }

    async clearMempool() {
        for await (const [key] of this.db.iterator({ gt: 'mempool:', lt: 'mempool:~' })) {
            await this.db.del(key);
        }
    }

    async putPeer(multiaddr) {
        await this.db.put(`peer:${multiaddr}`, { multiaddr, lastSeen: Date.now() });
    }

    async getPeers() {
        const peers = [];
        for await (const [key, value] of this.db.iterator({ gt: 'peer:', lt: 'peer:~' })) {
            peers.push(value);
        }
        return peers;
    }
}