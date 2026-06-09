# 🌐 OmniNode

### Complete Full Node Implementation with PoW Consensus, LevelDB Persistence, P2P Networking, and Mempool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![libp2p](https://img.shields.io/badge/libp2p-Powered-blue)](https://libp2p.io/)

---

## 📌 Overview

**OmniNode** is a **production-grade, complete full node implementation** for a blockchain network. It demonstrates:

- 🔗 Blockchain Architecture – Blocks, chain validation, genesis block
- ⛏️ Proof of Work (PoW) Consensus – Mining with adjustable difficulty
- 🌍 P2P Networking – Peer-to-peer communication using libp2p
- 📦 Mempool – Transaction pool with validation and propagation
- 💾 Persistent Storage – LevelDB for blockchain and mempool persistence
- 🔐 Cryptographic Signatures – ECDSA for transaction signing and verification
- 👛 Wallet – Key generation, address creation, transaction signing
- 📡 HTTP API – RESTful interface for external interaction
- 🔄 Block Synchronization – Automatic sync with peers on connection

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| Full Node | Complete node with all core components |
| PoW Mining | Adjustable difficulty, nonce search, hash validation |
| P2P Network | libp2p-based peer discovery and messaging |
| Mempool | Transaction pool with validation and gossip propagation |
| LevelDB | Persistent storage for blockchain and mempool |
| ECDSA Signatures | secp256k1 for transaction authentication |
| Wallet | Key pair generation, address derivation, signing |
| Block Sync | Automatic synchronization with peers |
| REST API | Full HTTP interface for node interaction |

---


### Data Flow

1. Client sends transaction via HTTP API → Mempool
2. Mempool validates and stores transaction → P2P Broadcast
3. Miner picks transactions from mempool → PoW Mining
4. New Block is created → Blockchain + LevelDB
5. Block is broadcast to all peers → Peer Sync

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)


🛡️ Security Features

✅ ECDSA Signatures – All transactions are cryptographically signed
✅ Replay Attack Protection – Nonce-based transaction ordering
✅ PoW Validation – Each block must meet difficulty target
✅ Chain Validation – Full chain integrity check
✅ Peer Identity – Cryptographic peer IDs (libp2p)
✅ Encrypted Transport – Noise protocol for P2P communication

👨‍💻 Author
Parsa Abolhasani Rad – Senior Blockchain Engineer

🔗 www.linkedin.com/in/parsa-abolhasani-rad-

💻 https://github.com/ParsaAbolhasani

✉️ Parsaabolhasani9@gmail.com

📄 License
MIT
