"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const fs_extra_1 = __importDefault(require("fs-extra"));
const sinon_1 = __importDefault(require("sinon"));
const client_1 = require("../../../../src/internal/hardhat-network/jsonrpc/client");
const random_1 = require("../../../../src/internal/hardhat-network/provider/fork/random");
const makeForkClient_1 = require("../../../../src/internal/hardhat-network/provider/utils/makeForkClient");
const fs_1 = require("../../../helpers/fs");
const constants_1 = require("../helpers/constants");
const providers_1 = require("../helpers/providers");
function assertBufferContents(buff, hexEncodedContents) {
    chai_1.assert.isTrue(hexEncodedContents.startsWith("0x"), "The contents should be 0x-prefixed hex encoded");
    chai_1.assert.equal(buff.toString("hex").toLowerCase(), hexEncodedContents.substring(2).toLowerCase());
}
describe("JsonRpcClient", () => {
    describe("Using fake providers", function () {
        describe("Caching", () => {
            const response1 = "0x00000000000000000000000000000000000000000067bafa8fb7228f04ffa792";
            const response2 = "0x00000000000000000000000000000000000000000067bafa8fb7228f04ffa793";
            let fakeProvider;
            let clientWithFakeProvider;
            function getStorageAt(blockNumber) {
                return clientWithFakeProvider.getStorageAt(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, new ethereumjs_util_1.BN(blockNumber));
            }
            beforeEach(async function () {
                fakeProvider = {
                    request: sinon_1.default
                        .stub()
                        .onFirstCall()
                        .resolves(response1)
                        .onSecondCall()
                        .resolves(response2),
                    url: "fake",
                    sendBatch: () => Promise.resolve([]),
                };
            });
            it("Doesn't cache things for blocks that can be reorg'd out", async () => {
                clientWithFakeProvider = new client_1.JsonRpcClient(fakeProvider, 1, 123, 3);
                assertBufferContents(await getStorageAt(121), response1);
                assertBufferContents(await getStorageAt(121), response2);
                chai_1.assert.isTrue(fakeProvider.request.calledTwice);
            });
            it("caches fetched data when its safe", async () => {
                clientWithFakeProvider = new client_1.JsonRpcClient(fakeProvider, 1, 123, 3);
                assertBufferContents(await getStorageAt(120), response1);
                assertBufferContents(await getStorageAt(120), response1);
                chai_1.assert.isTrue(fakeProvider.request.calledOnce);
            });
            it("is parameter aware", async () => {
                clientWithFakeProvider = new client_1.JsonRpcClient(fakeProvider, 1, 123, 3);
                assertBufferContents(await getStorageAt(110), response1);
                assertBufferContents(await getStorageAt(120), response2);
                assertBufferContents(await getStorageAt(110), response1);
                assertBufferContents(await getStorageAt(120), response2);
                chai_1.assert.isTrue(fakeProvider.request.calledTwice);
            });
            describe("Disk caching", () => {
                fs_1.useTmpDir("hardhat-network-forking-disk-cache");
                beforeEach(function () {
                    clientWithFakeProvider = new client_1.JsonRpcClient(fakeProvider, 1, 123, 3, this.tmpDir);
                });
                async function makeCall() {
                    assertBufferContents(await getStorageAt(120), response1);
                    chai_1.assert.isTrue(fakeProvider.request.calledOnce);
                }
                it("Stores to disk after a request", async function () {
                    await makeCall();
                    chai_1.assert.lengthOf(await fs_extra_1.default.readdir(this.tmpDir), 1);
                });
                it("Reads from disk if available, not making any request a request", async function () {
                    // We make a first call with the disk caching enabled, this will populate the disk
                    // cache, and also the in-memory one
                    await makeCall();
                    chai_1.assert.isTrue(fakeProvider.request.calledOnce);
                    // We create a new client, using the same cache dir, but with an empty in-memory cache.
                    // It should read from the disk, instead of making a new request.
                    clientWithFakeProvider = new client_1.JsonRpcClient(fakeProvider, 1, 123, 3, this.tmpDir);
                    await makeCall();
                    // We created a new client, but used the same provider, so it was already called once.
                    chai_1.assert.isTrue(fakeProvider.request.calledOnce);
                });
            });
        });
        describe("Retry on Infura's error", () => {
            const fakeInfuraUrl = "http://infura.com";
            const response = "0x00000000000000000000000000000000000000000067bafa8fb7228f04ffa792";
            it("makes a retry on the 'header not found' error", async () => {
                const fakeProvider = {
                    url: fakeInfuraUrl,
                    request: sinon_1.default
                        .stub()
                        .onFirstCall()
                        .rejects(new Error("header not found"))
                        .onSecondCall()
                        .resolves(response),
                    sendBatch: () => Promise.resolve([]),
                };
                const clientWithFakeProvider = new client_1.JsonRpcClient(fakeProvider, 1, 123, 3);
                const value = await clientWithFakeProvider.getStorageAt(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, new ethereumjs_util_1.BN(120));
                chai_1.assert.equal(fakeProvider.request.callCount, 2);
                chai_1.assert.isTrue(value.equals(ethereumjs_util_1.toBuffer(response)));
            });
            it("does not retry more than once", async () => {
                const fakeProvider = {
                    url: fakeInfuraUrl,
                    request: sinon_1.default
                        .stub()
                        .onFirstCall()
                        .rejects(new Error("header not found"))
                        .onSecondCall()
                        .rejects(new Error("header not found"))
                        .onThirdCall()
                        .resolves(response),
                    sendBatch: () => Promise.resolve([]),
                };
                const clientWithFakeProvider = new client_1.JsonRpcClient(fakeProvider, 1, 123, 3);
                await chai_1.assert.isRejected(clientWithFakeProvider.getStorageAt(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, new ethereumjs_util_1.BN(120)), "header not found");
            });
            it("does not retry on a different error", async () => {
                const fakeProvider = {
                    url: fakeInfuraUrl,
                    request: sinon_1.default
                        .stub()
                        .onFirstCall()
                        .rejects(new Error("different error"))
                        .onSecondCall()
                        .resolves(response),
                    sendBatch: () => Promise.resolve([]),
                };
                const clientWithFakeProvider = new client_1.JsonRpcClient(fakeProvider, 1, 123, 3);
                await chai_1.assert.isRejected(clientWithFakeProvider.getStorageAt(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, new ethereumjs_util_1.BN(120)), "different error");
            });
            it("does not retry when other RPC provider is used", async () => {
                const fakeProvider = {
                    url: "other",
                    request: sinon_1.default
                        .stub()
                        .onFirstCall()
                        .rejects(new Error("header not found"))
                        .onSecondCall()
                        .resolves(response),
                    sendBatch: () => Promise.resolve([]),
                };
                const clientWithFakeProvider = new client_1.JsonRpcClient(fakeProvider, 1, 123, 3);
                await chai_1.assert.isRejected(clientWithFakeProvider.getStorageAt(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, new ethereumjs_util_1.BN(120)), "header not found");
            });
        });
    });
    describe("Using actual providers", function () {
        providers_1.FORKED_PROVIDERS.forEach(({ rpcProvider, jsonRpcUrl }) => {
            describe(`Using ${rpcProvider}`, () => {
                let client;
                let forkNumber;
                beforeEach(async () => {
                    const clientResult = await makeForkClient_1.makeForkClient({ jsonRpcUrl });
                    client = clientResult.forkClient;
                    forkNumber = clientResult.forkBlockNumber;
                });
                describe("Basic tests", () => {
                    it("can be constructed", () => {
                        chai_1.assert.instanceOf(client, client_1.JsonRpcClient);
                    });
                    it("can actually fetch real json-rpc", async () => {
                        var _a;
                        // This is just a random tx from mainnet
                        const tx = await client.getTransactionByHash(ethereumjs_util_1.toBuffer("0xc008e9f9bb92057dd0035496fbf4fb54f66b4b18b370928e46d6603933054d5a"));
                        const blockNumber = (_a = tx === null || tx === void 0 ? void 0 : tx.blockNumber) === null || _a === void 0 ? void 0 : _a.toNumber();
                        chai_1.assert.isNotNull(blockNumber);
                        chai_1.assert.isAtLeast(blockNumber, 10964958);
                    });
                });
                describe("eth_getBlockByNumber", () => {
                    it("can fetch the data with transaction hashes", async () => {
                        var _a;
                        const block = await client.getBlockByNumber(constants_1.BLOCK_NUMBER_OF_10496585);
                        chai_1.assert.isTrue((_a = block === null || block === void 0 ? void 0 : block.hash) === null || _a === void 0 ? void 0 : _a.equals(constants_1.BLOCK_HASH_OF_10496585));
                        chai_1.assert.equal(block === null || block === void 0 ? void 0 : block.transactions.length, 192);
                        chai_1.assert.isTrue(block === null || block === void 0 ? void 0 : block.transactions.every((tx) => tx instanceof Buffer));
                    });
                    it("can fetch the data with transactions", async () => {
                        const block = await client.getBlockByNumber(constants_1.BLOCK_NUMBER_OF_10496585, true);
                        chai_1.assert.isTrue(block === null || block === void 0 ? void 0 : block.transactions.every((tx) => !(tx instanceof Buffer)));
                    });
                    it("returns null for non-existent block", async () => {
                        const block = await client.getBlockByNumber(forkNumber.addn(1000), true);
                        chai_1.assert.isNull(block);
                    });
                });
                describe("eth_getBlockByHash", () => {
                    it("can fetch the data with transaction hashes", async () => {
                        var _a;
                        const block = await client.getBlockByHash(constants_1.BLOCK_HASH_OF_10496585);
                        chai_1.assert.isTrue((_a = block === null || block === void 0 ? void 0 : block.hash) === null || _a === void 0 ? void 0 : _a.equals(constants_1.BLOCK_HASH_OF_10496585));
                        chai_1.assert.equal(block === null || block === void 0 ? void 0 : block.transactions.length, 192);
                        chai_1.assert.isTrue(block === null || block === void 0 ? void 0 : block.transactions.every((tx) => tx instanceof Buffer));
                    });
                    it("can fetch the data with transactions", async () => {
                        const block = await client.getBlockByHash(constants_1.BLOCK_HASH_OF_10496585, true);
                        chai_1.assert.isTrue(block === null || block === void 0 ? void 0 : block.transactions.every((tx) => !(tx instanceof Buffer)));
                    });
                    it("returns null for non-existent block", async () => {
                        const block = await client.getBlockByHash(random_1.randomHashBuffer(), true);
                        chai_1.assert.isNull(block);
                    });
                });
                describe("eth_getStorageAt", () => {
                    it("can fetch value from storage of an existing contract", async () => {
                        const totalSupply = await client.getStorageAt(constants_1.DAI_ADDRESS, constants_1.DAI_TOTAL_SUPPLY_STORAGE_POSITION, forkNumber);
                        const totalSupplyBN = new ethereumjs_util_1.BN(totalSupply);
                        chai_1.assert.isTrue(totalSupplyBN.gtn(0));
                    });
                    it("can fetch empty value from storage of an existing contract", async () => {
                        const value = await client.getStorageAt(constants_1.DAI_ADDRESS, ethereumjs_util_1.toBuffer("0xbaddcafe"), forkNumber);
                        const valueBN = new ethereumjs_util_1.BN(value);
                        chai_1.assert.isTrue(valueBN.eqn(0));
                    });
                    it("can fetch empty value from storage of a non-existent contract", async () => {
                        const value = await client.getStorageAt(constants_1.EMPTY_ACCOUNT_ADDRESS, ethereumjs_util_1.toBuffer([1]), forkNumber);
                        const valueBN = new ethereumjs_util_1.BN(value);
                        chai_1.assert.isTrue(valueBN.eqn(0));
                    });
                });
                describe("getTransactionByHash", () => {
                    it("can fetch existing transactions", async () => {
                        var _a;
                        const transaction = await client.getTransactionByHash(constants_1.FIRST_TX_HASH_OF_10496585);
                        chai_1.assert.isTrue(transaction === null || transaction === void 0 ? void 0 : transaction.hash.equals(constants_1.FIRST_TX_HASH_OF_10496585));
                        chai_1.assert.isTrue((_a = transaction === null || transaction === void 0 ? void 0 : transaction.blockHash) === null || _a === void 0 ? void 0 : _a.equals(constants_1.BLOCK_HASH_OF_10496585));
                    });
                    it("returns null for non-existent transactions", async () => {
                        const transaction = await client.getTransactionByHash(random_1.randomHashBuffer());
                        chai_1.assert.equal(transaction, null);
                    });
                });
                describe("getTransactionReceipt", () => {
                    it("can fetch existing receipts", async () => {
                        var _a, _b, _c;
                        const receipt = await client.getTransactionReceipt(constants_1.FIRST_TX_HASH_OF_10496585);
                        chai_1.assert.isTrue(receipt === null || receipt === void 0 ? void 0 : receipt.transactionHash.equals(constants_1.FIRST_TX_HASH_OF_10496585));
                        chai_1.assert.isTrue((_a = receipt === null || receipt === void 0 ? void 0 : receipt.transactionIndex) === null || _a === void 0 ? void 0 : _a.eqn(0));
                        chai_1.assert.isTrue((_b = receipt === null || receipt === void 0 ? void 0 : receipt.blockHash) === null || _b === void 0 ? void 0 : _b.equals(constants_1.BLOCK_HASH_OF_10496585));
                        chai_1.assert.isTrue((_c = receipt === null || receipt === void 0 ? void 0 : receipt.blockNumber) === null || _c === void 0 ? void 0 : _c.eq(constants_1.BLOCK_NUMBER_OF_10496585));
                    });
                    it("returns null for non-existent transactions", async () => {
                        const transaction = await client.getTransactionReceipt(random_1.randomHashBuffer());
                        chai_1.assert.equal(transaction, null);
                    });
                });
                describe("getLogs", () => {
                    it("can fetch existing logs", async () => {
                        const logs = await client.getLogs({
                            fromBlock: constants_1.BLOCK_NUMBER_OF_10496585,
                            toBlock: constants_1.BLOCK_NUMBER_OF_10496585,
                            address: ethereumjs_util_1.toBuffer("0x5acc84a3e955bdd76467d3348077d003f00ffb97"),
                        });
                        chai_1.assert.equal(logs.length, 19);
                    });
                });
                describe("getAccountData", () => {
                    it("Should return the right data", async function () {
                        const data = await client.getAccountData(constants_1.DAI_ADDRESS, forkNumber);
                        chai_1.assert.equal(data.balance.toNumber(), 0);
                        chai_1.assert.equal(data.transactionCount.toNumber(), 1);
                        chai_1.assert.lengthOf(data.code, constants_1.DAI_CONTRACT_LENGTH);
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=client.js.map