import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { ping } from '@libp2p/ping';
import { pipe } from 'it-pipe';
import { fromString, toString } from 'uint8arrays';

const PROTOCOL = '/fullnode/2.0.0';

export class P2PNode {
    constructor(port = 9000, handlers) {
        this.port = port;
        this.handlers = handlers; // { onTransaction, onBlock, onSyncRequest, onSyncResponse }
        this.node = null;
        this.peers = new Map();
    }

    async start() {
        this.node = await createLibp2p({
            addresses: { listen: [`/ip4/0.0.0.0/tcp/${this.port}`] },
            transports: [tcp()],
            connectionEncryptors: [noise()],
            streamMuxers: [mplex()],
            services: { ping: ping() }
        });

        await this.node.start();

        await this.node.handle(PROTOCOL, async ({ stream }) => {
            pipe(stream, async (source) => {
                for await (const message of source) {
                    const data = JSON.parse(toString(message.subarray()));
                    
                    switch (data.type) {
                        case 'TRANSACTION':
                            if (this.handlers.onTransaction) 
                                await this.handlers.onTransaction(data.payload);
                            break;
                        case 'BLOCK':
                            if (this.handlers.onBlock)
                                await this.handlers.onBlock(data.payload);
                            break;
                        case 'GET_BLOCKS':
                            if (this.handlers.onGetBlocks) {
                                const blocks = await this.handlers.onGetBlocks();
                                await this.sendMessage(stream, { type: 'BLOCKS', payload: blocks });
                            }
                            break;
                        case 'BLOCKS':
                            if (this.handlers.onBlocks)
                                await this.handlers.onBlocks(data.payload);
                            break;
                    }
                }
            });
        });

        console.log(`🆔 P2P Node started on port ${this.port}`);
        console.log(`   Peer ID: ${this.node.peerId.toString()}`);
        
        // بازیابی همسایه‌های قبلی از دیتابیس
        if (this.handlers.onGetSavedPeers) {
            const savedPeers = await this.handlers.onGetSavedPeers();
            for (const peer of savedPeers) {
                await this.connectToPeer(peer.multiaddr);
            }
        }
        
        return this.node;
    }

    async sendMessage(stream, message) {
        await pipe([fromString(JSON.stringify(message))], stream);
    }

    async connectToPeer(multiaddr) {
        try {
            await this.node.dial(multiaddr);
            this.peers.set(multiaddr, multiaddr);
            if (this.handlers.onNewPeer) this.handlers.onNewPeer(multiaddr);
            console.log(`✅ Connected to peer: ${multiaddr}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to connect: ${error.message}`);
            return false;
        }
    }

    async broadcastTransaction(transaction) {
        const message = { type: 'TRANSACTION', payload: transaction.toJSON() };
        await this.broadcast(message);
        console.log(`📡 Broadcasted transaction ${transaction.hash.substring(0, 10)}...`);
    }

    async broadcastBlock(block) {
        const message = { type: 'BLOCK', payload: block };
        await this.broadcast(message);
        console.log(`📡 Broadcasted block #${block.index}`);
    }

    async requestBlockSync() {
        const message = { type: 'GET_BLOCKS', payload: {} };
        await this.broadcast(message);
    }

    async broadcast(message) {
        const promises = [];
        for (const [multiaddr] of this.peers) {
            try {
                const stream = await this.node.dialProtocol(multiaddr, PROTOCOL);
                promises.push(this.sendMessage(stream, message));
            } catch (error) {
                console.error(`Failed to broadcast to ${multiaddr}: ${error.message}`);
            }
        }
        await Promise.all(promises);
    }

    getPeerCount() {
        return this.peers.size;
    }

    async stop() {
        await this.node.stop();
        console.log('🛑 P2P Node stopped');
    }
}