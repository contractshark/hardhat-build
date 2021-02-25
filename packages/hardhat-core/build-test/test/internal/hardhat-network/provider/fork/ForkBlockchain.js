"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_common_1 = __importDefault(require("ethereumjs-common"));
const ethereumjs_util_1 = require("ethereumjs-util");
const ForkBlockchain_1 = require("../../../../../src/internal/hardhat-network/provider/fork/ForkBlockchain");
const random_1 = require("../../../../../src/internal/hardhat-network/provider/fork/random");
const Block_1 = require("../../../../../src/internal/hardhat-network/provider/types/Block");
const makeForkClient_1 = require("../../../../../src/internal/hardhat-network/provider/utils/makeForkClient");
const setup_1 = require("../../../../setup");
const blockchain_1 = require("../../helpers/blockchain");
const constants_1 = require("../../helpers/constants");
describe("ForkBlockchain", () => {
    let client;
    let forkBlockNumber;
    let common;
    let fb;
    function createBlock(parent, difficulty = ethereumjs_util_1.zeros(32)) {
        return new Block_1.Block({
            header: {
                number: new ethereumjs_util_1.BN(parent.header.number).addn(1),
                parentHash: parent.hash(),
                difficulty,
            },
        }, { common });
    }
    before(async function () {
        if (setup_1.ALCHEMY_URL === undefined || setup_1.ALCHEMY_URL === "") {
            this.skip();
            return;
        }
    });
    beforeEach(async () => {
        const clientResult = await makeForkClient_1.makeForkClient({ jsonRpcUrl: setup_1.ALCHEMY_URL });
        client = clientResult.forkClient;
        forkBlockNumber = clientResult.forkBlockNumber;
        common = new ethereumjs_common_1.default("mainnet");
        common.setHardfork(common.activeHardfork(forkBlockNumber.toNumber()));
        fb = new ForkBlockchain_1.ForkBlockchain(client, forkBlockNumber, common);
    });
    it("can be constructed", () => {
        chai_1.assert.instanceOf(fb, ForkBlockchain_1.ForkBlockchain);
    });
    describe("getBlock", () => {
        it("can get remote block object by block number", async () => {
            const block = await fb.getBlock(constants_1.BLOCK_NUMBER_OF_10496585);
            chai_1.assert.isTrue(block === null || block === void 0 ? void 0 : block.hash().equals(constants_1.BLOCK_HASH_OF_10496585));
            chai_1.assert.equal(block === null || block === void 0 ? void 0 : block.transactions.length, 192);
            chai_1.assert.isTrue(block === null || block === void 0 ? void 0 : block.transactions[0].hash().equals(constants_1.FIRST_TX_HASH_OF_10496585));
            chai_1.assert.isTrue(block === null || block === void 0 ? void 0 : block.transactions[191].hash().equals(constants_1.LAST_TX_HASH_OF_10496585));
        });
        it("can get remote block object by hash", async () => {
            const block = await fb.getBlock(constants_1.BLOCK_HASH_OF_10496585);
            chai_1.assert.isTrue(block === null || block === void 0 ? void 0 : block.hash().equals(constants_1.BLOCK_HASH_OF_10496585));
            chai_1.assert.equal(block === null || block === void 0 ? void 0 : block.transactions.length, 192);
            chai_1.assert.isTrue(block === null || block === void 0 ? void 0 : block.transactions[0].hash().equals(constants_1.FIRST_TX_HASH_OF_10496585));
            chai_1.assert.isTrue(block === null || block === void 0 ? void 0 : block.transactions[191].hash().equals(constants_1.LAST_TX_HASH_OF_10496585));
        });
        it("caches the block object and returns the same one for subsequent calls", async () => {
            const blockOne = await fb.getBlock(constants_1.BLOCK_NUMBER_OF_10496585);
            const blockTwo = await fb.getBlock(constants_1.BLOCK_HASH_OF_10496585);
            const blockThree = await fb.getBlock(constants_1.BLOCK_NUMBER_OF_10496585);
            const blockFour = await fb.getBlock(constants_1.BLOCK_HASH_OF_10496585);
            chai_1.assert.equal(blockOne, blockTwo);
            chai_1.assert.equal(blockTwo, blockThree);
            chai_1.assert.equal(blockThree, blockFour);
        });
        it("returns undefined for non-existent block", async () => {
            chai_1.assert.equal(await fb.getBlock(random_1.randomHashBuffer()), undefined);
            chai_1.assert.equal(await fb.getBlock(forkBlockNumber.addn(100)), undefined);
        });
        it("can get remote block object with create transaction", async () => {
            const daiCreationBlock = new ethereumjs_util_1.BN(4719568);
            const daiCreateTxPosition = 85;
            const block = await fb.getBlock(daiCreationBlock);
            chai_1.assert.isTrue(block === null || block === void 0 ? void 0 : block.transactions[daiCreateTxPosition].to.equals(Buffer.from([])));
            chai_1.assert.isTrue(block === null || block === void 0 ? void 0 : block.transactions[daiCreateTxPosition].hash().equals(ethereumjs_util_1.toBuffer("0xb95343413e459a0f97461812111254163ae53467855c0d73e0f1e7c5b8442fa3")));
        });
        it("cannot get remote blocks that are newer than forkBlockNumber", async () => {
            fb = new ForkBlockchain_1.ForkBlockchain(client, forkBlockNumber.subn(10), common);
            const newerBlock = await client.getBlockByNumber(forkBlockNumber.subn(5));
            chai_1.assert.equal(await fb.getBlock(newerBlock.hash), undefined);
            chai_1.assert.equal(await fb.getBlock(newerBlock.hash), undefined);
            chai_1.assert.equal(await fb.getBlock(forkBlockNumber.subn(5)), undefined);
            chai_1.assert.equal(await fb.getBlock(forkBlockNumber.subn(5)), undefined);
        });
        it("can retrieve inserted block by hash", async () => {
            const block = createBlock(await fb.getLatestBlock());
            await fb.addBlock(block);
            const savedBlock = await fb.getBlock(block.hash());
            chai_1.assert.equal(savedBlock, block);
        });
    });
    describe("getLatestBlock", () => {
        it("returns the block at which we fork if no blocks were added", async () => {
            fb = new ForkBlockchain_1.ForkBlockchain(client, constants_1.BLOCK_NUMBER_OF_10496585, common);
            const block = await fb.getLatestBlock();
            chai_1.assert.isTrue(block === null || block === void 0 ? void 0 : block.hash().equals(constants_1.BLOCK_HASH_OF_10496585));
            chai_1.assert.equal(block === null || block === void 0 ? void 0 : block.transactions.length, 192);
            chai_1.assert.isTrue(block === null || block === void 0 ? void 0 : block.transactions[0].hash().equals(constants_1.FIRST_TX_HASH_OF_10496585));
            chai_1.assert.isTrue(block === null || block === void 0 ? void 0 : block.transactions[191].hash().equals(constants_1.LAST_TX_HASH_OF_10496585));
        });
        it("returns the latest added block", async () => {
            const block = createBlock(await fb.getLatestBlock());
            await fb.addBlock(block);
            const latestBlock = await fb.getLatestBlock();
            chai_1.assert.equal(latestBlock, block);
        });
    });
    describe("putBlock", () => {
        it("can save a new block in the blockchain", async () => {
            const block = createBlock(await fb.getLatestBlock());
            const returnedBlock = await fb.addBlock(block);
            const savedBlock = await fb.getBlock(forkBlockNumber.addn(1));
            chai_1.assert.equal(returnedBlock, block);
            chai_1.assert.equal(savedBlock, block);
        });
        it("rejects blocks with invalid block number", async () => {
            await chai_1.assert.isRejected(fb.addBlock(new Block_1.Block({ header: { number: forkBlockNumber.addn(2) } })), Error, "Invalid block number");
        });
        it("rejects blocks with invalid parent hash after the first block in the forked blockchain", async () => {
            const block = createBlock(await fb.getLatestBlock());
            await fb.addBlock(block);
            await chai_1.assert.isRejected(fb.addBlock(new Block_1.Block({ header: { number: forkBlockNumber.addn(2) } })), Error, "Invalid parent hash");
        });
        it("can save more than one block", async () => {
            const blockOne = createBlock(await fb.getLatestBlock());
            const blockTwo = createBlock(blockOne);
            const blockThree = createBlock(blockTwo);
            await fb.addBlock(blockOne);
            await fb.addBlock(blockTwo);
            await fb.addBlock(blockThree);
            chai_1.assert.equal(await fb.getBlock(forkBlockNumber.addn(1)), blockOne);
            chai_1.assert.equal(await fb.getBlock(forkBlockNumber.addn(2)), blockTwo);
            chai_1.assert.equal(await fb.getBlock(forkBlockNumber.addn(3)), blockThree);
        });
    });
    describe("delBlock", () => {
        it("removes the block and all subsequent ones", async () => {
            const blockOne = createBlock(await fb.getLatestBlock());
            const blockTwo = createBlock(blockOne);
            const blockThree = createBlock(blockTwo);
            await fb.addBlock(blockOne);
            await fb.addBlock(blockTwo);
            await fb.addBlock(blockThree);
            fb.deleteBlock(blockOne.hash());
            chai_1.assert.equal(await fb.getBlock(blockOne.hash()), undefined);
            chai_1.assert.equal(await fb.getBlock(blockTwo.hash()), undefined);
            chai_1.assert.equal(await fb.getBlock(blockThree.hash()), undefined);
        });
        it("updates the latest block number", async () => {
            const blockOne = createBlock(await fb.getLatestBlock());
            const blockTwo = createBlock(blockOne);
            const blockThree = createBlock(blockTwo);
            await fb.addBlock(blockOne);
            await fb.addBlock(blockTwo);
            fb.deleteBlock(blockTwo.hash());
            chai_1.assert.equal(await fb.getLatestBlock(), blockOne);
            await chai_1.assert.isRejected(fb.addBlock(blockThree), Error, "Invalid block number");
        });
        it("is possible to add a block after delete", async () => {
            const block = createBlock(await fb.getLatestBlock());
            const otherBlock = createBlock(await fb.getLatestBlock(), random_1.randomHashBuffer());
            await fb.addBlock(block);
            fb.deleteBlock(block.hash());
            await fb.addBlock(otherBlock);
            chai_1.assert.equal(await fb.getBlock(otherBlock.hash()), otherBlock);
        });
        it("throws when hash of non-existent block is given", async () => {
            chai_1.assert.throws(() => fb.deleteBlock(new Block_1.Block().hash()), Error, "Block not found");
        });
        it("throws when hash of not previously fetched remote block is given", async () => {
            // This is here because we do not want to fetch remote blocks for this operation
            chai_1.assert.throws(() => fb.deleteBlock(constants_1.BLOCK_HASH_OF_10496585), Error, "Block not found");
        });
        it("throws on attempt to remove remote block", async () => {
            const remoteBlock = await fb.getBlock(constants_1.BLOCK_NUMBER_OF_10496585);
            chai_1.assert.throws(() => fb.deleteBlock(remoteBlock.hash()), Error, "Cannot delete remote block");
        });
        it("throws on attempt to remove the block from which we fork", async () => {
            const forkBlock = await fb.getLatestBlock();
            chai_1.assert.throws(() => fb.deleteBlock(forkBlock.hash()), Error, "Cannot delete remote block");
        });
    });
    describe("deleteAllFollowingBlocks", () => {
        it("removes all blocks subsequent to the given block", async () => {
            const blockOne = await fb.getLatestBlock();
            const blockTwo = createBlock(blockOne);
            const blockThree = createBlock(blockTwo);
            await fb.addBlock(blockTwo);
            await fb.addBlock(blockThree);
            fb.deleteLaterBlocks(blockOne);
            chai_1.assert.equal(await fb.getBlock(blockOne.hash()), blockOne);
            chai_1.assert.equal(await fb.getBlock(blockTwo.hash()), undefined);
            chai_1.assert.equal(await fb.getBlock(blockThree.hash()), undefined);
        });
        it("throws if given block is not present in blockchain", async () => {
            const blockOne = createBlock(await fb.getLatestBlock());
            const notAddedBlock = createBlock(blockOne);
            const fakeBlockOne = createBlock(await fb.getLatestBlock(), random_1.randomHashBuffer());
            await fb.addBlock(blockOne);
            chai_1.assert.throws(() => fb.deleteLaterBlocks(notAddedBlock), Error, "Invalid block");
            chai_1.assert.throws(() => fb.deleteLaterBlocks(fakeBlockOne), Error, "Invalid block");
        });
        it("does not throw if there are no following blocks", async () => {
            const blockOne = createBlock(await fb.getLatestBlock());
            await fb.addBlock(blockOne);
            chai_1.assert.doesNotThrow(() => fb.deleteLaterBlocks(blockOne));
        });
        it("throws on attempt to remove remote blocks", async () => {
            const block = await fb.getBlock(constants_1.BLOCK_NUMBER_OF_10496585);
            chai_1.assert.throws(() => fb.deleteLaterBlocks(block), Error, "Cannot delete remote block");
        });
    });
    describe("getBlockTotalDifficulty", () => {
        it("rejects when hash of non-existent block is given", async () => {
            await chai_1.assert.isRejected(fb.getTotalDifficulty(random_1.randomHashBuffer()), Error, "Block not found");
        });
        it("can get difficulty of the genesis block", async () => {
            const genesis = await client.getBlockByNumber(new ethereumjs_util_1.BN(0), false);
            const difficulty = await fb.getTotalDifficulty(genesis === null || genesis === void 0 ? void 0 : genesis.hash);
            chai_1.assert.equal(difficulty.toNumber(), genesis === null || genesis === void 0 ? void 0 : genesis.difficulty.toNumber());
        });
        it("does not return total difficulty of a deleted block", async () => {
            const block = createBlock(await fb.getLatestBlock());
            await fb.addBlock(block);
            fb.deleteBlock(block.hash());
            await chai_1.assert.isRejected(fb.getTotalDifficulty(block.hash()), Error, "Block not found");
        });
        it("can get total difficulty of a remote block", async () => {
            const td = await fb.getTotalDifficulty(constants_1.BLOCK_HASH_OF_10496585);
            chai_1.assert.equal(td.toString(), constants_1.TOTAL_DIFFICULTY_OF_BLOCK_10496585.toString());
        });
        it("can get total difficulty of a new block", async () => {
            const latest = await fb.getLatestBlock();
            const block = createBlock(latest, 1000);
            const latestDifficulty = await fb.getTotalDifficulty(latest.hash());
            await fb.addBlock(block);
            const totalDifficulty = await fb.getTotalDifficulty(block.hash());
            chai_1.assert.equal(totalDifficulty.toString(), latestDifficulty.addn(1000).toString());
        });
    });
    function hasCommonGetTransactionBehaviour(getTransaction) {
        it("returns undefined for unknown transactions", async () => {
            const transaction = blockchain_1.createTestTransaction();
            chai_1.assert.isUndefined(await getTransaction(transaction.hash()));
        });
        it("returns a known transaction", async () => {
            const block = createBlock(await fb.getLatestBlock());
            const transaction = blockchain_1.createTestTransaction();
            block.transactions.push(transaction);
            await fb.addBlock(block);
            const result = await getTransaction(transaction.hash());
            chai_1.assert.equal(result, transaction);
        });
        it("forgets transactions after block is removed", async () => {
            const block = createBlock(await fb.getLatestBlock());
            const transaction = blockchain_1.createTestTransaction();
            block.transactions.push(transaction);
            await fb.addBlock(block);
            fb.deleteBlock(block.hash());
            chai_1.assert.isUndefined(await getTransaction(transaction.hash()));
        });
    }
    describe("getTransaction", () => {
        hasCommonGetTransactionBehaviour((hash) => fb.getTransaction(hash));
        it("returns a known remote transaction", async () => {
            const result = await fb.getTransaction(constants_1.FIRST_TX_HASH_OF_10496585);
            chai_1.assert.isTrue(result === null || result === void 0 ? void 0 : result.hash().equals(constants_1.FIRST_TX_HASH_OF_10496585));
        });
        it("returns undefined for newer remote transactions", async () => {
            fb = new ForkBlockchain_1.ForkBlockchain(client, constants_1.BLOCK_NUMBER_OF_10496585.subn(1), common);
            chai_1.assert.equal(await fb.getTransaction(constants_1.FIRST_TX_HASH_OF_10496585), undefined);
        });
    });
    describe("getLocalTransaction", () => {
        hasCommonGetTransactionBehaviour((hash) => fb.getLocalTransaction(hash));
        it("returns undefined for a remote transaction", async () => {
            const result = fb.getLocalTransaction(constants_1.FIRST_TX_HASH_OF_10496585);
            chai_1.assert.isUndefined(result);
        });
    });
    describe("getBlockByTransactionHash", () => {
        it("returns undefined for unknown transactions", async () => {
            const transaction = blockchain_1.createTestTransaction();
            chai_1.assert.equal(await fb.getBlockByTransactionHash(transaction.hash()), undefined);
        });
        it("returns block for a known transaction", async () => {
            const block = createBlock(await fb.getLatestBlock());
            const transaction = blockchain_1.createTestTransaction();
            block.transactions.push(transaction);
            await fb.addBlock(block);
            const result = await fb.getBlockByTransactionHash(transaction.hash());
            chai_1.assert.equal(result, block);
        });
        it("returns a block for known remote transaction", async () => {
            const result = await fb.getBlockByTransactionHash(constants_1.FIRST_TX_HASH_OF_10496585);
            const block = await fb.getBlock(constants_1.BLOCK_HASH_OF_10496585);
            chai_1.assert.equal(result, block);
        });
        it("returns undefined for newer remote transactions", async () => {
            fb = new ForkBlockchain_1.ForkBlockchain(client, constants_1.BLOCK_NUMBER_OF_10496585.subn(1), common);
            chai_1.assert.equal(await fb.getBlockByTransactionHash(constants_1.FIRST_TX_HASH_OF_10496585), undefined);
        });
        it("forgets transactions after block is removed", async () => {
            const block = createBlock(await fb.getLatestBlock());
            const transaction = blockchain_1.createTestTransaction();
            block.transactions.push(transaction);
            await fb.addBlock(block);
            fb.deleteBlock(block.hash());
            chai_1.assert.equal(await fb.getBlockByTransactionHash(transaction.hash()), undefined);
        });
    });
    describe("getTransactionReceipt", () => {
        it("returns undefined for unknown transactions", async () => {
            const transaction = blockchain_1.createTestTransaction();
            chai_1.assert.equal(await fb.getTransactionReceipt(transaction.hash()), undefined);
        });
        it("returns undefined for a known transaction without receipt", async () => {
            const block = createBlock(await fb.getLatestBlock());
            const transaction = blockchain_1.createTestTransaction();
            block.transactions.push(transaction);
            await fb.addBlock(block);
            chai_1.assert.equal(await fb.getTransactionReceipt(transaction.hash()), undefined);
        });
        it("returns the receipt when it was provided earlier", async () => {
            const block = createBlock(await fb.getLatestBlock());
            const transaction = blockchain_1.createTestTransaction();
            const receipt = blockchain_1.createTestReceipt(transaction);
            block.transactions.push(transaction);
            await fb.addBlock(block);
            fb.addTransactionReceipts([receipt]);
            chai_1.assert.equal(await fb.getTransactionReceipt(transaction.hash()), receipt);
        });
        it("returns remote receipts", async () => {
            const receipt = await fb.getTransactionReceipt(constants_1.FIRST_TX_HASH_OF_10496585);
            chai_1.assert.equal(receipt === null || receipt === void 0 ? void 0 : receipt.transactionHash, ethereumjs_util_1.bufferToHex(constants_1.FIRST_TX_HASH_OF_10496585));
        });
        it("returns undefined for newer remote receipts", async () => {
            fb = new ForkBlockchain_1.ForkBlockchain(client, constants_1.BLOCK_NUMBER_OF_10496585.subn(1), common);
            chai_1.assert.equal(await fb.getTransactionReceipt(constants_1.FIRST_TX_HASH_OF_10496585), undefined);
        });
        it("forgets receipts after block is removed", async () => {
            const block = createBlock(await fb.getLatestBlock());
            const transaction = blockchain_1.createTestTransaction();
            const receipt = blockchain_1.createTestReceipt(transaction);
            block.transactions.push(transaction);
            await fb.addBlock(block);
            fb.addTransactionReceipts([receipt]);
            fb.deleteBlock(block.hash());
            chai_1.assert.equal(await fb.getTransactionReceipt(transaction.hash()), undefined);
        });
    });
    describe("getLogs", () => {
        it("works like BlockchainData.getLogs for new blocks", async () => {
            const block1 = createBlock(await fb.getLatestBlock());
            const number = new ethereumjs_util_1.BN(block1.header.number);
            const log1 = blockchain_1.createTestLog(number);
            const log2 = blockchain_1.createTestLog(number);
            const tx1 = blockchain_1.createTestTransaction();
            const receipt1 = blockchain_1.createTestReceipt(tx1, [log1, log2]);
            const tx2 = blockchain_1.createTestTransaction();
            const log3 = blockchain_1.createTestLog(number);
            const receipt2 = blockchain_1.createTestReceipt(tx2, [log3]);
            block1.transactions.push(tx1, tx2);
            const block2 = createBlock(block1);
            const tx3 = blockchain_1.createTestTransaction();
            const log4 = blockchain_1.createTestLog(number.addn(1));
            const receipt3 = blockchain_1.createTestReceipt(tx3, [log4]);
            block2.transactions.push(tx3);
            await fb.addBlock(block1);
            await fb.addBlock(block2);
            fb.addTransactionReceipts([receipt1, receipt2, receipt3]);
            const logs = await fb.getLogs({
                fromBlock: number,
                toBlock: number,
                addresses: [],
                normalizedTopics: [],
            });
            chai_1.assert.deepEqual(logs, [log1, log2, log3]);
        });
        it("supports remote blocks", async () => {
            const logs = await fb.getLogs({
                fromBlock: constants_1.BLOCK_NUMBER_OF_10496585,
                toBlock: constants_1.BLOCK_NUMBER_OF_10496585,
                addresses: [ethereumjs_util_1.toBuffer("0x5acc84a3e955bdd76467d3348077d003f00ffb97")],
                normalizedTopics: [],
            });
            chai_1.assert.equal(logs.length, 19);
        });
        it("can fetch both remote and local logs simultaneously", async () => {
            fb = new ForkBlockchain_1.ForkBlockchain(client, constants_1.BLOCK_NUMBER_OF_10496585, common);
            const block1 = createBlock(await fb.getLatestBlock());
            const number = new ethereumjs_util_1.BN(block1.header.number);
            const log1 = blockchain_1.createTestLog(number);
            const log2 = blockchain_1.createTestLog(number);
            const tx1 = blockchain_1.createTestTransaction();
            const receipt1 = blockchain_1.createTestReceipt(tx1, [log1, log2]);
            const tx2 = blockchain_1.createTestTransaction();
            const log3 = blockchain_1.createTestLog(number);
            const receipt2 = blockchain_1.createTestReceipt(tx2, [log3]);
            block1.transactions.push(tx1, tx2);
            const block2 = createBlock(block1);
            const tx3 = blockchain_1.createTestTransaction();
            const log4 = blockchain_1.createTestLog(number.addn(1));
            const receipt3 = blockchain_1.createTestReceipt(tx3, [log4]);
            block2.transactions.push(tx3);
            await fb.addBlock(block1);
            await fb.addBlock(block2);
            fb.addTransactionReceipts([receipt1, receipt2, receipt3]);
            const logs = await fb.getLogs({
                fromBlock: constants_1.BLOCK_NUMBER_OF_10496585,
                toBlock: constants_1.BLOCK_NUMBER_OF_10496585.addn(1),
                addresses: [],
                normalizedTopics: [],
            });
            chai_1.assert.equal(logs.length, 208);
        });
    });
});
//# sourceMappingURL=ForkBlockchain.js.map