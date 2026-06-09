// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleBlockchain {
    struct Transaction {
        address from;
        address to;
        uint256 amount;
    }

    struct Block {
        uint256 blockId;
        uint256 timestamp;
        bytes32 previousHash;
        bytes32 hash;
        bytes32 transactionsHash; 
    }

    Block[] public chain;
    mapping(uint256 => Transaction[]) public blockTransactions; 
    address public owner;

    event NewBlock(uint256 indexed blockId, bytes32 blockHash, uint256 timestamp);
    event TransactionAdded(uint256 indexed blockId, address from, address to, uint256 amount);

    constructor() {
        owner = msg.sender;
        _createGenesisBlock();
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can mine");
        _;
    }

    function _calculateTransactionsHash(Transaction[] memory _transactions) internal pure returns (bytes32) {
        if (_transactions.length == 0) {
            return keccak256(abi.encodePacked(uint256(0)));
        }
        bytes32 hash = keccak256(abi.encodePacked(_transactions[0].from, _transactions[0].to, _transactions[0].amount));
        for (uint256 i = 1; i < _transactions.length; i++) {
            hash = keccak256(abi.encodePacked(hash, _transactions[i].from, _transactions[i].to, _transactions[i].amount));
        }
        return hash;
    }

    function _createGenesisBlock() internal {
        bytes32 genesisHash = keccak256(abi.encodePacked(uint256(0), block.timestamp, "GENESIS"));
        
        Block memory genesis = Block({
            blockId: 0,
            timestamp: block.timestamp,
            previousHash: bytes32(0),
            hash: genesisHash,
            transactionsHash: keccak256(abi.encodePacked(uint256(0)))
        });
        
        chain.push(genesis);
        emit NewBlock(0, genesisHash, block.timestamp);
    }

    function _calculateBlockHash(
        uint256 _blockId,
        uint256 _timestamp,
        bytes32 _previousHash,
        bytes32 _transactionsHash
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            uint256(_blockId),
            uint256(_timestamp),
            _previousHash,
            _transactionsHash
        ));
    }

    function mineBlock(Transaction[] memory _transactions) external onlyOwner {
        uint256 newId = chain.length;
        Block memory previousBlock = chain[chain.length - 1];
        
        bytes32 transactionsHash = _calculateTransactionsHash(_transactions);
        
        bytes32 newHash = _calculateBlockHash(
            newId,
            block.timestamp,
            previousBlock.hash,
            transactionsHash
        );

        Block memory newBlock = Block({
            blockId: newId,
            timestamp: block.timestamp,
            previousHash: previousBlock.hash,
            hash: newHash,
            transactionsHash: transactionsHash
        });

        chain.push(newBlock);
        
      
        for (uint256 i = 0; i < _transactions.length; i++) {
            blockTransactions[newId].push(_transactions[i]);
            emit TransactionAdded(newId, _transactions[i].from, _transactions[i].to, _transactions[i].amount);
        }
        
        emit NewBlock(newId, newHash, block.timestamp);
    }

    function getBlock(uint256 _blockId) public view returns (
        uint256 blockId,
        uint256 timestamp,
        bytes32 previousHash,
        bytes32 hash,
        bytes32 transactionsHash
    ) {
        require(_blockId < chain.length, "Block does not exist");
        Block storage b = chain[_blockId];
        return (b.blockId, b.timestamp, b.previousHash, b.hash, b.transactionsHash);
    }

    function getBlockTransactions(uint256 _blockId) public view returns (Transaction[] memory) {
        require(_blockId < chain.length, "Block does not exist");
        return blockTransactions[_blockId];
    }

    function getLatestBlock() public view returns (
        uint256 blockId,
        uint256 timestamp,
        bytes32 previousHash,
        bytes32 hash,
        bytes32 transactionsHash
    ) {
        return getBlock(chain.length - 1);
    }

    function isChainValid() public view returns (bool) {
        for (uint256 i = 1; i < chain.length; i++) {
            Block memory current = chain[i];
            Block memory previous = chain[i - 1];

            bytes32 calculatedHash = _calculateBlockHash(
                current.blockId,
                current.timestamp,
                previous.hash,
                current.transactionsHash
            );

            if (current.hash != calculatedHash) return false;
            if (current.previousHash != previous.hash) return false;
        }
        return true;
    }

    function getChainLength() public view returns (uint256) {
        return chain.length;
    }
}