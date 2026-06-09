import dotenv from 'dotenv';
import { NodeDB } from './db/leveldb.js';
import { Mempool } from './mempool/mempool.js';
import { Blockchain } from './blockchain/blockchain.js';
import { P2PNode } from './p2p/node.js';
import { ApiServer } from './api/server.js';
import { Wallet } from './wallet/wallet.js';
import { Transaction } from './transaction/tx.js';

dotenv.config();

async function main() {
    console.log('🚀 Starting Complete Full Node (PoW + LevelDB + P2P)...\n');

    // 1. Initialize Database
    const db = new NodeDB('./node-data');
    
    // 2. Initialize Mempool
    const mempool = new Mempool(db);
    await mempool.initialize();
    
    // 3. Create a wallet for mining rewards
    const minerWallet = new Wallet();
    console.log(`💰 Miner Wallet Address: ${minerWallet.address}`);
    
    // 4. P2P Handlers
    const handlers = {
        onTransaction: async (txData) => {
            const tx = Transaction.fromJSON(txData);
            await mempool.addTransaction(tx);
        },
        onBlock: async (blockData) => {
            await blockchain.addBlockFromPeer(blockData);
        },
        onGetBlocks: async () => {
            const latestBlock = await blockchain.getLatestBlock();
            const blocks = [];
            for (let i = 0; i <= latestBlock.index; i++) {
                const block = await blockchain.getBlockByIndex(i);
                if (block) blocks.push(block);
            }
            return blocks;
        },
        onBlocks: async (blocks) => {
            await blockchain.syncWithPeer(null, blocks);
        },
        onGetSavedPeers: async () => {
            return await db.getPeers();
        },
        onNewPeer: async (multiaddr) => {
            await db.putPeer(multiaddr);
        }
    };
    
    // 5. Initialize P2P Node
    const p2pNode = new P2PNode(process.env.PORT || 9000, handlers);
    await p2pNode.start();
    
    // 6. Initialize Blockchain
    const blockchain = new Blockchain(db, mempool, p2pNode, 4);
    await blockchain.initialize();
    
    // 7. Set blockchain reference in mempool
    mempool.setBlockchain(blockchain);
    
    // 8. Start API Server
    const apiServer = new ApiServer(mempool, blockchain, p2pNode, minerWallet, process.env.API_PORT || 3000);
    apiServer.start();
    
    // 9. Start mining loop (every 30 seconds if there are transactions)
    setInterval(async () => {
        const pendingCount = await mempool.getSize();
        if (pendingCount > 0) {
            await blockchain.mineNewBlock(minerWallet.address);
        }
    }, 30000);
    
    console.log('\n✅ Full Node Complete is running!');
    console.log('\n📋 Endpoints:');
    console.log('   GET  http://localhost:3000/api/status');
    console.log('   GET  http://localhost:3000/api/mempool');
    console.log('   GET  http://localhost:3000/api/blockchain');
    console.log('   GET  http://localhost:3000/api/wallet');
    console.log('   POST http://localhost:3000/api/transaction');
    console.log('   POST http://localhost:3000/api/mine');
    console.log('   POST http://localhost:3000/api/connect');
}

main().catch(console.error);