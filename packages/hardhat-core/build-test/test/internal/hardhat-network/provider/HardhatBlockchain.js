"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const util_1 = require("util");
const random_1 = require("../../../../src/internal/hardhat-network/provider/fork/random");
const HardhatBlockchain_1 = require("../../../../src/internal/hardhat-network/provider/HardhatBlockchain");
const Block_1 = require("../../../../src/internal/hardhat-network/provider/types/Block");
const PBlockchain_1 = require("../../../../src/internal/hardhat-network/provider/types/PBlockchain");
const blockchain_1 = require("../helpers/blockchain");
describe("HardhatBlockchain", () => {
    let blockchain;
    let callbackifiedBlockchain;
    let blocks;
    function createBlock(number, difficulty) {
        const parentHash = number === 0 ? ethereumjs_util_1.zeros(32) : blocks[number - 1].hash();
        const newBlock = new Block_1.Block({ header: { number, difficulty, parentHash } });
        blocks.push(newBlock);
        return newBlock;
    }
    beforeEach(() => {
        blockchain = new HardhatBlockchain_1.HardhatBlockchain();
        callbackifiedBlockchain = PBlockchain_1.toBlockchain(new HardhatBlockchain_1.HardhatBlockchain());
        blocks = [];
    });
    describe("getLatestBlock", () => {
        it("returns the latest block", async () => {
            await blockchain.addBlock(createBlock(0));
            const one = createBlock(1);
            await blockchain.addBlock(one);
            chai_1.assert.equal(await blockchain.getLatestBlock(), one);
        });
        it("throws when the blockchain is empty", async () => {
            await chai_1.assert.isRejected(blockchain.getLatestBlock(), Error, "No block available");
        });
    });
    describe("getBlock", () => {
        it("can get existing block by hash", async () => {
            const genesis = createBlock(0);
            const one = createBlock(1);
            await blockchain.addBlock(genesis);
            await blockchain.addBlock(one);
            chai_1.assert.equal(await blockchain.getBlock(one.hash()), one);
        });
        it("can get existing block by hash (callbackified)", async () => {
            const genesis = createBlock(0);
            const one = createBlock(1);
            await util_1.promisify(callbackifiedBlockchain.putBlock)(genesis);
            await util_1.promisify(callbackifiedBlockchain.putBlock)(one);
            const block = await util_1.promisify(callbackifiedBlockchain.getBlock)(one.hash());
            chai_1.assert.equal(block, one);
        });
        it("can get existing block by number", async () => {
            await blockchain.addBlock(createBlock(0));
            const one = createBlock(1);
            await blockchain.addBlock(one);
            chai_1.assert.equal(await blockchain.getBlock(1), one);
        });
        it("can get existing block by BN", async () => {
            await blockchain.addBlock(createBlock(0));
            const one = createBlock(1);
            await blockchain.addBlock(one);
            chai_1.assert.equal(await blockchain.getBlock(new ethereumjs_util_1.BN(1)), one);
        });
        it("returns undefined non-existent block", async () => {
            chai_1.assert.equal(await blockchain.getBlock(0), undefined);
            chai_1.assert.equal(await blockchain.getBlock(random_1.randomHashBuffer()), undefined);
        });
    });
    describe("putBlock", () => {
        it("can save genesis block", async () => {
            const genesis = createBlock(0);
            const returnedBlock = await blockchain.addBlock(genesis);
            const savedBlock = await blockchain.getBlock(0);
            chai_1.assert.equal(returnedBlock, genesis);
            chai_1.assert.equal(savedBlock, genesis);
        });
        it("can save genesis block (callbackified)", async () => {
            const genesis = createBlock(0);
            const returnedBlock = await util_1.promisify(callbackifiedBlockchain.putBlock)(genesis);
            const savedBlock = await util_1.promisify(callbackifiedBlockchain.getBlock)(0);
            chai_1.assert.equal(returnedBlock, genesis);
            chai_1.assert.equal(savedBlock, genesis);
        });
        it("rejects blocks with invalid block number", async () => {
            const block = new Block_1.Block({ header: { number: 1 } });
            await chai_1.assert.isRejected(blockchain.addBlock(block), Error, "Invalid block number");
        });
        it("rejects genesis block with invalid parent hash", async () => {
            const block = new Block_1.Block({
                header: { number: 0, parentHash: random_1.randomHashBuffer() },
            });
            await chai_1.assert.isRejected(blockchain.addBlock(block), Error, "Invalid parent hash");
        });
        it("rejects later block with invalid parent hash", async () => {
            const genesis = createBlock(0);
            await blockchain.addBlock(genesis);
            const block = new Block_1.Block({ header: { number: 1 } });
            await chai_1.assert.isRejected(blockchain.addBlock(block), Error, "Invalid parent hash");
        });
        it("can save multiple blocks", async () => {
            const blockOne = createBlock(0);
            const blockTwo = createBlock(1);
            const blockThree = createBlock(2);
            await blockchain.addBlock(blockOne);
            await blockchain.addBlock(blockTwo);
            await blockchain.addBlock(blockThree);
            chai_1.assert.equal(await blockchain.getBlock(0), blockOne);
            chai_1.assert.equal(await blockchain.getBlock(1), blockTwo);
            chai_1.assert.equal(await blockchain.getBlock(2), blockThree);
        });
    });
    describe("delBlock", () => {
        it("removes the block and all subsequent ones", async () => {
            const blockOne = createBlock(0);
            const blockTwo = createBlock(1);
            const blockThree = createBlock(2);
            await blockchain.addBlock(blockOne);
            await blockchain.addBlock(blockTwo);
            await blockchain.addBlock(blockThree);
            blockchain.deleteBlock(blockOne.hash());
            chai_1.assert.equal(await blockchain.getBlock(blockOne.hash()), undefined);
            chai_1.assert.equal(await blockchain.getBlock(blockTwo.hash()), undefined);
            chai_1.assert.equal(await blockchain.getBlock(blockThree.hash()), undefined);
        });
        it.skip("removes the block and all subsequent ones (callbackified)", async () => {
            const blockOne = createBlock(0);
            const blockTwo = createBlock(1);
            const blockThree = createBlock(2);
            await util_1.promisify(callbackifiedBlockchain.putBlock)(blockOne);
            await util_1.promisify(callbackifiedBlockchain.putBlock)(blockTwo);
            await util_1.promisify(callbackifiedBlockchain.putBlock)(blockThree);
            await util_1.promisify(callbackifiedBlockchain.delBlock)(blockOne.hash());
            const savedBlockOne = await util_1.promisify(callbackifiedBlockchain.getBlock)(blockOne.hash());
            const savedBlockTwo = await util_1.promisify(callbackifiedBlockchain.getBlock)(blockTwo.hash());
            const savedBlockThree = await util_1.promisify(callbackifiedBlockchain.getBlock)(blockThree.hash());
            chai_1.assert.equal(savedBlockOne, undefined);
            chai_1.assert.equal(savedBlockTwo, undefined);
            chai_1.assert.equal(savedBlockThree, undefined);
        });
        it("updates the latest block number", async () => {
            const blockOne = createBlock(0);
            const blockTwo = createBlock(1);
            const blockThree = createBlock(2);
            await blockchain.addBlock(blockOne);
            await blockchain.addBlock(blockTwo);
            blockchain.deleteBlock(blockTwo.hash());
            chai_1.assert.equal(await blockchain.getLatestBlock(), blockOne);
            await chai_1.assert.isRejected(blockchain.addBlock(blockThree), Error, "Invalid block number");
        });
        it("is possible to add a block after delete", async () => {
            const block = createBlock(0);
            const otherBlock = createBlock(0, random_1.randomHashBuffer());
            await blockchain.addBlock(block);
            blockchain.deleteBlock(block.hash());
            await blockchain.addBlock(otherBlock);
            chai_1.assert.equal(await blockchain.getBlock(otherBlock.hash()), otherBlock);
        });
        it("throws when hash if non-existent block is given", async () => {
            const block = createBlock(0);
            chai_1.assert.throws(() => blockchain.deleteBlock(block.hash()), Error, "Block not found");
        });
    });
    describe("deleteAllFollowingBlocks", () => {
        it("removes all blocks subsequent to the given block", async () => {
            const blockOne = createBlock(0);
            const blockTwo = createBlock(1);
            const blockThree = createBlock(2);
            await blockchain.addBlock(blockOne);
            await blockchain.addBlock(blockTwo);
            await blockchain.addBlock(blockThree);
            blockchain.deleteLaterBlocks(blockOne);
            chai_1.assert.equal(await blockchain.getBlock(blockOne.hash()), blockOne);
            chai_1.assert.equal(await blockchain.getBlock(blockTwo.hash()), undefined);
            chai_1.assert.equal(await blockchain.getBlock(blockThree.hash()), undefined);
        });
        it("throws if given block is not present in blockchain", async () => {
            const blockOne = createBlock(0);
            const notAddedBlock = createBlock(1);
            const fakeBlockOne = createBlock(0, random_1.randomHashBuffer());
            await blockchain.addBlock(blockOne);
            chai_1.assert.throws(() => blockchain.deleteLaterBlocks(notAddedBlock), Error, "Invalid block");
            chai_1.assert.throws(() => blockchain.deleteLaterBlocks(fakeBlockOne), Error, "Invalid block");
        });
        it("does not throw if there are no following blocks", async () => {
            const blockOne = createBlock(0);
            await blockchain.addBlock(blockOne);
            chai_1.assert.doesNotThrow(() => blockchain.deleteLaterBlocks(blockOne));
        });
    });
    describe("getBlockTotalDifficulty", () => {
        it("rejects when hash of non-existent block is given", async () => {
            await chai_1.assert.isRejected(blockchain.getTotalDifficulty(random_1.randomHashBuffer()), Error, "Block not found");
        });
        it("can get difficulty of the genesis block", async () => {
            const genesis = createBlock(0, 1000);
            await blockchain.addBlock(genesis);
            const difficulty = await blockchain.getTotalDifficulty(genesis.hash());
            chai_1.assert.equal(difficulty.toNumber(), 1000);
        });
        it("can get total difficulty of the second block", async () => {
            const genesis = createBlock(0, 1000);
            const second = createBlock(1, 2000);
            await blockchain.addBlock(genesis);
            await blockchain.addBlock(second);
            const difficulty = await blockchain.getTotalDifficulty(second.hash());
            chai_1.assert.equal(difficulty.toNumber(), 3000);
        });
        it("does not return total difficulty of a deleted block", async () => {
            const blockOne = createBlock(0, 1000);
            const blockTwo = createBlock(1, 2000);
            await blockchain.addBlock(blockOne);
            await blockchain.addBlock(blockTwo);
            blockchain.deleteLaterBlocks(blockOne);
            chai_1.assert.equal((await blockchain.getTotalDifficulty(blockOne.hash())).toNumber(), 1000);
            await chai_1.assert.isRejected(blockchain.getTotalDifficulty(blockTwo.hash()), Error, "Block not found");
        });
    });
    function hasGetTransactionBehaviour(getTransaction) {
        it("returns undefined unknown transactions", async () => {
            const transaction = blockchain_1.createTestTransaction();
            chai_1.assert.isUndefined(await getTransaction(transaction.hash()));
        });
        it("returns a known transaction", async () => {
            const genesis = createBlock(0, 1000);
            await blockchain.addBlock(genesis);
            const block = createBlock(1, 1000);
            const transaction = blockchain_1.createTestTransaction();
            block.transactions.push(transaction);
            await blockchain.addBlock(block);
            const result = await getTransaction(transaction.hash());
            chai_1.assert.equal(result, transaction);
        });
        it("forgets transactions after block is removed", async () => {
            const genesis = createBlock(0, 1000);
            await blockchain.addBlock(genesis);
            const block = createBlock(1, 1000);
            const transaction = blockchain_1.createTestTransaction();
            block.transactions.push(transaction);
            await blockchain.addBlock(block);
            blockchain.deleteBlock(block.hash());
            chai_1.assert.isUndefined(await getTransaction(transaction.hash()));
        });
    }
    describe("getTransaction", function () {
        hasGetTransactionBehaviour((hash) => blockchain.getTransaction(hash));
    });
    describe("getLocalTransaction", function () {
        hasGetTransactionBehaviour((hash) => blockchain.getLocalTransaction(hash));
    });
    describe("getBlockByTransactionHash", () => {
        it("returns undefined for unknown transactions", async () => {
            const transaction = blockchain_1.createTestTransaction();
            chai_1.assert.equal(await blockchain.getBlockByTransactionHash(transaction.hash()), undefined);
        });
        it("returns block for a known transaction", async () => {
            const genesis = createBlock(0, 1000);
            await blockchain.addBlock(genesis);
            const block = createBlock(1, 1000);
            const transaction = blockchain_1.createTestTransaction();
            block.transactions.push(transaction);
            await blockchain.addBlock(block);
            const result = await blockchain.getBlockByTransactionHash(transaction.hash());
            chai_1.assert.equal(result, block);
        });
        it("forgets transactions after block is removed", async () => {
            const genesis = createBlock(0, 1000);
            await blockchain.addBlock(genesis);
            const block = createBlock(1, 1000);
            const transaction = blockchain_1.createTestTransaction();
            block.transactions.push(transaction);
            await blockchain.addBlock(block);
            blockchain.deleteBlock(block.hash());
            chai_1.assert.equal(await blockchain.getBlockByTransactionHash(transaction.hash()), undefined);
        });
    });
    describe("getTransactionReceipt", () => {
        it("returns undefined for unknown transactions", async () => {
            const transaction = blockchain_1.createTestTransaction();
            chai_1.assert.equal(await blockchain.getTransactionReceipt(transaction.hash()), undefined);
        });
        it("returns undefined for a known transaction without receipt", async () => {
            const genesis = createBlock(0, 1000);
            await blockchain.addBlock(genesis);
            const block = createBlock(1, 1000);
            const transaction = blockchain_1.createTestTransaction();
            block.transactions.push(transaction);
            await blockchain.addBlock(block);
            chai_1.assert.equal(await blockchain.getTransactionReceipt(transaction.hash()), undefined);
        });
        it("returns the receipt when it was provided earlier", async () => {
            const genesis = createBlock(0, 1000);
            await blockchain.addBlock(genesis);
            const block = createBlock(1, 1000);
            const transaction = blockchain_1.createTestTransaction();
            const receipt = blockchain_1.createTestReceipt(transaction);
            block.transactions.push(transaction);
            await blockchain.addBlock(block);
            blockchain.addTransactionReceipts([receipt]);
            chai_1.assert.equal(await blockchain.getTransactionReceipt(transaction.hash()), receipt);
        });
        it("forgets receipts after block is removed", async () => {
            const genesis = createBlock(0, 1000);
            await blockchain.addBlock(genesis);
            const block = createBlock(1, 1000);
            const transaction = blockchain_1.createTestTransaction();
            const receipt = blockchain_1.createTestReceipt(transaction);
            block.transactions.push(transaction);
            await blockchain.addBlock(block);
            blockchain.addTransactionReceipts([receipt]);
            blockchain.deleteBlock(block.hash());
            chai_1.assert.equal(await blockchain.getTransactionReceipt(transaction.hash()), undefined);
        });
    });
    describe("getLogs", () => {
        it("works like BlockchainData.getLogs", async () => {
            const block1 = createBlock(0);
            const log1 = blockchain_1.createTestLog(0);
            const log2 = blockchain_1.createTestLog(0);
            const tx1 = blockchain_1.createTestTransaction();
            const receipt1 = blockchain_1.createTestReceipt(tx1, [log1, log2]);
            const tx2 = blockchain_1.createTestTransaction();
            const log3 = blockchain_1.createTestLog(0);
            const receipt2 = blockchain_1.createTestReceipt(tx2, [log3]);
            block1.transactions.push(tx1, tx2);
            const block2 = createBlock(1);
            const tx3 = blockchain_1.createTestTransaction();
            const log4 = blockchain_1.createTestLog(1);
            const receipt3 = blockchain_1.createTestReceipt(tx3, [log4]);
            block2.transactions.push(tx3);
            await blockchain.addBlock(block1);
            await blockchain.addBlock(block2);
            blockchain.addTransactionReceipts([receipt1, receipt2, receipt3]);
            const logs = await blockchain.getLogs({
                fromBlock: new ethereumjs_util_1.BN(0),
                toBlock: new ethereumjs_util_1.BN(0),
                addresses: [],
                normalizedTopics: [],
            });
            chai_1.assert.deepEqual(logs, [log1, log2, log3]);
        });
    });
});
//# sourceMappingURL=HardhatBlockchain.js.map