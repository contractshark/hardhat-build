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
exports.rpcTransactionReceipt = exports.rpcLog = exports.rpcBlockWithTransactions = exports.rpcBlock = exports.rpcTransaction = exports.optional = exports.nullable = exports.decode = void 0;
const t = __importStar(require("io-ts"));
const input_1 = require("../provider/input");
function decode(value, codec) {
    return codec.decode(value).fold(() => {
        // tslint:disable-next-line
        throw new Error(`Invalid ${codec.name}`);
    }, t.identity);
}
exports.decode = decode;
exports.nullable = (codec) => new t.Type(`${codec.name} or null`, (input) => input === null || input === undefined || codec.is(input), (input, context) => {
    if (input === null || input === undefined) {
        return t.success(null);
    }
    return codec.validate(input, context);
}, t.identity);
// Note that this is slightly different from optional properties marked with ?
// See https://github.com/gcanti/io-ts/issues/56
exports.optional = (codec) => new t.Type(`${codec.name} or undefined`, (input) => input === undefined || codec.is(input), (input, context) => {
    if (input === undefined) {
        return t.success(input);
    }
    return codec.validate(input, context);
}, t.identity);
exports.rpcTransaction = t.type({
    blockHash: exports.nullable(input_1.rpcHash),
    blockNumber: exports.nullable(input_1.rpcQuantity),
    from: input_1.rpcAddress,
    gas: input_1.rpcQuantity,
    gasPrice: input_1.rpcQuantity,
    hash: input_1.rpcHash,
    input: input_1.rpcData,
    nonce: input_1.rpcQuantity,
    to: exports.nullable(input_1.rpcAddress),
    transactionIndex: exports.nullable(input_1.rpcQuantity),
    value: input_1.rpcQuantity,
    v: input_1.rpcQuantity,
    r: input_1.rpcQuantity,
    s: input_1.rpcQuantity,
}, "RpcTransaction");
const baseBlockResponse = {
    number: exports.nullable(input_1.rpcQuantity),
    hash: exports.nullable(input_1.rpcHash),
    parentHash: input_1.rpcHash,
    nonce: exports.optional(input_1.rpcData),
    sha3Uncles: input_1.rpcHash,
    logsBloom: input_1.rpcData,
    transactionsRoot: input_1.rpcHash,
    stateRoot: input_1.rpcHash,
    receiptsRoot: input_1.rpcHash,
    miner: input_1.rpcAddress,
    difficulty: input_1.rpcQuantity,
    totalDifficulty: input_1.rpcQuantity,
    extraData: input_1.rpcData,
    size: input_1.rpcQuantity,
    gasLimit: input_1.rpcQuantity,
    gasUsed: input_1.rpcQuantity,
    timestamp: input_1.rpcQuantity,
    uncles: t.array(input_1.rpcHash, "HASH Array"),
    mixHash: exports.optional(input_1.rpcHash),
};
exports.rpcBlock = t.type(Object.assign(Object.assign({}, baseBlockResponse), { transactions: t.array(input_1.rpcHash, "HASH Array") }), "RpcBlock");
exports.rpcBlockWithTransactions = t.type(Object.assign(Object.assign({}, baseBlockResponse), { transactions: t.array(exports.rpcTransaction, "RpcTransaction Array") }), "RpcBlockWithTransactions");
exports.rpcLog = t.type({
    transactionIndex: exports.nullable(input_1.rpcQuantity),
    transactionHash: exports.nullable(input_1.rpcHash),
    blockHash: exports.nullable(input_1.rpcHash),
    blockNumber: exports.nullable(input_1.rpcQuantity),
    address: input_1.rpcAddress,
    data: input_1.rpcData,
    topics: t.array(input_1.rpcData, "RpcData Array"),
}, "RpcLog");
exports.rpcTransactionReceipt = t.type({
    transactionHash: input_1.rpcHash,
    transactionIndex: input_1.rpcQuantity,
    blockHash: input_1.rpcHash,
    blockNumber: input_1.rpcQuantity,
    from: input_1.rpcAddress,
    to: exports.nullable(input_1.rpcAddress),
    cumulativeGasUsed: input_1.rpcQuantity,
    gasUsed: input_1.rpcQuantity,
    contractAddress: exports.nullable(input_1.rpcAddress),
    logs: t.array(exports.rpcLog, "RpcLog Array"),
    logsBloom: input_1.rpcData,
    status: input_1.rpcQuantity,
}, "RpcTransactionReceipt");
//# sourceMappingURL=types.js.map