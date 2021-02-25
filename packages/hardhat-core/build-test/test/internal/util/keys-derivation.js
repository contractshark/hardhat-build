"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const keys_derivation_1 = require("../../../src/internal/util/keys-derivation");
describe("Keys derivation", function () {
    describe("deriveKeyFromMnemonicAndPath", function () {
        it("Should derive the right keys", function () {
            const mnemonic = "atom exist unusual amazing find assault penalty wall curve lunar promote cattle";
            const path = "m/123/123'";
            const derivedPk = keys_derivation_1.deriveKeyFromMnemonicAndPath(mnemonic, path);
            const address = ethereumjs_util_1.bufferToHex(ethereumjs_util_1.privateToAddress(derivedPk));
            chai_1.assert.equal(ethereumjs_util_1.toChecksumAddress(address), "0x9CFE3206BD8beDC01c1f04E644eCd3e96a16F095");
        });
    });
});
//# sourceMappingURL=keys-derivation.js.map