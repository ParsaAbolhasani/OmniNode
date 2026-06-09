import crypto from 'crypto';

export class ProofOfWork {
    constructor(difficulty = 4) {
        this.difficulty = difficulty; // تعداد صفرهای ابتدایی هش
        this.target = '0'.repeat(difficulty);
    }

    mine(blockData, previousHash) {
        let nonce = 0;
        let timestamp = Date.now();
        let hash = this.calculateHash(blockData, previousHash, timestamp, nonce);

        while (!hash.startsWith(this.target)) {
            nonce++;
            timestamp = Date.now();
            hash = this.calculateHash(blockData, previousHash, timestamp, nonce);
            
            // هر ۱۰۰۰۰ بار یکبار لاگ بزنیم (برای نمایش پیشرفت)
            if (nonce % 10000 === 0) {
                console.log(`   Mining... nonce: ${nonce}, hash: ${hash.substring(0, 10)}...`);
            }
        }

        return { nonce, timestamp, hash };
    }

    calculateHash(blockData, previousHash, timestamp, nonce) {
        const data = JSON.stringify({
            blockData,
            previousHash,
            timestamp,
            nonce
        });
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    validateHash(hash) {
        return hash.startsWith(this.target);
    }
}