import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { ping } from '@libp2p/ping';
import { pipe } from 'it-pipe';
import { fromString, toString } from 'uint8arrays';

const PROTOCOL = '/fullnode/1.0.0';

export class P2PNode {
    constructor(port = 9000, onTransaction, onNewPeer) {
        this.port = port;
        this.node = null;
        this.peers = new Map();
        this.onTransaction = onTransaction;
        this.onNewPeer = onNewPeer;
    }

    async start() {
        this.node = await createLibp2p({
            addresses: {
                listen: [`/ip4/0.0.0.0/tcp/${this.port}`]
            },
            transports: [tcp()],
            connectionEncryptors: [noise()],
            streamMuxers: [mplex()],
            services: {
                ping: ping()
            }
        });

        await this.node.start();

        // Handle incoming streams
        await this.node.handle(PROTOCOL, async ({ stream }) => {
            pipe(
                stream,
                async function (source) {
                    for await (const message of source) {
                        const data = JSON.parse(toString(message.subarray()));
                        
                        if (data.type === 'TRANSACTION') {
                            const tx = data.payload;
                            if (this.onTransaction) {
                                this.onTransaction(tx, stream);
                            }
                        }
                        
                        if (data.type === 'GET_BLOCKS') {
                            // Send blocks back
                            // Implementation simplified
                        }
                    }
                }.bind(this)
            );
        });

        console.log(`🆔 P2P Node started on port ${this.port}`);
        console.log(`   Peer ID: ${this.node.peerId.toString()}`);
        
        return this.node;
    }

    async connectToPeer(multiaddr) {
        try {
            await this.node.dial(multiaddr);
            console.log(`✅ Connected to peer: ${multiaddr}`);
            if (this.onNewPeer) this.onNewPeer(multiaddr);
            return true;
        } catch (error) {
            console.error(`❌ Failed to connect to ${multiaddr}:`, error.message);
            return false;
        }
    }

    async broadcastTransaction(transaction) {
        const message = {
            type: 'TRANSACTION',
            payload: transaction.toJSON()
        };

        const promises = [];
        for (const peer of this.peers.values()) {
            try {
                const stream = await this.node.dialProtocol(peer, PROTOCOL);
                promises.push(
                    pipe(
                        [fromString(JSON.stringify(message))],
                        stream
                    )
                );
            } catch (error) {
                console.error(`Failed to broadcast to peer: ${error.message}`);
            }
        }
        
        await Promise.all(promises);
        console.log(`📡 Broadcasted transaction ${transaction.hash.substring(0, 10)}... to ${this.peers.size} peers`);
    }

    addPeer(peerId, multiaddr) {
        if (!this.peers.has(peerId)) {
            this.peers.set(peerId, multiaddr);
            console.log(`🌟 New peer connected: ${peerId.substring(0, 10)}...`);
        }
    }

    getPeerCount() {
        return this.peers.size;
    }

    async stop() {
        await this.node.stop();
        console.log('🛑 P2P Node stopped');
    }
}