"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leftPad32 = void 0;
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
function leftPad32(value) {
    return ethereumjs_util_1.setLength(value, 32).toString("hex");
}
exports.leftPad32 = leftPad32;
describe("leftPad32", () => {
    it("correctly pads hex strings", () => {
        const address = "0x6b175474e89094c44da98b954eedeac495271d0f";
        chai_1.assert.equal(leftPad32(address), "0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f");
    });
    it("correctly pads buffers", () => {
        const buffer = ethereumjs_util_1.toBuffer("0x6b175474e89094c44da98b954eedeac495271d0f");
        chai_1.assert.equal(leftPad32(buffer), "0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f");
    });
    it("converts to hex and correctly pads BNs", () => {
        const bn = new ethereumjs_util_1.BN(10).pow(new ethereumjs_util_1.BN(18));
        chai_1.assert.equal(leftPad32(bn), "0000000000000000000000000000000000000000000000000de0b6b3a7640000");
    });
});
//# sourceMappingURL=leftPad32.js.map