"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertLatestBlockNumber = exports.assertTransaction = exports.assertReceiptMatchesGethOne = exports.assertTransactionFailure = exports.assertNodeBalances = exports.assertQuantity = exports.assertInvalidInputError = exports.assertInvalidArgumentsError = exports.assertNotSupported = exports.assertHardhatNetworkProviderError = void 0;
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const errors_1 = require("../../../../src/internal/hardhat-network/provider/errors");
const input_1 = require("../../../../src/internal/hardhat-network/provider/input");
const output_1 = require("../../../../src/internal/hardhat-network/provider/output");
async function assertHardhatNetworkProviderError(provider, method, params = [], message, code) {
    let res;
    try {
        res = await provider.send(method, params);
    }
    catch (error) {
        if (code !== undefined) {
            chai_1.assert.equal(error.code, code);
        }
        if (message !== undefined) {
            chai_1.assert.include(error.message, message);
        }
        return;
    }
    chai_1.assert.fail(`Method ${method} should have thrown [${code}] ${message} but returned ${res}`);
}
exports.assertHardhatNetworkProviderError = assertHardhatNetworkProviderError;
async function assertNotSupported(provider, method) {
    return assertHardhatNetworkProviderError(provider, method, [], `Method ${method} is not supported`, errors_1.MethodNotSupportedError.CODE);
}
exports.assertNotSupported = assertNotSupported;
async function assertInvalidArgumentsError(provider, method, params = [], message) {
    return assertHardhatNetworkProviderError(provider, method, params, message, errors_1.InvalidArgumentsError.CODE);
}
exports.assertInvalidArgumentsError = assertInvalidArgumentsError;
async function assertInvalidInputError(provider, method, params = [], message) {
    return assertHardhatNetworkProviderError(provider, method, params, message, errors_1.InvalidInputError.CODE);
}
exports.assertInvalidInputError = assertInvalidInputError;
function assertQuantity(actual, quantity, message) {
    chai_1.assert.strictEqual(actual, output_1.numberToRpcQuantity(quantity), message);
}
exports.assertQuantity = assertQuantity;
async function assertNodeBalances(provider, expectedBalances) {
    const accounts = await provider.send("eth_accounts");
    const balances = await Promise.all(accounts.map((acc) => provider.send("eth_getBalance", [acc])));
    chai_1.assert.deepEqual(balances, expectedBalances.map(output_1.numberToRpcQuantity));
}
exports.assertNodeBalances = assertNodeBalances;
async function assertTransactionFailure(provider, txData, message, code) {
    try {
        await provider.send("eth_sendTransaction", [txData]);
    }
    catch (error) {
        if (code !== undefined) {
            chai_1.assert.equal(error.code, code);
        }
        if (message !== undefined) {
            chai_1.assert.include(error.message, message);
        }
        return;
    }
    chai_1.assert.fail("Transaction should have failed");
}
exports.assertTransactionFailure = assertTransactionFailure;
function assertReceiptMatchesGethOne(actual, gethReceipt, expectedBlockNumber) {
    assertQuantity(actual.blockNumber, expectedBlockNumber);
    chai_1.assert.strictEqual(actual.transactionIndex, gethReceipt.transactionIndex);
    chai_1.assert.strictEqual(actual.to, gethReceipt.to);
    chai_1.assert.strictEqual(actual.logsBloom, gethReceipt.logsBloom);
    chai_1.assert.deepEqual(actual.logs, gethReceipt.logs);
    chai_1.assert.strictEqual(actual.status, gethReceipt.status);
    chai_1.assert.deepEqual(actual.cumulativeGasUsed, gethReceipt.cumulativeGasUsed);
}
exports.assertReceiptMatchesGethOne = assertReceiptMatchesGethOne;
function assertTransaction(tx, txHash, txParams, blockNumber, blockHash, txIndex) {
    chai_1.assert.equal(tx.from, ethereumjs_util_1.bufferToHex(txParams.from));
    assertQuantity(tx.gas, txParams.gasLimit);
    assertQuantity(tx.gasPrice, txParams.gasPrice);
    chai_1.assert.equal(tx.hash, txHash);
    chai_1.assert.equal(tx.input, ethereumjs_util_1.bufferToHex(txParams.data));
    assertQuantity(tx.nonce, txParams.nonce);
    chai_1.assert.equal(tx.to, txParams.to.length === 0 ? null : ethereumjs_util_1.bufferToHex(txParams.to));
    assertQuantity(tx.value, txParams.value);
    if (blockHash !== undefined) {
        chai_1.assert.equal(tx.blockHash, blockHash);
    }
    else {
        chai_1.assert.isNull(tx.blockHash);
    }
    if (txIndex !== undefined) {
        assertQuantity(tx.transactionIndex, txIndex);
    }
    else {
        chai_1.assert.isNull(tx.transactionIndex);
    }
    if (blockNumber !== undefined) {
        assertQuantity(tx.blockNumber, blockNumber);
    }
    else {
        chai_1.assert.isNull(tx.blockNumber);
    }
    // We just want to validate that these are QUANTITY encoded
    chai_1.assert.isTrue(input_1.rpcQuantity.decode(tx.r).isRight());
    chai_1.assert.isTrue(input_1.rpcQuantity.decode(tx.s).isRight());
    chai_1.assert.isTrue(input_1.rpcQuantity.decode(tx.v).isRight());
}
exports.assertTransaction = assertTransaction;
async function assertLatestBlockNumber(provider, latestBlockNumber) {
    const block = await provider.send("eth_getBlockByNumber", ["latest", false]);
    chai_1.assert.isNotNull(block);
    chai_1.assert.equal(block.number, output_1.numberToRpcQuantity(latestBlockNumber));
}
exports.assertLatestBlockNumber = assertLatestBlockNumber;
//# sourceMappingURL=assertions.js.map