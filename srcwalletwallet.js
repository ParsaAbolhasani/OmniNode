import { ec as EC } from 'elliptic';
import { hashData, verifySignature } from '../utils/crypto.js';
import { Transaction } from '../transaction/tx.js';

const ec = new EC('secp256k1');

export class Wallet {
    constructor() {
        this.keyPair = ec.genKeyPair();
        this.privateKey = this.keyPair.getPrivate('hex');
        this.publicKey = this.keyPair.getPublic('hex');
        this.address = this.generateAddress();
    }

    generateAddress() {
        // آدرس ساده: هش کلید عمومی
        return hashData(this.publicKey).substring(0, 42); // شبیه 0x...
    }

    signTransaction(transaction) {
        const signature = this.keyPair.sign(transaction.hash);
        transaction.signature = {
            r: signature.r.toString('hex'),
            s: signature.s.toString('hex')
        };
        return transaction;
    }

    createTransaction(to, amount, nonce) {
        const tx = new Transaction(this.address, to, amount, nonce);
        return this.signTransaction(tx);
    }

    static recoverAddress(txHash, signature) {
        try {
            const sig = {
                r: signature.r,
                s: signature.s
            };
            const keyPair = ec.keyFromPublic(signature, 'hex');
            return hashData(keyPair.getPublic('hex')).substring(0, 42);
        } catch {
            return null;
        }
    }

    static verifyTransaction(tx) {
        return verifySignature(tx.from, tx.hash, tx.signature);
    }
}