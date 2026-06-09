import { ec as EC } from 'elliptic';
import crypto from 'crypto';

const ec = new EC('secp256k1');

export function generateKeyPair() {
    const keyPair = ec.genKeyPair();
    return {
        privateKey: keyPair.getPrivate('hex'),
        publicKey: keyPair.getPublic('hex')
    };
}

export function signMessage(privateKey, message) {
    const keyPair = ec.keyFromPrivate(privateKey, 'hex');
    const signature = keyPair.sign(message);
    return {
        r: signature.r.toString('hex'),
        s: signature.s.toString('hex')
    };
}

export function verifySignature(publicKey, message, signature) {
    try {
        const keyPair = ec.keyFromPublic(publicKey, 'hex');
        return keyPair.verify(message, {
            r: signature.r,
            s: signature.s
        });
    } catch {
        return false;
    }
}

export function hashData(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}