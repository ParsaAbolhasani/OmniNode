import { Mempool } from './mempool/mempool.js';
import { Blockchain } from './blockchain/blockchain.js';
import { P2PNode } from './p2p/node.js';
import { ApiServer } from './api/server.js';
import { Transaction } from './transaction/tx.js';

async function main() {
    console.log('🚀 Starting Full Node with Mempool & P2P...\n');

    // 1. Initialize components
    const mempool = new Mempool();
    const blockchain = new Blockchain();

    // 2. Callback when a transaction is received from P2P
    const onTransaction = (txData, stream) => {
        const tx = Transaction.fromJSON(txData);
        try {
            if (mempool.addTransaction(tx)) {
                console.log(`📥 Received new transaction: ${tx.hash.substring(0, 10)}...`);
            }
        } catch (error) {
            console.log(`⚠️ Invalid transaction rejected: ${error.message}`);
        }
    };

    const onNewPeer = (multiaddr) => {
        console.log(`🔗 New peer connection established`);
    };

    // 3. Start P2P Node
    const p2pNode = new P2PNode(9000, onTransaction, onNewPeer);
    await p2pNode.start();

    // 4. Start API Server
    const apiServer = new ApiServer(mempool, blockchain, p2pNode, 3000);
    apiServer.start();

    console.log('\n✅ Full Node is running!');
    console.log('\n📋 Available endpoints:');
    console.log('   GET  http://localhost:3000/api/status');
    console.log('   GET  http://localhost:3000/api/mempool');
    console.log('   GET  http://localhost:3000/api/blockchain');
    console.log('   POST http://localhost:3000/api/transaction');
    console.log('   POST http://localhost:3000/api/connect');
}

main().catch(console.error);