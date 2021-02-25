"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const BlockchainData_1 = require("../../../../src/internal/hardhat-network/provider/BlockchainData");
const Block_1 = require("../../../../src/internal/hardhat-network/provider/types/Block");
const blockchain_1 = require("../helpers/blockchain");
describe("BlockchainData", () => {
    let bd;
    function createBlock(number) {
        return new Block_1.Block({ header: { number } });
    }
    beforeEach(() => {
        bd = new BlockchainData_1.BlockchainData();
    });
    describe("addBlock", () => {
        it("saves the block and allows for queries", () => {
            var _a;
            const block1 = createBlock(1234);
            const tx1 = blockchain_1.createTestTransaction();
            const tx2 = blockchain_1.createTestTransaction();
            block1.transactions.push(tx1, tx2);
            const block2 = createBlock(5678);
            const tx3 = blockchain_1.createTestTransaction();
            block2.transactions.push(tx3);
            bd.addBlock(block1, new ethereumjs_util_1.BN(9000));
            chai_1.assert.equal(bd.getBlockByHash(block1.hash()), block1);
            chai_1.assert.equal(bd.getBlockByNumber(new ethereumjs_util_1.BN(1234)), block1);
            chai_1.assert.equal(bd.getBlockByTransactionHash(tx1.hash()), block1);
            chai_1.assert.equal(bd.getBlockByTransactionHash(tx2.hash()), block1);
            chai_1.assert.equal(bd.getTransaction(tx1.hash()), tx1);
            chai_1.assert.equal(bd.getTransaction(tx2.hash()), tx2);
            chai_1.assert.isTrue((_a = bd.getTotalDifficulty(block1.hash())) === null || _a === void 0 ? void 0 : _a.eqn(9000));
            chai_1.assert.equal(bd.getBlockByHash(block2.hash()), undefined);
            chai_1.assert.equal(bd.getBlockByNumber(new ethereumjs_util_1.BN(5678)), undefined);
            chai_1.assert.equal(bd.getBlockByTransactionHash(tx3.hash()), undefined);
            chai_1.assert.equal(bd.getTransaction(tx3.hash()), undefined);
            chai_1.assert.equal(bd.getTotalDifficulty(block2.hash()), undefined);
        });
    });
    describe("removeBlock", () => {
        it("removes the block and clears the associated queries", () => {
            var _a;
            const block1 = createBlock(1234);
            const tx1 = blockchain_1.createTestTransaction();
            const tx2 = blockchain_1.createTestTransaction();
            block1.transactions.push(tx1, tx2);
            const block2 = createBlock(5678);
            const tx3 = blockchain_1.createTestTransaction();
            block2.transactions.push(tx3);
            bd.addBlock(block1, new ethereumjs_util_1.BN(9000));
            bd.addBlock(block2, new ethereumjs_util_1.BN(10000));
            bd.removeBlock(block1);
            chai_1.assert.equal(bd.getBlockByHash(block1.hash()), undefined);
            chai_1.assert.equal(bd.getBlockByNumber(new ethereumjs_util_1.BN(1234)), undefined);
            chai_1.assert.equal(bd.getBlockByTransactionHash(tx1.hash()), undefined);
            chai_1.assert.equal(bd.getBlockByTransactionHash(tx2.hash()), undefined);
            chai_1.assert.equal(bd.getTransaction(tx1.hash()), undefined);
            chai_1.assert.equal(bd.getTransaction(tx2.hash()), undefined);
            chai_1.assert.equal(bd.getTotalDifficulty(block1.hash()), undefined);
            chai_1.assert.equal(bd.getBlockByHash(block2.hash()), block2);
            chai_1.assert.equal(bd.getBlockByNumber(new ethereumjs_util_1.BN(5678)), block2);
            chai_1.assert.equal(bd.getBlockByTransactionHash(tx3.hash()), block2);
            chai_1.assert.equal(bd.getTransaction(tx3.hash()), tx3);
            chai_1.assert.isTrue((_a = bd.getTotalDifficulty(block2.hash())) === null || _a === void 0 ? void 0 : _a.eqn(10000));
        });
        it("removes associated transaction receipts", () => {
            const block = createBlock(1234);
            const tx = blockchain_1.createTestTransaction();
            const receipt = blockchain_1.createTestReceipt(tx);
            block.transactions.push(tx);
            bd.addBlock(block, new ethereumjs_util_1.BN(1));
            bd.addTransactionReceipt(receipt);
            bd.removeBlock(block);
            chai_1.assert.equal(bd.getTransactionReceipt(tx.hash()), undefined);
        });
    });
    describe("addTransaction", () => {
        it("can save a transaction", () => {
            const tx = blockchain_1.createTestTransaction();
            bd.addTransaction(tx);
            chai_1.assert.equal(bd.getTransaction(tx.hash()), tx);
        });
    });
    describe("addTransactionReceipt", () => {
        it("can save a transaction receipt", () => {
            const tx = blockchain_1.createTestTransaction();
            const receipt = blockchain_1.createTestReceipt(tx);
            bd.addTransactionReceipt(receipt);
            chai_1.assert.equal(bd.getTransactionReceipt(tx.hash()), receipt);
        });
    });
    describe("getLogs", () => {
        it("can retrieve logs for a block from receipts", () => {
            const block1 = createBlock(100);
            const log1 = blockchain_1.createTestLog(100);
            const log2 = blockchain_1.createTestLog(100);
            const tx1 = blockchain_1.createTestTransaction();
            const receipt1 = blockchain_1.createTestReceipt(tx1, [log1, log2]);
            const tx2 = blockchain_1.createTestTransaction();
            const log3 = blockchain_1.createTestLog(100);
            const receipt2 = blockchain_1.createTestReceipt(tx2, [log3]);
            block1.transactions.push(tx1, tx2);
            const block2 = createBlock(101);
            const tx3 = blockchain_1.createTestTransaction();
            const log4 = blockchain_1.createTestLog(101);
            const receipt3 = blockchain_1.createTestReceipt(tx3, [log4]);
            block2.transactions.push(tx3);
            bd.addBlock(block1, new ethereumjs_util_1.BN(5000));
            bd.addBlock(block2, new ethereumjs_util_1.BN(1000));
            bd.addTransactionReceipt(receipt1);
            bd.addTransactionReceipt(receipt2);
            bd.addTransactionReceipt(receipt3);
            const logs = bd.getLogs({
                fromBlock: new ethereumjs_util_1.BN(90),
                toBlock: new ethereumjs_util_1.BN(100),
                addresses: [],
                normalizedTopics: [],
            });
            chai_1.assert.deepEqual(logs, [log1, log2, log3]);
        });
        it("returns [] for unknown blocks", () => {
            chai_1.assert.deepEqual(bd.getLogs({
                fromBlock: new ethereumjs_util_1.BN(0),
                toBlock: new ethereumjs_util_1.BN(100),
                addresses: [],
                normalizedTopics: [],
            }), []);
        });
        it("returns [] for blocks without receipts", () => {
            const tx1 = blockchain_1.createTestTransaction();
            const tx2 = blockchain_1.createTestTransaction();
            const block = createBlock(1234);
            block.transactions.push(tx1, tx2);
            bd.addBlock(block, new ethereumjs_util_1.BN(5000));
            chai_1.assert.deepEqual(bd.getLogs({
                fromBlock: new ethereumjs_util_1.BN(0),
                toBlock: new ethereumjs_util_1.BN(10000),
                addresses: [],
                normalizedTopics: [],
            }), []);
        });
    });
});
//# sourceMappingURL=BlockchainData.js.map