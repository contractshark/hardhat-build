"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const lang_1 = require("../../../src/internal/util/lang");
describe("From entries", () => {
    it("Should return an empty object if entries is an empty array", () => {
        chai_1.assert.deepEqual(lang_1.fromEntries([]), {});
    });
    it("Should construct an object", () => {
        const o = {};
        chai_1.assert.deepEqual(lang_1.fromEntries([
            ["a", 1],
            ["b", true],
            ["c", o],
        ]), {
            a: 1,
            b: true,
            c: o,
        });
    });
    it("Should keep the last entry if there are multiple ones with the same key", () => {
        chai_1.assert.deepEqual(lang_1.fromEntries([
            ["a", 1],
            ["b", 2],
            ["a", 3],
        ]), {
            a: 3,
            b: 2,
        });
    });
});
//# sourceMappingURL=lang.js.map