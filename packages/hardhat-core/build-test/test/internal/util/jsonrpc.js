"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const jsonrpc_1 = require("../../../src/internal/util/jsonrpc");
describe("JSON-RPC", function () {
    describe("JSON-RPC response validation", function () {
        describe("Invalid responses", function () {
            it("Should validate the jsonrpc field", function () {
                chai_1.assert.isFalse(jsonrpc_1.isValidJsonResponse({
                    jsonrpc: "2.0.0",
                    id: 123,
                    result: "asd",
                }));
                chai_1.assert.isFalse(jsonrpc_1.isValidJsonResponse({
                    jsonrpc: 123,
                    id: 123,
                    result: "asd",
                }));
                chai_1.assert.isFalse(jsonrpc_1.isValidJsonResponse({
                    id: 123,
                    result: "asd",
                }));
            });
            it("Should validate the id field", function () {
                // Response without the id field is still a valid response,
                // returned when an invalid JSON was provided as the request
                // and id could not be parsed from it.
                chai_1.assert.isFalse(jsonrpc_1.isValidJsonResponse({
                    jsonrpc: "2.0",
                    result: "asd",
                }));
                chai_1.assert.isTrue(jsonrpc_1.isValidJsonResponse({
                    jsonrpc: "2.0",
                    id: null,
                    error: {
                        code: 123,
                        message: "asd",
                    },
                }));
                chai_1.assert.isFalse(jsonrpc_1.isValidJsonResponse({
                    jsonrpc: "2.0",
                    id: null,
                    result: 123,
                }));
                chai_1.assert.isFalse(jsonrpc_1.isValidJsonResponse({
                    jsonrpc: "2.0",
                    id: [],
                    result: "asd",
                }));
                chai_1.assert.isFalse(jsonrpc_1.isValidJsonResponse({
                    jsonrpc: "2.0",
                    id: {},
                    result: "asd",
                }));
            });
            it("Should validate that only response or error are present", function () {
                chai_1.assert.isTrue(jsonrpc_1.isValidJsonResponse({
                    jsonrpc: "2.0",
                    id: "123",
                    result: "asd",
                    error: {
                        code: 123,
                        message: "asd",
                    },
                }));
            });
        });
        describe("Valid responses", function () {
            it("Should be true for valid successful responses", function () {
                chai_1.assert.isTrue(jsonrpc_1.isValidJsonResponse({
                    jsonrpc: "2.0",
                    id: 123,
                    result: "asd",
                }));
                chai_1.assert.isTrue(jsonrpc_1.isValidJsonResponse({
                    jsonrpc: "2.0",
                    id: "123",
                    result: "asd",
                }));
                chai_1.assert.isTrue(jsonrpc_1.isValidJsonResponse({
                    jsonrpc: "2.0",
                    id: 123,
                    result: { asd: 123 },
                }));
                chai_1.assert.isTrue(jsonrpc_1.isValidJsonResponse({
                    jsonrpc: "2.0",
                    id: 123,
                    result: 123,
                }));
                chai_1.assert.isTrue(jsonrpc_1.isValidJsonResponse({
                    jsonrpc: "2.0",
                    id: 123,
                    result: [123],
                }));
            });
            it("Should be true for valid failure responses with data", function () {
                chai_1.assert.isTrue(jsonrpc_1.isValidJsonResponse({
                    jsonrpc: "2.0",
                    id: 123,
                    error: {
                        code: 2,
                        message: "err",
                    },
                }));
            });
            it("Should be true for valid failure responses without data", function () {
                chai_1.assert.isTrue(jsonrpc_1.isValidJsonResponse({
                    jsonrpc: "2.0",
                    id: 123,
                    error: {
                        code: 2,
                        message: "err",
                        data: 123,
                    },
                }));
                chai_1.assert.isTrue(jsonrpc_1.isValidJsonResponse({
                    jsonrpc: "2.0",
                    id: 123,
                    error: {
                        code: 2,
                        message: "err",
                        data: ["asd"],
                    },
                }));
                chai_1.assert.isTrue(jsonrpc_1.isValidJsonResponse({
                    jsonrpc: "2.0",
                    id: 123,
                    error: {
                        code: 2,
                        message: "err",
                        data: { a: 1 },
                    },
                }));
            });
        });
    });
});
//# sourceMappingURL=jsonrpc.js.map