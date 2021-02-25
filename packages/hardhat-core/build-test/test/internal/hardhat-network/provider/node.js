"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const path = __importStar(require("path"));
const provider_utils_1 = require("../../../../src/internal/core/providers/provider-utils");
const rpcToBlockData_1 = require("../../../../src/internal/hardhat-network/provider/fork/rpcToBlockData");
const node_1 = require("../../../../src/internal/hardhat-network/provider/node");
const Block_1 = require("../../../../src/internal/hardhat-network/provider/types/Block");
const makeForkClient_1 = require("../../../../src/internal/hardhat-network/provider/utils/makeForkClient");
const setup_1 = require("../../../setup");
describe("HardhatNode", function () {
    // Note that here `blockNumber` is the number of the forked block, not the number of the "simulated" block.
    // Tests are written to fork this block and execute all transactions of the block following the forked block.
    // This means that if the forked block number is 9300076, what the test will do is:
    //   - setup a forked blockchain based on block 9300076
    //   - fetch all transactions from 9300077
    //   - create a new block with them
    //   - execute the whole block and save it with the rest of the blockchain
    const forkPoints = [
        {
            networkName: "mainnet",
            url: setup_1.ALCHEMY_URL,
            blockNumber: 9300076,
            chainId: 1,
            hardfork: "muirGlacier",
        },
        {
            networkName: "kovan",
            url: (setup_1.ALCHEMY_URL !== null && setup_1.ALCHEMY_URL !== void 0 ? setup_1.ALCHEMY_URL : "").replace("mainnet", "kovan"),
            blockNumber: 23115226,
            chainId: 42,
            hardfork: "istanbul",
        },
        {
            networkName: "rinkeby",
            url: (setup_1.ALCHEMY_URL !== null && setup_1.ALCHEMY_URL !== void 0 ? setup_1.ALCHEMY_URL : "").replace("mainnet", "rinkeby"),
            blockNumber: 8004364,
            chainId: 4,
            hardfork: "istanbul",
        },
    ];
    // TODO: determine a good timeout for these tests
    this.timeout(0);
    for (const { url, blockNumber, networkName, chainId, hardfork, } of forkPoints) {
        it(`should run a ${networkName} block and produce the same results`, async function () {
            if (url === undefined || url === "") {
                this.skip();
            }
            const forkConfig = {
                jsonRpcUrl: url,
                blockNumber,
            };
            const { forkClient } = await makeForkClient_1.makeForkClient(forkConfig);
            const rpcBlock = await forkClient.getBlockByNumber(new ethereumjs_util_1.BN(blockNumber + 1), true);
            if (rpcBlock === null) {
                chai_1.assert.fail();
            }
            const forkCachePath = path.join(__dirname, ".hardhat_node_test_cache");
            const forkedNodeConfig = {
                networkName,
                chainId,
                networkId: chainId,
                hardfork,
                forkConfig,
                forkCachePath,
                blockGasLimit: rpcBlock.gasLimit.toNumber(),
                genesisAccounts: [],
            };
            const [common, forkedNode] = await node_1.HardhatNode.create(forkedNodeConfig);
            const block = new Block_1.Block(rpcToBlockData_1.rpcToBlockData(rpcBlock), { common });
            forkedNode["_vmTracer"].disableTracing();
            block.header.receiptTrie = Buffer.alloc(32, 0);
            const result = await forkedNode["_vm"].runBlock({
                block,
                generate: true,
                skipBlockValidation: true,
            });
            await forkedNode["_saveBlockAsSuccessfullyRun"](block, result);
            const newBlock = await forkedNode.getBlockByNumber(new ethereumjs_util_1.BN(blockNumber + 1));
            if (newBlock === undefined) {
                chai_1.assert.fail();
            }
            const localReceiptRoot = newBlock.header.receiptTrie.toString("hex");
            const remoteReceiptRoot = rpcBlock.receiptsRoot.toString("hex");
            // We do some manual comparisons here to understand why the root of the receipt tries differ.
            if (localReceiptRoot !== remoteReceiptRoot) {
                for (let i = 0; i < block.transactions.length; i++) {
                    const tx = block.transactions[i];
                    const txHash = ethereumjs_util_1.bufferToHex(tx.hash(true));
                    const remoteReceipt = (await forkClient["_httpProvider"].request({
                        method: "eth_getTransactionReceipt",
                        params: [txHash],
                    }));
                    const localReceipt = result.receipts[i];
                    const evmResult = result.results[i];
                    chai_1.assert.equal(ethereumjs_util_1.bufferToHex(localReceipt.bitvector), remoteReceipt.logsBloom, `Logs bloom of tx index ${i} (${txHash}) should match`);
                    chai_1.assert.equal(provider_utils_1.numberToRpcQuantity(evmResult.gasUsed.toNumber()), remoteReceipt.gasUsed, `Gas used of tx index ${i} (${txHash}) should match`);
                    chai_1.assert.equal(localReceipt.status, remoteReceipt.status, `Status of tx index ${i} (${txHash}) should be the same`);
                    chai_1.assert.equal(evmResult.createdAddress === undefined
                        ? undefined
                        : `0x${evmResult.createdAddress.toString("hex")}`, remoteReceipt.contractAddress, `Contract address created by tx index ${i} (${txHash}) should be the same`);
                }
            }
            chai_1.assert.equal(localReceiptRoot, remoteReceiptRoot, "The root of the receipts trie is different than expected");
        });
    }
});
//# sourceMappingURL=node.js.map