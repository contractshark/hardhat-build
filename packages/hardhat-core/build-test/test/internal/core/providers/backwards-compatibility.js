"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const util_1 = require("util");
const backwards_compatibility_1 = require("../../../../src/internal/core/providers/backwards-compatibility");
const mocks_1 = require("./mocks");
describe("BackwardsCompatibilityProviderAdapter", function () {
    let mock;
    let provider;
    beforeEach(function () {
        mock = new mocks_1.MockedProvider();
        provider = new backwards_compatibility_1.BackwardsCompatibilityProviderAdapter(mock);
    });
    describe("send", function () {
        it("Should forward send calls to request", async function () {
            await provider.send("m", [1, 2, 3]);
            await provider.send("m2", ["asd"]);
            chai_1.assert.deepEqual(mock.getLatestParams("m"), [1, 2, 3]);
            chai_1.assert.deepEqual(mock.getLatestParams("m2"), ["asd"]);
        });
        it("Should return the same than request", async function () {
            mock.setReturnValue("m", 123);
            const ret = await provider.send("m");
            chai_1.assert.equal(ret, 123);
        });
    });
    describe("sendAsync", function () {
        describe("Single request", function () {
            it("Should forward it to request", async function () {
                const sendAsync = util_1.promisify(provider.sendAsync.bind(provider));
                await sendAsync({
                    id: 123,
                    jsonrpc: "2.0",
                    method: "m",
                    params: [1, 2, 3],
                });
                chai_1.assert.deepEqual(mock.getLatestParams("m"), [1, 2, 3]);
            });
            it("Should return the same than request", async function () {
                const sendAsync = util_1.promisify(provider.sendAsync.bind(provider));
                mock.setReturnValue("m", 123456);
                const res = await sendAsync({
                    id: 123,
                    jsonrpc: "2.0",
                    method: "m",
                    params: [1, 2, 3],
                });
                chai_1.assert.equal(res.id, 123);
                chai_1.assert.equal(res.jsonrpc, "2.0");
                chai_1.assert.equal(res.result, 123456);
                chai_1.assert.equal(res.error, null);
            });
        });
    });
});
//# sourceMappingURL=backwards-compatibility.js.map