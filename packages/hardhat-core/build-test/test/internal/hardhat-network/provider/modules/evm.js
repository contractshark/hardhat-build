"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const sinon_1 = __importDefault(require("sinon"));
const output_1 = require("../../../../../src/internal/hardhat-network/provider/output");
const getCurrentTimestamp_1 = require("../../../../../src/internal/hardhat-network/provider/utils/getCurrentTimestamp");
const environment_1 = require("../../../../helpers/environment");
const project_1 = require("../../../../helpers/project");
const assertions_1 = require("../../helpers/assertions");
const contracts_1 = require("../../helpers/contracts");
const conversions_1 = require("../../helpers/conversions");
const cwd_1 = require("../../helpers/cwd");
const providers_1 = require("../../helpers/providers");
async function deployContract(provider, deploymentCode) {
    const hash = await provider.send("eth_sendTransaction", [
        {
            from: providers_1.DEFAULT_ACCOUNTS_ADDRESSES[0],
            data: deploymentCode,
            gas: output_1.numberToRpcQuantity(providers_1.DEFAULT_BLOCK_GAS_LIMIT),
        },
    ]);
    const { contractAddress } = await provider.send("eth_getTransactionReceipt", [
        hash,
    ]);
    return contractAddress;
}
describe("Evm module", function () {
    providers_1.PROVIDERS.forEach(({ name, useProvider, isFork }) => {
        if (isFork) {
            this.timeout(50000);
        }
        describe(`${name} provider`, function () {
            cwd_1.setCWD();
            useProvider();
            describe("evm_increaseTime", async function () {
                it("should increase the offset of time used for block timestamps", async function () {
                    const blockNumber = conversions_1.quantityToNumber(await this.provider.send("eth_blockNumber"));
                    const accounts = await this.provider.send("eth_accounts");
                    const burnTxParams = {
                        from: accounts[0],
                        to: ethereumjs_util_1.zeroAddress(),
                        value: output_1.numberToRpcQuantity(1),
                        gas: output_1.numberToRpcQuantity(21000),
                        gasPrice: output_1.numberToRpcQuantity(1),
                    };
                    const firstBlock = await this.provider.send("eth_getBlockByNumber", [
                        output_1.numberToRpcQuantity(blockNumber),
                        false,
                    ]);
                    await this.provider.send("evm_increaseTime", [123]);
                    await this.provider.send("eth_sendTransaction", [burnTxParams]);
                    const secondBlock = await this.provider.send("eth_getBlockByNumber", [
                        output_1.numberToRpcQuantity(blockNumber + 1),
                        false,
                    ]);
                    await this.provider.send("evm_increaseTime", [456]);
                    await this.provider.send("eth_sendTransaction", [burnTxParams]);
                    const thirdBlock = await this.provider.send("eth_getBlockByNumber", [
                        output_1.numberToRpcQuantity(blockNumber + 2),
                        false,
                    ]);
                    const firstTimestamp = conversions_1.quantityToNumber(firstBlock.timestamp);
                    const secondTimestamp = conversions_1.quantityToNumber(secondBlock.timestamp);
                    const thirdTimestamp = conversions_1.quantityToNumber(thirdBlock.timestamp);
                    chai_1.assert.isAtLeast(secondTimestamp - firstTimestamp, 123);
                    chai_1.assert.isAtLeast(thirdTimestamp - secondTimestamp, 456);
                });
                it("should return the total offset as a decimal string, not a QUANTITY", async function () {
                    // get the current offset
                    const initialOffset = parseInt(await this.provider.send("evm_increaseTime", [0]), 10);
                    let totalOffset = await this.provider.send("evm_increaseTime", [123]);
                    chai_1.assert.isString(totalOffset);
                    chai_1.assert.strictEqual(parseInt(totalOffset, 10), initialOffset + 123);
                    totalOffset = await this.provider.send("evm_increaseTime", [3456789]);
                    chai_1.assert.isString(totalOffset);
                    chai_1.assert.strictEqual(parseInt(totalOffset, 10), initialOffset + 123 + 3456789);
                });
                it("should expect an actual number as its first param, not a hex string", async function () {
                    await assertions_1.assertInvalidArgumentsError(this.provider, "evm_increaseTime", [
                        output_1.numberToRpcQuantity(123),
                    ]);
                });
            });
            describe("evm_setNextBlockTimestamp", async function () {
                it("should set next block timestamp and the next EMPTY block will be mined with that timestamp", async function () {
                    const timestamp = getCurrentTimestamp_1.getCurrentTimestamp() + 60;
                    await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                    await this.provider.send("evm_mine", []);
                    const block = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    assertions_1.assertQuantity(block.timestamp, timestamp);
                });
                it("should set next block timestamp and the next tx will be mined with that timestamp", async function () {
                    const timestamp = getCurrentTimestamp_1.getCurrentTimestamp() + 70;
                    await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                    await deployContract(this.provider, `0x${contracts_1.EXAMPLE_CONTRACT.bytecode.object}`);
                    const block = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    assertions_1.assertQuantity(block.timestamp, timestamp);
                });
                it("should be able to set and replace an existing 'next block timestamp'", async function () {
                    const timestamp = getCurrentTimestamp_1.getCurrentTimestamp() + 60;
                    await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                    await this.provider.send("evm_setNextBlockTimestamp", [
                        timestamp + 10,
                    ]);
                    await this.provider.send("evm_mine", []);
                    const block = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    assertions_1.assertQuantity(block.timestamp, timestamp + 10);
                });
                it("should be reset after the next block is mined", async function () {
                    const timestamp = getCurrentTimestamp_1.getCurrentTimestamp() + 60;
                    await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                    await this.provider.send("evm_mine", []);
                    await this.provider.send("evm_mine", []);
                    const block = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    chai_1.assert.isTrue(conversions_1.quantityToNumber(block.timestamp) > timestamp);
                });
                it("should be overridden if next EMPTY block is mined with timestamp", async function () {
                    const timestamp = getCurrentTimestamp_1.getCurrentTimestamp() + 90;
                    await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                    await this.provider.send("evm_mine", [timestamp + 100]);
                    const block = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    assertions_1.assertQuantity(block.timestamp, timestamp + 100);
                });
                it("should also advance time offset for future blocks", async function () {
                    let timestamp = getCurrentTimestamp_1.getCurrentTimestamp() + 70;
                    await this.provider.send("evm_setNextBlockTimestamp", [timestamp]);
                    await this.provider.send("evm_mine", []);
                    timestamp = getCurrentTimestamp_1.getCurrentTimestamp() + 90;
                    await this.provider.send("evm_mine", [timestamp]);
                    timestamp = getCurrentTimestamp_1.getCurrentTimestamp() + 120;
                    await this.provider.send("evm_mine", [timestamp]);
                    await this.provider.send("evm_mine", []);
                    const block = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                    chai_1.assert.isTrue(conversions_1.quantityToNumber(block.timestamp) > timestamp);
                });
                it("shouldn't set if specified timestamp is less or equal to the previous block", async function () {
                    const timestamp = getCurrentTimestamp_1.getCurrentTimestamp() + 70;
                    await this.provider.send("evm_mine", [timestamp]);
                    this.provider
                        .send("evm_setNextBlockTimestamp", [timestamp - 1])
                        .then(function () {
                        chai_1.assert.fail("should have failed setting next block timestamp");
                    })
                        .catch(function (e) { });
                    this.provider
                        .send("evm_setNextBlockTimestamp", [timestamp])
                        .then(function () {
                        chai_1.assert.fail("should have failed setting next block timestamp");
                    })
                        .catch(function (e) { });
                });
                it("should advance the time offset accordingly to the timestamp", async function () {
                    let timestamp = getCurrentTimestamp_1.getCurrentTimestamp() + 70;
                    await this.provider.send("evm_mine", [timestamp]);
                    await this.provider.send("evm_mine");
                    await this.provider.send("evm_setNextBlockTimestamp", [
                        timestamp + 100,
                    ]);
                    await this.provider.send("evm_mine");
                    await this.provider.send("evm_increaseTime", [30]);
                    await this.provider.send("evm_mine");
                    timestamp = getCurrentTimestamp_1.getCurrentTimestamp();
                    // 200 - 1 as we use ceil to round time to seconds
                    chai_1.assert.isTrue(timestamp >= 199);
                });
                describe("When the initial date is in the past", function () {
                    // These test use a Hardhat Network instance with an initialDate in the
                    // past. We do this by using a fixture project and useEnvironment(),
                    // so instead of using this.provider they must use
                    // this.env.network.provider
                    project_1.useFixtureProject("hardhat-network-initial-date");
                    environment_1.useEnvironment();
                    it("should still set the nextBlockTimestamp if it is less than the real time but larger than the previous block", async function () {
                        const timestamp = getCurrentTimestamp_1.getCurrentTimestamp();
                        await this.env.network.provider.send("evm_mine", [
                            timestamp - 1000,
                        ]);
                        const latestBlock = await this.env.network.provider.send("eth_getBlockByNumber", ["latest", false]);
                        assertions_1.assertQuantity(latestBlock.timestamp, timestamp - 1000);
                        await this.env.network.provider.send("evm_setNextBlockTimestamp", [
                            timestamp - 500,
                        ]);
                        await this.env.network.provider.send("evm_mine");
                        const latestBlock2 = await this.env.network.provider.send("eth_getBlockByNumber", ["latest", false]);
                        assertions_1.assertQuantity(latestBlock2.timestamp, timestamp - 500);
                    });
                });
            });
            describe("evm_mine", async function () {
                it("should mine an empty block", async function () {
                    await this.provider.send("evm_mine");
                    const block = await this.provider.send("eth_getBlockByNumber", [output_1.numberToRpcQuantity(1), false]);
                    chai_1.assert.isEmpty(block.transactions);
                    await this.provider.send("evm_mine");
                    const block2 = await this.provider.send("eth_getBlockByNumber", [output_1.numberToRpcQuantity(2), false]);
                    chai_1.assert.isEmpty(block2.transactions);
                });
                it("should mine an empty block with exact timestamp", async function () {
                    const blockNumber = conversions_1.quantityToNumber(await this.provider.send("eth_blockNumber"));
                    const timestamp = getCurrentTimestamp_1.getCurrentTimestamp() + 60;
                    await this.provider.send("evm_mine", [timestamp]);
                    const block = await this.provider.send("eth_getBlockByNumber", [output_1.numberToRpcQuantity(blockNumber + 1), false]);
                    assertions_1.assertQuantity(block.timestamp, timestamp);
                });
                it("should mine an empty block with the timestamp and other later blocks have higher timestamp", async function () {
                    const blockNumber = conversions_1.quantityToNumber(await this.provider.send("eth_blockNumber"));
                    const timestamp = getCurrentTimestamp_1.getCurrentTimestamp() + 60;
                    await this.provider.send("evm_mine", [timestamp]);
                    await this.provider.send("evm_mine");
                    await this.provider.send("evm_mine");
                    const block = await this.provider.send("eth_getBlockByNumber", [output_1.numberToRpcQuantity(blockNumber + 2), false]);
                    chai_1.assert.isTrue(conversions_1.quantityToNumber(block.timestamp) > timestamp);
                });
            });
            describe("Snapshot functionality", function () {
                describe("evm_snapshot", async function () {
                    it("returns the snapshot id starting at 1", async function () {
                        const id1 = await this.provider.send("evm_snapshot", []);
                        const id2 = await this.provider.send("evm_snapshot", []);
                        const id3 = await this.provider.send("evm_snapshot", []);
                        chai_1.assert.equal(id1, "0x1");
                        chai_1.assert.equal(id2, "0x2");
                        chai_1.assert.equal(id3, "0x3");
                    });
                    it("Doesn't repeat snapshot ids after revert is called", async function () {
                        const id1 = await this.provider.send("evm_snapshot", []);
                        const reverted = await this.provider.send("evm_revert", [
                            id1,
                        ]);
                        const id2 = await this.provider.send("evm_snapshot", []);
                        chai_1.assert.equal(id1, "0x1");
                        chai_1.assert.isTrue(reverted);
                        chai_1.assert.equal(id2, "0x2");
                    });
                });
                describe("evm_revert", async function () {
                    let sinonClock;
                    afterEach(function () {
                        if (sinonClock !== undefined) {
                            sinonClock.restore();
                            sinonClock = undefined;
                        }
                    });
                    it("Returns false for non-existing ids", async function () {
                        const reverted1 = await this.provider.send("evm_revert", [
                            "0x1",
                        ]);
                        const reverted2 = await this.provider.send("evm_revert", [
                            "0x2",
                        ]);
                        const reverted3 = await this.provider.send("evm_revert", [
                            "0x0",
                        ]);
                        chai_1.assert.isFalse(reverted1);
                        chai_1.assert.isFalse(reverted2);
                        chai_1.assert.isFalse(reverted3);
                    });
                    it("Returns false for already reverted ids", async function () {
                        const id1 = await this.provider.send("evm_snapshot", []);
                        const reverted = await this.provider.send("evm_revert", [
                            id1,
                        ]);
                        const reverted2 = await this.provider.send("evm_revert", [
                            id1,
                        ]);
                        chai_1.assert.isTrue(reverted);
                        chai_1.assert.isFalse(reverted2);
                    });
                    it("Deletes previous blocks", async function () {
                        const snapshotId = await this.provider.send("evm_snapshot", []);
                        const initialLatestBlock = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                        await this.provider.send("evm_mine");
                        await this.provider.send("evm_mine");
                        await this.provider.send("evm_mine");
                        await this.provider.send("evm_mine");
                        const latestBlockBeforeReverting = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                        const reverted = await this.provider.send("evm_revert", [
                            snapshotId,
                        ]);
                        chai_1.assert.isTrue(reverted);
                        const newLatestBlock = await this.provider.send("eth_getBlockByNumber", ["latest", false]);
                        chai_1.assert.equal(newLatestBlock.hash, initialLatestBlock.hash);
                        const blockByHash = await this.provider.send("eth_getBlockByHash", [
                            output_1.bufferToRpcData(latestBlockBeforeReverting.hash),
                            false,
                        ]);
                        chai_1.assert.isNull(blockByHash);
                        const blockByNumber = await this.provider.send("eth_getBlockByNumber", [latestBlockBeforeReverting.number, false]);
                        chai_1.assert.isNull(blockByNumber);
                    });
                    it("Deletes previous transactions", async function () {
                        const [, from] = await this.provider.send("eth_accounts");
                        const snapshotId = await this.provider.send("evm_snapshot", []);
                        const txHash = await this.provider.send("eth_sendTransaction", [
                            {
                                from,
                                to: "0x1111111111111111111111111111111111111111",
                                value: output_1.numberToRpcQuantity(1),
                                gas: output_1.numberToRpcQuantity(100000),
                                gasPrice: output_1.numberToRpcQuantity(1),
                                nonce: output_1.numberToRpcQuantity(0),
                            },
                        ]);
                        const reverted = await this.provider.send("evm_revert", [
                            snapshotId,
                        ]);
                        chai_1.assert.isTrue(reverted);
                        const txHashAfter = await this.provider.send("eth_getTransactionByHash", [txHash]);
                        chai_1.assert.isNull(txHashAfter);
                    });
                    it("Allows resending the same tx after a revert", async function () {
                        const [, from] = await this.provider.send("eth_accounts");
                        const snapshotId = await this.provider.send("evm_snapshot", []);
                        const txParams = {
                            from,
                            to: "0x1111111111111111111111111111111111111111",
                            value: output_1.numberToRpcQuantity(1),
                            gas: output_1.numberToRpcQuantity(100000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                            nonce: output_1.numberToRpcQuantity(0),
                        };
                        const txHash = await this.provider.send("eth_sendTransaction", [
                            txParams,
                        ]);
                        const reverted = await this.provider.send("evm_revert", [
                            snapshotId,
                        ]);
                        chai_1.assert.isTrue(reverted);
                        const txHash2 = await this.provider.send("eth_sendTransaction", [
                            txParams,
                        ]);
                        chai_1.assert.equal(txHash2, txHash);
                    });
                    it("Deletes the used snapshot and the following ones", async function () {
                        const snapshotId1 = await this.provider.send("evm_snapshot", []);
                        const snapshotId2 = await this.provider.send("evm_snapshot", []);
                        const snapshotId3 = await this.provider.send("evm_snapshot", []);
                        const revertedTo2 = await this.provider.send("evm_revert", [snapshotId2]);
                        chai_1.assert.isTrue(revertedTo2);
                        const revertedTo3 = await this.provider.send("evm_revert", [snapshotId3]);
                        // snapshot 3 didn't exist anymore
                        chai_1.assert.isFalse(revertedTo3);
                        const revertedTo1 = await this.provider.send("evm_revert", [snapshotId1]);
                        // snapshot 1 still existed
                        chai_1.assert.isTrue(revertedTo1);
                    });
                    it("Resets the blockchain so that new blocks are added with the right numbers", async function () {
                        const blockNumber = conversions_1.quantityToNumber(await this.provider.send("eth_blockNumber"));
                        await this.provider.send("evm_mine");
                        await this.provider.send("evm_mine");
                        await assertions_1.assertLatestBlockNumber(this.provider, blockNumber + 2);
                        const snapshotId1 = await this.provider.send("evm_snapshot", []);
                        await this.provider.send("evm_mine");
                        await assertions_1.assertLatestBlockNumber(this.provider, blockNumber + 3);
                        const revertedTo1 = await this.provider.send("evm_revert", [snapshotId1]);
                        chai_1.assert.isTrue(revertedTo1);
                        await assertions_1.assertLatestBlockNumber(this.provider, blockNumber + 2);
                        await this.provider.send("evm_mine");
                        await assertions_1.assertLatestBlockNumber(this.provider, blockNumber + 3);
                        await this.provider.send("evm_mine");
                        const snapshotId2 = await this.provider.send("evm_snapshot", []);
                        await this.provider.send("evm_mine");
                        const snapshotId3 = await this.provider.send("evm_snapshot", []);
                        await this.provider.send("evm_mine");
                        await assertions_1.assertLatestBlockNumber(this.provider, blockNumber + 6);
                        const revertedTo2 = await this.provider.send("evm_revert", [snapshotId2]);
                        chai_1.assert.isTrue(revertedTo2);
                        await assertions_1.assertLatestBlockNumber(this.provider, blockNumber + 4);
                    });
                    it("Resets the date to the right time", async function () {
                        const mineEmptyBlock = async () => {
                            await this.provider.send("evm_mine");
                            return this.provider.send("eth_getBlockByNumber", [
                                "latest",
                                false,
                            ]);
                        };
                        sinonClock = sinon_1.default.useFakeTimers({
                            now: Date.now(),
                            toFake: ["Date"],
                        });
                        const firstBlock = await mineEmptyBlock();
                        await this.provider.send("evm_increaseTime", [100]);
                        const snapshotBlock = await mineEmptyBlock();
                        const snapshotId = await this.provider.send("evm_snapshot");
                        chai_1.assert.equal(conversions_1.quantityToNumber(snapshotBlock.timestamp), conversions_1.quantityToNumber(firstBlock.timestamp) + 100);
                        sinonClock.tick(20 * 1000);
                        await this.provider.send("evm_revert", [snapshotId]);
                        const afterRevertBlock = await mineEmptyBlock();
                        // Check that time was correctly reverted to the snapshot time and that the new
                        // block's timestamp has been incremented to avoid timestamp collision
                        chai_1.assert.equal(conversions_1.quantityToNumber(afterRevertBlock.timestamp), conversions_1.quantityToNumber(snapshotBlock.timestamp) + 1);
                    });
                    it("Restores the previous state", async function () {
                        // This is a very coarse test, as we know that the entire state is
                        // managed by the vm, and is restored as a whole
                        const [, from] = await this.provider.send("eth_accounts");
                        const balanceBeforeTx = await this.provider.send("eth_getBalance", [
                            from,
                        ]);
                        const snapshotId = await this.provider.send("evm_snapshot", []);
                        const txParams = {
                            from,
                            to: "0x1111111111111111111111111111111111111111",
                            value: output_1.numberToRpcQuantity(1),
                            gas: output_1.numberToRpcQuantity(100000),
                            gasPrice: output_1.numberToRpcQuantity(1),
                            nonce: output_1.numberToRpcQuantity(0),
                        };
                        await this.provider.send("eth_sendTransaction", [txParams]);
                        const balanceAfterTx = await this.provider.send("eth_getBalance", [
                            from,
                        ]);
                        chai_1.assert.notEqual(balanceAfterTx, balanceBeforeTx);
                        const reverted = await this.provider.send("evm_revert", [
                            snapshotId,
                        ]);
                        chai_1.assert.isTrue(reverted);
                        const balanceAfterRevert = await this.provider.send("eth_getBalance", [from]);
                        chai_1.assert.equal(balanceAfterRevert, balanceBeforeTx);
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=evm.js.map