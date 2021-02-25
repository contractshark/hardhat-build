"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const errors_list_1 = require("../../../../src/internal/core/errors-list");
const provider_utils_1 = require("../../../../src/internal/core/providers/provider-utils");
const errors_1 = require("../../../helpers/errors");
describe("Provider utils", function () {
    describe("rpcQuantityToNumber", function () {
        it("Should decode valid quantities", function () {
            chai_1.assert.equal(provider_utils_1.rpcQuantityToNumber("0x0"), 0);
            chai_1.assert.equal(provider_utils_1.rpcQuantityToNumber("0x1"), 1);
            chai_1.assert.equal(provider_utils_1.rpcQuantityToNumber("0x10"), 16);
            chai_1.assert.equal(provider_utils_1.rpcQuantityToNumber("0x123"), 291);
        });
        it("Should not accept invalid quantities", function () {
            errors_1.expectHardhatError(() => provider_utils_1.rpcQuantityToNumber("0x"), errors_list_1.ERRORS.NETWORK.INVALID_RPC_QUANTITY_VALUE);
            errors_1.expectHardhatError(() => provider_utils_1.rpcQuantityToNumber("0X1"), errors_list_1.ERRORS.NETWORK.INVALID_RPC_QUANTITY_VALUE);
            errors_1.expectHardhatError(() => provider_utils_1.rpcQuantityToNumber(""), errors_list_1.ERRORS.NETWORK.INVALID_RPC_QUANTITY_VALUE);
            errors_1.expectHardhatError(() => provider_utils_1.rpcQuantityToNumber("0x01"), errors_list_1.ERRORS.NETWORK.INVALID_RPC_QUANTITY_VALUE);
            errors_1.expectHardhatError(() => provider_utils_1.rpcQuantityToNumber("0xp"), errors_list_1.ERRORS.NETWORK.INVALID_RPC_QUANTITY_VALUE);
            errors_1.expectHardhatError(() => provider_utils_1.rpcQuantityToNumber("ff"), errors_list_1.ERRORS.NETWORK.INVALID_RPC_QUANTITY_VALUE);
        });
    });
    describe("numberToRpcQuantity", function () {
        it("Should encode numbers correctly", function () {
            chai_1.assert.equal(provider_utils_1.numberToRpcQuantity(0), "0x0");
            chai_1.assert.equal(provider_utils_1.numberToRpcQuantity(1), "0x1");
            chai_1.assert.equal(provider_utils_1.numberToRpcQuantity(16), "0x10");
            chai_1.assert.equal(provider_utils_1.numberToRpcQuantity(291), "0x123");
        });
    });
});
//# sourceMappingURL=provider-utils.js.map