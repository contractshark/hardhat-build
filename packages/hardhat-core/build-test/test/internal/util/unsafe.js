"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const unsafe_1 = require("../../../src/internal/util/unsafe");
describe("Type unsafe helpers functions", () => {
    describe("unsafeObjectKeys", () => {
        it("Should return the right type", () => {
            const t = { a: "a", b: 123 };
            const keys = unsafe_1.unsafeObjectKeys(t);
            chai_1.assert.deepEqual([...new Set(keys)], [...new Set(["a", "b"])]);
        });
        it("Should work with extended types, but that's unsafe", () => {
            const t2 = { a: "a", b: 123, c: false };
            const t = t2;
            const keys = unsafe_1.unsafeObjectKeys(t);
            // This is the unsafe case, where we receive a key not in KeyType because
            // we passed an extension of T.
            chai_1.assert.notDeepEqual([...new Set(keys)], [...new Set(["a", "b"])]);
        });
    });
});
//# sourceMappingURL=unsafe.js.map