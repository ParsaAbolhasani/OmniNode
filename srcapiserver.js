import express from 'express';
import cors from 'cors';

export class ApiServer {
    constructor(mempool, blockchain, p2pNode, port = 3000) {
        this.app = express();
        this.mempool = mempool;
        this.blockchain = blockchain;
        this.p2pNode = p2pNode;
        this.port = port;
        this.setupRoutes();
    }

    setupRoutes() {
        this.app.use(cors());
        this.app.use(express.json());

        // دریافت وضعیت نود
        this.app.get('/api/status', (req, res) => {
            res.json({
                blockCount: this.blockchain.getBlockCount(),
                mempoolSize: this.mempool.getSize(),
                peerCount: this.p2pNode.getPeerCount(),
                isChainValid: this.blockchain.isChainValid()
            });
        });

        // دریافت ممپول
        this.app.get('/api/mempool', (req, res) => {
            res.json(this.mempool.getAllTransactions());
        });

        // دریافت بلاک‌چین
        this.app.get('/api/blockchain', (req, res) => {
            res.json(this.blockchain.chain);
        });

        // ارسال تراکنش جدید
        this.app.post('/api/transaction', async (req, res) => {
            try {
                const tx = req.body;
                
                // Add to mempool
                const added = this.mempool.addTransaction(tx);
                
                if (added) {
                    // Broadcast to all peers
                    await this.p2pNode.broadcastTransaction(tx);
                    res.json({ success: true, message: 'Transaction added and broadcasted' });
                } else {
                    res.status(400).json({ success: false, message: 'Transaction already in mempool' });
                }
            } catch (error) {
                res.status(400).json({ success: false, message: error.message });
            }
        });

        // اتصال به یک گره جدید
        this.app.post('/api/connect', async (req, res) => {
            try {
                const { multiaddr } = req.body;
                await this.p2pNode.connectToPeer(multiaddr);
                res.json({ success: true, message: `Connected to ${multiaddr}` });
            } catch (error) {
                res.status(400).json({ success: false, message: error.message });
            }
        });
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`🌐 API Server running on http://localhost:${this.port}`);
        });
    }
}