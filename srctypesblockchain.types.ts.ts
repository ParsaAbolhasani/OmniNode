export interface Block {
    number: number;
    hash: string;
    parentHash: string;
    timestamp: number;
    transactions: string[];
    gasUsed: string;
    gasLimit: string;
    miner: string;
}

export interface Transaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    gasPrice: string;
    gas: string;
    blockNumber: number;
}

export interface RpcRequest {
    jsonrpc: string;
    method: string;
    params: any[];
    id: number;
}

export interface RpcResponse<T> {
    jsonrpc: string;
    id: number;
    result?: T;
    error?: {
        code: number;
        message: string;
    };
}