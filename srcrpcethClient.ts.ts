import axios, { AxiosInstance } from 'axios';
import { Block, Transaction, RpcRequest, RpcResponse } from '../types/blockchain.types';

export class EthClient {
    private client: AxiosInstance;
    private requestId: number = 1;

    constructor(rpcUrl: string) {
        this.client = axios.create({
            baseURL: rpcUrl,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
    }

    private async call<T>(method: string, params: any[] = []): Promise<T> {
        const request: RpcRequest = {
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: this.requestId++,
        };

        const response = await this.client.post<RpcResponse<T>>('', request);
        
        if (response.data.error) {
            throw new Error(`RPC Error: ${response.data.error.message} (code: ${response.data.error.code})`);
        }

        return response.data.result as T;
    }

    async getBlockNumber(): Promise<number> {
        const result = await this.call<string>('eth_blockNumber');
        return parseInt(result, 16);
    }

    async getBlockByNumber(blockNumber: number, includeTransactions: boolean = true): Promise<Block | null> {
        const hexBlockNumber = '0x' + blockNumber.toString(16);
        const result = await this.call<any>('eth_getBlockByNumber', [hexBlockNumber, includeTransactions]);
        
        if (!result) return null;

        return {
            number: parseInt(result.number, 16),
            hash: result.hash,
            parentHash: result.parentHash,
            timestamp: parseInt(result.timestamp, 16),
            transactions: result.transactions,
            gasUsed: result.gasUsed,
            gasLimit: result.gasLimit,
            miner: result.miner,
        };
    }

    async getLatestBlock(includeTransactions: boolean = true): Promise<Block | null> {
        const result = await this.call<any>('eth_getBlockByNumber', ['latest', includeTransactions]);
        
        if (!result) return null;

        return {
            number: parseInt(result.number, 16),
            hash: result.hash,
            parentHash: result.parentHash,
            timestamp: parseInt(result.timestamp, 16),
            transactions: result.transactions,
            gasUsed: result.gasUsed,
            gasLimit: result.gasLimit,
            miner: result.miner,
        };
    }

    async getTransaction(txHash: string): Promise<Transaction | null> {
        const result = await this.call<any>('eth_getTransactionByHash', [txHash]);
        
        if (!result) return null;

        return {
            hash: result.hash,
            from: result.from,
            to: result.to,
            value: result.value,
            gasPrice: result.gasPrice,
            gas: result.gas,
            blockNumber: parseInt(result.blockNumber, 16),
        };
    }

    async getBalance(address: string, block: string = 'latest'): Promise<string> {
        const result = await this.call<string>('eth_getBalance', [address, block]);
        return result;
    }

    async getGasPrice(): Promise<string> {
        return await this.call<string>('eth_gasPrice');
    }

    async sendRawTransaction(signedTx: string): Promise<string> {
        return await this.call<string>('eth_sendRawTransaction', [signedTx]);
    }
}