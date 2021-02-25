"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const opcodes_1 = require("../../../../src/internal/hardhat-network/stack-traces/opcodes");
describe("Opcodes", function () {
    it("Should have 256 opcodes", function () {
        const opcodes = Object.keys(opcodes_1.Opcode).filter((k) => isNaN(Number(k)));
        chai_1.assert.lengthOf(opcodes, 256);
        chai_1.assert.equal(new Set(opcodes).size, 256);
    });
});
//# sourceMappingURL=opcodes.js.map