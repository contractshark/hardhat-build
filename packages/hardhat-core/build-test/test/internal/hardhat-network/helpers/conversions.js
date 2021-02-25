"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataToBN = exports.dataToNumber = exports.quantityToBN = exports.quantityToNumber = void 0;
/**
 * Transforms a QUANTITY to a number. It should only be used if you are 100% sure that the value
 * fits in a number.
 */
const ethereumjs_util_1 = require("ethereumjs-util");
const types_1 = require("../../../../src/internal/hardhat-network/jsonrpc/types");
const input_1 = require("../../../../src/internal/hardhat-network/provider/input");
function quantityToNumber(quantity) {
    return parseInt(quantity.substring(2), 16);
}
exports.quantityToNumber = quantityToNumber;
function quantityToBN(quantity) {
    return types_1.decode(quantity, input_1.rpcQuantity);
}
exports.quantityToBN = quantityToBN;
exports.dataToNumber = quantityToNumber;
function dataToBN(data) {
    const buffer = types_1.decode(data, input_1.rpcData);
    return new ethereumjs_util_1.BN(buffer);
}
exports.dataToBN = dataToBN;
//# sourceMappingURL=conversions.js.map