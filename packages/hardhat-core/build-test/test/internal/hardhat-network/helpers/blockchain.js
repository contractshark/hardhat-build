"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestLog = exports.createTestReceipt = exports.createTestTransaction = void 0;
const ethereumjs_tx_1 = require("ethereumjs-tx");
const ethereumjs_util_1 = require("ethereumjs-util");
const random_1 = require("../../../../src/internal/hardhat-network/provider/fork/random");
const output_1 = require("../../../../src/internal/hardhat-network/provider/output");
function createTestTransaction() {
    return new ethereumjs_tx_1.Transaction({ to: random_1.randomAddressBuffer() });
}
exports.createTestTransaction = createTestTransaction;
function createTestReceipt(transaction, logs = []) {
    const receipt = {
        transactionHash: ethereumjs_util_1.bufferToHex(transaction.hash()),
        logs,
    };
    return receipt;
}
exports.createTestReceipt = createTestReceipt;
function createTestLog(blockNumber) {
    const log = {
        address: random_1.randomAddressBuffer(),
        blockNumber: output_1.numberToRpcQuantity(blockNumber),
    };
    return log;
}
exports.createTestLog = createTestLog;
//# sourceMappingURL=blockchain.js.map