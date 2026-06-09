import { ProofOfWork } from './pow.js';
import { hashData } from '../utils/crypto.js';

class Block {
    constructor(index, timestamp, transactions, previousHash, validator, nonce, hash) {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.validator = validator;
        this.nonce = nonce;
        this.hash = hash;
    }

    static createGenesisBlock() {
        const genesisHash = hashData({ type: 'GENESIS', timestamp: Date.now() });
        return new Block(0, Date.now(), [], '0', 'genesis', 0, genesisHash);
    }

    toJSON() {
        return {
            index: this.index,
            timestamp: this.timestamp,
            transactions: this.transactions.map(tx => tx.toJSON ? tx.toJSON() : tx),
            previousHash: this.previousHash,
            validator: this.validator,
            nonce: this.nonce,
            hash: this.hash
        };
    }

    static fromJSON(data, TransactionClass) {
        const transactions = data.transactions.map(tx => TransactionClass.fromJSON(tx));
        return new Block(
            data.index,
            data.timestamp,
            transactions,
            data.previousHash,
            data.validator,
            data.nonce,
            data.hash
        );
    }
}

export class Blockchain {
    constructor(db, mempool, p2pNode, difficulty = 4) {
        this.db = db;
        this.mempool = mempool;
        this.p2pNode = p2pNode;
        this.pow = new ProofOfWork(difficulty);
        this.isMining = false;
    }

    async initialize() {
        // بارگذاری آخرین بلاک از دیتابیس
        let latestBlock = await this.db.getLatestBlock();
        
        if (!latestBlock) {
            // اگر هیچ بلاکی وجود نداشت، بلاک جنسیس را بساز
            const genesisBlock = Block.createGenesisBlock();
            await this.saveBlock(genesisBlock);
            console.log('🌍 Genesis block created');
        } else {
            console.log(`📦 Loaded blockchain with ${latestBlock.index + 1} blocks`);
        }
    }

    async saveBlock(block) {
        await this.db.putBlock(block.hash, block.toJSON());
        
        // حذف تراکنش‌های این بلاک از ممپول
        for (const tx of block.transactions) {
            await this.db.deleteMempoolTx(tx.hash);
            this.mempool.removeTransaction(tx.hash);
        }
    }

    async getLatestBlock() {
        return await this.db.getLatestBlock();
    }

    async getBlockByIndex(index) {
        return await this.db.getBlockByIndex(index);
    }

    async mineNewBlock(validatorAddress) {
        if (this.isMining) {
            console.log('⛏️ Already mining, please wait...');
            return null;
        }

        this.isMining = true;
        console.log('\n⛏️ Starting to mine a new block...');

        try {
            // دریافت تراکنش‌های تأیید نشده از ممپول
            const pendingTxs = await this.db.getAllMempoolTxs();
            
            if (pendingTxs.length === 0) {
                console.log('📭 No pending transactions to mine');
                this.isMining = false;
                return null;
            }

            const latestBlock = await this.getLatestBlock();
            const newIndex = latestBlock.index + 1;

            console.log(`   Block index: ${newIndex}`);
            console.log(`   Transactions: ${pendingTxs.length}`);
            console.log(`   Target difficulty: ${'0'.repeat(this.pow.difficulty)}`);

            // ماین کردن بلاک جدید
            const blockData = {
                index: newIndex,
                transactions: pendingTxs,
                validator: validatorAddress
            };

            const { nonce, timestamp, hash } = this.pow.mine(
                blockData,
                latestBlock.hash
            );

            // ساخت بلاک
            const newBlock = new Block(
                newIndex,
                timestamp,
                pendingTxs,
                latestBlock.hash,
                validatorAddress,
                nonce,
                hash
            );

            // ذخیره بلاک
            await this.saveBlock(newBlock);
            
            // پخش بلاک به شبکه
            await this.p2pNode.broadcastBlock(newBlock.toJSON());
            
            console.log(`✅ New block mined! Block #${newIndex}`);
            console.log(`   Hash: ${hash.substring(0, 20)}...`);
            console.log(`   Nonce: ${nonce}`);
            
            this.isMining = false;
            return newBlock;
            
        } catch (error) {
            console.error('❌ Mining failed:', error.message);
            this.isMining = false;
            return null;
        }
    }

    async addBlockFromPeer(blockData) {
        const latestBlock = await this.getLatestBlock();
        
        // بررسی اینکه بلاک جدید دنباله صحیحی داشته باشد
        if (blockData.previousHash !== latestBlock.hash) {
            console.log('⚠️ Received block out of order, requesting sync...');
            await this.p2pNode.requestBlockSync();
            return false;
        }

        // بررسی هش (اثبات کار)
        if (!this.pow.validateHash(blockData.hash)) {
            console.log('❌ Invalid PoW, block rejected');
            return false;
        }

        // ساخت و ذخیره بلاک
        const newBlock = new Block(
            blockData.index,
            blockData.timestamp,
            blockData.transactions,
            blockData.previousHash,
            blockData.validator,
            blockData.nonce,
            blockData.hash
        );

        await this.saveBlock(newBlock);
        
        // حذف تراکنش‌های این بلاک از ممپول محلی
        for (const tx of blockData.transactions) {
            await this.db.deleteMempoolTx(tx.hash);
            this.mempool.removeTransaction(tx.hash);
        }
        
        console.log(`📥 Received new block #${blockData.index} from peer`);
        return true;
    }

    async syncWithPeer(peerMultiaddr, peerBlocks) {
        const latestBlock = await this.getLatestBlock();
        const missingBlocks = peerBlocks.filter(block => block.index > latestBlock.index);
        
        if (missingBlocks.length === 0) return;
        
        console.log(`🔄 Syncing ${missingBlocks.length} blocks from peer...`);
        
        for (const block of missingBlocks.sort((a, b) => a.index - b.index)) {
            await this.addBlockFromPeer(block);
        }
        
        console.log('✅ Sync complete');
    }

    getBlockCount() {
        // این تابع باید از دیتابیس بخواند، فعلاً ساده شده
        return this.db.getLatestBlock().then(block => block ? block.index + 1 : 0);
    }
}