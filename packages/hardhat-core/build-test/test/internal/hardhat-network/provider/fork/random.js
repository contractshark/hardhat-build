"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const random_1 = require("../../../../../src/internal/hardhat-network/provider/fork/random");
const HASH_REGEX = /^0x[a-f\d]{64}$/;
const ADDRESS_REGEX = /^0x[a-f\d]{40}$/;
describe("randomHash", () => {
    it("matches regex pattern", async () => {
        chai_1.assert.isTrue(HASH_REGEX.test(random_1.randomHash()));
    });
});
describe("randomAddress", () => {
    it("matches regex pattern", async () => {
        chai_1.assert.isTrue(ADDRESS_REGEX.test(random_1.randomAddress()));
    });
});
//# sourceMappingURL=random.js.map