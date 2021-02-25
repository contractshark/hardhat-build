"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForkBlockchain = void 0;
const ethereumjs_util_1 = require("ethereumjs-util");
const BlockchainData_1 = require("../BlockchainData");
const output_1 = require("../output");
const Block_1 = require("../types/Block");
const PBlockchain_1 = require("../types/PBlockchain");
const ForkTransaction_1 = require("./ForkTransaction");
const rpcToBlockData_1 = require("./rpcToBlockData");
const rpcToTxData_1 = require("./rpcToTxData");
/* tslint:disable only-hardhat-error */
class ForkBlockchain {
    constructor(_jsonRpcClient, _forkBlockNumber, _common) {
        this._jsonRpcClient = _jsonRpcClient;
        this._forkBlockNumber = _forkBlockNumber;
        this._common = _common;
        this._data = new BlockchainData_1.BlockchainData();
        this._latestBlockNumber = this._forkBlockNumber;
    }
    async getLatestBlock() {
        const block = await this.getBlock(this._latestBlockNumber);
        if (block === undefined) {
            throw new Error("Block not found");
        }
        return block;
    }
    async getBlock(blockHashOrNumber) {
        if (Buffer.isBuffer(blockHashOrNumber)) {
            return this._getBlockByHash(blockHashOrNumber);
        }
        return this._getBlockByNumber(new ethereumjs_util_1.BN(blockHashOrNumber));
    }
    async addBlock(block) {
        const blockNumber = new ethereumjs_util_1.BN(block.header.number);
        if (!blockNumber.eq(this._latestBlockNumber.addn(1))) {
            throw new Error("Invalid block number");
        }
        // When forking a network whose consensus is not the classic PoW,
        // we can't calculate the hash correctly.
        // Thus, we avoid this check for the first block after the fork.
        if (blockNumber.gt(this._forkBlockNumber.addn(1))) {
            const parent = await this.getLatestBlock();
            if (!block.header.parentHash.equals(parent.hash())) {
                throw new Error("Invalid parent hash");
            }
        }
        this._latestBlockNumber = this._latestBlockNumber.addn(1);
        const totalDifficulty = await this._computeTotalDifficulty(block);
        this._data.addBlock(block, totalDifficulty);
        return block;
    }
    deleteBlock(blockHash) {
        const block = this._data.getBlockByHash(blockHash);
        if (block === undefined) {
            throw new Error("Block not found");
        }
        this._delBlock(block);
    }
    deleteLaterBlocks(block) {
        const blockNumber = new ethereumjs_util_1.BN(block.header.number);
        const savedBlock = this._data.getBlockByNumber(blockNumber);
        if (savedBlock === undefined || !savedBlock.hash().equals(block.hash())) {
            throw new Error("Invalid block");
        }
        const nextBlockNumber = blockNumber.addn(1);
        if (this._forkBlockNumber.gte(nextBlockNumber)) {
            throw new Error("Cannot delete remote block");
        }
        const nextBlock = this._data.getBlockByNumber(nextBlockNumber);
        if (nextBlock !== undefined) {
            return this._delBlock(nextBlock);
        }
    }
    async getTotalDifficulty(blockHash) {
        let td = this._data.getTotalDifficulty(blockHash);
        if (td !== undefined) {
            return td;
        }
        const block = await this.getBlock(blockHash);
        if (block === undefined) {
            throw new Error("Block not found");
        }
        td = this._data.getTotalDifficulty(blockHash);
        if (td === undefined) {
            throw new Error("This should never happen");
        }
        return td;
    }
    async getTransaction(transactionHash) {
        const tx = this.getLocalTransaction(transactionHash);
        if (tx === undefined) {
            const remote = await this._jsonRpcClient.getTransactionByHash(transactionHash);
            return this._processRemoteTransaction(remote);
        }
        return tx;
    }
    getLocalTransaction(transactionHash) {
        return this._data.getTransaction(transactionHash);
    }
    async getBlockByTransactionHash(transactionHash) {
        let block = this._data.getBlockByTransactionHash(transactionHash);
        if (block === undefined) {
            const remote = await this._jsonRpcClient.getTransactionByHash(transactionHash);
            this._processRemoteTransaction(remote);
            if (remote !== null && remote.blockHash !== null) {
                await this.getBlock(remote.blockHash);
                block = this._data.getBlockByTransactionHash(transactionHash);
            }
        }
        return block;
    }
    async getTransactionReceipt(transactionHash) {
        const local = this._data.getTransactionReceipt(transactionHash);
        if (local !== undefined) {
            return local;
        }
        const remote = await this._jsonRpcClient.getTransactionReceipt(transactionHash);
        if (remote !== null) {
            return this._processRemoteReceipt(remote);
        }
    }
    addTransactionReceipts(receipts) {
        for (const receipt of receipts) {
            this._data.addTransactionReceipt(receipt);
        }
    }
    async getLogs(filterParams) {
        if (filterParams.fromBlock.lte(this._forkBlockNumber)) {
            let toBlock = filterParams.toBlock;
            let localLogs = [];
            if (toBlock.gt(this._forkBlockNumber)) {
                toBlock = this._forkBlockNumber;
                localLogs = this._data.getLogs(Object.assign(Object.assign({}, filterParams), { fromBlock: this._forkBlockNumber.addn(1) }));
            }
            const remoteLogs = await this._jsonRpcClient.getLogs({
                fromBlock: filterParams.fromBlock,
                toBlock,
                address: filterParams.addresses.length === 1
                    ? filterParams.addresses[0]
                    : filterParams.addresses,
                topics: filterParams.normalizedTopics,
            });
            return remoteLogs
                .map((log, index) => output_1.toRpcLogOutput(log, index))
                .concat(localLogs);
        }
        return this._data.getLogs(filterParams);
    }
    asBlockchain() {
        return PBlockchain_1.toBlockchain(this);
    }
    async _getBlockByHash(blockHash) {
        const block = this._data.getBlockByHash(blockHash);
        if (block !== undefined) {
            return block;
        }
        const rpcBlock = await this._jsonRpcClient.getBlockByHash(blockHash, true);
        return this._processRemoteBlock(rpcBlock);
    }
    async _getBlockByNumber(blockNumber) {
        if (blockNumber.gt(this._latestBlockNumber)) {
            return undefined;
        }
        const block = this._data.getBlockByNumber(blockNumber);
        if (block !== undefined) {
            return block;
        }
        const rpcBlock = await this._jsonRpcClient.getBlockByNumber(blockNumber, true);
        return this._processRemoteBlock(rpcBlock);
    }
    async _processRemoteBlock(rpcBlock) {
        if (rpcBlock === null ||
            rpcBlock.hash === null ||
            rpcBlock.number === null ||
            rpcBlock.number.gt(this._forkBlockNumber)) {
            return undefined;
        }
        // we don't include the transactions to add our own custom ForkTransaction txs
        const blockData = rpcToBlockData_1.rpcToBlockData(Object.assign(Object.assign({}, rpcBlock), { transactions: [] }));
        const block = new Block_1.Block(blockData, { common: this._common });
        const chainId = this._jsonRpcClient.getNetworkId();
        for (const transaction of rpcBlock.transactions) {
            block.transactions.push(new ForkTransaction_1.ForkTransaction(chainId, rpcToTxData_1.rpcToTxData(transaction), {
                common: this._common,
            }));
        }
        this._data.addBlock(block, rpcBlock.totalDifficulty);
        return block;
    }
    async _computeTotalDifficulty(block) {
        var _a;
        const difficulty = new ethereumjs_util_1.BN(block.header.difficulty);
        const blockNumber = new ethereumjs_util_1.BN(block.header.number);
        if (blockNumber.eqn(0)) {
            return difficulty;
        }
        const parentBlock = (_a = this._data.getBlockByNumber(blockNumber.subn(1))) !== null && _a !== void 0 ? _a : (await this.getBlock(blockNumber.subn(1)));
        if (parentBlock === undefined) {
            throw new Error("Block not found");
        }
        const parentHash = parentBlock.hash();
        const parentTD = this._data.getTotalDifficulty(parentHash);
        if (parentTD === undefined) {
            throw new Error("This should never happen");
        }
        return parentTD.add(difficulty);
    }
    _delBlock(block) {
        if (new ethereumjs_util_1.BN(block.header.number).lte(this._forkBlockNumber)) {
            throw new Error("Cannot delete remote block");
        }
        const blockNumber = ethereumjs_util_1.bufferToInt(block.header.number);
        for (let i = blockNumber; this._latestBlockNumber.gten(i); i++) {
            const current = this._data.getBlockByNumber(new ethereumjs_util_1.BN(i));
            if (current !== undefined) {
                this._data.removeBlock(current);
            }
        }
        this._latestBlockNumber = new ethereumjs_util_1.BN(blockNumber).subn(1);
    }
    _processRemoteTransaction(rpcTransaction) {
        if (rpcTransaction === null ||
            rpcTransaction.blockNumber === null ||
            rpcTransaction.blockNumber.gt(this._forkBlockNumber)) {
            return undefined;
        }
        const chainId = this._jsonRpcClient.getNetworkId();
        const transaction = new ForkTransaction_1.ForkTransaction(chainId, rpcToTxData_1.rpcToTxData(rpcTransaction), {
            common: this._common,
        });
        this._data.addTransaction(transaction);
        return transaction;
    }
    _processRemoteReceipt(txReceipt) {
        if (txReceipt === null || txReceipt.blockNumber.gt(this._forkBlockNumber)) {
            return undefined;
        }
        const receipt = output_1.toRpcReceiptOutput(txReceipt);
        this._data.addTransactionReceipt(receipt);
        return receipt;
    }
}
exports.ForkBlockchain = ForkBlockchain;
//# sourceMappingURL=ForkBlockchain.js.map