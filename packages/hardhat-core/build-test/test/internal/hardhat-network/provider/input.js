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
const t = __importStar(require("io-ts"));
const errors_1 = require("../../../../src/internal/hardhat-network/provider/errors");
const input_1 = require("../../../../src/internal/hardhat-network/provider/input");
const cwd_1 = require("../helpers/cwd");
describe("validateParams", function () {
    cwd_1.setCWD();
    describe("0-arguments", function () {
        it("Should return an empty array if no argument is given", function () {
            chai_1.assert.deepEqual(input_1.validateParams([]), []);
        });
        it("Should throw if params are given", function () {
            chai_1.assert.throws(() => input_1.validateParams([1]), errors_1.InvalidArgumentsError);
            chai_1.assert.throws(() => input_1.validateParams([1, true]), errors_1.InvalidArgumentsError);
            chai_1.assert.throws(() => input_1.validateParams([{}]), errors_1.InvalidArgumentsError);
            chai_1.assert.throws(() => input_1.validateParams(["ASD", 123, false]), errors_1.InvalidArgumentsError);
        });
    });
    describe("With multiple params", function () {
        it("Should throw if the number of params and arguments doesn't match", function () {
            chai_1.assert.throws(() => input_1.validateParams([1], input_1.rpcHash, input_1.rpcQuantity), errors_1.InvalidArgumentsError);
            chai_1.assert.throws(() => input_1.validateParams([1, true], input_1.rpcHash), errors_1.InvalidArgumentsError);
            chai_1.assert.throws(() => input_1.validateParams([{}], input_1.rpcQuantity, input_1.rpcQuantity), errors_1.InvalidArgumentsError);
            chai_1.assert.throws(() => input_1.validateParams(["ASD", 123, false], input_1.rpcQuantity), errors_1.InvalidArgumentsError);
        });
        it("Should return the right values", function () {
            chai_1.assert.deepEqual(input_1.validateParams(["0x0000000000000000000000000000000000000001"], input_1.rpcAddress), [ethereumjs_util_1.toBuffer("0x0000000000000000000000000000000000000001")]);
            chai_1.assert.deepEqual(input_1.validateParams([
                "0x0000000000000000000000000000000000000000000000000000000000000001",
                true,
            ], input_1.rpcHash, t.boolean), [
                ethereumjs_util_1.toBuffer("0x0000000000000000000000000000000000000000000000000000000000000001"),
                true,
            ]);
        });
    });
    describe("Optional params", function () {
        it("Should fail if less than the minimum number of params are received", function () {
            chai_1.assert.throws(() => input_1.validateParams([], input_1.rpcHash, input_1.optionalBlockTag), errors_1.InvalidArgumentsError);
        });
        it("Should fail if more than the maximum number of params are received", function () {
            chai_1.assert.throws(() => input_1.validateParams([
                "0x0000000000000000000000000000000000000000000000000000000000000001",
                "latest",
                123,
            ], input_1.rpcHash, input_1.optionalBlockTag), errors_1.InvalidArgumentsError);
        });
        it("Should return undefined if optional params are missing", function () {
            chai_1.assert.deepEqual(input_1.validateParams([
                "0x0000000000000000000000000000000000000000000000000000000000000001",
            ], input_1.rpcHash, input_1.optionalBlockTag), [
                ethereumjs_util_1.toBuffer("0x0000000000000000000000000000000000000000000000000000000000000001"),
                undefined,
            ]);
            chai_1.assert.deepEqual(input_1.validateParams(["0x1111111111111111111111111111111111111111"], input_1.rpcAddress, input_1.optionalBlockTag), [ethereumjs_util_1.toBuffer("0x1111111111111111111111111111111111111111"), undefined]);
        });
    });
});
//# sourceMappingURL=input.js.map