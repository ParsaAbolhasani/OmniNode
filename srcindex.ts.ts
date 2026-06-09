import dotenv from 'dotenv';
import { EthClient } from './rpc/ethClient';

dotenv.config();

const RPC_URL = process.env.ETH_RPC_URL || 'https://ethereum.publicnode.com';

async function main() {
    console.log('🚀 Starting Ethereum RPC Client (Full Node Communication Layer)\n');
    
    const client = new EthClient(RPC_URL);
    
    try {
        // 1. دریافت شماره آخرین بلاک
        const blockNumber = await client.getBlockNumber();
        console.log(`📦 Latest Block Number: ${blockNumber}`);
        
        // 2. دریافت آخرین بلاک
        const latestBlock = await client.getLatestBlock(true);
        if (latestBlock) {
            console.log(`\n📄 Latest Block:`);
            console.log(`   Hash: ${latestBlock.hash}`);
            console.log(`   Miner: ${latestBlock.miner}`);
            console.log(`   Transactions: ${latestBlock.transactions.length}`);
            console.log(`   Gas Used: ${latestBlock.gasUsed}`);
        }
        
        // 3. دریافت قیمت گس
        const gasPrice = await client.getGasPrice();
        console.log(`\n⛽ Current Gas Price: ${parseInt(gasPrice, 16)} wei`);
        
        // 4. دریافت بیلنس یک آدرس معروف (Vitalik)
        const vitalikAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
        const balance = await client.getBalance(vitalikAddress);
        const balanceInEth = parseInt(balance, 16) / 1e18;
        console.log(`\n💰 Vitalik's Balance: ${balanceInEth} ETH`);
        
        console.log('\n✅ RPC Client is running successfully!');
        console.log('💡 This is how a Full Node communicates with the blockchain network');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

main();