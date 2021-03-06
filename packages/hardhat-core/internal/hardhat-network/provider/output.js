"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toRpcLogOutput = exports.toRpcReceiptOutput = exports.getRpcReceipts = exports.getRpcTransaction = exports.getRpcBlock = exports.bufferToRpcData = exports.numberToRpcQuantity = void 0;
const ethereumjs_util_1 = require("ethereumjs-util");
// tslint:disable only-hardhat-error
function numberToRpcQuantity(n) {
    // This is here because we have some any's from dependencies
    if (typeof n !== "number" && Buffer.isBuffer(n)) {
        throw new Error(`Expected a number and got ${n}`);
    }
    if (Buffer.isBuffer(n)) {
        n = new ethereumjs_util_1.BN(n);
    }
    return `0x${n.toString(16)}`;
}
exports.numberToRpcQuantity = numberToRpcQuantity;
function bufferToRpcData(buffer, pad = 0) {
    let s = ethereumjs_util_1.bufferToHex(buffer);
    if (pad > 0 && s.length < pad + 2) {
        s = `0x${"0".repeat(pad + 2 - s.length)}${s.slice(2)}`;
    }
    return s;
}
exports.bufferToRpcData = bufferToRpcData;
function getRpcBlock(block, totalDifficulty, includeTransactions = true) {
    return {
        number: numberToRpcQuantity(new ethereumjs_util_1.BN(block.header.number)),
        hash: bufferToRpcData(block.hash()),
        parentHash: bufferToRpcData(block.header.parentHash),
        // We pad this to 8 bytes because of a limitation in The Graph
        // See: https://github.com/nomiclabs/hardhat/issues/491
        nonce: bufferToRpcData(block.header.nonce, 16),
        mixHash: bufferToRpcData(block.header.mixHash, 32),
        sha3Uncles: bufferToRpcData(block.header.uncleHash),
        logsBloom: bufferToRpcData(block.header.bloom),
        transactionsRoot: bufferToRpcData(block.header.transactionsTrie),
        stateRoot: bufferToRpcData(block.header.stateRoot),
        receiptsRoot: bufferToRpcData(block.header.receiptTrie),
        miner: bufferToRpcData(block.header.coinbase),
        difficulty: numberToRpcQuantity(new ethereumjs_util_1.BN(block.header.difficulty)),
        totalDifficulty: numberToRpcQuantity(totalDifficulty),
        extraData: bufferToRpcData(block.header.extraData),
        size: numberToRpcQuantity(block.serialize().length),
        gasLimit: numberToRpcQuantity(new ethereumjs_util_1.BN(block.header.gasLimit)),
        gasUsed: numberToRpcQuantity(new ethereumjs_util_1.BN(block.header.gasUsed)),
        timestamp: numberToRpcQuantity(new ethereumjs_util_1.BN(block.header.timestamp)),
        transactions: block.transactions.map((tx, index) => getRpcTransaction(tx, block, index, !includeTransactions)),
        uncles: block.uncleHeaders.map((uh) => bufferToRpcData(uh.hash())),
    };
}
exports.getRpcBlock = getRpcBlock;
function getRpcTransaction(tx, block, index, txHashOnly = false) {
    if (txHashOnly) {
        return bufferToRpcData(tx.hash(true));
    }
    return {
        blockHash: block !== undefined ? bufferToRpcData(block.hash()) : null,
        blockNumber: block !== undefined
            ? numberToRpcQuantity(new ethereumjs_util_1.BN(block.header.number))
            : null,
        from: bufferToRpcData(tx.getSenderAddress()),
        gas: numberToRpcQuantity(new ethereumjs_util_1.BN(tx.gasLimit)),
        gasPrice: numberToRpcQuantity(new ethereumjs_util_1.BN(tx.gasPrice)),
        hash: bufferToRpcData(tx.hash(true)),
        input: bufferToRpcData(tx.data),
        nonce: numberToRpcQuantity(new ethereumjs_util_1.BN(tx.nonce)),
        to: tx.to.length === 0 ? null : bufferToRpcData(tx.to),
        transactionIndex: index !== undefined ? numberToRpcQuantity(index) : null,
        value: numberToRpcQuantity(new ethereumjs_util_1.BN(tx.value)),
        v: numberToRpcQuantity(new ethereumjs_util_1.BN(tx.v)),
        r: numberToRpcQuantity(new ethereumjs_util_1.BN(tx.r)),
        s: numberToRpcQuantity(new ethereumjs_util_1.BN(tx.s)),
    };
}
exports.getRpcTransaction = getRpcTransaction;
function getRpcReceipts(block, runBlockResult) {
    const receipts = [];
    let cumulativeGasUsed = new ethereumjs_util_1.BN(0);
    for (let i = 0; i < runBlockResult.results.length; i += 1) {
        const tx = block.transactions[i];
        const { createdAddress } = runBlockResult.results[i];
        const receipt = runBlockResult.receipts[i];
        cumulativeGasUsed = cumulativeGasUsed.add(new ethereumjs_util_1.BN(receipt.gasUsed));
        const logs = receipt.logs.map((log, logIndex) => getRpcLogOutput(log, tx, block, i, logIndex));
        receipts.push({
            transactionHash: bufferToRpcData(tx.hash()),
            transactionIndex: numberToRpcQuantity(i),
            blockHash: bufferToRpcData(block.hash()),
            blockNumber: numberToRpcQuantity(new ethereumjs_util_1.BN(block.header.number)),
            from: bufferToRpcData(tx.getSenderAddress()),
            to: tx.to.length === 0 ? null : bufferToRpcData(tx.to),
            cumulativeGasUsed: numberToRpcQuantity(cumulativeGasUsed),
            gasUsed: numberToRpcQuantity(new ethereumjs_util_1.BN(receipt.gasUsed)),
            contractAddress: createdAddress !== undefined ? bufferToRpcData(createdAddress) : null,
            logs,
            logsBloom: bufferToRpcData(receipt.bitvector),
            status: numberToRpcQuantity(receipt.status),
        });
    }
    return receipts;
}
exports.getRpcReceipts = getRpcReceipts;
function toRpcReceiptOutput(receipt) {
    return {
        blockHash: bufferToRpcData(receipt.blockHash),
        blockNumber: numberToRpcQuantity(receipt.blockNumber),
        contractAddress: receipt.contractAddress !== null
            ? bufferToRpcData(receipt.contractAddress)
            : null,
        cumulativeGasUsed: numberToRpcQuantity(receipt.cumulativeGasUsed),
        from: bufferToRpcData(receipt.from),
        gasUsed: numberToRpcQuantity(receipt.gasUsed),
        logs: receipt.logs.map(toRpcLogOutput),
        logsBloom: bufferToRpcData(receipt.logsBloom),
        status: numberToRpcQuantity(receipt.status),
        to: receipt.to !== null ? bufferToRpcData(receipt.to) : null,
        transactionHash: bufferToRpcData(receipt.transactionHash),
        transactionIndex: numberToRpcQuantity(receipt.transactionIndex),
    };
}
exports.toRpcReceiptOutput = toRpcReceiptOutput;
function toRpcLogOutput(log, index) {
    return {
        removed: false,
        address: bufferToRpcData(log.address),
        blockHash: log.blockHash !== null ? bufferToRpcData(log.blockHash) : null,
        blockNumber: log.blockNumber !== null ? numberToRpcQuantity(log.blockNumber) : null,
        data: bufferToRpcData(log.data),
        logIndex: index !== undefined ? numberToRpcQuantity(index) : null,
        transactionIndex: log.transactionIndex !== null
            ? numberToRpcQuantity(log.transactionIndex)
            : null,
        transactionHash: log.transactionHash !== null
            ? bufferToRpcData(log.transactionHash)
            : null,
        topics: log.topics.map((topic) => bufferToRpcData(topic)),
    };
}
exports.toRpcLogOutput = toRpcLogOutput;
function getRpcLogOutput(log, tx, block, transactionIndex, logIndex) {
    return {
        removed: false,
        logIndex: logIndex !== undefined ? numberToRpcQuantity(logIndex) : null,
        transactionIndex: transactionIndex !== undefined
            ? numberToRpcQuantity(transactionIndex)
            : null,
        transactionHash: block !== undefined ? bufferToRpcData(tx.hash()) : null,
        blockHash: block !== undefined ? bufferToRpcData(block.hash()) : null,
        blockNumber: block !== undefined
            ? numberToRpcQuantity(new ethereumjs_util_1.BN(block.header.number))
            : null,
        address: bufferToRpcData(log[0]),
        data: bufferToRpcData(log[2]),
        topics: log[1].map((topic) => bufferToRpcData(topic)),
    };
}
//# sourceMappingURL=output.js.map